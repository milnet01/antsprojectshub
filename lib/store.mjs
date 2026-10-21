// The stats dashboard's history: one SQLite file, .stats/stats.db, through Node's built-in
// node:sqlite (no dependency). LOCAL ONLY, like the dashboard — nothing the site build runs
// imports this file, so no figure here can reach antsprojectshub.co.za.
//
// The one file that runs SQL. stats.mjs reads the history back through loadHistory() in the
// shape history.json used to have, so the renderers did not change, and the Trends tab reads
// the rest through readTrends(). The design, and why each rule is what it is, is
// docs/specs/APHW-0029-stats-history-database.md.

import { DatabaseSync } from "node:sqlite";
import { readdir, mkdir, unlink } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const FILE = "stats.db";
const BACKUPS_KEPT = 14;
const BACKUP_NAME = /^stats-\d{4}-\d{2}-\d{2}\.db$/;
const OS_COLS = ["win", "mac", "linux", "other"];
const COUNT_COLS = ["total", "stars", "forks", "issues", "prs"];
const SNAPSHOT_COLS = [...OS_COLS, ...COUNT_COLS];

const SCHEMA = `
CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS gh_snapshot (
  at TEXT NOT NULL, slug TEXT NOT NULL,
  win INTEGER, mac INTEGER, linux INTEGER, other INTEGER, total INTEGER,
  stars INTEGER, forks INTEGER, issues INTEGER, prs INTEGER,
  PRIMARY KEY (at, slug));
CREATE TABLE IF NOT EXISTS gh_traffic (
  slug TEXT NOT NULL, day TEXT NOT NULL,
  views INTEGER, uniques INTEGER, clones INTEGER, clone_uniques INTEGER,
  PRIMARY KEY (slug, day));
CREATE TABLE IF NOT EXISTS obs_snapshot (
  at TEXT NOT NULL, slug TEXT NOT NULL, pkg TEXT NOT NULL,
  d1 INTEGER NOT NULL, d7 INTEGER NOT NULL, d30 INTEGER NOT NULL,
  PRIMARY KEY (at, pkg));
CREATE TABLE IF NOT EXISTS ga_daily (
  day TEXT PRIMARY KEY,
  active_users INTEGER NOT NULL, sessions INTEGER NOT NULL, views INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS ga_post_daily (day TEXT NOT NULL, path TEXT NOT NULL,
  views INTEGER NOT NULL, PRIMARY KEY (day, path));
CREATE TABLE IF NOT EXISTS ga_click_daily (day TEXT NOT NULL, path TEXT NOT NULL,
  clicks INTEGER NOT NULL, PRIMARY KEY (day, path));
CREATE TABLE IF NOT EXISTS ga_read (
  tbl TEXT NOT NULL, day TEXT NOT NULL, PRIMARY KEY (tbl, day));
CREATE TABLE IF NOT EXISTS attention (key TEXT PRIMARY KEY, since TEXT NOT NULL);
INSERT OR IGNORE INTO meta (key, value) VALUES ('schema_version', '1');
`;

const dayKey = (ts) => new Date(ts).toISOString().slice(0, 10);
const gaDate = (d) => `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;

// Every calendar day from `from` to `to`, both YYYY-MM-DD and inclusive. Pure date arithmetic,
// so no time zone can shift a day.
function daysBetween(from, to) {
  const out = [];
  for (let t = Date.parse(`${from}T00:00:00Z`); t <= Date.parse(`${to}T00:00:00Z`); t += 86400000) out.push(dayKey(t));
  return out;
}

function transaction(db, fn) {
  db.exec("BEGIN IMMEDIATE");
  try {
    fn();
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

// Open (creating if absent) <dir>/stats.db, and import history.json once if it is given and
// the database has never imported it. Anything that stops the file being read throws, naming
// it: the old history.json path started again from empty and then wrote that over the file.
export function openStore(dir, { importFrom } = {}) {
  const file = join(dir, FILE);
  let db;
  try {
    db = new DatabaseSync(file);
    // A CLI run and the service's run wait for each other rather than fail.
    db.exec("PRAGMA busy_timeout = 10000");
    db.exec(SCHEMA);
  } catch (err) {
    db?.close();
    throw new Error(`${file}: ${err.message}`);
  }
  const store = { db, dir, file };
  const imported = db.prepare("SELECT value FROM meta WHERE key = 'history_json_imported'").get();
  if (!imported && importFrom && existsSync(importFrom)) importHistory(store, importFrom);
  return store;
}

export function closeStore(store) {
  if (store.db.isOpen) store.db.close();
}

function importHistory(store, path) {
  let h;
  try {
    h = JSON.parse(readFileSync(path, "utf8"));
  } catch (err) {
    throw new Error(`${path}: cannot import (${err.message}) — nothing was written`);
  }
  const { db } = store;
  transaction(db, () => {
    const snap = insertSnapshotStmt(db);
    for (const s of h.snapshots || []) {
      for (const [slug, p] of Object.entries(s.projects || {})) snap.run(...snapshotParams(s.at, slug, p));
    }
    const traffic = db.prepare(
      "INSERT INTO gh_traffic (slug, day, views, uniques, clones, clone_uniques) VALUES (?, ?, ?, ?, ?, ?)"
    );
    for (const [slug, bucket] of Object.entries(h.traffic || {})) {
      for (const [day, d] of Object.entries(bucket)) {
        traffic.run(slug, day, d.views ?? null, d.uniques ?? null, d.clones ?? null, d.cloneUniques ?? null);
      }
    }
    const att = db.prepare("INSERT INTO attention (key, since) VALUES (?, ?)");
    for (const [key, since] of Object.entries(h.attention || {})) att.run(key, since);
    db.prepare("INSERT INTO meta (key, value) VALUES ('history_json_imported', ?)").run(new Date().toISOString());
  });
}

const insertSnapshotStmt = (db) =>
  db.prepare(
    `INSERT INTO gh_snapshot (at, slug, ${SNAPSHOT_COLS.join(", ")}) VALUES (?, ?, ${SNAPSHOT_COLS.map(() => "?").join(", ")})`
  );
const snapshotParams = (at, slug, p) => [at, slug, ...SNAPSHOT_COLS.map((k) => p[k] ?? null)];

// The history in history.json's shape: { version, snapshots, traffic, attention }. A NULL
// column comes back as an absent key, as the JSON had it, so older snapshots with no `other`
// read exactly as before.
export function loadHistory(store) {
  const { db } = store;
  const snapshots = [];
  let last = null;
  for (const r of db.prepare("SELECT * FROM gh_snapshot ORDER BY at, slug").all()) {
    if (last?.at !== r.at) snapshots.push((last = { at: r.at, projects: {} }));
    const p = {};
    for (const k of SNAPSHOT_COLS) if (r[k] != null) p[k] = r[k];
    last.projects[r.slug] = p;
  }
  const traffic = {};
  for (const r of db.prepare("SELECT * FROM gh_traffic ORDER BY slug, day").all()) {
    const d = {};
    if (r.views != null) d.views = r.views;
    if (r.uniques != null) d.uniques = r.uniques;
    if (r.clones != null) d.clones = r.clones;
    if (r.clone_uniques != null) d.cloneUniques = r.clone_uniques;
    (traffic[r.slug] ||= {})[r.day] = d;
  }
  const attention = {};
  for (const r of db.prepare("SELECT key, since FROM attention ORDER BY key").all()) attention[r.key] = r.since;
  return { version: 1, snapshots, traffic, attention };
}

// Record one run, all or nothing. What a run did not manage to fetch writes nothing — never a
// zero, which every later run would read as a fall and then a spike.
//   rows      collectProject() results; only `ok` ones are stored
//   obs       collectObs() results; only those carrying d1, d7 and d30
//   ga        collectAnalytics() result, or null; postViews and clicks likewise, or { error }
//   attention the run's attention map, which replaces the stored one
export function saveRun(store, { now, rows = [], obs = [], ga, postViews, clicks, attention }) {
  const { db } = store;
  const at = new Date(now).toISOString();
  transaction(db, () => {
    const snap = insertSnapshotStmt(db);
    const views = db.prepare(`INSERT INTO gh_traffic (slug, day, views, uniques) VALUES (?, ?, ?, ?)
      ON CONFLICT (slug, day) DO UPDATE SET views = excluded.views, uniques = excluded.uniques`);
    const clones = db.prepare(`INSERT INTO gh_traffic (slug, day, clones, clone_uniques) VALUES (?, ?, ?, ?)
      ON CONFLICT (slug, day) DO UPDATE SET clones = excluded.clones, clone_uniques = excluded.clone_uniques`);
    for (const r of rows.filter((x) => x.ok)) {
      snap.run(...snapshotParams(at, r.slug, { ...r.downloads, total: r.total, stars: r.stars, forks: r.forks, issues: r.issues, prs: r.prs }));
      if (!r.traffic || r.traffic.denied) continue;
      for (const d of r.traffic.daily || []) views.run(r.slug, dayKey(d.timestamp), d.count, d.uniques);
      for (const d of r.traffic.dailyClones || []) clones.run(r.slug, dayKey(d.timestamp), d.count, d.uniques);
    }

    const pkg = db.prepare("INSERT INTO obs_snapshot (at, slug, pkg, d1, d7, d30) VALUES (?, ?, ?, ?, ?, ?)");
    for (const o of obs) {
      if ([o.d1, o.d7, o.d30].every(Number.isFinite)) pkg.run(at, o.slug, o.pkg, o.d1, o.d7, o.d30);
    }

    if (ga?.daily) {
      replaceWindow(db, "daily", ga, "INSERT INTO ga_daily (day, active_users, sessions, views) VALUES (?, ?, ?, ?)",
        ga.daily.map((r) => [gaDate(r.date), r.activeUsers, r.sessions, r.screenPageViews]));
    }
    if (postViews?.rows) {
      replaceWindow(db, "posts", postViews, "INSERT INTO ga_post_daily (day, path, views) VALUES (?, ?, ?)",
        postViews.rows.map((r) => [gaDate(r.date), r.pagePath, r.screenPageViews]));
    }
    if (clicks?.rows) {
      replaceWindow(db, "clicks", clicks, "INSERT INTO ga_click_daily (day, path, clicks) VALUES (?, ?, ?)",
        clicks.rows.map((r) => [gaDate(r.date), r.pagePath, r.eventCount]));
    }

    db.exec("DELETE FROM attention");
    const att = db.prepare("INSERT INTO attention (key, since) VALUES (?, ?)");
    for (const [key, since] of Object.entries(attention || {})) att.run(key, since);
  });
}

const GA_TABLE = { daily: "ga_daily", posts: "ga_post_daily", clicks: "ga_click_daily" };

// A GA read covers a window of days, `from` to `to`. Whatever the window held before is
// replaced by what Google returned for it, so the store matches Google for every day it
// re-read and keeps every day it did not. Each day read is noted in ga_read: GA returns no
// row for a day with nothing to count, and that note is how a zero is told from a gap.
function replaceWindow(db, tbl, { from, to }, insertSql, rows) {
  db.prepare(`DELETE FROM ${GA_TABLE[tbl]} WHERE day BETWEEN ? AND ?`).run(from, to);
  const ins = db.prepare(insertSql);
  for (const r of rows) ins.run(...r);
  const read = db.prepare("INSERT OR IGNORE INTO ga_read (tbl, day) VALUES (?, ?)");
  for (const day of daysBetween(from, to)) read.run(tbl, day);
}

// What the Trends tab draws from, beyond loadHistory(): openSUSE runs, and GA's daily figures
// with the set of days each GA table was read.
export function readTrends(store) {
  const { db } = store;
  const readSet = (tbl) => new Set(db.prepare("SELECT day FROM ga_read WHERE tbl = ?").all(tbl).map((r) => r.day));
  return {
    obs: db.prepare("SELECT at, slug, pkg, d1 FROM obs_snapshot ORDER BY at, pkg").all(),
    ga: {
      daily: db.prepare("SELECT * FROM ga_daily ORDER BY day").all(),
      posts: db.prepare("SELECT day, SUM(views) AS value FROM ga_post_daily GROUP BY day ORDER BY day").all(),
      clicks: db.prepare("SELECT day, SUM(clicks) AS value FROM ga_click_daily GROUP BY day ORDER BY day").all(),
      read: { daily: readSet("daily"), posts: readSet("posts"), clicks: readSet("clicks") },
    },
  };
}

// One copy of the database per UTC day in <dir>/backup/, the newest BACKUPS_KEPT kept. The
// database is the only record of GitHub traffic past 14 days and openSUSE counts past 30, so
// a bad write must not be the end of it. Rotation runs only after the new copy exists: a
// failed backup deletes nothing.
export async function backup(store, now) {
  const dir = join(store.dir, "backup");
  await mkdir(dir, { recursive: true });
  const name = `stats-${dayKey(now)}.db`;
  const have = (await readdir(dir)).filter((f) => BACKUP_NAME.test(f));
  if (have.includes(name)) return;
  store.db.exec(`VACUUM INTO '${join(dir, name).replaceAll("'", "''")}'`);
  const all = [...have, name].sort();
  for (const old of all.slice(0, Math.max(0, all.length - BACKUPS_KEPT))) await unlink(join(dir, old));
}
