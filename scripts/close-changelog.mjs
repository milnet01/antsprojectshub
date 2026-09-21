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
// rather than opening a second one with the same heading.
//
// Usage: node scripts/close-changelog.mjs [--check]
//   --check  report what would happen; write nothing. Exits 0 either way.
//
// WEEKLY_POST_TODAY overrides the date, matching scripts/weekly-post.sh, and is
// only for testing the runner itself.

import { readFileSync, writeFileSync } from "node:fs";

const FILE = "CHANGELOG.md";
const UNRELEASED = "## [Unreleased]";
const check = process.argv.includes("--check");
const today = process.env.WEEKLY_POST_TODAY || new Date().toISOString().slice(0, 10);

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
  console.log(`close-changelog: would close ${UNRELEASED} as "## ${today}"`);
  process.exit(0);
}

const out = [...lines];
// A section already dated today absorbs these entries instead of gaining a twin.
if (next < out.length && out[next].trim() === `## ${today}`) out.splice(next, 1);
out.splice(start + 1, 0, "", `## ${today}`);

writeFileSync(FILE, out.join("\n"));
console.log(`close-changelog: closed ${UNRELEASED} as "## ${today}"`);
