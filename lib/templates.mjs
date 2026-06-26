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
// No inline scripts/styles are emitted, so 'self' is strict and safe.
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' https: data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "form-action 'self'",
].join("; ");

/**
 * Full HTML document.
 * @param {object} o
 * @param {string} o.title        - page <title> (site name appended)
 * @param {string} o.description  - meta description
 * @param {string} [o.canonical]  - absolute canonical URL (omit to skip; e.g. unpublished)
 * @param {string} [o.ogImage]    - absolute OG image URL
 * @param {string} o.content      - inner HTML for <main>
 * @param {boolean} [o.back]      - show "← All projects" link in the header
 */
export function basePage({ title, description, canonical, ogImage, content, back = false }) {
  const fullTitle = title === SITE ? SITE : `${title} · ${SITE}`;
  const og = ogImage || `${ORIGIN}/assets/img/og-image.jpg`;
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
  <link rel="stylesheet" href="/assets/style.css">
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
      ${back ? `<a class="nav-back" href="/">← All projects</a>` : ""}
    </header>
  </div>
  <main id="main" class="wrap">
${content}
  </main>
  <footer class="site-foot">
    <div class="wrap">
      Built by Anthony Schemel · Open source ·
      <a href="https://github.com/milnet01">github.com/milnet01</a>
    </div>
  </footer>
</body>
</html>
`;
}

export { SITE, ORIGIN };
