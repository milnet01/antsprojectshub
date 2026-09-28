---
paths:
  - "scripts/weekly-post.sh"
  - "scripts/week-digest.mjs"
  - "scripts/weekly-post/**"
  - "systemd/ants-weekly-post*"
  - ".digest/**"
---

# Weekly blog post — how the pipeline works

Loaded by itself when a session reads one of the files above. Why a rule says what it says
is in [`docs/history/claude-md.md`](../../docs/history/claude-md.md), under "Weekly blog
post".

A user timer (`systemd/ants-weekly-post.timer`, Wednesdays 09:00, catching up after a missed
one) publishes the week's post with nobody at the keyboard. Install lines are in
`systemd/ants-weekly-post.service`. Three stages:

- **Gather — `scripts/week-digest.mjs`, no AI.** Reads every project's local clone and
  GitHub since the newest post was committed: commits, releases and whether they carry
  downloads, tags, what `CHANGELOG.md` gained, roadmap lines marked done, and commit
  subjects with the body lines that carry a figure. Writes `.digest/<date>.md`
  (`.gitignore`d). **Keep new facts flowing through the digest** rather than telling a
  session to go and read histories. A source that could not be read says "could not be
  read", never none. A tag on the same commit as an earlier one is flagged.

- **Write, then review — two separate `claude -p` sessions**, prompts in
  `scripts/weekly-post/`. The reviewer never saw the writing, checks every figure against
  the digest or its commit, and ends `VERDICT: PASS` or `FAIL`; only PASS publishes. Both
  skip user-level settings and run under `dontAsk` holding exactly: read anything, edit
  `src/posts/**`, and `git log`/`git show` on each clone the digest names **with the path
  spelled out**. Don't widen that list to make a run succeed.

- **Build and publish.** `local-CI.sh`, then commit the one new post and push. Any failed
  step stops with a desktop notification and leaves the draft uncommitted.

It refuses a dirty tree, and skips a week whose newest post is under five days old or in
which no project moved. `--dry-run` gathers the digest and stops, spending no tokens;
`--no-push` stops after the review and the build.

