# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Source for **[antsprojectshub.co.za](https://antsprojectshub.co.za)** — a static showcase
site for Anthony Schemel's projects. It is a small Node build-time static-site generator:
the only client-side JavaScript is one tiny progressive-enhancement script
(`assets/lightbox.js`, keyboard shortcuts for the screenshot lightbox — see below),
loaded only on pages that have a gallery. `dist/` is generated, never hand-edited (it is
`.gitignore`d and rebuilt in CI).

## Build & preview

```bash
npm ci                  # install locked deps (Node >= 20)
node build.mjs          # build → dist/  (or: npm run build)
npx serve dist          # preview at http://localhost:3000
./local-CI.sh           # reproduce the CI build job locally before pushing
npm run stats           # private stats dashboard → .stats/ (never published)
npm test                # the stats server's port handling (Node + Python)
```

`local-CI.sh` mirrors the `build` job in `.github/workflows/deploy.yml` step-for-step
(`npm ci` → `node build.mjs`); if you change the workflow's build steps or its pinned Node
version, update the script to match. The deploy steps are GitHub Pages infra and can't run
locally.

Authentication avoids GitHub API rate limits: `GITHUB_TOKEN` if set (CI passes the Actions
token automatically), otherwise the GitHub CLI's login via `gh auth token`. With neither /
offline, the build still succeeds — each project falls back to static metadata from
`projects.json`. There is no linter; `.editorconfig` enforces 2-space indent, LF, UTF-8,
final newline.

`npm test` covers the *stats server only* — the port contract below, and nothing else. It
uses `node --test` and Python's `unittest`, so it adds no dependency; the site build has no
tests. It is **local, not CI**: the tray half needs PySide6, which the deploy runner doesn't
have, and the deploy workflow deliberately touches nothing under `.stats/`.

You almost never run the build by hand: pushing to `main` is enough (see deploy below).

## Architecture

Data flows: `projects.json` + `src/about/*.md` → `build.mjs` → `dist/`.

- **`src/projects.json`** — the single source of content and the file you edit most. Holds
  the `projects` array and `support` links. Adding/editing a project means editing this
  file and nothing else. Fields: `status` is `live` · `beta` · `wip` · `soon`; `platforms`
  is any of `win` · `mac` · `linux` · `web`; `repo` is `owner/name` (null = unpublished);
  `isFork`/`upstream`/`homepage` drive header credit and download fallbacks. `category`
  groups the project into a landing-page section (`engines` · `emulation` · `media` ·
  `utilities`); `screenshots` is an array of `{src, alt}` rendered as a gallery on the
  project page (`src` relative to `assets/img/`, `alt` required — see
  `src/assets/img/shots/README.md`); `video` is an optional single `{src, poster, caption}`
  rendered as a Demo section above the gallery (both paths relative to `assets/video/`,
  `caption` required — see `src/assets/video/README.md`).

- **`src/about/<slug>.md`** — the hand-written About section for one project, named for its
  slug. **Every project needs one, `soon` ones included**; a missing file fails the build
  with the slug named. This REPLACED rendering the project's GitHub README in that slot, on
  2026-08-20: a README opens with badges and build flags, buries what the thing does, and
  changed the page shape whenever the repo was edited. `src/about/README.md` owns what goes
  in one and the house style. Plain markdown, no header block, headings start at `##`.

- **`build.mjs`** — the generator. For each *published* project (has a `repo` and status is
  not `soon`) it fetches the release history from the GitHub API, renders the notes to HTML,
  and writes the project page plus a full on-site changelog. It also emits the landing page,
  `404.html`, `CNAME`, `robots.txt` and `sitemap.xml`. Owns all data access and
  page-assembly logic.

- **`lib/about.mjs`** — reads and renders `src/about/*.md`. Data access + parsing only. Its
  sanitiser allowlist is deliberately NOT `build.mjs`'s: this is our own copy, so an
  internal link stays internal.

- **`lib/templates.mjs`** — pure presentation: the `basePage()` HTML document shell, the
  `esc()` escaper, and `ORIGIN`. No data access or fetching here — keep that boundary.

- **`lib/github.mjs`** — shared GitHub I/O (`ghRequest`/`ghJson`) and the release-asset →
  OS matcher (`ASSET_PAT`, `assetPlatform`, `pickAsset`, `pickLatestRelease`). Imported by
  both `build.mjs` and `stats.mjs` **so the two can never disagree about which file counts
  as a Windows/macOS/Linux download** — if they drifted, the private dashboard would report
  numbers the public site doesn't show. Change the matcher here, nowhere else.

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
- **A release with no notes falls back to the repo's `CHANGELOG.md`.** 24 of 180 releases
  here were cut with an empty body — all 11 of OneUp's — so without the fallback the
  changelog page read "shipped without written notes" over and over. Sections are matched
  by version (`v1.4.5` ↔ `## [1.4.5]`), `[Unreleased]` is skipped, and a project that keeps
  a changelog but has cut no release still gets a history. Where neither exists the page
  says so plainly rather than hiding the version.
- **`marked` and `sanitize-html` are build-time only** — never ship them to visitors. The
  output is static HTML/CSS plus a single hand-written progressive-enhancement script
  (`src/assets/lightbox.js`, ~1 KB): keyboard shortcuts (Esc / ← / →) for the screenshot
  lightbox, since CSS alone can't listen for key presses. The lightbox works fully without
  it (✕, click-outside, Back) — keep it that way, and don't add further client JS lightly.
  It's loaded only on gallery pages, via `basePage({ lightbox: true })`.
- **Demo videos are native `<video controls>`** — no player library, no JS, self-hosted
  under `/assets/video/`, and they **never autoplay**: unrequested motion is a barrier, and
  `preload="none"` + a poster means a visitor who doesn't press play downloads nothing. The
  screencasts are silent, so the visible `caption` *is* the accessible alternative (WCAG
  1.2.1) — never make it optional, and never swap it for a decorative one-liner.
- **Security headers ship via `<meta>`** (GitHub Pages can't set HTTP headers): a strict CSP
  (`script-src 'self'`, no inline scripts/styles), `referrer: no-referrer`, `nosniff`. The
  self-hosted `lightbox.js` is allowed by `script-src 'self'` and demo videos by
  `media-src 'self'`; **inline** `<script>`/`<style>` still break the CSP — never introduce
  them.
- **Download links** point at matched release assets per OS (`ASSET_PAT`/`pickAsset`,
  deliberately conservative so a source tarball isn't mistaken for a Linux binary), falling
  back to `homepage` → Releases page → repo home. Companion files — signatures, checksum
  manifests, SBOMs, updater metadata (`isCompanionFile`) — are skipped *before* OS matching:
  several carry an OS name and GitHub lists assets alphabetically, so `foo-windows.cdx.json`
  would otherwise sort ahead of `foo.exe` and become the Windows download.

## Deploy

`.github/workflows/deploy.yml` runs the build and publishes `dist/` to GitHub Pages on every
push to `main`, daily at ~05:00 UTC (to refresh release notes and changelogs), and on
manual dispatch.
The repo is public, so pushing is the normal way to ship. Action SHAs are pinned (with the
version in a trailing comment) — bump them deliberately, not casually.

The `deploy` job runs only on GitHub Pages infrastructure, so it can't be reproduced locally.
If it fails with **`Deployment failed, try again later`** while the `build` job is green, that
is a transient Pages backend hiccup — **re-run the deploy job** (`gh run rerun <id> --failed`),
don't hunt for a code cause. `local-CI.sh` checks deploy *readiness* (dist/ has `index.html`,
`CNAME`, no stray symlinks) so the failures that *are* our fault are caught before pushing.

## Private stats dashboard (`npm run stats`)

`stats.mjs` builds an owner-only dashboard — downloads per OS per project, repo traffic,
audience/activity, release health, and content checks — into `.stats/dashboard.html`.
`serve.mjs` (systemd user unit in `systemd/`) serves it on `127.0.0.1:4321` and calls
`generate()` on start, every 24 h, and on `POST /refresh` from the page's button.
`tray/ants-stats-tray.py` is an optional PySide6 tray icon that drives the unit
(open / refresh / start / stop / restart / quit) — the one piece not written in JavaScript,
because a tray icon needs a desktop toolkit and the Node route is Electron. It refreshes via
the same `POST /refresh`, never by calling `generate()` itself.

**The privacy model is "it is never published", and nothing weaker works.** This is a
static site on public GitHub Pages: anything in `dist/` is world-readable, a password box
would be defeated by View Source (the numbers are already in the page), and a secret URL
is only as secret as the URL. So the dashboard is deliberately *outside* the pipeline:

- `.stats/` is `.gitignore`d, and `stats.mjs` writes **only** there — never `dist/`.
- Nothing in `build.mjs`, `local-CI.sh` or `deploy.yml` references it.
- `serve.mjs` binds `127.0.0.1` explicitly, never `0.0.0.0` — the dashboard must not be
  reachable from the local network. Keep the file allowlist (`FILES`) closed; don't turn it
  into a general static server rooted at the repo.
- Keep it that way. Do not add stats output to `src/assets/` — `build.mjs` copies that
  whole directory into `dist/`, which would publish it. Do not "just add a login".

Other invariants:

- **The port is `PORT` → `STATS_PORT` → 4321, resolved in `lib/port.mjs`.** `STATS_PORT` is
  the packaged default in the unit file; `PORT` is how an external process manager overrides
  it via a systemd drop-in, without editing a tracked file. A `PORT` that can't be used is
  fatal — `serve.mjs` exits non-zero naming the value, because binding 4321 instead would
  look healthy while nothing reached it. `STATS_PORT` keeps its older lenient behaviour
  (a bad value still falls back) — that path predates this and must not change.
  **The tray reads the port from the *unit's* environment** (`systemctl --user show
  ants-stats -p Environment`), never from its own: the server is started by systemd, so an
  override never reaches the tray's environment, and a tray that guessed would open a dead
  port while the server was fine. `LWSM_MANAGED=1` drops the icon and logs to stdout
  instead — a presentation hint only, never a reason to grant or skip anything.

- **A failed fetch is never recorded as zero.** Rate-limited or errored projects are shown
  as "no data", excluded from totals, and kept out of `.stats/history.json` — a false zero
  would poison every future delta. Keep this discipline in new metrics.
- **The token is resolved per run, never once per process.** `gh` keeps it in the desktop
  keyring, which is still locked when the service starts at boot — so a token resolved at
  import would leave a long-lived server permanently unauthenticated: traffic blank and every
  run capped at 60 calls/hour, even after a manual refresh hours later. `resolveAuth()` in
  `lib/github.mjs` re-checks while unauthenticated and caches success; `generate()` calls it
  first, and `serve.mjs` waits for a login before its startup run rather than firing blind.
  `hasToken`/`tokenSource` are `export let` **on purpose** — importers rely on the live
  binding to see the update. Don't turn them back into `const`.
- **Authentication is effectively required, but automatic.** A full run needs ~90 API calls
  against an unauthenticated ceiling of 60/hour, and the traffic endpoints need push access
  (403 otherwise). `lib/github.mjs` resolves a token from `GITHUB_TOKEN`, else from
  `gh auth token` — so a developer already logged into the GitHub CLI needs no setup, and
  local `node build.mjs` runs authenticated too. If a token is ever suggested, it's classic
  scope `public_repo`, **not** full `repo`: every site repo is public, and `repo` would
  also grant control of the owner's private ones. With neither, the run degrades — traffic
  is skipped, which keeps it under 60 calls so the rest still fills in.
- **History is append-only and local.** Download totals are stored as dated snapshots;
  traffic is merged as per-day buckets, because GitHub deletes traffic data after 14 days.
- **`.stats/` must stay self-contained.** `src/assets/style.css` is *copied* in as
  `site.css`, not linked as `../src/assets/style.css`: the relative path resolves when the
  file is opened from disk but 404s when `serve.mjs` serves it, silently dropping every
  colour and font to browser defaults. Any new asset the page references gets copied in and
  added to `FILES` too. The body class is `admin`, **not** `stats` — the site's own
  `.stats` rule is a flex container and would wreck the layout.
- **Colour on the dashboard is wayfinding, not data.** Each section owns an `--accent`
  (teal → violet down the page) shared with its nav link, and the three OS columns are
  tinted blue/magenta/green. Those hues deliberately sit clear of the status language —
  amber still means "look at this", teal "up", rose "down" — so a tinted column can never
  read as a warning. Figures stay in text ink; the colour never competes with the numbers.
- **The sticky nav is progressive enhancement too.** The links are ordinary anchors that
  work without JavaScript; `dashboard.js` only adds the scroll-spy that highlights the
  section you're looking at.
- **Sorting is progressive enhancement.** `dashboard.js` turns each `table.sortable`
  header into a `<button>` and toggles `aria-sort`; every table also ships pre-sorted by
  its most useful column, so the page is complete if the script never runs. Sort keys come
  from `data-sort` attributes emitted with each cell — don't switch to parsing the rendered
  text, which carries thousands separators, `d` suffixes and a delta line. Mark a column
  `data-nosort` when it holds no rankable value (Trend, Top referrers).

## Dependencies

**All dependencies are kept at their latest stable version** (npm packages, pinned GitHub
Actions, and the Node runtime) — for security as much as features. The only time a dep may
be held back is when a newer version explicitly breaks a feature, and then it **must** be
documented in [`docs/DEPENDENCY_POLICY.md`](docs/DEPENDENCY_POLICY.md) — including the exact
version that broke us, so a later release can be re-tested and the pin lifted. Read that file
before bumping or pinning anything.

## Accessibility is a hard requirement

The site owner is partially sighted. All visual changes must keep WCAG AA contrast (the CSS
text tokens are chosen to meet AA on `--bg`), preserve the skip-link and semantic landmarks,
and not rely on colour alone to convey status. Verify contrast when touching colours.
