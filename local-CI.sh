#!/usr/bin/env bash
#
# local-CI.sh — reproduce the GitHub Actions "Build & deploy" build job locally,
# so you can catch failures before pushing to main.
#
# It mirrors the build steps in .github/workflows/deploy.yml exactly:
#     Set up Node 24  ->  npm ci  ->  node build.mjs   (env: GITHUB_TOKEN)
#
# The workflow's deploy steps (configure-pages / upload-pages-artifact /
# deploy-pages) are GitHub Pages infrastructure and cannot run locally, so they
# are intentionally not reproduced here — a green run of this script means the
# part CI can actually fail on (the build) is good.
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

step "Result"
ok "Local CI passed — build reproduced the workflow's build job (deploy steps run only on GitHub Pages)."
