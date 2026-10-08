---
paths:
  - "build.mjs"
  - "lib/about.mjs"
  - "lib/templates.mjs"
  - "lib/github.mjs"
  - "src/assets/*.js"
  - "src/assets/style.css"
  - "local-CI.sh"
  - ".github/**"
  - "package.json"
  - "package-lock.json"
---

# Site build — modules, gate and invariants

Loaded by itself when a session reads one of the files above. Moved verbatim from
`CLAUDE.md` on 2026-10-08 to keep start-up load down.

## The pre-push gate

Beyond the build it checks that `dist/` is deploy-ready, that no About page contradicts
the release history, and that every project at 1.0.0 or later is `live`. Each fails a
plain `./local-CI.sh`, which is the pre-push gate. Under `--ci` the About and status
checks are reported and not fatal. The gate also runs
`npm test`; `--ci` does not. A project whose release list GitHub did not return has
nothing for those checks to compare, so the gate declares them skipped in
`$ANTS_GATE_SKIPPED` and the hook writes no passed record; with that variable unset, it
fails.

The push hook runs it; running it by hand is for iterating. The hook is the machine-wide
one (`core.hooksPath`). For a push touching only the paths in `ants.gate.docsGlob` it runs
`./local-CI.sh --docs`, which checks the glob and that the weekly post can close
`CHANGELOG.md`, and skips the build: nothing else the gate runs reads those paths. **Each clone sets `ants.gate.docsGlob`, and it never matches `src/about/` or
`src/posts/`**, which the build reads. A plain `./local-CI.sh` refuses to run until it is
set, printing the exact command. A fresh clone starts without it.

The build authenticates with `GITHUB_TOKEN` if set (CI passes the Actions token
automatically), otherwise with the GitHub CLI's login via `gh auth token`. With neither, or
offline, the build still succeeds — each project falls back to static metadata from
`projects.json`.

## Modules

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

- **`src/assets/style.css`** — all styling. Re-skin by editing the `:root` design tokens at
  the top; it is the single source of truth for theme.

## Key behaviours to preserve

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

- **Download links** point at matched release assets per OS (`ASSET_PAT`/`pickAsset`,
  deliberately conservative), falling
  back to `homepage` → Releases page → repo home. A project whose release ships two builds
  per OS names the one to link with `assetMatch` in `projects.json`, a regex the file must
  also match. Companion files — signatures, checksum
  manifests, SBOMs, updater metadata (`isCompanionFile`) — are skipped *before* OS matching.

The About-page and 1.0.0 checks are in [`content.md`](content.md).
