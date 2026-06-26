// Ants Projects Hub — static site generator.
// Reads src/projects.json, enriches published projects from GitHub (README + latest
// release), and writes dist/. A single project's GitHub failure uses its fallback and
// never aborts the build. Runs in CI (authenticated via GITHUB_TOKEN) or locally
// (unauthenticated; offline → fallbacks).

import { readFile, writeFile, mkdir, rm, cp } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { marked } from "marked";
import sanitizeHtml from "sanitize-html";
import { basePage, esc, ORIGIN } from "./lib/templates.mjs";

const ROOT = dirname(fileURLToPath(import.meta.url));
const DIST = join(ROOT, "dist");
const TOKEN = process.env.GITHUB_TOKEN || "";

// ---------------------------------------------------------------- presentation
const STATUS = {
  live: { label: "Live", cls: "pill--live" },
  beta: { label: "Beta", cls: "pill--beta" },
  wip: { label: "Early WIP", cls: "pill--wip" },
  soon: { label: "Coming soon", cls: "pill--soon" },
};
const PLATFORM = { win: "Windows", mac: "macOS", linux: "Linux", web: "Web" };
const PLAT_SHORT = { win: "WIN", mac: "MAC", linux: "LNX", web: "WEB" };

const isPublished = (p) => Boolean(p.repo) && p.status !== "soon";
// Releases LIST page — always valid and shows pre-releases too (unlike /releases/latest,
// whose web page 404s for a repo that only has pre-releases).
const releasesUrl = (repo) => `https://github.com/${repo}/releases`;
const repoUrl = (repo) => `https://github.com/${repo}`;
const issuesUrl = (repo) => `https://github.com/${repo}/issues`;

function computeStats(projects) {
  return {
    total: projects.length,
    live: projects.filter((p) => p.status === "live").length,
  };
}

function statusPill(p) {
  const s = STATUS[p.status] || STATUS.soon;
  return `<span class="pill ${s.cls}">${esc(s.label)}</span>`;
}
function platformTags(p) {
  return `<span class="plats">${p.platforms
    .map((pl) => `<span class="plat">${esc(PLAT_SHORT[pl] || pl)}</span>`)
    .join("")}</span>`;
}

function renderCard(p) {
  const fork = p.isFork ? `<span class="card__fork">· fork</span>` : "";
  return `<a class="card ${p.status === "soon" ? "card--soon" : ""}" href="/p/${esc(
    p.slug
  )}.html">
      <h2 class="card__name">${esc(p.name)}${fork}</h2>
      <p class="card__desc">${esc(p.tagline)}</p>
      <span class="card__meta">${statusPill(p)}${platformTags(p)}</span>
    </a>`;
}

function renderSupport(support) {
  const btns = support
    .map((s) => {
      if (s.url) {
        const primary = /sponsor/i.test(s.label) ? " support__btn--primary" : "";
        return `<a class="support__btn${primary}" href="${esc(
          s.url
        )}" target="_blank" rel="noopener noreferrer">${esc(s.label)}</a>`;
      }
      return `<span class="support__btn" aria-disabled="true">${esc(
        s.label
      )} <span class="note">· soon</span></span>`;
    })
    .join("");
  return `<section class="support" aria-labelledby="support-h">
      <h2 class="section-label" id="support-h">Support the work</h2>
      <div class="support__row">${btns}</div>
    </section>`;
}

// ------------------------------------------------------------------- GitHub I/O
async function ghJson(path) {
  try {
    const res = await fetch(`https://api.github.com${path}`, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "ants-projects-hub-build",
        "X-GitHub-Api-Version": "2022-11-28",
        ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
      },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// Shift README headings down one level so the page keeps a single <h1>.
function demoteHeadings(html) {
  for (let n = 5; n >= 1; n--) {
    const to = n + 1;
    html = html
      .replace(new RegExp(`<h${n}(\\s|>)`, "gi"), `<h${to}$1`)
      .replace(new RegExp(`</h${n}>`, "gi"), `</h${to}>`);
  }
  return html;
}

// One sanitiser config shared by the README and release-note paths, so the allowlist
// can never drift between them. README content is UNTRUSTED (third-party fork READMEs
// included), so the allowlist is tight: no script/style/iframe, no event handlers, no
// javascript:/data: URLs, no protocol-relative links.
const ALLOWED_TAGS = [
  "h1", "h2", "h3", "h4", "h5", "h6", "p", "a", "ul", "ol", "li",
  "blockquote", "pre", "code", "em", "strong", "del", "hr", "br",
  "img", "table", "thead", "tbody", "tr", "th", "td", "details",
  "summary", "span", "div", "kbd", "sub", "sup",
];
const ALLOWED_ATTR = {
  a: ["href", "title"],
  img: ["src", "alt", "title", "width", "height"],
  "*": ["align"],
};

// Resolve a relative URL against a base; pass through anything already absolute/anchor.
function absolutize(url, base) {
  if (!base || !url || /^(https?:|mailto:|#|\/\/)/i.test(url)) return url;
  try {
    return new URL(url, base).href;
  } catch {
    return url;
  }
}

function sanitizeOptions({ rawBase, blobBase } = {}) {
  return {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTR,
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: { img: ["http", "https"] }, // images must be real fetched URLs
    allowProtocolRelative: false,
    transformTags: {
      a: (tag, attribs) => {
        if (attribs.href) attribs.href = absolutize(attribs.href, blobBase);
        attribs.rel = "noopener noreferrer nofollow";
        attribs.target = "_blank";
        return { tagName: "a", attribs };
      },
      img: (tag, attribs) => {
        if (attribs.src) attribs.src = absolutize(attribs.src, rawBase);
        attribs.loading = "lazy";
        return { tagName: "img", attribs };
      },
    },
  };
}

async function fetchReadmeHtml(repo) {
  const data = await ghJson(`/repos/${repo}/readme`);
  if (!data || !data.content || !data.download_url) return null;
  let md;
  try {
    md = Buffer.from(data.content, data.encoding || "base64").toString("utf8");
  } catch {
    return null;
  }
  // download_url: https://raw.githubusercontent.com/<owner>/<repo>/<branch>/README.md
  const rawBase = data.download_url.replace(/[^/]*$/, ""); // strip filename → dir
  let blobBase = rawBase;
  const m = data.download_url.match(
    /raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)\//
  );
  if (m) blobBase = `https://github.com/${m[1]}/${m[2]}/blob/${m[3]}/`;
  const rendered = marked.parse(md, { gfm: true });
  return demoteHeadings(sanitizeHtml(rendered, sanitizeOptions({ rawBase, blobBase })));
}

async function fetchRelease(repo) {
  // The list endpoint includes pre-releases (newest first); /releases/latest does not.
  // Skip drafts (only visible to tokens with push access — never show them publicly).
  const list = await ghJson(`/repos/${repo}/releases?per_page=5`);
  const data = Array.isArray(list) ? list.find((r) => !r.draft) : null;
  if (!data || !data.tag_name) return null;
  const notesHtml = data.body
    ? sanitizeHtml(marked.parse(data.body, { gfm: true }), sanitizeOptions())
    : "";
  const assets = Array.isArray(data.assets)
    ? data.assets.map((a) => ({ name: a.name, url: a.browser_download_url }))
    : [];
  return { version: data.tag_name, notesHtml, assets };
}

// Match a release asset to a platform by filename. Deliberately conservative: a Linux
// match needs an AppImage/deb/rpm/flatpak extension or the word "linux" — so a plain
// source `*.tar.gz` (e.g. a Python sdist) is NOT mistaken for a Linux binary.
const ASSET_PAT = {
  win: /\.(exe|msi)$|windows|win-?(64|32)|[-_]win[-_.]/i,
  mac: /\.(dmg|pkg)$|macos|mac[-_.]|osx|darwin/i,
  linux: /\.(appimage|deb|rpm|flatpak)$|linux/i,
};
function pickAsset(assets, pl) {
  const pat = ASSET_PAT[pl];
  return (assets || []).find((a) => pat && pat.test(a.name)) || null;
}

// No-release repos always fall back to the repo home (never a guessed upstream
// releases URL that might 404). The upstream is still credited in the header.

// --------------------------------------------------------------- page builders
function landingPage(projects, support) {
  const stats = computeStats(projects);
  const cards = projects.map(renderCard).join("\n");
  const content = `
    <section class="hero">
      <p class="kicker">Anthony Schemel · Open Source</p>
      <h1>Ants Projects Hub</h1>
      <p class="tagline">A home for the things I build — engines, emulation tools,
        utilities and more. Free, open, and downloadable.</p>
      <div class="stats">
        <div class="stat"><b>${stats.total}</b><span>Projects</span></div>
        <div class="stat"><b>${stats.live}</b><span>Live now</span></div>
        <div class="stat"><b>3</b><span>Desktop OSes</span></div>
      </div>
    </section>
    <h2 class="section-label">Projects</h2>
    <section class="grid" aria-label="Projects">
${cards}
    </section>
    ${renderSupport(support)}`;
  return basePage({
    title: "Ants Projects Hub",
    description:
      "Open-source projects by Anthony Schemel — a 3D engine, emulation tools, " +
      "desktop utilities and more. Free and downloadable.",
    canonical: `${ORIGIN}/`,
    content,
  });
}

function ext(url, label, cls = "btn") {
  return `<a class="${cls}" href="${esc(
    url
  )}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`;
}

function actionButtons(p, release) {
  if (p.status === "soon") {
    return `<div class="actions">${p.platforms
      .map(
        (pl) =>
          `<span class="btn" aria-disabled="true">${esc(
            PLATFORM[pl] || pl
          )} · soon</span>`
      )
      .join("")}</div>`;
  }
  const hasRelease = Boolean(release);
  const hasWeb = p.platforms.includes("web");
  const desktop = p.platforms.filter((pl) => pl !== "web");
  // Fallback when there's no matching binary: the project's homepage (e.g. Flathub) if
  // set, else its Releases page (or repo home if there's no release at all).
  const fallback = p.homepage || (hasRelease ? releasesUrl(p.repo) : repoUrl(p.repo));
  const fallbackLabel = p.homepage || hasRelease ? "Download" : "Get it on GitHub";
  const buttons = [];

  if (hasWeb) {
    // Self-hosted web app — download & run it yourself.
    buttons.push(ext(fallback, hasRelease ? "Download · Self-host" : "Get it on GitHub", "btn btn--primary"));
  }

  // Direct per-OS download to the latest release's matching file (auto-updates each
  // build); platforms without a matching file share one fallback button.
  const matched = desktop.map((pl) => ({ pl, asset: hasRelease ? pickAsset(release.assets, pl) : null }));
  const direct = matched.filter((m) => m.asset);
  direct.forEach((m, i) =>
    buttons.push(
      ext(m.asset.url, `Download · ${PLATFORM[m.pl] || m.pl}`, `btn ${i === 0 && !hasWeb ? "btn--primary" : ""}`)
    )
  );
  if (matched.some((m) => !m.asset)) {
    const primary = direct.length === 0 && !hasWeb ? "btn--primary" : "";
    buttons.push(ext(fallback, fallbackLabel, `btn ${primary}`));
  }

  buttons.push(ext(issuesUrl(p.repo), "Report an issue", "btn btn--ghost"));
  return `<div class="actions">${buttons.join("")}</div>`;
}

function projectPage(p, { readmeHtml, release }) {
  const published = isPublished(p);
  const hasRelease = Boolean(release);
  const fork =
    p.isFork && p.upstream
      ? `<a href="${esc(repoUrl(p.upstream))}" target="_blank" rel="noopener noreferrer">forked from ${esc(
          p.upstream
        )}</a>`
      : "";
  const version = hasRelease
    ? `<span class="version">Latest: <strong>${esc(release.version)}</strong></span>`
    : "";

  let body;
  if (!published) {
    body = `<div class="callout"><strong>Coming soon.</strong> ${esc(
      p.blurb
    )} This project isn't published yet — check back, or follow along on GitHub.</div>`;
  } else if (readmeHtml) {
    const changelog = hasRelease
      ? `<section class="panel" aria-labelledby="cl-h">
          <h2 class="section-label" id="cl-h">What's new · ${esc(release.version)}</h2>
          <div class="prose">${release.notesHtml || "<p>See the release on GitHub.</p>"}</div>
          <p><a href="${esc(releasesUrl(p.repo))}" target="_blank" rel="noopener noreferrer">All releases on GitHub →</a></p>
        </section>`
      : `<p><a class="btn btn--ghost" href="${esc(
          releasesUrl(p.repo)
        )}" target="_blank" rel="noopener noreferrer">Latest release on GitHub →</a></p>`;
    body = `${changelog}
      <section class="panel" aria-labelledby="readme-h">
        <h2 class="section-label" id="readme-h">About ${esc(p.name)}</h2>
        <div class="prose">${readmeHtml}</div>
      </section>`;
  } else {
    body = `<div class="callout">${esc(
      p.blurb
    )} <a href="${esc(repoUrl(p.repo))}" target="_blank" rel="noopener noreferrer">Read more on GitHub →</a></div>`;
  }

  const content = `
    <section class="detail-head">
      <p class="kicker">${esc(STATUS[p.status]?.label || "")}${
    fork ? " · " + fork : ""
  }</p>
      <h1>${esc(p.name)}</h1>
      <div class="detail-sub">${statusPill(p)}${platformTags(p)}${version}</div>
      ${actionButtons(p, release)}
    </section>
    ${body}`;

  return basePage({
    title: p.name,
    description: p.tagline,
    canonical: published ? `${ORIGIN}/p/${p.slug}.html` : undefined,
    content,
    back: true,
  });
}

function notFoundPage() {
  return basePage({
    title: "Not found",
    description: "Page not found.",
    content: `<section class="notfound">
      <h1>404</h1>
      <p class="tagline">That page wandered off. Let's get you back.</p>
      <p><a class="btn btn--primary" href="/">← Back to all projects</a></p>
    </section>`,
  });
}

// ------------------------------------------------------------------------ main
async function main() {
  const data = JSON.parse(await readFile(join(ROOT, "src/projects.json"), "utf8"));
  const { projects, support } = data;

  await rm(DIST, { recursive: true, force: true });
  await mkdir(join(DIST, "p"), { recursive: true });
  await cp(join(ROOT, "src/assets"), join(DIST, "assets"), { recursive: true });

  // Landing
  await writeFile(join(DIST, "index.html"), landingPage(projects, support));

  // Project pages (enrich published ones; fallbacks never abort the build)
  let enriched = 0;
  for (const p of projects) {
    let readmeHtml = null;
    let release = null;
    if (isPublished(p)) {
      try {
        [readmeHtml, release] = await Promise.all([
          fetchReadmeHtml(p.repo),
          fetchRelease(p.repo),
        ]);
        if (readmeHtml) enriched++;
      } catch (err) {
        console.warn(`! ${p.slug}: enrichment failed (${err.message}) — using fallback`);
      }
    }
    await writeFile(join(DIST, "p", `${p.slug}.html`), projectPage(p, { readmeHtml, release }));
  }

  // 404, CNAME, robots, sitemap
  await writeFile(join(DIST, "404.html"), notFoundPage());
  await writeFile(join(DIST, "CNAME"), "antsprojectshub.co.za\n");
  await writeFile(
    join(DIST, "robots.txt"),
    `User-agent: *\nAllow: /\nSitemap: ${ORIGIN}/sitemap.xml\n`
  );
  const urls = [`${ORIGIN}/`].concat(
    projects.filter(isPublished).map((p) => `${ORIGIN}/p/${p.slug}.html`)
  );
  await writeFile(
    join(DIST, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      urls.map((u) => `  <url><loc>${u}</loc></url>`).join("\n") +
      `\n</urlset>\n`
  );

  console.log(
    `Built ${projects.length} projects (${enriched} enriched from GitHub${
      TOKEN ? ", authenticated" : ", unauthenticated"
    }) → dist/`
  );
}

main().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
