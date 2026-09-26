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
npm ci                  # install locked deps (Node >= 20)
node build.mjs          # build → dist/  (or: npm run build)
npx serve dist          # preview at http://localhost:3000
./local-CI.sh           # reproduce the CI build job locally before pushing
npm run stats           # private stats dashboard → .stats/ (never published)
npm test                # the stats server's port handling (Node + Python)
```

`local-CI.sh` **is** the build: the `build` job in `.github/workflows/deploy.yml` calls
`./local-CI.sh --ci`, and reads the Node version from `./local-CI.sh --print-node-major`.
Change a build step or the Node version in the script, never in the workflow. Only the
Pages steps (configure, upload, deploy) belong to the workflow; they cannot run locally.

It checks two things beyond the build: that `dist/` is deploy-ready, and that no About page
contradicts the release history. Both fail a plain `./local-CI.sh`, which is the pre-push
gate. Under `--ci` the About check is reported and not fatal, so a stale sentence never
stops the site's daily rebuild.

The push hook runs it; running it by hand is for iterating. The hook is the machine-wide
one (`core.hooksPath`), and it skips the gate for a push it takes to be documentation
only. Its default guess counts every `*.md`, including `src/about/` and `src/posts/`,
which the build reads. **So each clone needs `ants.gate.docsGlob` set**, and a plain
`./local-CI.sh` refuses to run until it is, printing the exact command. Git config is
never committed, so a fresh clone starts without it.

Authentication avoids GitHub API rate limits: `GITHUB_TOKEN` if set (CI passes the Actions
token automatically), otherwise the GitHub CLI's login via `gh auth token`. With neither, or
offline, the build still succeeds — each project falls back to static metadata from
`projects.json`.

There is no linter. `.editorconfig` enforces 2-space indent, LF, UTF-8, final newline.

`npm test` covers the *stats server only* — the port contract below, and nothing else. It
uses `node --test` and Python's `unittest`, so it adds no dependency; the site build has no
tests. It is **local, not CI**: the tray half needs PySide6, which the deploy runner does
not have, and the deploy workflow deliberately touches nothing under `.stats/`.

You almost never run the build by hand. Pushing to `main` is enough — see Deploy.

## Architecture

Data flows: `projects.json` + `src/about/*.md` → `build.mjs` → `dist/`.

- **`src/projects.json`** — the single source of content and the file you edit most. Holds
  the `projects` array and `support` links. Adding or editing a project means editing this
  file and nothing else. Fields: `status` is `live` · `beta` · `wip` · `soon`; `platforms`
  is any of `win` · `mac` · `linux` · `web`; `repo` is `owner/name` (null = unpublished);
  `isFork`/`upstream`/`homepage` drive header credit and download fallbacks. `category`
  groups the project into a landing-page section (`engines` · `emulation` · `media` ·
  `utilities`); `screenshots` is an array of `{src, alt}` rendered as a gallery on the
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
  Its sanitiser allowlist is deliberately NOT `build.mjs`'s: this is our own copy, so an
  internal link stays internal.

- **`lib/templates.mjs`** — pure presentation: the `basePage()` HTML document shell, the
  `esc()` escaper, and `ORIGIN`. No data access or fetching here — keep that boundary.

- **`lib/github.mjs`** — shared GitHub I/O (`ghRequest`/`ghJson`) and the release-asset → OS
  matcher (`ASSET_PAT`, `assetPlatform`, `pickAsset`, `pickLatestRelease`). Imported by both
  `build.mjs` and `stats.mjs` **so the two can never disagree about which file counts as a
  Windows/macOS/Linux download**. Change the matcher here, nowhere else.

- **`lib/ga.mjs`** — the *read* half of analytics: service-account auth (a JWT signed with
  `node:crypto`, no dependency) and the GA4 Data API calls the dashboard shows. Local only —
  `build.mjs` never imports it, so no GA figure can reach the public site. It is the mirror
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

- **Release-note HTML is untrusted** (a fork's upstream writes some of it). It is rendered
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
  `datetime` attribute and acts only on `<time data-localise>`, so nothing else on the page
  can drift; it is loaded via `basePage({ dates: true })`. With no JavaScript there is
  nothing to track, so `analytics.js` correctly does nothing at all. Don't add further
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
  given** — it is an inline `<script>`, and the CSP forbids those. `googletagmanager.com` is
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

- **Security headers ship via `<meta>`** (GitHub Pages cannot set HTTP headers): a strict CSP
  with no inline scripts or styles, `referrer: no-referrer`, `nosniff`. The self-hosted
  scripts are allowed by `script-src 'self'` and demo videos by `media-src 'self'`;
  **inline** `<script>`/`<style>` still break the CSP — never introduce them. The one
  third-party origin in the whole policy is `googletagmanager.com` in `script-src`, plus
  Google Analytics' collector in `connect-src`.

- **An About page's claim to be unpublished must stay true.** The copy is hand-written
  and the release history is not, so a page saying "no download yet" outlives the release
  that gave it one. `build.mjs` compares each About page against the history it has just
  fetched and warns; `local-CI.sh` turns that warning into a failure (except under
  `--ci`, the daily rebuild). The phrases it
  recognises are `UNPUBLISHED_CLAIMS` in `build.mjs` — extend that list rather than adding
  a second check. No About page states a version number, so nothing reads one; add that
  check when one does.

- **Download links** point at matched release assets per OS (`ASSET_PAT`/`pickAsset`,
  deliberately conservative so a source tarball is not mistaken for a Linux binary), falling
  back to `homepage` → Releases page → repo home. Companion files — signatures, checksum
  manifests, SBOMs, updater metadata (`isCompanionFile`) — are skipped *before* OS matching.

## Deploy

`.github/workflows/deploy.yml` runs the build and publishes `dist/` to GitHub Pages on every
push to `main`, daily at ~05:00 UTC (to refresh release notes and changelogs), and on manual
dispatch. The repo is public, so pushing is the normal way to ship. Action SHAs are pinned
(with the version in a trailing comment) — bump them deliberately, not casually.

The `deploy` job runs only on GitHub Pages infrastructure, so it cannot be reproduced
locally. If it fails with **`Deployment failed, try again later`** while the `build` job is
green, that is a transient Pages backend hiccup — **re-run the deploy job**
(`gh run rerun <id> --failed`), don't hunt for a code cause. `local-CI.sh` checks deploy
*readiness* (dist/ has `index.html`, `CNAME`, no stray symlinks), so the failures that *are*
our fault are caught before pushing.

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
- Do not add stats output to `src/assets/` — `build.mjs` copies that whole directory into
  `dist/`, which would publish it. Do not "just add a login".

Other invariants:

- **The port is `PORT` → `STATS_PORT` → 4321, resolved in `lib/port.mjs`.** `STATS_PORT` is
  the packaged default in the unit file; `PORT` is how an external process manager overrides
  it via a systemd drop-in, without editing a tracked file. A `PORT` that cannot be used is
  fatal — `serve.mjs` exits non-zero naming the value. `STATS_PORT` keeps its older lenient
  behaviour (a bad value still falls back) and must not change. **The tray reads the port
  from the *unit's* environment** (`systemctl --user show ants-stats -p Environment`), never
  from its own. `LWSM_MANAGED=1` drops the icon and logs to stdout instead — a presentation
  hint only, never a reason to grant or skip anything.

- **Google Analytics is read, never written, and never snapshotted.** The "Site visitors"
  section calls the GA4 Data API through `lib/ga.mjs` at render time and keeps nothing. A GA
  failure returns `null` and renders as "could not be read" — never as zeros, and never
  enough to abort the run; the GitHub half of the page still builds. The section also states
  in plain words that opt-in tracking makes every figure a floor rather than a total.

- **A failed fetch is never recorded as zero.** Rate-limited or errored projects are shown
  as "no data", excluded from totals, and kept out of `.stats/history.json`. Keep this
  discipline in new metrics.

- **The token is resolved per run, never once per process.** `resolveAuth()` in
  `lib/github.mjs` re-checks while unauthenticated and caches success; `generate()` calls it
  first, and `serve.mjs` waits for a login before its startup run rather than firing blind.
  `hasToken`/`tokenSource` are `export let` **on purpose** — importers rely on the live
  binding to see the update. Don't turn them back into `const`.

- **Authentication is effectively required, but automatic.** `lib/github.mjs` resolves a
  token from `GITHUB_TOKEN`, else from `gh auth token` — so a developer already logged into
  the GitHub CLI needs no setup, and local `node build.mjs` runs authenticated too. If a
  token is ever suggested, it is classic scope `public_repo`, **not** full `repo`. With
  neither, the run degrades: traffic is skipped, which keeps the call count under the
  unauthenticated ceiling so the rest still fills in.

- **History is append-only and local.** Download totals are stored as dated snapshots;
  traffic is merged as per-day buckets, because GitHub deletes traffic data after 14 days.

- **`.stats/` must stay self-contained.** `src/assets/style.css` is *copied* in as
  `site.css`, not linked. Any new asset the page references gets copied in and added to
  `FILES` too. The body class is `admin`, **not** `stats`.

- **Colour on the dashboard is wayfinding, not data.** Each section owns an `--accent`
  (teal → violet down the page) shared with its nav link, and the OS columns are tinted
  blue/magenta/green. Those hues deliberately sit clear of the status language — amber means
  "look at this", teal "up", rose "down". Figures stay in text ink; the colour never
  competes with the numbers.

- **The sticky nav is progressive enhancement too.** The links are ordinary anchors that
  work without JavaScript; `dashboard.js` only adds the scroll-spy.

- **Sorting is progressive enhancement.** `dashboard.js` turns each `table.sortable` header
  into a `<button>` and toggles `aria-sort`; every table also ships pre-sorted by its most
  useful column, so the page is complete if the script never runs. Sort keys come from
  `data-sort` attributes emitted with each cell — don't switch to parsing the rendered text.
  Mark a column `data-nosort` when it holds no rankable value (Trend, Top referrers).
  **A chosen sort is remembered across reloads**, in `localStorage` under
  `aph-sort:<data-table>`. Every sortable table carries a `data-table` name, and a new one
  needs its own; the key is that name and never the table's position. A stored column index
  that no longer names a sortable column is ignored. Every access is wrapped in
  `try`/`catch`.

## Weekly blog post (`scripts/weekly-post.sh`)

A user timer (`systemd/ants-weekly-post.timer`, Wednesdays 09:00, catching up after a missed
one) publishes the week's post with nobody at the keyboard. Install lines are in
`systemd/ants-weekly-post.service`. Three stages, and the split is the point:

- **Gather — `scripts/week-digest.mjs`, no AI.** Reads every project's local clone and
  GitHub since the newest post was committed: commits, releases and whether they carry
  downloads, tags, what `CHANGELOG.md` gained, roadmap lines marked done, and commit
  subjects with the body lines that carry a figure. Writes `.digest/<date>.md`
  (`.gitignore`d). **Keep new facts flowing through the digest** rather than telling a
  session to go and read histories. A source that could not be read says "could not be
  read", never none. A tag on the same commit as an earlier one is flagged, because a
  promoted preview carries nothing new.

- **Write, then review — two separate `claude -p` sessions**, prompts in
  `scripts/weekly-post/`. The reviewer never saw the writing, checks every figure against
  the digest or its commit, and ends `VERDICT: PASS` or `FAIL`; only PASS publishes. Both
  skip user-level settings and run under `dontAsk` holding exactly: read anything, edit
  `src/posts/**`, and `git log`/`git show` on each clone the digest names **with the path
  spelled out** — a wildcard before the subcommand would also approve `git -c`, which runs
  commands. Don't widen that list to make a run succeed.

- **Build and publish.** `local-CI.sh`, then commit the one new post and push. Any failed
  step stops with a desktop notification and leaves the draft uncommitted, so nothing
  unreviewed goes live.

It refuses a dirty tree, and skips a week whose newest post is under five days old or in
which no project moved. `--dry-run` gathers the digest and stops, spending no tokens;
`--no-push` stops after the review and the build.

## Dependencies

**All dependencies are kept at their latest stable version** (npm packages, pinned GitHub
Actions, and the Node runtime) — for security as much as features. The only time a dep may
be held back is when a newer version explicitly breaks a feature, and then it **must** be
documented in [`docs/DEPENDENCY_POLICY.md`](docs/DEPENDENCY_POLICY.md) — including the exact
version that broke us, so a later release can be re-tested and the pin lifted. Read that
file before bumping or pinning anything.

## Accessibility is a hard requirement

The site owner is partially sighted. All visual changes must keep WCAG AA contrast (the CSS
text tokens are chosen to meet AA on `--bg`), preserve the skip-link and semantic landmarks,
and not rely on colour alone to convey status. Verify contrast when touching colours.

## Changelog

The site deploys continuously, so dated sections stand in for versions. Add entries under
`## [Unreleased]`; `scripts/weekly-post.sh` closes them under the day's date when it
publishes, so no section stays open. `scripts/close-changelog.mjs` does the closing and
can be run by hand.

## History

Dated corrections, superseded wording, and the arguments that settled these rules are in
[`docs/history/claude-md.md`](docs/history/claude-md.md).
