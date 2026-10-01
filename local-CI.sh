#!/usr/bin/env bash
#
# local-CI.sh — reproduce the GitHub Actions "Build & deploy" build job locally,
# so you can catch failures before pushing to main.
#
# It IS the build job's steps, not a copy of them: .github/workflows/deploy.yml
# calls `./local-CI.sh --ci` and reads its Node version from
# `./local-CI.sh --print-node-major`, so the two cannot drift.
#     Node check  ->  npm ci  ->  node build.mjs   (env: GITHUB_TOKEN)
# The pre-push gate also runs `npm test` after the install; --ci does not.
#
# The workflow's deploy steps (configure-pages / upload-pages-artifact /
# deploy-pages) are GitHub Pages infrastructure and cannot run locally. What we
# CAN check is deploy *readiness* — that dist/ is a well-formed site artifact
# (site root, CNAME, no stray symlinks). A green run means the parts CI can fail
# on for OUR reasons are good; a transient "Deployment failed, try again later"
# from Pages is a backend hiccup — just re-run the deploy job.
#
# Usage:   ./local-CI.sh                     the pre-push gate
#          ./local-CI.sh --ci                the workflow's build job: an About page
#                                            that contradicts the releases is reported
#                                            but not fatal, so the daily rebuild never
#                                            stops over a stale sentence
#          ./local-CI.sh --print-node-major  the Node major the workflow sets up
#          ./local-CI.sh --docs              a push touching only DOCS_GLOB's paths:
#                                            checks the glob, skips the build (below)
#          ./local-CI.sh --docs-glob         the documentation glob, for git config
# Token:   export GITHUB_TOKEN=<pat>   before running to avoid GitHub API rate
#          limits (CI passes secrets.GITHUB_TOKEN automatically). Without it the
#          build still succeeds via projects.json fallbacks — same as CI.

set -euo pipefail

# Always run from the repo root, whatever the caller's cwd.
cd "$(dirname "$(readlink -f "$0")")"

# The Node major version, here and nowhere else: the workflow's setup-node step
# reads it through --print-node-major before this script's build runs.
readonly CI_NODE_MAJOR=24

# What counts as documentation (see the glob check below for why it is narrow).
DOCS_GLOB='docs/*|README.md|CHANGELOG.md|ROADMAP.md|CLAUDE.md|LICENSE'

mode=gate
case "${1:-}" in
  "") ;;
  --ci) mode=ci ;;
  --docs) mode=docs ;;
  --docs-glob) echo "$DOCS_GLOB"; exit 0 ;;
  --print-node-major) echo "$CI_NODE_MAJOR"; exit 0 ;;
  *) echo "usage: $0 [--ci | --docs | --docs-glob | --print-node-major]" >&2; exit 2 ;;
esac

step() { printf '\n\033[1;34m==> %s\033[0m\n' "$1"; }
ok()   { printf '\033[1;32m%s\033[0m\n' "$1"; }
warn() { printf '\033[1;33m%s\033[0m\n' "$1" >&2; }

# The machine-wide pre-push hook counts a push as documentation-only by
# `ants.gate.docsGlob`, and runs --docs for one. The glob must not count
# src/about/ or src/posts/, which the build reads. Git config is per clone and
# never committed, so a fresh clone starts without it. Checked here because this
# is the one file every clone runs; a setup step written down and checked by
# nothing does not survive a new clone. Not under --ci: GitHub's runner has no
# hook.
if [ "$mode" != ci ] && [ "$(git config --get ants.gate.docsGlob || true)" != "$DOCS_GLOB" ]; then
  warn "ants.gate.docsGlob is not set to this repo's value, which keeps About pages and"
  warn "posts out of what counts as documentation. Set it once, then re-run:"
  warn "  git config ants.gate.docsGlob '$DOCS_GLOB'"
  exit 1
fi

# The workflow's paths-ignore is the same list, so GitHub skips the pushes this
# gate treats as documentation. Two copies drift, so they are compared here, where
# every push and CI both run: `docs/*` is `docs/**` in the workflow's syntax.
wf_glob="$(sed -n '/^ *paths-ignore:/,/^ *[a-z_]*:/{s/^ *- *"\{0,1\}\([^"]*\)"\{0,1\} *$/\1/p}' \
  .github/workflows/deploy.yml | sed 's#^docs/\*\*$#docs/*#' | paste -sd'|')"
if [ "$wf_glob" != "$DOCS_GLOB" ]; then
  warn "deploy.yml's paths-ignore ($wf_glob) differs from DOCS_GLOB ($DOCS_GLOB)."
  warn "Make the two lists match, so GitHub and this gate agree on what is documentation."
  exit 1
fi

# The weekly post closes CHANGELOG.md's [Unreleased] section with no one watching,
# so a section it cannot close is caught here, at the push that broke it. Not
# under --ci: the daily rebuild never closes the changelog.
if [ "$mode" != ci ]; then
  step "Check CHANGELOG.md can be closed  ->  close-changelog --check"
  node scripts/close-changelog.mjs --check
fi

# --docs: nothing below reads a DOCS_GLOB path. The build reads src/, and fetches
# other projects' CHANGELOG.md from GitHub, never this repo's; npm test reads
# test/ and the stats server. So the two checks above are the whole of what a
# documentation-only push can break here. Checked 2026-09-28 by searching the
# build, lib/, stats, scripts and tests for each path in the glob.
if [ "$mode" = docs ]; then
  step "Result"
  ok "Documentation-only push: docsGlob, the workflow's matching list and CHANGELOG checked. Not run, because nothing they check reads these paths: the Node version check, npm ci, npm test, the build, the About and download checks, deploy readiness."
  exit 0
fi

step "Check Node (the workflow sets up Node ${CI_NODE_MAJOR})"
if ! command -v node >/dev/null 2>&1; then
  warn "node not found on PATH — install Node >= ${CI_NODE_MAJOR}."
  exit 1
fi
node_major="$(node --version | sed 's/^v//; s/\..*//')"
printf 'node %s, npm %s\n' "$(node --version)" "$(npm --version)"
if [ "$node_major" -lt "$CI_NODE_MAJOR" ]; then
  warn "Local Node ${node_major} is older than the workflow's Node ${CI_NODE_MAJOR} — build may differ from CI."
  exit 1
elif [ "$node_major" -ne "$CI_NODE_MAJOR" ]; then
  warn "Note: local Node ${node_major} differs from the workflow's Node ${CI_NODE_MAJOR} (build should still match, but CI is the source of truth)."
fi

step "Install (locked)  ->  npm ci"
# Same command the workflow runs — but never with its stdout on a pipe.
#
# Measured on this machine on 2026-09-04 (npm 11.16.0, 19 locked packages, warm
# cache), the SAME `npm ci` cost:
#     stdout -> file    2.35s
#     stdout -> pipe  300.62s        (npm's own summary agreed: "added 18 packages in 5m")
#
# Since a git hook runs this script with its output on a pipe, `git push` paid
# five minutes for a two-second install. NOT reproducible on 2026-09-25, on the
# same npm: a file, a pipe and a real pre-push hook all installed in under a
# second. The cause was never identified, so treat it as that day's environment,
# not a known npm behaviour. The redirect stays because it costs nothing: the
# install is unchanged and still lockfile-exact, and the log is printed after.
npm_log="$(mktemp -t local-ci-npm.XXXXXX)"
trap 'rm -f "$npm_log"' EXIT
if ! npm ci >"$npm_log" 2>&1; then
  cat "$npm_log" >&2
  warn "npm ci failed — see the output above."
  exit 1
fi
cat "$npm_log"

# The stats server's tests (npm test). Gate only: the tray half imports PySide6, which the
# workflow's runner does not have, and the deploy job never touches the stats server.
if [ "$mode" = gate ]; then
  step "Stats server tests  ->  npm test"
  if ! npm test; then
    warn "npm test failed — see the output above."
    exit 1
  fi
fi

step "Build site  ->  node build.mjs"
# GITHUB_TOKEN is used if set; the workflow passes the Actions token.
#
# Output is teed rather than buffered: the build talks to GitHub and a silent minute
# looks like a hang. The copy is kept for the About-drift check below.
build_log="$(mktemp -t local-ci-build.XXXXXX)"
trap 'rm -f "$npm_log" "$build_log"' EXIT
node build.mjs 2>&1 | tee "$build_log"

# A project whose release fetch failed has no release, and the three checks below then
# find nothing to compare: they pass having checked nothing. So the gate says so
# (local-gate.md § 7.1). Under the pre-push hook each skipped project goes to
# $ANTS_GATE_SKIPPED, the push goes through, and the hook writes no passed record. Run
# any other way there is no one to declare to, so the gate fails. Not under --ci: the
# daily rebuild writes no passed record.
advisory=""
failed_fetch="$(sed -n 's/^! \([^:]*\): release fetch failed.*/\1/p' "$build_log")"
if [ -n "$failed_fetch" ] && [ "$mode" = gate ]; then
  step "Declare the checks a failed release fetch skipped"
  for slug in $failed_fetch; do
    warn "Skipped for $slug: the About, status and download checks (its release fetch failed)."
  done
  if [ -z "${ANTS_GATE_SKIPPED:-}" ]; then
    warn "Nothing to declare the skip to (ANTS_GATE_SKIPPED is unset), so this is a failure."
    warn "Re-run when GitHub is reachable, or push, so the hook can record the skip."
    exit 1
  fi
  for slug in $failed_fetch; do
    echo "release checks for $slug (fetch failed)" >> "$ANTS_GATE_SKIPPED"
  done
  advisory=" — WITH CHECKS SKIPPED for: $(echo $failed_fetch | tr ' ' ',')"
fi

step "Check About copy against the release history"
# build.mjs only warns on these. The daily rebuild exists to keep release notes fresh
# and must not stop over a stale sentence — but a person about to publish should be.
# So the warning is advisory in the build and fatal here, at the gate before a push.
# Under --ci the check is downgraded, never silenced: each contradiction becomes a
# GitHub warning annotation on the run's summary page, and the final line says the
# pass carries one. A non-fatal check that says nothing would be a green that lies.
if grep -q '^! about-drift:' "$build_log"; then
  grep '^! about-drift:' "$build_log" >&2
  warn "An About page contradicts the release history. Fix src/about/ before pushing."
  [ "$mode" = ci ] || exit 1
  grep '^! about-drift:' "$build_log" | sed 's/^! about-drift: /::warning title=About copy contradicts the releases::/'
  advisory=" — WITH A WARNING: an About page contradicts the release history (see above)"
else
  ok "About copy agrees with the release history."
fi

step "Check each project's status against its version"
# A project at 1.0.0 or later is "live". Same shape as the About check above: advisory
# in the build, fatal here, and a warning annotation under --ci.
if grep -q '^! status-drift:' "$build_log"; then
  grep '^! status-drift:' "$build_log" >&2
  warn "A project at 1.0.0 or later is not marked live. Fix its status in src/projects.json before pushing."
  [ "$mode" = ci ] || exit 1
  grep '^! status-drift:' "$build_log" | sed 's/^! status-drift: /::warning title=Status contradicts the version::/'
  advisory="$advisory — WITH A WARNING: a project at 1.0.0 or later is not marked live (see above)"
else
  ok "Every project at 1.0.0 or later is marked live."
fi

step "Check downloads against earlier releases"
# A release cut without a build an earlier release shipped leaves that OS's button falling
# back to the source zip. Reported in both modes and fatal in neither: the fix is in the
# other project's release, and stopping here would block every push to this site until it
# lands. Under --ci each one becomes a warning annotation, so the pass still says it.
if grep -q '^! download-gap:' "$build_log"; then
  grep '^! download-gap:' "$build_log" >&2
  warn "A release is missing a download an earlier release had (see above). Not fatal."
  if [ "$mode" = ci ]; then
    grep '^! download-gap:' "$build_log" | sed 's/^! download-gap: /::warning title=A release lost a download::/'
  fi
else
  ok "Every download an earlier release shipped is still there."
fi

step "Check deploy readiness (what upload-pages-artifact / deploy-pages expect)"
# The deploy job runs only on GitHub Pages infrastructure and can't be reproduced
# here — but its *reproducible* precondition is that dist/ is a well-formed site
# artifact. A transient "Deployment failed, try again later" from Pages is a
# backend hiccup (re-run the job); THIS catches the failures that are actually our
# fault: an empty dist/, a lost site root, or a dropped CNAME that would silently
# break the custom domain after a "successful" deploy.
deploy_fail=0
require_file() { # <path> <why>
  if [ ! -s "$1" ]; then
    warn "MISSING/empty: $1 — $2"
    deploy_fail=1
  fi
}
if [ ! -d dist ] || [ -z "$(find dist -type f -print -quit)" ]; then
  warn "dist/ is missing or empty — nothing would be deployed."
  deploy_fail=1
else
  require_file dist/index.html "site root; GitHub Pages serves this — without it the site 404s"
  require_file dist/CNAME      "custom domain; losing it reverts the site to *.github.io"
  require_file dist/404.html   "custom not-found page emitted by build.mjs"
  require_file dist/robots.txt "emitted by build.mjs"
  require_file dist/sitemap.xml "emitted by build.mjs"
  # upload-pages-artifact tars dist/ following symlinks; a symlink pointing outside
  # dist/ (or a dangling one) fails the artifact upload on CI.
  if [ -n "$(find dist -type l -print -quit)" ]; then
    warn "dist/ contains symlink(s) — upload-pages-artifact may reject the artifact:"
    find dist -type l >&2
    deploy_fail=1
  fi
fi
if [ "$deploy_fail" -ne 0 ]; then
  warn "Deploy-readiness check FAILED — CI would build green but the deployed site would be broken."
  exit 1
fi
printf 'dist/ OK — %s files, %s\n' "$(find dist -type f | wc -l)" "$(du -sh dist | cut -f1)"

step "Result"
ok "Local CI passed — build + deploy-readiness verified (the live Pages deploy runs only on GitHub)${advisory}."
