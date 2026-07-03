#!/usr/bin/env bash
#
# local-CI.sh — reproduce the GitHub Actions "Build & deploy" build job locally,
# so you can catch failures before pushing to main.
#
# It mirrors the build steps in .github/workflows/deploy.yml exactly:
#     Set up Node 24  ->  npm ci  ->  node build.mjs   (env: GITHUB_TOKEN)
#
# The workflow's deploy steps (configure-pages / upload-pages-artifact /
# deploy-pages) are GitHub Pages infrastructure and cannot run locally. What we
# CAN check is deploy *readiness* — that dist/ is a well-formed site artifact
# (site root, CNAME, no stray symlinks). A green run means the parts CI can fail
# on for OUR reasons are good; a transient "Deployment failed, try again later"
# from Pages is a backend hiccup — just re-run the deploy job.
#
# Usage:   ./local-CI.sh
# Token:   export GITHUB_TOKEN=<pat>   before running to avoid GitHub API rate
#          limits (CI passes secrets.GITHUB_TOKEN automatically). Without it the
#          build still succeeds via projects.json fallbacks — same as CI.

set -euo pipefail

# Always run from the repo root, whatever the caller's cwd.
cd "$(dirname "$(readlink -f "$0")")"

# The Node major version pinned in the workflow. Keep in lockstep with
# .github/workflows/deploy.yml's `node-version:`.
readonly CI_NODE_MAJOR=24

step() { printf '\n\033[1;34m==> %s\033[0m\n' "$1"; }
ok()   { printf '\033[1;32m%s\033[0m\n' "$1"; }
warn() { printf '\033[1;33m%s\033[0m\n' "$1" >&2; }

step "Set up Node (workflow pins Node ${CI_NODE_MAJOR})"
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
npm ci

step "Build site  ->  node build.mjs"
# GITHUB_TOKEN is passed through if set, exactly as the workflow does.
node build.mjs

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
ok "Local CI passed — build + deploy-readiness verified (the live Pages deploy runs only on GitHub)."
