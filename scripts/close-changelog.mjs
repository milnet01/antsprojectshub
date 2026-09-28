#!/usr/bin/env node
// Close CHANGELOG.md's [Unreleased] section under today's date.
//
// The site deploys continuously from main rather than in numbered releases, so
// dated sections stand in for versions — CHANGELOG.md says so in its own
// preamble. Nothing was closing one, so seven weeks of entries accumulated
// under a heading that never resolved.
//
// A no-op when [Unreleased] holds nothing: an empty dated section claims a week
// shipped when it did not.
//
// Run twice in one day and the entries join the section already dated today
// rather than opening a second one with the same heading. Its ### blocks merge
// too, new bullets first, in Keep a Changelog order
// (~/.claude/standards/changelog-format.md § 4.1 and § 4.2).
//
// Today is the local date, as scripts/weekly-post.sh reads it with `date +%F`.
//
// Usage: node scripts/close-changelog.mjs [--check]
//   --check  report what would happen; write nothing. Exits 1 where a real
//            close would fail, 0 otherwise. local-CI.sh runs it on every push.
//
// WEEKLY_POST_TODAY overrides the date, matching scripts/weekly-post.sh, and is
// only for testing the runner itself.

import { readFileSync, writeFileSync } from "node:fs";

const FILE = "CHANGELOG.md";
const UNRELEASED = "## [Unreleased]";
const check = process.argv.includes("--check");
const now = new Date();
const pad = (n) => String(n).padStart(2, "0");
const today = process.env.WEEKLY_POST_TODAY ||
  `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
const ORDER = ["Added", "Changed", "Deprecated", "Removed", "Fixed", "Security"];

const lines = readFileSync(FILE, "utf8").split("\n");

const start = lines.findIndex((l) => l.trim() === UNRELEASED);
if (start === -1) {
  console.error(`close-changelog: ${FILE} has no "${UNRELEASED}" heading`);
  process.exit(1);
}

// The body runs to the next section heading, or to the end of the file.
let next = lines.length;
for (let i = start + 1; i < lines.length; i++) {
  if (lines[i].startsWith("## ")) { next = i; break; }
}

const body = lines.slice(start + 1, next);
if (!body.some((l) => l.trim())) {
  console.log(`close-changelog: ${UNRELEASED} is empty; nothing to close`);
  process.exit(0);
}

if (check) {
  blocks(body); // exits 1 on text before the first ### heading, as a real close would
  console.log(`close-changelog: would close ${UNRELEASED} as "## ${today}"`);
  process.exit(0);
}

// Split a section body into its ### blocks, keyed by category, in the order seen.
function blocks(body) {
  const map = new Map();
  let cur = null;
  for (const l of body) {
    const h = l.match(/^###\s+(.+?)\s*$/);
    if (h) { cur = h[1]; if (!map.has(cur)) map.set(cur, []); continue; }
    if (cur === null) {
      if (l.trim()) { console.error(`close-changelog: text before the first ### heading: "${l}"`); process.exit(1); }
      continue;
    }
    map.get(cur).push(l);
  }
  for (const [k, v] of map) {
    while (v.length && !v[0].trim()) v.shift();
    while (v.length && !v[v.length - 1].trim()) v.pop();
  }
  return map;
}

// A section already dated today absorbs these entries instead of gaining a twin.
let end = next;
const merged = blocks(body);
if (next < lines.length && lines[next].trim() === `## ${today}`) {
  end = lines.length;
  for (let i = next + 1; i < lines.length; i++) {
    if (lines[i].startsWith("## ")) { end = i; break; }
  }
  for (const [k, v] of blocks(lines.slice(next + 1, end))) {
    merged.set(k, [...(merged.get(k) || []), ...v]);
  }
}

const cats = [...ORDER.filter((c) => merged.has(c)),
  ...[...merged.keys()].filter((c) => !ORDER.includes(c))];
const section = ["", `## ${today}`, ""];
for (const c of cats) section.push(`### ${c}`, "", ...merged.get(c), "");

const out = [...lines.slice(0, start + 1), ...section, ...lines.slice(end)];
writeFileSync(FILE, out.join("\n"));
console.log(`close-changelog: closed ${UNRELEASED} as "## ${today}"`);
