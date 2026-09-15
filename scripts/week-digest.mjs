#!/usr/bin/env node
// Week digest — the facts for this week's blog post, gathered by git and gh at no
// token cost, so the post is written from one compact file instead of by reading
// hundreds of commits. Local only, like stats.mjs: it writes .digest/<date>.md, which
// is .gitignored, and build.mjs never imports it.
//
//   node scripts/week-digest.mjs                          # since the newest post was committed
//   node scripts/week-digest.mjs --since=2026-09-09T17:36:00+02:00
//
// Prints the digest's path on stdout. Borrowed from the stats dashboard: a source that
// could not be read is written as "could not be read", never as none — a false "no
// releases" would put a project that shipped into the quiet list.

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const execFileP = promisify(execFile);
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
// The project clones sit beside this repository. Override when they don't.
const CLONES = resolve(process.env.DIGEST_CLONES_DIR || join(ROOT, ".."));
const EMPTY_TREE = "4b825dc642cb6eb9a060e54bf8d69288fbee4904";

// Per-project ceilings, in characters. They stop one very busy repository crowding out
// the rest; a clipped section says so and names where the remainder lives.
const CAP = { changelog: 12_000, roadmap: 5_000, commits: 15_000 };
// A commit body's lines are kept only when they carry a figure, and only this many.
const FIGURE_LINES_PER_COMMIT = 4;
const TRAILER = /^(Co-Authored-By|Claude-Session|Signed-off-by):|^CLAUDE\.md rule 14/i;

async function run(cmd, args) {
  try {
    const { stdout } = await execFileP(cmd, args, { maxBuffer: 256 * 1024 * 1024 });
    return stdout;
  } catch {
    return null;
  }
}
const git = (dir, ...args) => run("git", ["-C", dir, ...args]);
const gh = (...args) => run("gh", args);

function clip(text, max, where) {
  if (text.length <= max) return text;
  const cut = text.slice(0, text.lastIndexOf("\n", max) + 1);
  return `${cut}… clipped: ${text.length - cut.length} more characters in ${where}\n`;
}

/** The window opens when the newest post was committed, unless --since says otherwise. */
async function windowStart() {
  const posts = (await readdir(join(ROOT, "src/posts")))
    .filter((f) => /^\d{4}-\d{2}-\d{2}-.+\.md$/.test(f))
    .sort();
  const lastPost = posts.at(-1) ?? null;
  const flag = process.argv.find((a) => a.startsWith("--since="));
  let since;
  if (flag) {
    since = new Date(flag.slice("--since=".length));
  } else {
    if (!lastPost) throw new Error("no earlier post to measure from — pass --since=<date>");
    const iso = (await git(ROOT, "log", "-1", "--format=%cI", "--", `src/posts/${lastPost}`))?.trim();
    if (!iso) throw new Error(`${lastPost} is not committed yet — commit it, or pass --since=<date>`);
    since = new Date(iso);
  }
  if (Number.isNaN(since.getTime())) throw new Error(`${flag} is not a date`);
  return { since, lastPost };
}

/**
 * GitHub "owner/name" (lower-cased) → local clone. Worktrees and scratch copies point at
 * the same URL, so only a real clone (.git is a directory) counts, and one whose folder
 * name matches the repository's wins over any other.
 */
async function localClones() {
  const norm = (s) => s.toLowerCase().replace(/[-_.]/g, "");
  const best = new Map();
  for (const entry of await readdir(CLONES, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dir = join(CLONES, entry.name);
    if (!(await stat(join(dir, ".git")).catch(() => null))?.isDirectory()) continue;
    const url = (await git(dir, "remote", "get-url", "origin"))?.trim();
    const m = url && /github\.com[/:]([^/]+\/[^/]+?)(?:\.git)?\/?$/i.exec(url);
    if (!m) continue;
    const key = m[1].toLowerCase();
    const named = norm(entry.name) === norm(m[1].split("/")[1]);
    if (!best.has(key) || (named && !best.get(key).named)) best.set(key, { dir, named });
  }
  return new Map([...best].map(([key, v]) => [key, v.dir]));
}

/** Lines a file gained between `base` and HEAD, filtered by `keep`. */
async function addedLines(dir, base, file, keep) {
  const diff = await git(dir, "diff", "--unified=0", base, "HEAD", "--", file);
  if (diff === null) return null;
  return diff
    .split("\n")
    .filter((l) => l.startsWith("+") && !l.startsWith("+++"))
    .map((l) => l.slice(1))
    .filter(keep)
    .join("\n");
}

async function gather(project, dir, since) {
  const sinceISO = since.toISOString();
  const r = { project, dir, releases: null, remoteCommits: null, localCount: null, tags: [] };

  // GitHub: what was published, and whether the default branch moved.
  if (project.repo) {
    const list = await gh("release", "list", "-R", project.repo, "--limit", "30",
      "--json", "tagName,publishedAt,isPrerelease");
    if (list !== null) {
      r.releases = [];
      for (const rel of JSON.parse(list).filter((x) => new Date(x.publishedAt) >= since)) {
        const assets = rel.isPrerelease ? null
          : (await gh("release", "view", rel.tagName, "-R", project.repo,
            "--json", "assets", "-q", "[.assets[].name] | join(\", \")"))?.trim();
        r.releases.push({ ...rel, assets });
      }
    }
    const n = await gh("api", `repos/${project.repo}/commits?since=${sinceISO}&per_page=100`, "-q", "length");
    if (n !== null) r.remoteCommits = Number(n.trim());
  }
  if (!dir) return r;

  // The local clone: commits, tags, and what the changelog and roadmap gained.
  const count = await git(dir, "rev-list", "--count", "--all", `--since=${sinceISO}`);
  if (count !== null) r.localCount = Number(count.trim());

  const refs = (await git(dir, "for-each-ref", "--format=%(refname:short)\t%(creatordate:iso-strict)", "refs/tags")) ?? "";
  for (const line of refs.split("\n").filter(Boolean)) {
    const [name, date] = line.split("\t");
    if (new Date(date) < since) continue;
    const commit = (await git(dir, "rev-list", "-n1", name))?.trim();
    const same = ((commit && (await git(dir, "tag", "--points-at", commit))) ?? "")
      .split("\n").filter((t) => t && t !== name);
    // A tag on the same commit as an earlier one is a promotion, and carries nothing new.
    r.tags.push(`${name} (${date.slice(0, 10)})${same.length ? `, same commit as ${same.join(", ")}` : ""}`);
  }

  const base = (await git(dir, "rev-list", "-1", `--before=${sinceISO}`, "HEAD"))?.trim() || EMPTY_TREE;
  r.changelog = await addedLines(dir, base, "CHANGELOG.md", (l) => l.trim() !== "");
  r.roadmap = await addedLines(dir, base, "ROADMAP.md", (l) => /✅|\[x\]|\bshipped\b|\bdone\b/i.test(l));

  const log = (await git(dir, "log", "HEAD", "--no-merges", `--since=${sinceISO}`, "--date=short",
    "--format=%h %ad %s%x1f%b%x1e")) ?? "";
  let bookkeeping = 0;
  const entries = [];
  for (const rec of log.split("\x1e")) {
    const [head = "", body = ""] = rec.replace(/^\n+/, "").split("\x1f");
    if (!head.trim()) continue;
    if (/^\S+ \S+ records?:/i.test(head)) { bookkeeping++; continue; }
    const figures = body.split("\n").map((l) => l.trim())
      .filter((l) => /\d/.test(l) && !TRAILER.test(l))
      .slice(0, FIGURE_LINES_PER_COMMIT);
    entries.push([head, ...figures.map((f) => `    ${f}`)].join("\n"));
  }
  r.commits = entries.join("\n");
  r.bookkeeping = bookkeeping;
  return r;
}

const active = (r) => r.localCount > 0 || r.remoteCommits > 0 || r.releases?.length > 0;
const readable = (r) => r.localCount !== null || r.remoteCommits !== null;
const unknown = "could not be read";

function render(r) {
  const p = r.project;
  const rel = r.releases === null ? unknown
    : r.releases.length === 0 ? "none"
    : r.releases.map((x) => `${x.tagName} on ${x.publishedAt.slice(0, 10)} ${x.isPrerelease
      ? "(preview only)" : `(stable; downloads: ${x.assets || "no files attached"})`}`).join("; ");
  const out = [
    `## ${p.name ?? p.slug} (slug \`${p.slug}\`, listed on the site as ${p.status})`,
    "",
    `- Repository: ${p.repo}; local clone: ${r.dir ?? "none found"}`,
    `- Commits in the window: ${r.dir ? r.localCount ?? unknown : "no clone"} locally, all branches` +
      `${r.bookkeeping ? ` (${r.bookkeeping} are bookkeeping, not listed)` : ""};` +
      ` ${r.remoteCommits ?? unknown}${r.remoteCommits === 100 ? "+" : ""} on GitHub's default branch`,
    `- GitHub releases published in the window: ${rel}`,
    `- Tags created in the window: ${r.tags.length ? r.tags.join("; ") : "none"}`,
  ];
  const section = (title, text, cap, where) => {
    // A tilde fence, because changelogs and commit bodies carry backtick fences of their own.
    if (text) out.push("", `### ${title}`, "", "~~~~~~", clip(text, cap, where).trimEnd(), "~~~~~~");
  };
  section("CHANGELOG.md gained", r.changelog, CAP.changelog, `${r.dir}/CHANGELOG.md`);
  section("ROADMAP.md lines marked done", r.roadmap, CAP.roadmap, `${r.dir}/ROADMAP.md`);
  section("Commits (hash, date, subject; body lines carrying a figure)", r.commits, CAP.commits,
    `git -C ${r.dir} log --since=<window start>`);
  return out.join("\n");
}

const { since, lastPost } = await windowStart();
const [clones, { projects }] = await Promise.all([
  localClones(),
  readFile(join(ROOT, "src/projects.json"), "utf8").then(JSON.parse),
]);
const reports = await Promise.all(projects.map((p) =>
  p.repo ? gather(p, clones.get(p.repo.toLowerCase()) ?? null, since)
    : { project: p, unpublished: true }));

const busy = reports.filter((r) => !r.unpublished && active(r))
  .sort((a, b) => (b.localCount ?? b.remoteCommits ?? 0) - (a.localCount ?? a.remoteCommits ?? 0));
const quiet = reports.filter((r) => !r.unpublished && !active(r) && readable(r));
const unread = reports.filter((r) => !r.unpublished && !active(r) && !readable(r));
const unpublished = reports.filter((r) => r.unpublished);
const names = (rs) => rs.map((r) => r.project.name ?? r.project.slug).join(", ") || "none";
const siteLog = (await git(ROOT, "log", "--no-merges", `--since=${since.toISOString()}`,
  "--date=short", "--format=%h %ad %s")) ?? unknown;

const now = new Date();
const text = [
  ...(busy.length ? [] : ["NO-ACTIVITY", ""]),
  `# Week digest: ${since.toISOString()} to ${now.toISOString()}`,
  "",
  `Previous post: src/posts/${lastPost}`,
  "",
  "Gathered by scripts/week-digest.mjs from git and GitHub. Every figure is copied from",
  "its source; check one with `git -C <clone> show <hash>`. \"could not be read\" means",
  "unknown, never none.",
  "",
  `- Quiet (no commits, no releases, checked): ${names(quiet)}`,
  `- Could not be read (neither GitHub nor a local clone answered): ${names(unread)}`,
  `- No repository to read (unpublished): ${names(unpublished)}`,
  "",
  "## This site's own commits in the window",
  "",
  "~~~~~~",
  siteLog.trim() || "none",
  "~~~~~~",
  "",
  ...busy.map(render),
  "",
].join("\n");

const file = join(ROOT, ".digest", `${now.toLocaleDateString("en-CA")}.md`);
await mkdir(dirname(file), { recursive: true });
await writeFile(file, text);
console.log(file);
