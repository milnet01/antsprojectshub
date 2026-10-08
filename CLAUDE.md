# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this
repository. Why a rule says what it says is in
[`docs/history/claude-md.md`](docs/history/claude-md.md).

## What this is

Source for **[antsprojectshub.co.za](https://antsprojectshub.co.za)** — a static showcase
site for Anthony Schemel's projects. It is a small Node build-time static-site generator.

The only client-side JavaScript is hand-written, and each piece is progressive enhancement:

- `assets/lightbox.js` — keyboard shortcuts for the screenshot lightbox, loaded only on
  gallery pages.
- `assets/dates.js` — rewrites a release date into the reader's own locale format, loaded
  only on project pages that have one.
- `assets/analytics.js` — the cookie consent bar, and the Google Analytics tag it gates.

`dist/` is generated. Never hand-edit it; it is `.gitignore`d and rebuilt in CI.

## Build & preview

```bash
npm ci                  # install locked deps (Node >= 22.12)
node build.mjs          # build → dist/  (or: npm run build)
npx serve dist          # preview at http://localhost:3000
./local-CI.sh           # reproduce the CI build job locally before pushing
npm run stats           # private stats dashboard → .stats/ (never published)
npm test                # the stats server's port handling (Node + Python)
```

`local-CI.sh` **is** the build: the `build` job in `.github/workflows/deploy.yml` calls
`./local-CI.sh --ci`, and reads the Node version from `./local-CI.sh --print-node-major`.
Change a build step or the Node version in the script, never in the workflow. Only the
Pages steps (configure, upload, deploy) belong to the workflow.

What else the gate checks, the `ants.gate.docsGlob` setting and how the build reaches
GitHub are in [`.claude/rules/site-build.md`](.claude/rules/site-build.md).

There is no linter. `.editorconfig` enforces 2-space indent, LF, UTF-8, final newline.

You almost never run the build by hand. Pushing to `main` is enough — see Deploy.

## Architecture

Data flows: `projects.json` + `src/about/*.md` → `build.mjs` → `dist/`.

- **`src/projects.json`** — the single source of content and the file you edit most.
- **`src/about/<slug>.md`** — the About section for one project; every project needs one.

Field meanings and About rules: [`.claude/rules/content.md`](.claude/rules/content.md).

`build.mjs`, `lib/about.mjs`, `lib/templates.mjs`, `lib/github.mjs` and `src/assets/style.css`
each own one job, listed in [`.claude/rules/site-build.md`](.claude/rules/site-build.md).
`lib/ga.mjs` belongs to the stats dashboard and is described in its rules file.

### Key behaviours to preserve

The build's invariants — resilience, sanitising, analytics, the CSP, downloads — are in
[`.claude/rules/site-build.md`](.claude/rules/site-build.md). Read it before changing
`build.mjs`, `lib/` or `src/assets/`.

## Deploy

`.github/workflows/deploy.yml` runs the build and publishes `dist/` to GitHub Pages on every
push to `main` that changes more than the `ants.gate.docsGlob` paths, daily at ~05:00 UTC, and on manual
dispatch. The repo is public, so pushing is the normal way to ship. Action SHAs are pinned
(with the version in a trailing comment) — bump them deliberately, not casually.

The `deploy` job runs only on GitHub Pages infrastructure, so it cannot be reproduced
locally. If it fails with **`Deployment failed, try again later`** while the `build` job is
green, that is a transient Pages backend hiccup — **re-run the deploy job**
(`gh run rerun <id> --failed`), don't hunt for a code cause. `local-CI.sh` checks deploy
*readiness* (dist/ has `index.html`, `CNAME`, no stray symlinks).

## Private stats dashboard (`npm run stats`)

`stats.mjs` builds an owner-only dashboard — downloads per OS per project, repo traffic,
audience/activity, release health, and content checks — into `.stats/dashboard.html`.
`serve.mjs` (systemd user unit in `systemd/`) serves it on `127.0.0.1:4321` and calls
`generate()` on start, every 24 h, and on `POST /refresh` from the page's button.
`tray/ants-stats-tray.py` is an optional PySide6 tray icon that drives the unit (open /
refresh / start / stop / restart / quit). It refreshes via the same `POST /refresh`, never
by calling `generate()` itself.

**The privacy model is "it is never published", and nothing weaker works.**

- `.stats/` is `.gitignore`d, and `stats.mjs` writes **only** there — never `dist/`.
- Nothing in `build.mjs`, `local-CI.sh` or `deploy.yml` references it.
- `serve.mjs` binds `127.0.0.1` explicitly, never `0.0.0.0` — the dashboard must not be
  reachable from the local network. Keep the file allowlist (`FILES`) closed; don't turn it
  into a general static server rooted at the repo.
- Do not add stats output to `src/assets/`. Do not "just add a login".

**Everything else about the dashboard — the port, Google Analytics, failed fetches,
authentication, history, the self-contained `.stats/` folder, colour, the nav and sorting —
is in [`.claude/rules/stats-dashboard.md`](.claude/rules/stats-dashboard.md).** It loads by
itself when you open `stats.mjs`, `serve.mjs`, `lib/ga.mjs`, `lib/port.mjs`, `tray/`, `test/`
or `systemd/ants-stats*`. Read it by hand before creating a new file for the dashboard.

## Weekly blog post (`scripts/weekly-post.sh`)

A user timer publishes the week's post on Wednesdays with nobody at the keyboard: gather a
digest, write and review it in two separate `claude -p` sessions, then build and push.
**How it works, and what it must never be widened to do, is in
[`.claude/rules/weekly-post.md`](.claude/rules/weekly-post.md).** It loads by itself when you
open `scripts/weekly-post.sh`, `scripts/week-digest.mjs`, `scripts/weekly-post/` or
`systemd/ants-weekly-post*`. Read it by hand before creating a new file for the pipeline.

## Dependencies

**All dependencies are kept at their latest stable version** (npm packages, pinned GitHub
Actions, and the Node runtime, which tracks the newest LTS). The only time a dep may be held back is when a newer version explicitly breaks a
feature, and then it **must** be documented in [`docs/DEPENDENCY_POLICY.md`](docs/DEPENDENCY_POLICY.md) — including the exact
version that broke us. Read that
file before bumping or pinning anything.

## Accessibility is a hard requirement

The site owner is partially sighted. All visual changes must keep WCAG AA contrast (the CSS
text tokens are chosen to meet AA on `--bg`), preserve the skip-link and semantic landmarks,
and not rely on colour alone to convey status. Verify contrast when touching colours.

## Changelog

The site deploys continuously, so dated sections stand in for versions. Add entries under
`## [Unreleased]`; `scripts/weekly-post.sh` closes them under the day's date when it
publishes. `scripts/close-changelog.mjs` does the closing and
can be run by hand.
