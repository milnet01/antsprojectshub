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
```

`local-CI.sh` mirrors the `build` job in `.github/workflows/deploy.yml` step-for-step
(`npm ci` → `node build.mjs`); if you change the workflow's build steps or its pinned Node
version, update the script to match. The deploy steps are GitHub Pages infra and can't run
locally.

Set `GITHUB_TOKEN` before `node build.mjs` to avoid GitHub API rate limits (CI passes the
Actions token automatically). With no token / offline, the build still succeeds — each
project falls back to static metadata from `projects.json`. There is no test suite or
linter; `.editorconfig` enforces 2-space indent, LF, UTF-8, final newline.

You almost never run the build by hand: pushing to `main` is enough (see deploy below).

## Architecture

The whole pipeline is three files. Data flows: `projects.json` → `build.mjs` → `dist/`.

- **`src/projects.json`** — the single source of content and the file you edit most. Holds
  the `projects` array and `support` links. Adding/editing a project means editing this
  file and nothing else. Fields: `status` is `live` · `beta` · `wip` · `soon`; `platforms`
  is any of `win` · `mac` · `linux` · `web`; `repo` is `owner/name` (null = unpublished);
  `isFork`/`upstream`/`homepage` drive header credit and download fallbacks. `category`
  groups the project into a landing-page section (`engines` · `emulation` · `media` ·
  `utilities`); `screenshots` is an array of `{src, alt}` rendered as a gallery on the
  project page (`src` relative to `assets/img/`, `alt` required — see
  `src/assets/img/shots/README.md`).

- **`build.mjs`** — the generator. For each *published* project (has a `repo` and status is
  not `soon`) it fetches the README and latest release from the GitHub API, renders them to
  HTML, and writes a page. It also emits the landing page, `404.html`, `CNAME`, `robots.txt`
  and `sitemap.xml`. Owns all data access and page-assembly logic.

- **`lib/templates.mjs`** — pure presentation: the `basePage()` HTML document shell, the
  `esc()` escaper, and `ORIGIN`. No data access or fetching here — keep that boundary.

- **`src/assets/style.css`** — all styling. Re-skin by editing the `:root` design tokens at
  the top; it is the single source of truth for theme.

### Key behaviours to preserve

- **Resilience: one project's failure must never abort the build.** A GitHub fetch error
  falls back to static metadata and logs a warning. Keep new enrichment paths inside this
  try/fallback discipline.
- **README/release HTML is untrusted** (third-party fork READMEs included). It is rendered
  with `marked` then run through `sanitize-html` with a tight allowlist (`sanitizeOptions`,
  shared by both the README and release-note paths so they can't drift). Links get
  `rel="noopener noreferrer nofollow"` + `target="_blank"`; relative URLs are absolutized
  against the source repo. Do not loosen the allowlist or skip sanitisation.
- **`marked` and `sanitize-html` are build-time only** — never ship them to visitors. The
  output is static HTML/CSS plus a single hand-written progressive-enhancement script
  (`src/assets/lightbox.js`, ~1 KB): keyboard shortcuts (Esc / ← / →) for the screenshot
  lightbox, since CSS alone can't listen for key presses. The lightbox works fully without
  it (✕, click-outside, Back) — keep it that way, and don't add further client JS lightly.
  It's loaded only on gallery pages, via `basePage({ lightbox: true })`.
- **Security headers ship via `<meta>`** (GitHub Pages can't set HTTP headers): a strict CSP
  (`script-src 'self'`, no inline scripts/styles), `referrer: no-referrer`, `nosniff`. The
  self-hosted `lightbox.js` is allowed by `script-src 'self'`; **inline** `<script>`/`<style>`
  still break the CSP — never introduce them.
- **Download links** point at matched release assets per OS (`ASSET_PAT`/`pickAsset`,
  deliberately conservative so a source tarball isn't mistaken for a Linux binary), falling
  back to `homepage` → Releases page → repo home.

## Deploy

`.github/workflows/deploy.yml` runs the build and publishes `dist/` to GitHub Pages on every
push to `main`, daily at ~05:00 UTC (to refresh READMEs/releases), and on manual dispatch.
The repo is public, so pushing is the normal way to ship. Action SHAs are pinned (with the
version in a trailing comment) — bump them deliberately, not casually.

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
