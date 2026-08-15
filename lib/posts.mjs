// Blog posts: src/posts/*.md → post objects. Data access + parsing only — page
// assembly stays in build.mjs and the document shell in templates.mjs.
//
// One file per post, named `YYYY-MM-DD-<slug>.md`, opening with a small header
// block. Adding a post means dropping a file in src/posts/ and nothing else, the
// same way adding a project is one edit to src/projects.json.
//
//   ---
//   title: What happened this week
//   date: 2026-08-15
//   summary: One sentence for the index, the home page and the RSS feed.
//   projects: oneup, doom-ants
//   ---
//
// A malformed post throws. That is deliberate: unlike a GitHub fetch, post content
// is ours and in-repo, so a bad header is a mistake to fix rather than a transient
// failure to fall back from. The build fails, the deploy is skipped, and the last
// good site stays up.

import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

const FILENAME = /^(\d{4}-\d{2}-\d{2})-([a-z0-9]+(?:-[a-z0-9]+)*)\.md$/;
const REQUIRED = ["title", "date", "summary"];

// Posts are OUR content, so this allowlist is deliberately NOT the one build.mjs
// uses for READMEs — that one guards against untrusted third-party markup and
// forces every link off-site. Here an internal link must stay internal. The tag
// list is still tight (no script/style/iframe, no event handlers) because the
// page ships under a strict CSP and an inline style would break it.
const ALLOWED_TAGS = [
  "h2", "h3", "h4", "h5", "h6", "p", "a", "ul", "ol", "li",
  "blockquote", "pre", "code", "em", "strong", "del", "hr", "br",
  "img", "table", "thead", "tbody", "tr", "th", "td",
  "figure", "figcaption", "span", "kbd", "abbr",
];

const SANITIZE = {
  allowedTags: ALLOWED_TAGS,
  allowedAttributes: {
    a: ["href", "title"],
    img: ["src", "alt", "title", "width", "height", "loading"],
    abbr: ["title"],
    th: ["scope"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  allowProtocolRelative: false,
  transformTags: {
    // Off-site links open in a new tab and disown the referrer; links to our own
    // pages (/p/oneup.html, /blog/, #anchor) are left exactly as written.
    a: (tag, attribs) => {
      if (attribs.href && /^https?:/i.test(attribs.href)) {
        attribs.rel = "noopener noreferrer";
        attribs.target = "_blank";
      }
      return { tagName: "a", attribs };
    },
    img: (tag, attribs) => ({ tagName: "img", attribs: { ...attribs, loading: "lazy" } }),
  },
};

const DATE_FMT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** Split the `---` header block from the body. Throws if the block is absent. */
function parseFrontMatter(raw, file) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw);
  if (!m) throw new Error(`${file}: missing the --- header block at the top of the file`);
  const meta = {};
  for (const line of m[1].split(/\r?\n/)) {
    if (!line.trim() || line.trimStart().startsWith("#")) continue;
    const at = line.indexOf(":");
    if (at < 0) throw new Error(`${file}: header line is not "key: value" — ${line}`);
    meta[line.slice(0, at).trim()] = line.slice(at + 1).trim();
  }
  return { meta, body: m[2] };
}

/**
 * The opening of a post, for the home page and the index: whole top-level blocks
 * up to `maxChars` of text, never cutting one in half. Returns the whole post
 * when it is already shorter than that, so a short post is shown complete and
 * `truncated` says whether anything was held back.
 */
export function excerpt(html, maxChars = 700) {
  const blocks = html.match(/<p\b[\s\S]*?<\/p>/gi) || [];
  const out = [];
  let used = 0;
  for (const b of blocks) {
    out.push(b);
    used += b.replace(/<[^>]+>/g, "").length;
    if (used >= maxChars) break;
  }
  const kept = out.join("");
  return { html: kept || html, truncated: kept.length < html.trim().length };
}

/**
 * Read every post, newest first.
 * @param {string} dir - absolute path to src/posts
 * @returns {Promise<Array<{slug,title,date,dateISO,dateLabel,summary,projects,html,url}>>}
 */
export async function loadPosts(dir) {
  let files;
  try {
    files = await readdir(dir);
  } catch (err) {
    if (err.code === "ENOENT") return []; // no posts yet — not an error
    throw err;
  }

  const posts = [];
  for (const file of files.filter((f) => f.endsWith(".md")).sort()) {
    const name = FILENAME.exec(file);
    if (!name) {
      throw new Error(`${file}: name a post YYYY-MM-DD-some-slug.md`);
    }
    const { meta, body } = parseFrontMatter(await readFile(join(dir, file), "utf8"), file);

    for (const key of REQUIRED) {
      if (!meta[key]) throw new Error(`${file}: header is missing "${key}"`);
    }
    if (meta.date !== name[1]) {
      throw new Error(`${file}: header date ${meta.date} does not match the filename date ${name[1]}`);
    }
    const date = new Date(`${meta.date}T00:00:00Z`);
    if (Number.isNaN(date.getTime())) throw new Error(`${file}: ${meta.date} is not a real date`);

    posts.push({
      slug: name[2],
      url: `/blog/${name[2]}/`,
      title: meta.title,
      summary: meta.summary,
      date,
      dateISO: meta.date,
      dateLabel: DATE_FMT.format(date),
      projects: (meta.projects || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      html: sanitizeHtml(marked.parse(body, { gfm: true }), SANITIZE),
    });
  }

  posts.sort((a, b) => b.date - a.date || a.slug.localeCompare(b.slug));
  return posts;
}
