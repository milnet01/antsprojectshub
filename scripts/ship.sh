#!/usr/bin/env bash
# Ship what is committed: push to main, wait for the Pages deploy of that commit, then check
# the live site shows what the commit added. Prints a few lines instead of the whole gate and
# deploy log, so a session spends its tokens on the change, not on reading build output.
#
#   scripts/ship.sh                                   # push and wait for the deploy
#   scripts/ship.sh 'p/groundwork.html=zypper addrepo' 'p/snatch.html=Log button'
#
# Each argument is <path on the site>=<text that page must now contain>. The push runs the
# pre-push gate (local-CI.sh) as always; its full output goes to .ship.log (gitignored, as
# *.log), which is the file to read when a step fails.
set -uo pipefail
cd "$(dirname "$(readlink -f "$0")")/.." || exit

origin=https://antsprojectshub.co.za
log=.ship.log
say() { echo "ship: $1"; }

for check in "$@"; do
  [[ $check == *=* ]] || { echo "usage: $0 ['<site path>=<text>' ...]" >&2; exit 2; }
done

sha=$(git rev-parse HEAD)
git push origin main >"$log" 2>&1
rc=$?
if ((rc != 0)); then
  grep -E 'FAIL|rror|✗' "$log" | tail -n 20
  say "push failed (exit $rc); the whole output is in $log"
  exit 1
fi
if grep -q 'Everything up-to-date' "$log"; then
  say "${sha:0:7} was already on GitHub; nothing pushed, so the gate did not run"
else
  say "pushed ${sha:0:7}; the gate passed"
fi

# A push touching only ants.gate.docsGlob paths starts no deploy, so allow for no run.
run=
for _ in {1..12}; do
  run=$(gh run list --commit "$sha" --workflow deploy.yml --json databaseId -q '.[0].databaseId // empty')
  [[ -n $run ]] && break
  sleep 5
done
if [[ -z $run ]]; then
  say "no deploy run started for ${sha:0:7} within a minute (a docs-only push starts none)"
  (($# == 0)) && exit 0
  exit 1
fi

gh run watch "$run" --exit-status >>"$log" 2>&1
rc=$?
if ((rc != 0)); then
  say "deploy run $run failed (exit $rc). If only the deploy job failed, re-run it: gh run rerun $run --failed"
  exit 1
fi
say "deploy run $run succeeded"

failed=0
for check in "$@"; do
  path=${check%%=*} text=${check#*=}
  # The query string asks the CDN for a fresh copy rather than one cached before the deploy.
  if curl -fsS "$origin/${path#/}?ship=${sha:0:7}" | grep -qF -- "$text"; then
    say "live: /${path#/} shows \"$text\""
  else
    say "NOT live: /${path#/} does not show \"$text\""
    failed=1
  fi
done
exit "$failed"
