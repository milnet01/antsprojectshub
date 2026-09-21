#!/usr/bin/env bash
# Weekly blog post: gather the facts (free) → Claude writes the post → a second, fresh
# Claude session checks it against the sources → build → close the week's
# changelog section → commit and push.
# systemd/ants-weekly-post.timer runs it every Wednesday. Safe to run by hand:
#
#   scripts/weekly-post.sh             # the whole thing
#   scripts/weekly-post.sh --no-push   # stop after the review and the build; nothing is committed
#   scripts/weekly-post.sh --dry-run   # gather the digest and stop; no AI, no tokens
#
# It stops, and says why on the desktop, at the first thing that is not right: a dirty
# tree, no GitHub login, a review that does not pass, a build that fails. A stopped run
# leaves the draft in src/posts/ uncommitted, so nothing unchecked is ever published.
#
# WEEKLY_POST_MODEL (default opus) and WEEKLY_POST_BUDGET_USD (default 15, per session)
# override the model and the spending cap.
set -euo pipefail
cd "$(dirname "$(readlink -f "$0")")/.."

mode=${1:-publish}
case $mode in
  publish | --no-push | --dry-run) ;;
  *) echo "usage: $0 [--no-push | --dry-run]" >&2; exit 2 ;;
esac
model=${WEEKLY_POST_MODEL:-opus}
budget=${WEEKLY_POST_BUDGET_USD:-15}
# WEEKLY_POST_TODAY pretends it is another day — only for testing the runner itself.
today=${WEEKLY_POST_TODAY:-$(date +%F)}

say() { echo "weekly-post: $1"; }
stop() {
  say "$1"
  notify-send -a "Ants Projects Hub" "Weekly post stopped" "$1" 2>/dev/null || true
  exit 1
}

mkdir -p .digest
exec 9>.digest/.lock
flock -n 9 || stop "another run is already in progress"

if [[ $mode != --dry-run ]]; then
  [[ -z $(git status --porcelain) ]] ||
    stop "the site folder has uncommitted changes, which a new post could get mixed up with"
  # A post published by hand earlier in the week covers it; don't follow it with a
  # near-empty one. Filenames start with the post's date, so the last one is the newest.
  newest=$(basename "$(printf '%s\n' src/posts/*.md | tail -1)")
  age_days=$(( ($(date -d "$today" +%s) - $(date -d "${newest:0:10}" +%s)) / 86400 ))
  if (( age_days < 5 )); then
    say "the newest post, $newest, is only $age_days day(s) old; nothing to do"
    exit 0
  fi
fi

# gh keeps its login in the desktop keyring, locked until you log in. A run fired at boot
# waits for it rather than gathering a digest full of "could not be read".
for _ in $(seq 60); do
  gh auth token >/dev/null 2>&1 && break
  sleep 30
done
gh auth token >/dev/null 2>&1 || stop "no GitHub login after 30 minutes (is the keyring unlocked?)"
[[ $mode == --dry-run ]] || git pull --ff-only -q || stop "could not update the site from GitHub"

digest=$(node scripts/week-digest.mjs) || stop "the digest could not be gathered"
say "digest: $digest ($(wc -c <"$digest") bytes)"
if head -1 "$digest" | grep -qx NO-ACTIVITY; then
  say "no project moved since the last post; no post this week"
  exit 0
fi
if [[ $mode == --dry-run ]]; then
  say "dry run: stopping before the AI steps"
  exit 0
fi

post=""
fill() {
  local t
  t=$(<"$1")
  t=${t//\{\{DIGEST\}\}/$digest}
  t=${t//\{\{TODAY\}\}/$today}
  t=${t//\{\{POST\}\}/$post}
  printf '%s\n' "$t"
}

# One git rule per clone the digest names, with the path spelled out. A wildcard in front
# of the subcommand would also approve options such as -c, which can run any command.
git_rules=()
while read -r clone; do
  git_rules+=("Bash(git -C $clone log *)" "Bash(git -C $clone show *)")
done < <(sed -n 's|^- Repository: .*; local clone: \(/.*\)$|\1|p' "$digest")

# Both sessions skip the user-level settings — plugins, hooks and the general allowlist —
# so the only tools they hold are the ones named here: read anything, edit only posts
# (an Edit rule covers Write too), and git log / git show on those clones. dontAsk refuses
# everything else rather than waiting for a person who is not there. The prompt goes in on
# stdin because --allowedTools takes a list and would swallow it.
claude_run() {
  timeout 60m claude --print --no-session-persistence --model "$model" \
    --max-budget-usd "$budget" --setting-sources project,local --permission-mode dontAsk \
    --add-dir "$(dirname "$PWD")" \
    --allowedTools Read Glob Grep "Edit(./src/posts/**)" "${git_rules[@]}"
}

say "writing the post"
fill scripts/weekly-post/write.md | claude_run || stop "the writing session failed"
changed=$(git status --porcelain --untracked-files=all)
post=$(sed -n "s|^?? \(src/posts/${today}-.*\.md\)\$|\1|p" <<<"$changed")
[[ -n $post && $(wc -l <<<"$changed") -eq 1 ]] ||
  stop "the writing session did not leave exactly one new post: ${changed:-nothing}"

say "reviewing $post"
verdict=$(fill scripts/weekly-post/review.md | claude_run | tee /dev/stderr | grep '^VERDICT:' | tail -1) || true
[[ $verdict == "VERDICT: PASS" ]] ||
  stop "the review did not pass, so nothing was published (${verdict:-no verdict}). The draft is $post"
[[ $(git status --porcelain --untracked-files=all) == "?? $post" ]] ||
  stop "the review changed more than the post; nothing was published"

./local-CI.sh || stop "the site did not build with the new post. The draft is $post"
if [[ $mode == --no-push ]]; then
  say "--no-push: $post is reviewed and builds, and is not committed"
  exit 0
fi

# The site ships by pushing, so dated changelog sections stand in for versions.
# This is the cadence that closes one: whatever accrued under [Unreleased] since
# the last post is dated now, in the same commit as the post that describes it.
closed=$(node scripts/close-changelog.mjs) || stop "closing the changelog section failed"
say "${closed#close-changelog: }"
git add -- "$post" CHANGELOG.md
git commit -q -F - <<EOF
content: this week's post

Written by scripts/weekly-post.sh from $digest, then checked against its
sources by a second, independent session before publishing (VERDICT: PASS).

Changelog: ${closed#close-changelog: }

CLAUDE.md rule 14: checked, no contract document edited, no gate.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
git push -q origin main || stop "the post is committed but the push failed; run git push"
say "published $post"
notify-send -a "Ants Projects Hub" "Weekly post published" "$post" 2>/dev/null || true
