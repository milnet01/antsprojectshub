// Page shell + small HTML helpers. Pure presentation — no data access here.

const SITE = "Ants Projects Hub";
const ORIGIN = "https://antsprojectshub.co.za";

/** Escape text for safe insertion into HTML element content / attributes. */
export function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// Content-Security-Policy delivered via <meta> (GitHub Pages can't set headers).
// No inline scripts/styles are emitted, so 'self' stays strict — every script here is
// a file we serve. README images are rewritten to absolute https URLs at build time,
// so img-src needs https but not data:. media-src is 'self' because demo videos are
// self-hosted under /assets/video/ — no third-party embeds. NOTE: frame-ancestors is
// ignored when delivered via <meta> (header-only) — it is kept for completeness but
// provides no active clickjacking protection here.
//
// googletagmanager.com is the ONE third-party origin allowed, and only because Google
// Analytics has no self-hostable tag. It is fetched by src/assets/analytics.js and only
// after the visitor accepts; listing the origin here permits it, it does not load it.
// google-analytics.com in connect-src is where gtag.js posts the hit. Do not widen this
// list for anything else — an embed, a font CDN, a chat widget — without the same test:
// can it be self-hosted instead?
const CSP = [
  "default-src 'self'",
  "script-src 'self' https://www.googletagmanager.com",
  "style-src 'self'",
  "img-src 'self' https:",
  "media-src 'self'",
  "font-src 'self'",
  "connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "form-action 'self'",
].join("; ");

// Header nav. Two destinations, so it stays a row of links rather than a menu that
// needs JavaScript to open. `section` marks the current one for aria-current.
const NAV = [
  { id: "projects", href: "/", label: "Projects" },
  { id: "blog", href: "/blog/", label: "Blog" },
];

/**
 * Full HTML document.
 * @param {object} o
 * @param {string} o.title        - page <title> (site name appended)
 * @param {string} o.description  - meta description
 * @param {string} [o.canonical]  - absolute canonical URL (omit to skip; e.g. unpublished)
 * @param {string} [o.ogImage]    - absolute OG image URL
 * @param {string} o.content      - inner HTML for <main>
 * @param {string} [o.section]    - nav id to mark current: "projects" | "blog"
 * @param {{href: string, label: string}} [o.back] - breadcrumb link under the header
 * @param {boolean} [o.lightbox]  - load the screenshot-lightbox keyboard script
 * @param {boolean} [o.dates]     - load the date-localising script (ISO stands without it)
 * @param {boolean} [o.feed]      - advertise the RSS feed in <head>
 */
// Cache-busting fingerprint for /assets/style.css, set once by the build (build.mjs owns
// the file read; this module stays presentation-only). Appended as ?v=<hash> so browsers
// re-fetch the stylesheet the instant its contents change instead of serving a stale copy.
let cssVersion = "";
export function setAssetVersion(v) {
  cssVersion = v;
}

// GA4 measurement ID from src/projects.json (analytics.measurementId), set once by the
// build. Empty or absent means the analytics script is not emitted at all — no tag, no
// consent bar, no third-party request — so switching tracking off is one edit to that
// file. The ID is not a secret: it is visible in the page source of every site using GA.
let analyticsId = "";
export function setAnalyticsId(id) {
  analyticsId = typeof id === "string" ? id.trim() : "";
}

export function basePage({
  title,
  description,
  canonical,
  ogImage,
  content,
  section = "",
  back = null,
  lightbox = false,
  dates = false,
  feed = false,
}) {
  const fullTitle = title === SITE ? SITE : `${title} · ${SITE}`;
  const og = ogImage || `${ORIGIN}/assets/img/og-image.jpg`;
  const nav = NAV.map(
    (n) =>
      `<a href="${n.href}"${n.id === section ? ' aria-current="page"' : ""}>${esc(n.label)}</a>`
  ).join("");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="${CSP}">
  <meta name="referrer" content="no-referrer">
  <meta http-equiv="X-Content-Type-Options" content="nosniff">
  <title>${esc(fullTitle)}</title>
  <meta name="description" content="${esc(description)}">
  ${canonical ? `<link rel="canonical" href="${esc(canonical)}">` : ""}
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${esc(SITE)}">
  <meta property="og:title" content="${esc(fullTitle)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:image" content="${esc(og)}">
  ${canonical ? `<meta property="og:url" content="${esc(canonical)}">` : ""}
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(fullTitle)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${esc(og)}">
  <link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">
  ${feed ? `<link rel="alternate" type="application/rss+xml" title="${esc(SITE)} — the log" href="/blog/feed.xml">` : ""}
  <link rel="stylesheet" href="/assets/style.css${cssVersion ? `?v=${cssVersion}` : ""}">
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  <div class="bg-blobs" aria-hidden="true">
    <span class="blob blob--1"></span>
    <span class="blob blob--2"></span>
    <span class="blob blob--3"></span>
  </div>
  <div class="wrap">
    <header class="site-head">
      <a class="brand" href="/">${esc(SITE)}</a>
      <nav class="site-nav" aria-label="Main">${nav}</nav>
    </header>
  </div>
  <main id="main" class="wrap">
${back ? `    <a class="nav-back" href="${esc(back.href)}">← ${esc(back.label)}</a>\n` : ""}${content}
  </main>
  <footer class="site-foot">
    <div class="wrap">
      Built by Anthony Schemel · Open source ·
      <a href="https://github.com/milnet01">github.com/milnet01</a>
    </div>
  </footer>
  ${lightbox ? `<script src="/assets/lightbox.js" defer></script>` : ""}
  ${dates ? `<script src="/assets/dates.js" defer></script>` : ""}
  ${analyticsId ? `<script src="/assets/analytics.js" data-ga-id="${esc(analyticsId)}" defer></script>` : ""}
</body>
</html>
`;
}

export { SITE, ORIGIN, CSP };
