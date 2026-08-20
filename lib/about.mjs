// Project "About" copy: src/about/<slug>.md → rendered HTML. Data access + parsing
// only — page assembly stays in build.mjs and the document shell in templates.mjs.
//
// One file per project, named for its slug in src/projects.json. This is the hand-
// written answer to "what is this and why would I want it?", and it deliberately
// REPLACED the project's GitHub README, which the build used to fetch and render in
// its place. A README is written for someone who has already decided to clone the
// repo: it opens with badges, build flags and a licence, and it changes shape without
// warning when the repo is edited. A visitor who has just landed on a project page
// wants none of that. So the copy lives here, in this repo, written for this site.
//
// A missing file is a hard error rather than a fallback. Unlike a GitHub fetch — which
// is a transient failure the build routes around — this content is ours and in-repo,
// so its absence is a project that was added without its About being written. Failing
// the build is what makes that impossible to ship by accident; the deploy is skipped
// and the last good site stays up.

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

// The same allowlist posts.mjs uses, and for the same reason: this is OUR markup, so
// an internal link must stay internal, but the page still ships under a strict CSP —
// no script/style/iframe, no event handlers, no inline style attribute.
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

// The panel already contributes the page's "About <name>" <h2>, so a heading written
// as ## in the file belongs one level below it. Authors write natural markdown and the
// page keeps one <h1> and a heading order screen readers can navigate. h6 has nowhere
// to go and stays put.
function demoteHeadings(html) {
  return html.replace(/<(\/?)h([1-5])\b/gi, (_, slash, n) => `<${slash}h${Number(n) + 1}`);
}

/**
 * Read the About copy for every project.
 * @param {string} dir - absolute path to src/about
 * @param {Array<{slug: string, name: string}>} projects - every project, in any order
 * @returns {Promise<Map<string, string>>} slug → rendered HTML
 */
export async function loadAbout(dir, projects) {
  const out = new Map();
  for (const p of projects) {
    const file = join(dir, `${p.slug}.md`);
    let raw;
    try {
      raw = await readFile(file, "utf8");
    } catch (err) {
      if (err.code !== "ENOENT") throw err;
      throw new Error(
        `${p.name} has no About copy — write src/about/${p.slug}.md. Every project in ` +
          `src/projects.json needs one; see src/about/README.md for what goes in it.`
      );
    }
    if (!raw.trim()) throw new Error(`src/about/${p.slug}.md is empty — write the About copy for ${p.name}.`);
    out.set(p.slug, demoteHeadings(sanitizeHtml(marked.parse(raw, { gfm: true }), SANITIZE)));
  }
  return out;
}
