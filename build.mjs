// Ants Projects Hub — static site generator.
// Reads src/projects.json, enriches published projects from GitHub (README + latest
// release), and writes dist/. A single project's GitHub failure uses its fallback and
// never aborts the build. Runs in CI (authenticated via GITHUB_TOKEN) or locally
// (unauthenticated; offline → fallbacks).

import { readFile, writeFile, mkdir, rm, cp } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { marked } from "marked";
import sanitizeHtml from "sanitize-html";
import { basePage, esc, ORIGIN, setAssetVersion } from "./lib/templates.mjs";
import { loadPosts, excerpt } from "./lib/posts.mjs";
import {
  ghJson,
  assetPlatform,
  pickAsset,
  pickLatestRelease,
  hasToken,
} from "./lib/github.mjs";

const ROOT = dirname(fileURLToPath(import.meta.url));
const DIST = join(ROOT, "dist");

// ---------------------------------------------------------------- presentation
const STATUS = {
  live: { label: "Live", cls: "pill--live" },
  beta: { label: "Beta", cls: "pill--beta" },
  wip: { label: "Early WIP", cls: "pill--wip" },
  soon: { label: "Coming soon", cls: "pill--soon" },
};
const PLATFORM = { win: "Windows", mac: "macOS", linux: "Linux", web: "Web" };
const PLAT_SHORT = { win: "WIN", mac: "MAC", linux: "LNX", web: "WEB" };

// Landing-page grouping: projects are split into themed sections (the jump-nav
// anchors), and sorted by status within each theme so finished work leads.
const CATEGORY = {
  engines: { label: "Engines & Graphics", id: "engines" },
  games: { label: "Games", id: "games" },
  emulation: { label: "Emulation & Retro", id: "emulation" },
  media: { label: "Media", id: "media" },
  utilities: { label: "Desktop Utilities", id: "utilities" },
};
const CATEGORY_ORDER = ["engines", "games", "emulation", "media", "utilities"];
const STATUS_ORDER = { live: 0, beta: 1, wip: 2, soon: 3 };

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

// The picture at the top of a card. A project with screenshots shows its first one;
// the rest get a monogram panel in their category's colour, so the grid stays even
// instead of going patchy while the other fourteen are still unshot. The image is
// alt="" on purpose — it is decorative here, and the link already announces itself
// with the project's name and tagline.
function cardCover(p) {
  const shot = Array.isArray(p.screenshots) ? p.screenshots[0] : null;
  if (shot?.src) {
    return `<span class="card__cover"><img src="/assets/img/${esc(shot.src)}" alt="" loading="lazy" decoding="async"></span>`;
  }
  const mono = [...p.name.trim()][0] || "?";
  return `<span class="card__cover card__cover--mono" aria-hidden="true"><span class="card__mono">${esc(
    mono
  )}</span></span>`;
}

function renderCard(p, release) {
  const fork = p.isFork ? `<span class="card__fork">· fork</span>` : "";
  // Latest release version (stable-preferred, from fetchRelease) shown beside the status
  // pill — matches what the project page's download button offers. Absent for unpublished
  // or unreleased projects, so the card simply omits it.
  const version = release && release.version
    ? `<span class="card__version">${esc(release.version)}</span>`
    : "";
  return `<a class="card ${p.status === "soon" ? "card--soon" : ""}" href="/p/${esc(
    p.slug
  )}.html">
      ${cardCover(p)}
      <span class="card__body">
        <h3 class="card__name">${esc(p.name)}${fork}</h3>
        <p class="card__desc">${esc(p.tagline)}</p>
        <span class="card__meta"><span class="card__status">${statusPill(p)}${version}</span>${platformTags(p)}</span>
      </span>
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
  return `<section class="support" id="support" aria-labelledby="support-h">
      <h2 class="section-label" id="support-h">Support the work</h2>
      <div class="support__row">${btns}</div>
    </section>`;
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
  // Prefer the newest *stable* release — never hand visitors a release-candidate/preview
  // download. RCs are transient: GitHub deletes them when the final ships, leaving a dead
  // 404 link (the exact symptom that motivated this). The list endpoint (newest first,
  // pre-releases included) lets us fall back to a prerelease only for projects that have
  // *only ever* shipped prereleases, so they still get a download rather than none. Skip
  // drafts entirely — they're visible only to push-access tokens, never to the public.
  // per_page=100 (not 10) so the cumulative download tally below sees every release, not
  // just the most recent handful — the counts are meant to be all-time totals.
  const list = await ghJson(`/repos/${repo}/releases?per_page=100`);
  const nonDraft = Array.isArray(list) ? list.filter((r) => !r.draft) : [];
  const data = pickLatestRelease(nonDraft);
  if (!data || !data.tag_name) return null;
  const notesHtml = data.body
    ? sanitizeHtml(marked.parse(data.body, { gfm: true }), sanitizeOptions())
    : "";
  const assets = Array.isArray(data.assets)
    ? data.assets.map((a) => ({ name: a.name, url: a.browser_download_url }))
    : [];
  // All-time downloads per OS: sum download_count across every non-draft release, assigning
  // each asset to at most one OS via the same conservative matcher the buttons use (first
  // match wins, so a file is never double-counted across two platforms).
  const downloads = { win: 0, mac: 0, linux: 0 };
  for (const r of nonDraft) {
    for (const a of Array.isArray(r.assets) ? r.assets : []) {
      const pl = assetPlatform(a.name);
      if (pl) downloads[pl] += a.download_count || 0;
    }
  }
  return { version: data.tag_name, notesHtml, assets, downloads };
}

// No-release repos always fall back to the repo home (never a guessed upstream
// releases URL that might 404). The upstream is still credited in the header.

// --------------------------------------------------------------- page builders
// The newest post, on the home page — capped at its opening paragraphs so a long
// entry can never push the projects off the front page. The full thing is one
// click away, and the cap is why the link says "read the rest" when there is more.
function renderLogBand(posts) {
  if (!posts.length) return "";
  const p = posts[0];
  const { html, truncated } = excerpt(p.html, 620);
  return `    <section class="logband" aria-labelledby="logband-h">
      <div class="logband__head">
        <h2 class="section-label" id="logband-h">From the log</h2>
        <a class="logband__all" href="/blog/">All posts →</a>
      </div>
      <article class="logband__post">
        <p class="post__date"><time datetime="${esc(p.dateISO)}">${esc(p.dateLabel)}</time></p>
        <h3 class="logband__title"><a href="${esc(p.url)}">${esc(p.title)}</a></h3>
        <div class="prose logband__lede">${html}</div>
        <p class="logband__more"><a class="btn btn--ghost" href="${esc(p.url)}">${
          truncated ? "Read the rest" : "Open the post"
        } →</a></p>
      </article>
    </section>`;
}

function landingPage(projects, support, releases, posts) {
  const stats = computeStats(projects);
  const present = CATEGORY_ORDER.filter((c) => projects.some((p) => p.category === c));
  const jump = `<nav class="jump" aria-label="Jump to a section">
${present
    .map((c) => `      <a href="#${CATEGORY[c].id}">${esc(CATEGORY[c].label)}</a>`)
    .join("\n")}
      <a href="#support">Support</a>
    </nav>`;
  const groups = present
    .map((c) => {
      const cards = projects
        .filter((p) => p.category === c)
        .sort((a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9))
        .map((p) => renderCard(p, releases.get(p.slug)))
        .join("\n");
      // The theme--<id> class is what carries the category's accent colour; the hue
      // itself lives in style.css so the generator holds no design tokens.
      return `    <section class="theme theme--${CATEGORY[c].id}" id="${CATEGORY[c].id}" aria-labelledby="${CATEGORY[c].id}-h">
      <h2 class="section-label" id="${CATEGORY[c].id}-h">${esc(CATEGORY[c].label)}</h2>
      <div class="grid">
${cards}
      </div>
    </section>`;
    })
    .join("\n");
  const content = `
    <section class="hero">
      <p class="kicker">Anthony Schemel · Open Source</p>
      <h1><img class="hero__logo" src="/assets/img/favicon.svg" alt="" width="64" height="64"><span class="hero__brand">Ants Projects Hub</span></h1>
      <p class="tagline">A home for the things I build — engines, games, emulation
        tools, utilities and more. Free, open, and downloadable.</p>
      <div class="stats">
        <div class="stat"><b>${stats.total}</b><span>Projects</span></div>
        <div class="stat"><b>${stats.live}</b><span>Live now</span></div>
        <div class="stat"><b>3</b><span>Desktop OSes</span></div>
      </div>
    </section>
${renderLogBand(posts)}
    ${jump}
${groups}
    ${renderSupport(support)}`;
  return basePage({
    title: "Ants Projects Hub",
    description:
      "Open-source projects by Anthony Schemel — a 3D engine, games, emulation " +
      "tools, desktop utilities and more. Free and downloadable.",
    canonical: `${ORIGIN}/`,
    content,
    section: "projects",
    feed: true,
  });
}

function ext(url, label, cls = "btn") {
  return `<a class="${cls}" href="${esc(
    url
  )}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`;
}

// All-time GitHub download count for one OS's binaries, shown under its download button.
const dlCountLabel = (n) => `${n.toLocaleString("en-US")} download${n === 1 ? "" : "s"}`;

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
  direct.forEach((m, i) => {
    const btn = ext(m.asset.url, `Download · ${PLATFORM[m.pl] || m.pl}`, `btn ${i === 0 && !hasWeb ? "btn--primary" : ""}`);
    // Cumulative all-time downloads for this OS. A freshly-cut release genuinely has
    // none yet, and printing "0 downloads" under the button reads worse than printing
    // nothing at all — so the count appears only once there is one.
    const n = release.downloads?.[m.pl] ?? 0;
    const count = n > 0 ? `<span class="dl__count">${esc(dlCountLabel(n))}</span>` : "";
    buttons.push(`<span class="dl">${btn}${count}</span>`);
  });
  if (matched.some((m) => !m.asset)) {
    const primary = direct.length === 0 && !hasWeb ? "btn--primary" : "";
    buttons.push(ext(fallback, fallbackLabel, `btn ${primary}`));
  }

  buttons.push(ext(issuesUrl(p.repo), "Report an issue", "btn btn--ghost"));
  return `<div class="actions">${buttons.join("")}</div>`;
}

// Curated screenshot gallery (pure-CSS, no JS ships). Each entry is { src, alt }:
// src is relative to assets/img/, alt is required for accessibility. Thumbnails sit
// in a responsive grid (all visible — scales from 2 to 20+ shots); clicking one opens
// a full-screen :target lightbox with a ✕ close, backdrop-click close, and ‹ / › prev-
// next (wrap-around). No JS, so ESC can't close it — the visible controls and the
// browser Back button do. Empty/absent screenshots → no section at all.
function renderScreenshots(p) {
  const shots = Array.isArray(p.screenshots) ? p.screenshots : [];
  if (!shots.length) return "";
  const n = shots.length;
  const lbId = (i) => `lb-${p.slug}-${i + 1}`;

  const thumbs = shots
    .map((s, i) => {
      const src = `/assets/img/${esc(s.src)}`;
      const alt = esc(s.alt || `${p.name} screenshot`);
      return `<a class="shot" href="#${lbId(i)}" aria-label="Enlarge screenshot ${i + 1} of ${n}: ${alt}"><img src="${src}" alt="${alt}" loading="lazy"></a>`;
    })
    .join("");

  // One lightbox panel per shot. Prev/next wrap around, so navigation always works
  // (even with 2 shots); with a single shot the arrows are omitted.
  const boxes = shots
    .map((s, i) => {
      const src = `/assets/img/${esc(s.src)}`;
      const alt = esc(s.alt || `${p.name} screenshot`);
      const nav =
        n > 1
          ? `<a class="lightbox__nav lightbox__prev" href="#${lbId((i - 1 + n) % n)}" aria-label="Previous screenshot">‹</a>` +
            `<a class="lightbox__nav lightbox__next" href="#${lbId((i + 1) % n)}" aria-label="Next screenshot">›</a>`
          : "";
      return `<div class="lightbox" id="${lbId(i)}" role="dialog" aria-label="Screenshot ${i + 1} of ${n}: ${alt}">
          <a class="lightbox__backdrop" href="#screenshots" aria-label="Close screenshot viewer" tabindex="-1"></a>
          <figure class="lightbox__inner">
            <img class="lightbox__img" src="${src}" alt="${alt}">
            <figcaption class="lightbox__cap"><span class="lightbox__count">${i + 1} / ${n}</span>${alt}</figcaption>
          </figure>
          <a class="lightbox__close" href="#screenshots" aria-label="Close screenshot viewer">✕</a>
          ${nav}
        </div>`;
    })
    .join("");

  return `<section class="shots-sec" id="screenshots" aria-labelledby="shots-h">
      <h2 class="section-label" id="shots-h">Screenshots</h2>
      <div class="shots">${thumbs}</div>
      <div class="lightboxes">${boxes}</div>
    </section>`;
}

// Optional demo video (one per project): { src, poster, caption }, both paths relative
// to assets/video/. Native <video controls> — no player library, no JS. It never
// autoplays: motion the visitor didn't ask for is a barrier, and a poster keeps the
// layout stable. The screencasts are silent, so `caption` IS the text alternative
// (WCAG 1.2.1 video-only) — it is required and rendered visibly under the player.
function renderVideo(p) {
  const v = p.video;
  if (!v?.src) return "";
  const url = `/assets/video/${esc(v.src)}`;
  const poster = v.poster ? ` poster="/assets/video/${esc(v.poster)}"` : "";
  return `<section class="demo-sec" id="demo" aria-labelledby="demo-h">
      <h2 class="section-label" id="demo-h">Demo</h2>
      <figure class="demo">
        <video class="demo__video" src="${url}"${poster} controls preload="none" playsinline aria-label="${esc(
    p.name
  )} demo video">
          <p>Your browser can't play this video. <a href="${url}">Download it (MP4)</a> instead.</p>
        </video>
        <figcaption class="demo__cap">${esc(v.caption)}</figcaption>
      </figure>
    </section>`;
}

// How much README to show before the reveal, in characters of visible text, and how
// small a tail has to be before hiding it is not worth a click. The budget is what it
// is because splitting at the first section heading — which this used to do — showed
// 163 characters of DOOM Ants' 6,485 and 202 of OneUp's 8,487: about 2%, so a visitor
// saw the project name, one sentence and a button. Anything shorter than the budget is
// shown whole with no reveal at all, which covers most projects outright.
const README_BUDGET = 4000;
const README_TAIL_MIN = 400;

const textLength = (html) => html.replace(/<[^>]+>/g, "").length;

// Cut the rendered README into its top-level blocks (<p>, <ul>, <h2>, <table>, …), so a
// split can only ever land BETWEEN two of them. Splitting anywhere else — at the first
// </p> found by a regex, say — lands inside a list or a blockquote and leaves both
// halves with unbalanced tags. Depth tracking is what keeps a nested </p> from counting.
function topLevelBlocks(html) {
  const VOID = new Set(["area", "base", "br", "col", "hr", "img", "input", "link", "meta", "source", "wbr"]);
  const tagRe = /<(\/?)([a-z][a-z0-9]*)\b[^>]*?(\/?)>/gi;
  const blocks = [];
  let depth = 0;
  let start = 0;
  let m;
  while ((m = tagRe.exec(html))) {
    const [full, closing, name, selfClosing] = m;
    if (selfClosing || VOID.has(name.toLowerCase())) continue;
    if (!closing) {
      depth++;
      continue;
    }
    depth--;
    if (depth <= 0) {
      depth = 0; // malformed input can't drive the counter negative
      const end = m.index + full.length;
      blocks.push(html.slice(start, end));
      start = end;
    }
  }
  if (html.slice(start).trim()) blocks.push(html.slice(start));
  return blocks;
}

// Split the rendered README into an always-visible opening and a remainder tucked behind
// a no-JS <details> reveal. Returns the whole thing with no reveal when the README fits
// the budget, or when what would be hidden is too small to be worth a click.
function splitReadme(html) {
  const blocks = topLevelBlocks(html);
  let used = 0;
  let i = 0;
  while (i < blocks.length && used < README_BUDGET) {
    used += textLength(blocks[i]);
    i++;
  }
  const rest = blocks.slice(i).join("");
  if (textLength(rest) < README_TAIL_MIN) return { lede: html, rest: "" };
  return { lede: blocks.slice(0, i).join(""), rest };
}

function readmePanel(p, readmeHtml) {
  const { lede, rest } = splitReadme(readmeHtml);
  const inner = rest
    ? `<div class="prose reveal__lede">${lede}</div>
        <details class="reveal">
          <summary class="reveal__btn"><span class="reveal__more">Read the rest</span><span class="reveal__less">Show less</span></summary>
          <div class="prose">${rest}</div>
        </details>`
    : `<div class="prose">${lede}</div>`;
  return `<section class="panel panel--readme" id="about" aria-labelledby="readme-h">
        <h2 class="section-label" id="readme-h">About ${esc(p.name)}</h2>
        ${inner}
      </section>`;
}

function changelogPanel(p, release) {
  return `<section class="panel panel--changelog" id="whatsnew" aria-labelledby="cl-h">
        <h2 class="section-label" id="cl-h">What's new · ${esc(release.version)}</h2>
        <div class="prose">${release.notesHtml || "<p>See the release on GitHub.</p>"}</div>
        <p><a href="${esc(
          releasesUrl(p.repo)
        )}" target="_blank" rel="noopener noreferrer">All releases on GitHub →</a></p>
      </section>`;
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
    // Most "soon" projects have no repo yet; finbreak and any future ones with a public
    // repo get a real "follow development" link instead of a dead GitHub mention.
    const follow = p.repo
      ? ` <a href="${esc(
          repoUrl(p.repo)
        )}" target="_blank" rel="noopener noreferrer">Follow development on GitHub →</a>`
      : "";
    body = `<div class="callout"><strong>Coming soon.</strong> ${esc(
      p.blurb
    )} This project isn't published for download yet — check back soon.${follow}</div>`;
  } else if (readmeHtml) {
    // README ("About") first, then the changelog ("What's new") — newcomers read what
    // the project is before what changed last release.
    const whatsNew = hasRelease
      ? changelogPanel(p, release)
      : `<p><a class="btn btn--ghost" href="${esc(
          releasesUrl(p.repo)
        )}" target="_blank" rel="noopener noreferrer">Latest release on GitHub →</a></p>`;
    body = `${readmePanel(p, readmeHtml)}
      ${whatsNew}`;
  } else {
    body = `<div class="callout">${esc(
      p.blurb
    )} <a href="${esc(repoUrl(p.repo))}" target="_blank" rel="noopener noreferrer">Read more on GitHub →</a></div>`;
  }

  // The demo video then the screenshots lead the page (the hook), then the body — a
  // moving tour beats a still, and a still beats prose. Jump nav only links to sections
  // that actually exist on this page.
  const videoHtml = renderVideo(p);
  const shotsHtml = renderScreenshots(p);
  const navTargets = [];
  if (videoHtml) navTargets.push(["demo", "Demo"]);
  if (shotsHtml) navTargets.push(["screenshots", "Screenshots"]);
  if (published && readmeHtml) {
    navTargets.push(["about", "About"]);
    if (hasRelease) navTargets.push(["whatsnew", "What's new"]);
  }
  const jump =
    navTargets.length >= 2
      ? `<nav class="jump" aria-label="Jump to a section">${navTargets
          .map(([id, label]) => `<a href="#${id}">${esc(label)}</a>`)
          .join("")}</nav>`
      : "";

  // The tagline is the page's own one-line answer to "what is this?" — without it the
  // page jumped from a two-word title straight to the download buttons, and the only
  // description a visitor got was whatever the README's first line happened to be.
  const content = `
    <section class="detail-head">
      <p class="kicker">${esc(STATUS[p.status]?.label || "")}${
    fork ? " · " + fork : ""
  }</p>
      <h1>${esc(p.name)}</h1>
      <p class="detail-tagline">${esc(p.tagline)}</p>
      <div class="detail-sub">${statusPill(p)}${platformTags(p)}${version}</div>
      ${actionButtons(p, release)}
    </section>
    ${jump}
    ${videoHtml}
    ${shotsHtml}
    ${body}`;

  return basePage({
    title: p.name,
    description: p.tagline,
    canonical: published ? `${ORIGIN}/p/${p.slug}.html` : undefined,
    content,
    section: "projects",
    back: { href: "/", label: "All projects" },
    lightbox: Boolean(shotsHtml),
  });
}

// ------------------------------------------------------------------------- blog
// Posts come from src/posts/*.md via lib/posts.mjs. A post names the projects it
// covers by slug; each becomes a chip linking to that project's page. An unknown
// slug is a typo rather than a reason to fail the build, so it warns and is dropped.
function postProjectChips(post, bySlug) {
  const chips = post.projects
    .map((slug) => {
      const p = bySlug.get(slug);
      if (!p) {
        console.warn(`! blog/${post.slug}: no project with slug "${slug}" — chip omitted`);
        return "";
      }
      return `<a class="chip" href="/p/${esc(p.slug)}.html">${esc(p.name)}</a>`;
    })
    .filter(Boolean)
    .join("");
  return chips ? `<p class="post__tags">${chips}</p>` : "";
}

function postMeta(post) {
  return `<p class="post__date"><time datetime="${esc(post.dateISO)}">${esc(
    post.dateLabel
  )}</time></p>`;
}

function blogIndexPage(posts, bySlug) {
  const items = posts
    .map(
      (post) => `        <li class="postlist__item">
          ${postMeta(post)}
          <h2 class="postlist__title"><a href="${esc(post.url)}">${esc(post.title)}</a></h2>
          <p class="postlist__sum">${esc(post.summary)}</p>
          ${postProjectChips(post, bySlug)}
        </li>`
    )
    .join("\n");
  const content = `
    <section class="blog-head">
      <p class="kicker">The log</p>
      <h1>What I've been building</h1>
      <p class="tagline">A note every week or two on what actually changed across the
        projects — what shipped, what broke, and what the fix turned out to be.</p>
      <p class="blog-head__feed"><a href="/blog/feed.xml">Follow by RSS →</a></p>
    </section>
    <ol class="postlist">
${items}
    </ol>`;
  return basePage({
    title: "The log",
    description:
      "A weekly development log from Ants Projects Hub — what shipped across the " +
      "engine, the games, the emulation tools and the desktop utilities.",
    canonical: `${ORIGIN}/blog/`,
    content,
    section: "blog",
    feed: true,
  });
}

function blogPostPage(post, bySlug, { prev, next }) {
  // prev = older, next = newer. Both are plain links, so the pair is a working
  // archive walk with no JavaScript and no index page round-trip.
  const around = [
    next ? `<a class="post__prevnext" href="${esc(next.url)}">← ${esc(next.title)}</a>` : "",
    prev ? `<a class="post__prevnext post__prevnext--older" href="${esc(prev.url)}">${esc(prev.title)} →</a>` : "",
  ]
    .filter(Boolean)
    .join("");
  const content = `
    <article class="post">
      <header class="post__head">
        ${postMeta(post)}
        <h1>${esc(post.title)}</h1>
        <p class="post__sum">${esc(post.summary)}</p>
        ${postProjectChips(post, bySlug)}
      </header>
      <div class="prose post__body">${post.html}</div>
    </article>
    ${around ? `<nav class="post__nav" aria-label="More posts">${around}</nav>` : ""}`;
  return basePage({
    title: post.title,
    description: post.summary,
    canonical: `${ORIGIN}${post.url}`,
    content,
    section: "blog",
    back: { href: "/blog/", label: "All posts" },
    feed: true,
  });
}

function rssFeed(posts) {
  const items = posts
    .map(
      (post) => `    <item>
      <title>${esc(post.title)}</title>
      <link>${ORIGIN}${post.url}</link>
      <guid isPermaLink="true">${ORIGIN}${post.url}</guid>
      <pubDate>${post.date.toUTCString()}</pubDate>
      <description>${esc(post.summary)}</description>
    </item>`
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Ants Projects Hub — the log</title>
    <link>${ORIGIN}/blog/</link>
    <atom:link href="${ORIGIN}/blog/feed.xml" rel="self" type="application/rss+xml"/>
    <description>What shipped this week across Anthony Schemel's projects.</description>
    <language>en</language>
${items}
  </channel>
</rss>
`;
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

  // Posts are read before anything is written: a malformed post should fail the build
  // before dist/ is wiped, not halfway through generating it.
  const posts = await loadPosts(join(ROOT, "src/posts"));
  const bySlug = new Map(projects.map((p) => [p.slug, p]));

  await rm(DIST, { recursive: true, force: true });
  await mkdir(join(DIST, "p"), { recursive: true });
  await mkdir(join(DIST, "blog"), { recursive: true });
  await cp(join(ROOT, "src/assets"), join(DIST, "assets"), { recursive: true });

  // Fingerprint the stylesheet so every page's <link> carries ?v=<hash>; browsers then
  // re-fetch the CSS the moment its contents change, rather than serving a stale cache.
  const cssBytes = await readFile(join(ROOT, "src/assets/style.css"));
  setAssetVersion(createHash("sha256").update(cssBytes).digest("hex").slice(0, 8));

  // Project pages (enrich published ones; fallbacks never abort the build). Collect each
  // project's release so the landing cards below can show the latest version.
  let enriched = 0;
  const releases = new Map();
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
    releases.set(p.slug, release);
    await writeFile(join(DIST, "p", `${p.slug}.html`), projectPage(p, { readmeHtml, release }));
  }

  // Blog: index, one directory per post (so its URL is /blog/<slug>/), and the feed.
  for (const [i, post] of posts.entries()) {
    await mkdir(join(DIST, "blog", post.slug), { recursive: true });
    await writeFile(
      join(DIST, "blog", post.slug, "index.html"),
      // posts is newest-first, so the NEXT entry is the older post.
      blogPostPage(post, bySlug, { prev: posts[i + 1], next: posts[i - 1] })
    );
  }
  await writeFile(join(DIST, "blog", "index.html"), blogIndexPage(posts, bySlug));
  await writeFile(join(DIST, "blog", "feed.xml"), rssFeed(posts));

  // Landing (built after enrichment so each card can show its latest release version)
  await writeFile(join(DIST, "index.html"), landingPage(projects, support, releases, posts));

  // 404, CNAME, robots, sitemap
  await writeFile(join(DIST, "404.html"), notFoundPage());
  await writeFile(join(DIST, "CNAME"), "antsprojectshub.co.za\n");
  // Google Search Console site-ownership token — served at the domain root so
  // the "HTML file" verification method resolves. Written by the build because
  // dist/ is wiped and regenerated on every deploy.
  await writeFile(
    join(DIST, "google26e8bc6a1b61c6cf.html"),
    "google-site-verification: google26e8bc6a1b61c6cf.html"
  );
  await writeFile(
    join(DIST, "robots.txt"),
    `User-agent: *\nAllow: /\nSitemap: ${ORIGIN}/sitemap.xml\n`
  );
  const urls = [`${ORIGIN}/`]
    .concat(projects.filter(isPublished).map((p) => `${ORIGIN}/p/${p.slug}.html`))
    .concat(posts.length ? [`${ORIGIN}/blog/`] : [])
    .concat(posts.map((post) => `${ORIGIN}${post.url}`));
  await writeFile(
    join(DIST, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      urls.map((u) => `  <url><loc>${u}</loc></url>`).join("\n") +
      `\n</urlset>\n`
  );

  console.log(
    `Built ${projects.length} projects (${enriched} enriched from GitHub${
      hasToken ? ", authenticated" : ", unauthenticated"
    }) and ${posts.length} blog post${posts.length === 1 ? "" : "s"} → dist/`
  );
}

main().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
