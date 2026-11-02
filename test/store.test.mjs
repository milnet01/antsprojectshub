// The stats history database (lib/store.mjs) and the Trends charts drawn from it.
//
// Locks the invariants in docs/specs/APHW-0029-stats-history-database.md, one test each,
// named as that spec's § What checks this names them. Every test works in a fresh temporary
// directory: none of them may touch the real .stats/, which holds the only copy of the
// history.

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, readFile, readdir, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { openStore, closeStore, loadHistory, saveRun, readTrends, backup } from "../lib/store.mjs";
import { compareWeeks, dailyDownloads, lineChart } from "../stats.mjs";

async function scratch(t) {
  const dir = await mkdtemp(join(tmpdir(), "aph-store-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  return dir;
}

// A run's GitHub row, shaped as collectProject() returns it.
const ghRow = (slug, n, extra = {}) => ({
  slug,
  ok: true,
  downloads: { win: n, mac: 0, linux: n, other: 1 },
  total: 2 * n + 1,
  stars: 3,
  forks: 1,
  issues: 0,
  prs: 0,
  ...extra,
});

const DAY = 24 * 60 * 60 * 1000;

test("imports history.json once", async (t) => {
  const dir = await scratch(t);
  const json = {
    version: 1,
    snapshots: [
      // The older shape: no `other` key, which must come back absent rather than as null.
      { at: "2026-07-28T07:44:45.996Z", projects: { a: { win: 1, mac: 0, linux: 2, total: 3, stars: 0, forks: 0, issues: 0, prs: 1 } } },
      { at: "2026-07-29T07:44:45.996Z", projects: { a: { win: 2, mac: 0, linux: 2, other: 5, total: 9, stars: 1, forks: 0, issues: 0, prs: 0 } } },
    ],
    traffic: {
      a: {
        "2026-07-14": { views: 4, uniques: 2, clones: 1, cloneUniques: 1 },
        // GitHub reported only the clones half for this day.
        "2026-07-15": { clones: 3, cloneUniques: 2 },
      },
    },
    attention: { "dl-never:a:win": "2026-07-28T07:44:45.028Z" },
  };
  const path = join(dir, "history.json");
  await writeFile(path, JSON.stringify(json));

  let store = openStore(dir, { importFrom: path });
  assert.deepEqual(loadHistory(store), json);
  closeStore(store);

  store = openStore(dir, { importFrom: path });
  assert.equal(loadHistory(store).snapshots.length, 2, "a second open must not import again");
  closeStore(store);
  assert.equal(await readFile(path, "utf8"), JSON.stringify(json), "history.json is never written");
});

test("a failed fetch writes nothing", async (t) => {
  const dir = await scratch(t);
  const store = openStore(dir);
  t.after(() => closeStore(store));
  saveRun(store, {
    now: Date.parse("2026-10-21T08:00:00Z"),
    rows: [ghRow("good", 5), { slug: "bad", ok: false, rateLimited: true }],
    obs: [
      { slug: "good", pkg: "good", d1: 1, d7: 2, d30: 3 },
      { slug: "bad", error: true },
      { slug: "shared", pkg: "shared", shared: true },
      { slug: "new", pkg: "new", uncounted: true },
    ],
    ga: null,
    postViews: { error: "quota" },
    clicks: null,
    attention: {},
  });
  const h = loadHistory(store);
  assert.deepEqual(Object.keys(h.snapshots[0].projects), ["good"]);
  const tr = readTrends(store);
  assert.deepEqual(tr.obs.map((o) => o.pkg), ["good"]);
  assert.equal(tr.ga.daily.length, 0);
  assert.equal(tr.ga.read.daily.size + tr.ga.read.posts.size + tr.ga.read.clicks.size, 0);
});

test("GA days are overwritten, not added", async (t) => {
  const dir = await scratch(t);
  const store = openStore(dir);
  t.after(() => closeStore(store));
  const day = (d, users) => ({ date: `202610${d}`, activeUsers: users, sessions: users, screenPageViews: users });
  const run = (from, to, daily) =>
    saveRun(store, { now: Date.now(), rows: [], obs: [], ga: { daily, from, to }, postViews: null, clicks: null, attention: {} });

  run("2026-10-01", "2026-10-03", [day("01", 1), day("02", 2), day("03", 3)]);
  run("2026-10-02", "2026-10-03", [day("02", 20), day("03", 30)]);

  const got = Object.fromEntries(readTrends(store).ga.daily.map((r) => [r.day, r.active_users]));
  assert.deepEqual(got, { "2026-10-01": 1, "2026-10-02": 20, "2026-10-03": 30 });
});

test("no snapshot cap", async (t) => {
  const dir = await scratch(t);
  const store = openStore(dir);
  t.after(() => closeStore(store));
  const start = Date.parse("2025-01-01T06:00:00Z");
  for (let i = 0; i < 450; i++) {
    saveRun(store, { now: start + i * DAY, rows: [ghRow("a", i)], obs: [], ga: null, postViews: null, clicks: null, attention: {} });
  }
  assert.equal(loadHistory(store).snapshots.length, 450);
});

test("an unreadable store is never replaced", async (t) => {
  const dir = await scratch(t);
  const junk = Buffer.from("this is not an SQLite database, and it must survive being opened\n".repeat(64));
  await writeFile(join(dir, "stats.db"), junk);
  assert.throws(() => openStore(dir), /stats\.db/);
  assert.deepEqual(await readFile(join(dir, "stats.db")), junk);
});

test("a missing day is a gap", () => {
  const svg = lineChart({
    id: "t",
    title: "Test",
    points: [
      { day: "2026-10-01", value: 5 },
      { day: "2026-10-02", value: null },
      { day: "2026-10-03", value: 7 },
    ],
  });
  // Each value has no neighbour, so each is a dot and nothing joins them.
  assert.equal((svg.match(/<circle /g) || []).length, 2);
  assert.doesNotMatch(svg, /<polyline /);
  // The y-axis starts at 0, so a value coerced to 0 would sit on the baseline.
  const base = Number(svg.match(/data-baseline="([\d.]+)"/)[1]);
  const ys = [...svg.matchAll(/<circle [^>]*cy="([\d.]+)"/g)].map((m) => Number(m[1]));
  assert.equal(ys.length, 2);
  for (const y of ys) assert.notEqual(y, base);
});

test("every point is in the table", () => {
  const points = [
    { day: "2026-10-01", value: 5 },
    { day: "2026-10-02", value: null },
    { day: "2026-10-03", value: 0 },
    { day: "2026-10-04", value: 7 },
  ];
  const html = lineChart({ id: "t", title: "Test", points });
  const table = html.slice(html.indexOf("<table"));
  assert.equal((table.match(/<tr>/g) || []).length - 1, 3, "one row per non-null point, plus the header");
});

const reading = (day, projects) => ({
  at: `${day}T08:00:00Z`,
  projects: Object.fromEntries(Object.entries(projects).map(([k, linux]) => [k, { win: 0, mac: 0, linux, other: 0 }])),
});

test("downloads per day count rises, and a new project's history is not one", () => {
  const days = dailyDownloads(
    [
      reading("2026-10-01", { a: 100 }),
      reading("2026-10-02", { a: 103 }),
      // b appears with 500 from before it was watched; a loses an asset.
      reading("2026-10-03", { a: 90, b: 500 }),
      reading("2026-10-05", { a: 95, b: 502 }),
    ],
    "2026-10-07"
  );
  assert.deepEqual(days, [
    { day: "2026-10-02", value: 3 },
    { day: "2026-10-03", value: 0 },
    // No reading that day: a gap, never a zero. Its downloads land on the next reading.
    { day: "2026-10-04", value: null },
    { day: "2026-10-05", value: 7 },
    { day: "2026-10-06", value: null },
  ]);
});

test("downloads per day never include today", () => {
  const days = dailyDownloads([reading("2026-10-01", { a: 1 }), reading("2026-10-02", { a: 5 })], "2026-10-02");
  assert.deepEqual(days, []);
});

test("a week's gaps are counted, not summed as zero", () => {
  const week = (values) => values.map((value, i) => ({ day: `d${i}`, value }));
  const c = compareWeeks(week([1, 1, 1, 1, 1, 1, 1, 2, null, 2, 2, 2, 2, 2]));
  assert.deepEqual(c, { now: { total: 12, days: 6 }, before: { total: 7, days: 7 } });
  assert.equal(compareWeeks(week([1, 1, null, null, null, null, null, null, null])), null);
  assert.equal(compareWeeks(undefined), null);
});

test("backups rotate", async (t) => {
  const dir = await scratch(t);
  const store = openStore(dir);
  const bdir = join(dir, "backup");
  await mkdir(bdir);
  for (let d = 1; d <= 16; d++) await writeFile(join(bdir, `stats-2026-09-${String(d).padStart(2, "0")}.db`), "x");
  const now = Date.parse("2026-10-21T08:00:00Z");

  // A backup that fails deletes nothing: the closed handle makes VACUUM INTO throw, and
  // rotation must not have run first.
  closeStore(store);
  await assert.rejects(() => backup(store, now));
  assert.equal((await readdir(bdir)).length, 16);

  const live = openStore(dir);
  t.after(() => closeStore(live));
  await backup(live, now);
  const kept = (await readdir(bdir)).sort();
  assert.equal(kept.length, 14);
  assert.equal(kept.at(-1), "stats-2026-10-21.db");
  assert.equal(kept[0], "stats-2026-09-04.db");

  await backup(live, now + 60 * 60 * 1000);
  assert.equal((await readdir(bdir)).length, 14, "a second run the same day makes no second backup");
});
