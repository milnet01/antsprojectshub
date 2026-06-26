# Ants Projects Hub — Design Spec

**Date:** 2026-06-26
**Owner:** Anthony Schemel (GitHub: `milnet01`)
**Status:** ✅ Shipped 2026-06-26 — live at https://antsprojectshub.co.za
(repo: github.com/milnet01/antsprojectshub; cold-eyes ×5 clean + security review)

## 1. Purpose

A static showcase website for Anthony's ~13 software projects. A minimal landing
page introduces every project in plain language; each project has its own detail
page with a fuller description, downloads (linking to GitHub Releases per platform),
and a changelog. Pages are pre-rendered to static HTML at build time. Hosted free on
GitHub Pages under the custom domain `antsprojectshub.co.za`.

## 2. Goals & non-goals

**Goals**
- One-glance landing page; deeper per-project pages.
- Downloads point straight at each project's GitHub Releases, per supported OS.
- Per-project description (README), version + "what's new" pulled from GitHub at build
  time and baked into static pages (zero manual upkeep).
- **Strong SEO + clean social link previews** — pages are pre-rendered static HTML, so
  crawlers and preview bots see full content with no JavaScript required.
- Dark "Mesh Glow" theme: frosted-glass cards, slow-roaming colour blobs, flowing-
  gradient title.
- **Accessibility is a hard requirement** (owner is partially sighted).
- **Fully fluid/responsive** (continuous reflow, not just fixed breakpoints).
- Adding/editing a project = editing one data file, no code.

**Non-goals**
- No server, database, or runtime framework. A build runs **in CI only** (GitHub
  Actions); the deployed site is pure static HTML/CSS (+ optional tiny decorative JS).
- No client-side rendering of core content — pages ship pre-rendered (for SEO).
- No hosting of large binaries in the repo (binaries live in GitHub Releases).
- No blog/CMS/auth.

## 3. Architecture

Pre-rendered static site. A **build script** (`build.mjs`, plain Node, runs in GitHub
Actions only) reads one data file (`projects.json`), pulls each published project's
README + latest release from the GitHub API at build time, and writes finished static
HTML — `index.html` (landing) and one `dist/p/<slug>.html` per project. GitHub Pages
serves the generated `dist/`. Visitors get plain HTML/CSS (+ optional decorative JS);
search engines and preview bots see complete content with no JS.

### 3.1 File layout

```
/  (repo)
├── src/
│   ├── projects.json          # THE data file — one entry per project (+ support links)
│   └── assets/
│       ├── style.css          # all styling + design tokens (single source of truth)
│       ├── enhance.js         # OPTIONAL tiny progressive-enhancement JS (no core content)
│       └── img/               # og-image, favicon, brand/platform icons
├── build.mjs                  # generator: data + GitHub → dist/
├── lib/
│   └── templates.mjs          # page templates as JS template-literal functions (DRY shell)
├── package.json               # devDeps: marked, sanitize-html (CI-only)
├── .github/workflows/deploy.yml  # build on push + daily cron → deploy Pages
└── dist/                      # GENERATED, deployed by Pages (gitignored)
    ├── index.html  ├── 404.html  ├── CNAME  ├── robots.txt  ├── sitemap.xml
    ├── p/<slug>.html  (one per project)
    └── assets/…  (copied from src/assets)
```

URLs: landing `https://antsprojectshub.co.za/`, project pages
`https://antsprojectshub.co.za/p/<slug>.html`.

### 3.2 Data model (`src/projects.json`)

```jsonc
{
  "projects": [
    {
      "slug": "vestige-engine",         // URL key + filename-safe id (stable; don't rename)
      "name": "Vestige Engine",
      "tagline": "A 3D game engine built from scratch.",  // one line, landing card
      "blurb": "…2–4 sentences; fallback intro if README is unavailable at build…",
      "status": "beta",                 // "live" | "beta" | "wip" | "soon"
      "repo": "milnet01/Vestige",       // "owner/name", or null if unpublished
      "platforms": ["win", "linux"],    // subset of win|linux|mac|web
      "isFork": false,
      "upstream": null,                 // e.g. "libretro/RetroArch" when isFork
      "homepage": null                  // optional extra link (e.g. Flathub for Perch)
    }
    // …all 13 per §7…
  ],
  "support": [
    { "label": "GitHub Sponsors", "url": "https://github.com/sponsors/milnet01" }, // confirm §10
    { "label": "Patreon", "url": null },           // null → rendered disabled "soon"
    { "label": "Buy Me a Coffee", "url": null }
  ]
}
```

### 3.3 Build-time rendering, README, changelog

`build.mjs` runs once per build (CI). For each project it renders from `projects.json`
and, when `repo` is set, enriches from GitHub. **All fetches are authenticated with the
Action's `GITHUB_TOKEN`** (5000 req/hr — the 60/hr unauthenticated limit does not apply).

- **Landing (`index.html`):** hero + a static card per project (name, tagline, status
  pill, platform tags, `.soon` dimming), each linking to `/p/<slug>.html`. Plus the
  support cards. All baked into HTML — no runtime data file.
- **Project page header:** name (`<h1>`), status, per-platform download buttons, latest
  version, and a **"Report an issue / Feedback"** link. Baked static.
- **Page scope:** `build.mjs` generates `/p/<slug>.html` for **every** project, so every
  landing card clicks through. A `soon` project (no repo) renders a **placeholder body**
  — tagline/blurb + a "Coming soon — not yet published" note, with download/issue actions
  omitted. Published projects (`repo` set) get the full README + release. The
  **`sitemap.xml` and per-page `<link rel="canonical">` cover published projects only**
  (placeholders are not worth indexing).
- **Body = README, baked.** When `repo` is set, fetch `…/repos/<repo>/readme`, convert
  Markdown→HTML with `marked`, **sanitise the `marked` HTML output** with `sanitize-html`
  (run on the rendered HTML, not raw Markdown), and write it into the page inside a
  labelled `<section>`. Handling:
  - **Relative image/links** (e.g. `![](docs/shot.png)`) rewritten to absolute
    `raw.githubusercontent.com/<repo>/<branch>/…`. The `/readme` response's `download_url`
    encodes the default branch but points at the README *file*; strip the trailing
    filename to get the base directory, then resolve relative paths against it.
  - **Heading demotion:** README `#`/`h1` shifted down one level so the page keeps a
    single `<h1>` (the project name) — required for the heading order in §5.
  - **Precondition/Fallback:** repo without a committed README → `/readme` 404s → bake
    the `blurb` from `projects.json` + a "Read more on GitHub →" link instead. A fetch
    error fails that project *soft* (use the fallback; never abort the whole build).
- **Changelog/version:** when `repo` is set, fetch `…/repos/<repo>/releases/latest`; bake
  the tag (version) + rendered release notes. No releases (e.g. DOOM Ants) or error →
  bake a "Latest release on GitHub →" link to `…/releases/latest` instead.
- **Downloads:** per-platform buttons → the repo's `…/releases/latest`. Edge cases:
  - `status: "soon"` (no repo) → buttons disabled with a "Coming soon" label.
  - **Repo with no own releases** (DOOM Ants; a fork like RetroArch carrying no own
    releases) → `…/releases/latest` would 404, so the button targets the repo home (or,
    for a fork, the `upstream` releases), labelled "Get it on GitHub" / "Upstream
    releases". The release fetch already detected the no-release case — reuse it.
  - Forks link to the owner's fork repo; `upstream` is credited on the page.
- **Issue reporting:** when `repo` is set, a "Report an issue" link → `github.com/<repo>/
  issues`. `soon` (no repo) → omitted. **Fork** (`isFork`): link the fork's own `…/issues`
  if Issues are enabled, else the `upstream` issues labelled "Report upstream" (per-fork
  setting confirmed at build / §10).
- **Freshness:** pages reflect READMEs/releases as of the last build. The workflow (§3.5)
  builds on every push **and** on a daily schedule, so content is at most ~24h behind a
  project's change (usually immediate on push).

### 3.4 Per-page SEO (now first-class, not a trade-off)

Because every page is pre-rendered static HTML, crawlers and social-preview bots get
full content with no JS. `build.mjs` writes, per page: a unique `<title>` and
`<meta name="description">` (from name + tagline), Open Graph + Twitter-card tags
(per-project, with a default `assets/img/og-image.png`), `<link rel="canonical">`, and
a `sitemap.xml` listing the landing page + every published project URL.

### 3.5 Build & deploy pipeline

- **`.github/workflows/deploy.yml`** triggers on push to `main` and a daily `schedule`
  (cron), plus manual `workflow_dispatch`. Steps: checkout → `npm ci` → `node build.mjs`
  (uses `GITHUB_TOKEN`) → upload `dist/` → deploy to GitHub Pages via the official
  Pages actions.
- **Pages source = GitHub Actions** (not "deploy from branch"), so `dist/` is published
  without committing generated files. `dist/` is gitignored.
- **Build robustness:** a single project's GitHub fetch failing uses that project's
  fallback (blurb + GitHub link); it does **not** fail the build. A hard build failure
  leaves the previously-deployed site untouched.

## 4. Visual design — "Mesh Glow"

Single source of truth = CSS custom properties at the top of `style.css`.

- **Background:** near-black `#08080c`.
- **Roaming blobs:** 3 large blurred radial glows (teal `#2dd4bf`, violet `#a855f7`,
  rose `#f43f5e`) drifting on slow independent paths (~50–62s loops) with a slow
  parent hue-rotate. Decorative only.
- **Cards:** frosted glass — `rgba(255,255,255,.055)` fill, 1.5px `rgba(255,255,255,.11)`
  border, `backdrop-filter: blur(12px)`, 14px radius. **Hover:** lifts 6px + slight
  scale, fill drops to near-transparent (`~.02`) with reduced blur so the roaming glow
  shimmers through, solid teal border + teal halo shadow, title text → teal. Card text
  carries a faint shadow so it stays legible over the revealed glow.
- **Title:** flowing white-dominant gradient (`#ccfbf1→#fff→#cffafe→#fff→#fce7f3`) over
  a soft dark radial "cushion" for legibility; subtle cyan drop-shadow glow.
- **Status pills:** live=teal, beta=amber, wip=violet, soon=grey — **always with text.**
- **Platform tags:** short text badges (WIN / LNX / MAC / WEB).
- **Accent:** teal `#5eead4` leads (links, primary buttons, focus rings).

## 5. Accessibility (hard requirement — owner partially sighted)

- All text meets **WCAG 2.1 AA** contrast; body text is high-contrast (no faint grey).
  Mockup's muted greys are raised to ≥ AA on the real site.
- Type sized in `rem`; layout reflows under browser zoom to 200% without breakage.
- **`prefers-reduced-motion: reduce`** → blobs and title gradient become static; all
  transitions disabled. Motion is purely decorative; nothing essential animates.
- Status conveyed by **text + colour**, never colour alone.
- Semantic HTML landmarks (`header`/`main`/`nav`/`footer`), one `h1` per page, logical
  heading order, `alt` on all images, visible `:focus-visible` outlines, skip-to-content
  link, full keyboard operability, descriptive link text (no bare "click here").
- Disabled "Coming soon" buttons use `aria-disabled` + visible label.

## 6. Responsive / mobile — fluid by default

- **Continuous reflow, not fixed jumps.** Card grid uses
  `grid-template-columns: repeat(auto-fit, minmax(<min>, 1fr))` so columns flow naturally
  (1 → many) at *every* width, not only at named breakpoints. Add breakpoints only to
  fine-tune spacing/hero, not to gate the column count.
- **Fluid type & spacing** via `clamp()` (hero, headings, section padding) so everything
  scales smoothly between phone and ultrawide.
- Tap targets ≥ 44×44px; no horizontal scroll at any width; `<meta name="viewport">` set.
- Verified across the continuum — spot-checked at 320px, 768px, 1280px, and ≥1920px.

## 7. Content — project roster

Renames adopted: **Create 3D Boxart → Slipcase**, **YT-DLP Frontend → Snatch**.

| Project | slug | status | platforms | repo (`milnet01/…`) | notes |
|---|---|---|---|---|---|
| Vestige Engine | vestige-engine | beta | win, linux | Vestige | 3D engine, ray tracing |
| Ants Terminal | ants-terminal | beta | linux | ants-terminal | Qt6 terminal; also Flatpak/DEB/RPM/Arch |
| RetroDB | retrodb | live | web | RetroDB | self-hosted web app |
| MAME Curator | mame-curator | live | win, mac, linux | mame-curator | |
| Perch | perch | live | linux | perch | also Flathub + openSUSE OBS (homepage) |
| RetroArch | retroarch | live | win, mac, linux | RetroArch | **fork** of libretro/RetroArch |
| Album Builder | album-builder | beta | linux | album-builder | |
| Snatch | snatch | live | win, mac, linux | ytdlp-gui | yt-dlp GUI; Windows .exe in Releases; repo pending confirm (§10) |
| DOOM Ants | doom-ants | wip | linux | DOOM_Ants | no releases yet → "View on GitHub" |
| Slipcase | slipcase | soon | linux | — | not yet published |
| Contact List | contact-list | soon | linux | — | not yet published |
| Rolodex | rolodex | soon | linux | — | not yet published |
| Rusty PSN | rusty-psn | soon | win, mac, linux | — | **fork** of RainbowCookie32/rusty-psn; not yet published under milnet01 |

Hero stats: **projects** (13) and **live** (5) are computed by `build.mjs` from
`projects.json` (never hand-typed, so they can't drift as statuses change). The third
stat is a fixed label rendered verbatim as **"3 — Desktop OSes"** (Windows · macOS ·
Linux); the `web` platform is intentionally not counted here. It is a static label, not
a computed tally.
*(Open: confirm exact tagline/blurb wording and which screenshots exist per project.)*

## 8. Support section

Three cards on the landing page, built from the `support` array in `projects.json`
(§3.2). A `null` URL renders the card disabled with a "soon" label.
- **GitHub Sponsors** — live (owner has it). URL `https://github.com/sponsors/milnet01`
  *(assumed from the username — owner to confirm in §10).*
- **Patreon** — `url: null` → "soon" until the account is ready.
- **Buy Me a Coffee** — `url: null` → "soon"; owner sets up after launch.

Adding/swapping a link is one edit to `SUPPORT`.

## 9. Deployment

DNS is **already configured** at Truehost: four A records on `@`
(185.199.108–111.153) + `www` CNAME → `milnet01.github.io`.

1. Create public repo `milnet01/antsprojectshub`; commit the repo (src + `build.mjs` +
   `package.json` + workflow). `dist/` is gitignored (generated by CI).
2. Settings → Pages → **Source = GitHub Actions** (not "deploy from branch").
3. The `deploy.yml` workflow builds `dist/` and deploys it on push + daily cron. `CNAME`
   (= `antsprojectshub.co.za`) is emitted into `dist/` by `build.mjs` so the custom
   domain persists across deploys.
4. Settings → Pages → set Custom domain = `antsprojectshub.co.za`; after the DNS check +
   certificate, tick **Enforce HTTPS**.
5. Live at `https://antsprojectshub.co.za`.

## 10. Open items (owner: Anthony — non-blocking, build proceeds with stated defaults)

- Confirm the GitHub Sponsors URL (default assumed: `github.com/sponsors/milnet01`).
- Final tagline/blurb wording per project (drafts exist; refine during build).
- Which projects already have screenshots to include.
- Confirm `ytdlp-gui` (Snatch) is the intended public repo (owner had thought it
  unpublished; scan found it live). Until confirmed, Snatch ships pointing at
  `milnet01/ytdlp-gui`; if confirmation fails, downgrade its row to `status: "soon"`
  (no repo) so no broken download/issue links ship.
- Per-fork: confirm whether the RetroArch and Rusty PSN forks have GitHub **Issues**
  enabled; if not, the "Report an issue" link targets the upstream repo (per §3.3).
- Platforms for the four unpublished projects (§7) are **provisional** until each is
  published — confirm/adjust when they go live.

## 11. Standards & conventions

The rules the whole site is built and maintained to. Where a topic already has a home
above, this section points to it rather than restating (accessibility → §5,
responsive → §6, data model → §3.2).

### 11.1 Browser support
- Modern evergreen browsers: last 2 versions of Chrome, Firefox, Edge, Safari (desktop
  + mobile). No Internet Explorer.
- **Core content needs no JS** — pages are pre-rendered static HTML, so they fully work
  with JavaScript disabled (only optional decorative enhancement, if any, is JS-gated).
- `backdrop-filter` is progressive enhancement (verify against current Baseline); where
  unsupported, cards fall back to a solid translucent fill (still legible). CSS `clamp()`
  is baseline.

### 11.2 HTML
- HTML5, valid (passes the W3C Nu validator with zero errors).
- Every page: `<!doctype html>`, `<html lang="en">`, `<meta charset="utf-8">`,
  `<meta name="viewport" content="width=device-width, initial-scale=1">`, a unique
  `<title>` and `<meta name="description">`.
- Semantic landmarks (`header`/`nav`/`main`/`footer`); exactly one `<h1>` per page;
  no skipped heading levels (ties to §5).
- External links: `target="_blank"` + `rel="noopener noreferrer"`.

### 11.3 CSS
- All styling in `assets/style.css` — **no inline styles or `<style>` blocks in
  production pages** (the brainstorm mockups used inline styles; the real site does
  not). Design tokens (colours, spacing, radii, blur, timings) are CSS custom
  properties declared once in `:root` at the top of the file — the single re-skin point.
- Mobile-first; `rem`/`em` for type and spacing (no fixed `px` font sizes); breakpoints
  per §6.
- Class naming: lowercase kebab-case, component-prefixed (e.g. `.card`, `.card__title`,
  `.card--soon`). Consistent throughout.
- All animation gated behind `@media (prefers-reduced-motion: no-preference)` so the
  reduced-motion default is static (ties to §5).

### 11.4 JavaScript & build tooling
- The **build** (`build.mjs`) is plain Node ES modules, run in CI only. Dependencies
  (`marked`, `sanitize-html`) are pinned in `package.json` + `package-lock.json` and
  installed with `npm ci` (reproducible). No bundler, no client framework.
- **Runtime JS is optional and decorative only** — no core content or navigation depends
  on it (per §11.1). Any `enhance.js` is a single first-party module; no CDN; no `eval`.
- **Untrusted input:** README + release-note Markdown from GitHub is untrusted. `marked`
  renders it; `sanitize-html` (allowlist) runs on the **rendered HTML output** before it
  is written into the page (§3.3, §11.7).

### 11.5 Performance budget

Targets verified at build/audit time (Lighthouse + asset measurement), not asserted
constants. Pages are pre-rendered static HTML with no client-side data-fetching:

- Per page served: 1 HTML + `style.css` + favicon (+ optional small `enhance.js`) +
  lazy README images. **Target first-party HTML+CSS(+JS) ≤ 60 KB gzipped, ≤ 4 requests**
  to first contentful paint; no render-blocking external requests.
- `marked`/`sanitize-html` run at **build only — never shipped to the browser.**
- Images (`assets/img/` + README `raw` URLs): `loading="lazy"` + explicit `width`/
  `height` to avoid layout shift.
- Target Lighthouse ≥ 95 on Performance, Accessibility, Best-Practices, SEO.

### 11.6 SEO & metadata
- Built per page by `build.mjs` (§3.4): unique `<title>` + `<meta name="description">`,
  Open Graph + Twitter-card tags (+ default `assets/img/og-image.png`), canonical link.
- `robots.txt` allows all + points at `sitemap.xml`, which lists `/` and one
  `/p/<slug>.html` per published project.
- Favicon in `assets/img/`.

### 11.7 Security
- **Content-Security-Policy** on every page via `<meta http-equiv>` (GitHub Pages can't
  set HTTP headers): `default-src 'self'`; `script-src 'self'` (no inline scripts — which
  also enforces §11.3/§11.4); `style-src 'self'`; `img-src 'self' https: data:`
  (README/badge images); `object-src 'none'`; `base-uri 'self'`; `frame-ancestors
  'none'`. Add `referrer` (`no-referrer`) and `X-Content-Type-Options` (`nosniff`) via
  meta where honoured.
- **Untrusted content:** README + release notes sanitised at build with an allowlist
  `sanitize-html` — strip `<script>`/`<style>`/`<iframe>`, event-handler attributes, and
  `javascript:` URLs; allow standard formatting, images, and links. This is the primary
  XSS defence; CSP is defence-in-depth.
- **Supply chain:** deps pinned via `package-lock.json` + `npm ci`; GitHub Actions pinned
  to commit SHAs (not floating tags); Dependabot enabled for npm + actions.
- **Least-privilege CI:** workflow `permissions:` limited to `contents: read`,
  `pages: write`, `id-token: write`. `GITHUB_TOKEN` is the ephemeral Action token, used
  only for build-time API reads — never written into `dist/`. No other secrets in the repo.
- **External links:** always `rel="noopener noreferrer"` with `target="_blank"`.
- **Transport:** HTTPS enforced by Pages; GitHub serves HSTS for the apex once Enforce
  HTTPS is on.
- **Pre-deploy:** run `/security-review` on the built output before first deploy (§12).

### 11.8 Naming & repo conventions
- Project `slug`: lowercase kebab-case, stable (it's the URL — don't rename once live).
- Image files: `<slug>-<n>.<ext>` in `src/assets/img/`.
- `CNAME` (= `antsprojectshub.co.za`, no scheme/slash) emitted into `dist/` by `build.mjs`.
- `.editorconfig`: UTF-8, LF line endings, 2-space indent, final newline. `dist/` gitignored.

### 11.9 Maintenance workflow
- **Add/Update a project:** edit one entry in `src/projects.json` (+ drop screenshots in
  `src/assets/img/`), commit, push — CI rebuilds + deploys. Publishing a "coming soon"
  project = set its `repo` and change `status` from `"soon"`; its page then self-populates
  from the README + releases at the next build (§3.3). No other file changes.
- **Re-skin:** edit the `:root` tokens in `src/assets/style.css`.
- **Add a support link:** edit the `support` array in `src/projects.json` (§3.2/§8).

## 12. Acceptance criteria (verification before "done")

The build is complete when all hold:
1. `build.mjs` generates `dist/index.html` with all 13 cards as **static HTML** (content
   present with JS off); projects (13) + live (5) counts computed from `projects.json`;
   coming-soon cards dimmed with disabled buttons.
2. Each published project has a static `dist/p/<slug>.html` whose HTML source contains
   the themed header (working "Report an issue" link; omitted for coming-soon), the baked
   README (images load, headings demoted, HTML sanitised), and the latest version/notes —
   all without JS.
3. Failure paths: a request to a non-existent `/p/<x>.html` serves `dist/404.html`
   (GitHub Pages' custom-404 mechanism); a project whose README/release fetch fails
   builds with its fallback (blurb + GitHub link) and does **not** abort the build;
   no-release repo (DOOM Ants) → "Get it on GitHub", not a 404 link.
4. Responsive: fluid layout, no horizontal scroll, usable from 320px to 1280px+ (§6).
5. Accessibility (§5): W3C HTML validation passes; Lighthouse/axe Accessibility ≥ 95;
   text meets WCAG AA contrast; keyboard operable with visible focus; usable at 200%
   zoom; reduced-motion makes all animation static.
6. Security (§11.7): CSP meta present; a `<script>` placed in a test README is stripped
   from the output; workflow uses least-privilege `permissions:` + SHA-pinned actions;
   `/security-review` run on the output with no unresolved findings.
7. Performance budget (§11.5) + Lighthouse targets met.
8. `CNAME` emitted into `dist/`; site loads over HTTPS at `https://antsprojectshub.co.za`
   after deploy (§9).
