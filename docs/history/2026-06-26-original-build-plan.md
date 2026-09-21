# Ants Projects Hub — Implementation Plan (pre-rendered)

> **Historical.** This is the build plan for the site's first build, carried out and finished 2026-06-26. Its steps are done and its instructions to a worker are spent. [`CLAUDE.md`](../../CLAUDE.md) describes the site as it stands. Do not execute this.

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (inline) or subagent-driven-development. Steps use `- [ ]`.

**Goal:** A build-time pre-rendered static site (GitHub Pages) showcasing 13 projects — landing grid + one static page per project, with README/version/downloads/issues baked from GitHub. "Mesh Glow" theme, accessible, fluid-responsive, secure.

**Architecture:** `build.mjs` (Node ESM, CI-only) reads `src/projects.json`, fetches each repo's README + latest release from GitHub (authenticated with `GITHUB_TOKEN`), renders Markdown→HTML (`marked`) → sanitises (`sanitize-html`), and writes static `dist/` (index + `p/<slug>.html` + 404/CNAME/robots/sitemap + copied assets). GitHub Actions builds on push + daily cron and deploys Pages.

**Tech Stack:** Node 20 ESM; devDeps `marked`, `sanitize-html` (CI-only, pinned + lockfile). HTML5 / CSS custom properties / optional tiny vanilla JS. No client framework, nothing shipped to the browser but HTML+CSS(+optional enhance.js).

## Global Constraints (from spec §2/§5/§6/§11)

- Build in CI only; deployed output is pure static HTML/CSS. Core content works with JS off.
- Accessibility (hard): WCAG AA contrast, `rem`+`clamp()` type, visible `:focus-visible`, semantic landmarks, one `<h1>`/page, status = text+colour, `prefers-reduced-motion`→static, 200% zoom OK.
- Fluid responsive: grid `repeat(auto-fit, minmax(...))`; tap targets ≥44px; no horizontal scroll 320→1920px+.
- Security: CSP `<meta>` (`script-src 'self'`, no inline JS); sanitise the **rendered HTML output** (not raw md); least-priv workflow `permissions:` (`contents:read`, `pages:write`, `id-token:write`); SHA-pinned actions; `npm ci` + lockfile; ext links `rel="noopener noreferrer"`.
- Status enum `live|beta|wip|soon`; platforms `win|linux|mac|web`. Owner `milnet01`; domain `antsprojectshub.co.za`.
- Build robustness: a project's failed fetch uses its fallback (blurb + GitHub link), never aborts the build.

## File structure (per spec §3.1)

```
src/projects.json · src/assets/{style.css,enhance.js?,img/}
build.mjs · lib/templates.mjs · package.json · package-lock.json
.gitignore (dist/) · .editorconfig · .github/workflows/deploy.yml · .github/dependabot.yml
dist/ (generated): index.html · p/<slug>.html · 404.html · CNAME · robots.txt · sitemap.xml · assets/
```

---

## Task 1 — Scaffold + data

**Files:** `src/projects.json`, `package.json`, `.gitignore`, `.editorconfig`.

- [ ] `src/projects.json` — `projects[]` (all 13 from spec §7: slug, name, tagline, blurb, status, repo|null, platforms[], isFork, upstream, homepage) + `support[]` (Sponsors URL + two `null`).
- [ ] `package.json` (type:module; scripts.build=`node build.mjs`; pinned `marked` + `sanitize-html`). `.gitignore` (`dist/`, `node_modules/`). `.editorconfig` (UTF-8/LF/2-space/final-newline).
- [ ] Verify: `node -e "JSON.parse(require('fs').readFileSync('src/projects.json'))"` → ok; 13 projects.
- [ ] Commit.

## Task 2 — Templates + theme

**Files:** `lib/templates.mjs`, `src/assets/style.css`.

**Produces:**
```
basePage({title, description, canonical, ogImage, bodyClass, main}) -> full HTML doc
  (head: charset/viewport/title/meta-desc/OG+Twitter/canonical/CSP meta/favicon/style.css; skip-link; <main>; footer)
landingBody({cards, support, stats}) -> string
projectBody({project, headerHtml, readmeHtml, releaseHtml}) -> string
```

- [ ] `lib/templates.mjs`: `basePage()` shell with **CSP meta** (`default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' https: data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'`), referrer + nosniff meta; semantic landmarks; one `<h1>` slot; footer. Plus `landingBody`/`projectBody`.
- [ ] `src/assets/style.css`: `:root` tokens; reset; skip-link; `:focus-visible`; hero (roaming blobs + flowing white-dominant gradient title on dark cushion — values from approved `landing-mockup-v8`); stats; grid `repeat(auto-fit,minmax(260px,1fr))`; frosted cards + hover (lift + near-transparent fill + teal halo + title→teal + text-shadow); status pills (text+colour); platform tags; support; footer; `clamp()` fluid type; `@media (prefers-reduced-motion: no-preference)` gating ALL animation.
- [ ] Verify: tokens render (after Task 3 emits a page); reduce-motion → static; 320/768/1280/1920 no horizontal scroll.
- [ ] Commit.

## Task 3 — build.mjs core (data → static, no network)

**Files:** `build.mjs`.

**Produces:**
```
statusMeta(s) -> {label, cls}      platformLabel(p) -> "Windows"|…
releasesLatestUrl(repo) issuesUrl(repo) repoHomeUrl(repo)
computeStats(projects) -> {projects, live}
renderCard(project) -> html        renderSupport(support) -> html
copyAssets(); writeFile(distPath, html); writeCname/Robots/Sitemap()
buildLanding(); buildProject(project, {readmeHtml, releaseHtml}|fallback)
```

- [ ] Helpers + landing build: read `src/projects.json`; emit `dist/index.html` (hero, computed stats `13`/`live`/fixed "3 — Desktop OSes", cards link `/p/<slug>.html`, support). Copy `src/assets`→`dist/assets`. Write `CNAME` (`antsprojectshub.co.za`), `robots.txt`, `sitemap.xml` (published only).
- [ ] Project pages (no-network path first): for every project emit `dist/p/<slug>.html`; `soon` → placeholder body (blurb + "Coming soon" note, no download/issue); published → header (downloads, issue link, version slot) + blurb fallback body (README filled in Task 4). Per-page title/desc/OG/canonical (canonical+sitemap published only).
- [ ] Verify: `node build.mjs` → `dist/` populates; open `dist/index.html` + a `dist/p/*.html` in browser → render correct; W3C-validate.
- [ ] Commit.

## Task 4 — build.mjs GitHub enrichment

**Files:** `build.mjs` (extend), `package-lock.json` (via `npm install`).

**Produces:**
```
async ghJson(path) -> json|null   // Authorization: Bearer GITHUB_TOKEN if set; null on non-200/offline
async fetchReadmeHtml(project) -> {html}|null  // /repos/<repo>/readme → marked → sanitize-html → demote h1 → rewrite rel urls (strip README filename from download_url for base)
async fetchReleaseHtml(project) -> {version, html}|null  // /repos/<repo>/releases/latest
downloadTarget(project, hasRelease)  // releases/latest | repo home | upstream releases
```

- [ ] `npm install marked sanitize-html` (writes lockfile). Implement `ghJson` (auth header, try/catch → null). `fetchReadmeHtml`: marked.parse → `sanitize-html` (allowlist; strip script/style/iframe/on*; `javascript:`); demote headings; rewrite relative img/links via `download_url` base (filename stripped). `fetchReleaseHtml`: version tag + sanitised notes.
- [ ] Wire into `buildProject`: published project → use README/release if fetched, else fallback (blurb + "Read more on GitHub"); downloads pick target via `downloadTarget` (no-release/fork → repo/upstream). Each project fetch in try/catch — failure never aborts build.
- [ ] Verify: `GITHUB_TOKEN=… node build.mjs` (or offline → fallbacks) → `dist/p/perch.html` has README; `doom-ants` → "Get it on GitHub"; offline run still completes with fallbacks. **Security check:** temporarily add `<script>alert(1)</script>` to a fixture README string → confirm stripped from output.
- [ ] Commit.

## Task 5 — CI workflow + Dependabot

**Files:** `.github/workflows/deploy.yml`, `.github/dependabot.yml`.

- [ ] `deploy.yml`: triggers `push` (main) + `schedule` (daily cron) + `workflow_dispatch`; `permissions: {contents: read, pages: write, id-token: write}`; concurrency group; job: checkout → setup-node 20 → `npm ci` → `node build.mjs` (env `GITHUB_TOKEN`) → `actions/upload-pages-artifact` (`dist`) → `actions/deploy-pages`. **Pin every action to a commit SHA.**
- [ ] `dependabot.yml`: weekly updates for `npm` + `github-actions`.
- [ ] Verify: `actionlint` (or YAML lint) clean; permissions are least-privilege.
- [ ] Commit.

## Task 6 — 404 + brand assets

**Files:** `build.mjs` emits `dist/404.html`; `src/assets/img/{og-image.png,favicon.svg}`.

- [ ] `build.mjs` writes a themed `dist/404.html` (links home) via `basePage`. Add a simple branded `og-image.png` + `favicon.svg`.
- [ ] Verify: `dist/404.html` renders; favicon + og-image referenced and load.
- [ ] Commit.

## Task 7 — Verify + security + deploy

- [ ] Full `node build.mjs`; W3C-validate index + a project + 404 (zero errors).
- [ ] Lighthouse (index + project): Perf/A11y/BP/SEO ≥ 95. Manual: AA contrast, keyboard + visible focus, 200% zoom, reduced-motion static, fluid 320→1920.
- [ ] Security: confirm CSP meta present; script-in-README stripped; run **`/security-review`** on the output; resolve findings.
- [ ] Perf budget: per-page first-party ≤ ~60 KB / ≤ 4 requests.
- [ ] Deploy (spec §9): `git init`, commit; create public `milnet01/antsprojectshub`; push; Settings→Pages→Source=GitHub Actions; set custom domain; after DNS+cert, Enforce HTTPS; verify `https://antsprojectshub.co.za`.

---

## Self-review notes
- Spec coverage: data/scaffold (T1); theme+templates+CSP (T2); landing+assets+CNAME/robots/sitemap (T3); README/release/downloads/issues enrichment + sanitise (T4); CI least-priv+pinned+Dependabot (T5); 404+SEO assets (T6); a11y/perf/security/deploy verify (T7). All §-sections mapped.
- Interfaces named once, reused (status/platform/url helpers; basePage/bodies; fetch/render). DRY.
- Open items (spec §10) non-blocking; Sponsors URL default; Snatch=`ytdlp-gui` pending confirm; fork Issues confirm.
- Watch-point: `marked` current API (`marked.parse` sync); heading demotion via post-HTML rewrite or `walkTokens`.
