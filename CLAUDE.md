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

It checks two things beyond the build: that `dist/` is deploy-ready, and that no About page
contradicts the release history. Both fail a plain `./local-CI.sh`, which is the pre-push
gate. Under `--ci` the About check is reported and not fatal. The gate also runs
`npm test`; `--ci` does not.

The push hook runs it; running it by hand is for iterating. The hook is the machine-wide
one (`core.hooksPath`). For a push touching only the paths in `ants.gate.docsGlob` it runs
the gate's documentation mode. `local-CI.sh` has none, so every push runs the full gate.
**Each clone sets `ants.gate.docsGlob`, and it never matches `src/about/` or
`src/posts/`**, which the build reads. A plain `./local-CI.sh` refuses to run until it is
set, printing the exact command. A fresh clone starts without it.

The build authenticates with `GITHUB_TOKEN` if set (CI passes the Actions token
automatically), otherwise with the GitHub CLI's login via `gh auth token`. With neither, or
offline, the build still succeeds — each project falls back to static metadata from
`projects.json`.

There is no linter. `.editorconfig` enforces 2-space indent, LF, UTF-8, final newline.

`npm test` covers the *stats server only* — the port contract in
`.claude/rules/stats-dashboard.md`, and nothing else. It
uses `node --test` and Python's `unittest`; the site build has no
tests. It runs in the pre-push gate, **not in CI**.

You almost never run the build by hand. Pushing to `main` is enough — see Deploy.

## Architecture

Data flows: `projects.json` + `src/about/*.md` → `build.mjs` → `dist/`.

- **`src/projects.json`** — the single source of content and the file you edit most. Holds
  the `projects` array and `support` links. Adding or editing a project means editing this
  file and nothing else. Fields: `status` is `live` · `beta` · `wip` · `soon`; `platforms`
  is any of `win` · `mac` · `linux` · `web`; `repo` is `owner/name` (null = unpublished);
  `isFork`/`upstream`/`homepage` drive header credit and download fallbacks. `category`
  groups the project into a landing-page section (`engines` · `games` · `emulation` ·
  `media` · `utilities`); `screenshots` is an array of `{src, alt}` rendered as a gallery on the
  project page (`src` relative to `assets/img/`, `alt` required — see
  `src/assets/img/shots/README.md`); `video` is an optional single `{src, poster, caption}`
  rendered as a Demo section above the gallery (both paths relative to `assets/video/`,
  `caption` required — see `src/assets/video/README.md`); `logo` is the optional wordmark on
  the project's landing-page card and, as the `<h1>` with the name as its alt, at the top
  of its page and changelog (relative to `assets/img/`, see
  `src/assets/img/logos/README.md`) — without one the card shows the name's first letter,
  never a screenshot, and the pages a text heading.

- **`src/about/<slug>.md`** — the hand-written About section for one project, named for its
  slug. **Every project needs one, `soon` ones included**; a missing file fails the build
  with the slug named. `src/about/README.md` owns what goes in one and the house style.
  Plain markdown, no header block, headings start at `##`.

- **`build.mjs`** — the generator. For each *published* project (has a `repo` and status is
  not `soon`) it fetches the release history from the GitHub API, renders the notes to HTML,
  and writes the project page plus a full on-site changelog. It also emits the landing page,
  `404.html`, `CNAME`, `robots.txt` and `sitemap.xml`. Owns all data access and
  page-assembly logic.

- **`lib/about.mjs`** — reads and renders `src/about/*.md`. Data access and parsing only.
  Its sanitiser allowlist is deliberately NOT `build.mjs`'s.

- **`lib/templates.mjs`** — pure presentation: the `basePage()` HTML document shell, the
  `esc()` escaper, and `ORIGIN`. No data access or fetching here — keep that boundary.

- **`lib/github.mjs`** — shared GitHub I/O (`ghRequest`/`ghJson`) and the release-asset → OS
  matcher (`ASSET_PAT`, `assetPlatform`, `pickAsset`, `pickLatestRelease`). Imported by both
  `build.mjs` and `stats.mjs`. Change the matcher here, nowhere else.

- **`lib/ga.mjs`** — the *read* half of analytics: service-account auth (a JWT signed with
  `node:crypto`, no dependency) and the GA4 Data API calls the dashboard shows. Local only —
  `build.mjs` never imports it. It is the mirror
  of `src/assets/analytics.js`, the *write* half, and neither can switch the other on.

- **`src/assets/style.css`** — all styling. Re-skin by editing the `:root` design tokens at
  the top; it is the single source of truth for theme.

### Key behaviours to preserve

- **Resilience: one project's failure must never abort the build.** A GitHub fetch error
  falls back to static metadata and logs a warning. Keep new enrichment paths inside this
  try/fallback discipline.

- **The site is a one-stop shop; only what GitHub alone can serve still links there.** That
  is the release binaries, the issue tracker, and credit to a fork's upstream. Everything a
  visitor *reads* — the About copy and the whole changelog — is on this site. Do not
  reintroduce an "on GitHub →" link for reading material.

- **Release-note HTML is untrusted**. It is rendered
  with `marked` then run through `sanitize-html` with a tight allowlist (`sanitizeOptions`).
  Links get `rel="noopener noreferrer nofollow"` + `target="_blank"`; relative URLs are
  absolutized against the source repo. Do not loosen the allowlist or skip sanitisation.

- **A release with no notes falls back to the repo's `CHANGELOG.md`.** Sections are matched
  by version (`v1.4.5` ↔ `## [1.4.5]`), `[Unreleased]` is skipped, and a project that keeps
  a changelog but has cut no release still gets a history. Where neither exists the page
  says so plainly rather than hiding the version.

- **`marked` and `sanitize-html` are build-time only** — never ship them to visitors. The
  output is static HTML/CSS plus the hand-written progressive-enhancement scripts.
  The lightbox works fully without `lightbox.js` (✕, click-outside, Back) — keep it that
  way; it is loaded via `basePage({ lightbox: true })`. `dates.js` never touches the
  `datetime` attribute and acts only on `<time data-localise>`; it is loaded via `basePage({ dates: true })`. Don't add further
  client JS lightly.

- **Demo videos are native `<video controls>`** — no player library, no JS, self-hosted
  under `/assets/video/`, `preload="none"` with a poster, and they **never autoplay**. The
  visible `caption` is the accessible alternative: never make it optional, and never swap it
  for a decorative one-liner.

- **Analytics is opt-in, and the measurement ID has exactly one home.** The GA4 ID lives in
  `src/projects.json` (`analytics.measurementId`) and nowhere else: the build reads it,
  `lib/templates.mjs` writes it onto the `<script data-ga-id>` tag, and
  `src/assets/analytics.js` reads it back off its own tag. **Blank that one field and the
  tag, the consent bar and every third-party request vanish together** — that is the off
  switch, don't add another. Nothing loads until the visitor presses Accept; the choice is
  kept in `localStorage`, not a cookie. Google's own copy-paste snippet **cannot be used as
  given**. `googletagmanager.com` is
  the one third-party origin allowed, because GA has no self-hostable tag; apply that same
  test before widening the list for anything else.

- **Reading the numbers back is a separate switch from sending them, deliberately.**
  `analytics.measurementId` decides whether visitors are *tracked*; `analytics.propertyId`
  (same block in `src/projects.json`) decides whether the private dashboard *reads* the
  history back. Blank the measurement ID and tracking stops while figures already collected
  stay readable. Blank the property ID and the dashboard's "Site visitors" section
  disappears without touching the live site. Neither ID is a credential; the key at
  `~/.config/gcloud/aph-ga-reader.json` is, and it is read-only, scoped to one property, and
  never enters this repo.

- **`/privacy/` and `analytics.js` are one fact written twice, and the build enforces it.**
  `assertAnalyticsContract()` in `build.mjs` fails the build if ad personalisation is
  switched back on or if the script fetches a host the CSP does not allow. **Adding a claim
  to the privacy page means adding its guard to `ANALYTICS_CLAIMS` in the same edit.**

- **Security headers ship via `<meta>`**: a strict CSP
  with no inline scripts or styles, `referrer: no-referrer`, `nosniff`. The self-hosted
  scripts are allowed by `script-src 'self'` and demo videos by `media-src 'self'`;
  **inline** `<script>`/`<style>` still break the CSP — never introduce them. The one
  third-party origin in the whole policy is `googletagmanager.com` in `script-src`, plus
  Google Analytics' collector in `connect-src`.

- **An About page's claim to be unpublished must stay true.** `build.mjs` compares each About page against the history it has just
  fetched and warns; `local-CI.sh` turns that warning into a failure (except under
  `--ci`, the daily rebuild). The phrases it
  recognises are `UNPUBLISHED_CLAIMS` in `build.mjs` — extend that list rather than adding
  a second check. No About page states a version number, so nothing reads one; add that
  check when one does.

- **Download links** point at matched release assets per OS (`ASSET_PAT`/`pickAsset`,
  deliberately conservative), falling
  back to `homepage` → Releases page → repo home. Companion files — signatures, checksum
  manifests, SBOMs, updater metadata (`isCompanionFile`) — are skipped *before* OS matching.

## Deploy

`.github/workflows/deploy.yml` runs the build and publishes `dist/` to GitHub Pages on every
push to `main`, daily at ~05:00 UTC, and on manual
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
