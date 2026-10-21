<!-- ants-spec-format: 1 -->
# APHW-0029 — Keep every stat's history in a local database and chart it

**Status:** accepted (2026-10-21).
**Kind:** feature.
**Source:** ROADMAP APHW-0029 (user request, 2026-10-21).

**Layman:** the private stats dashboard remembers GitHub, openSUSE and Google
figures day by day, for as long as it runs, and gains a Trends tab showing how
they change over time.

## 1. Goal

Every figure the dashboard records is stored in one SQLite file,
`.stats/stats.db`, with no age or count limit. A new Trends tab draws each
daily series as a line chart with a table of the same numbers beside it.
`.stats/history.json` is imported once and never written again.

## 2. Problem

1. **Download snapshots are capped.** `updateHistory()` in `stats.mjs` keeps
   the newest 400 snapshots and drops the rest
   (`grep -n "snapshots.length > 400" stats.mjs` → one hit).
2. **openSUSE counts are not kept at all.** `collectObs()` reads MirrorCache's
   last-day, 7-day and 30-day counts at render time. MirrorCache serves no
   older figure, so each day's count is lost a month later.
3. **Google Analytics figures are not kept.** The rule in
   `.claude/rules/stats-dashboard.md` says GA is *"never snapshotted"*. The
   user has asked for its history to be kept locally (§3).
4. **An unreadable history is overwritten.** `loadHistory()` returns an empty
   history on any read or parse error, and `generate()` then writes that empty
   history over `HISTORY`. A half-written `history.json` therefore loses every
   past snapshot without a warning.
5. **Nothing shows history as a picture.** `sparkline()` draws an unlabelled
   64 × 18 trend in the downloads table. No chart has axes, dates or a text
   alternative.

## 3. Scope decisions (agreed with the user)

- **Keep Google Analytics history** — user, 2026-10-21. This reverses
  *"Google Analytics is read, never written, and never snapshotted"* in
  `.claude/rules/stats-dashboard.md`. The rule's reason (in
  `docs/history/claude-md.md`) was that a local copy could drift from
  Google's. §4.3 answers it: every run overwrites every day it re-read.
- **Charts are part of this item, not a later one** — user, 2026-10-21.
- **SQLite through Node's built-in `node:sqlite`** — author's call. It adds
  no dependency. It needs no flag from Node 22.13.0 (Node's `sqlite` docs,
  History table), so the Node floor rises from 22.12 to 22.13.0 (§11). Node
  v24.21.0, this machine's version, loads it with no warning (checked
  2026-10-21).
- **Only daily series are stored** — author's call. GA's top pages, sources
  and countries are 28-day rankings, not daily series. Google keeps them, and
  the dashboard goes on reading them live (§9).

## 4. Design

### 4.1 Files

- **New `lib/store.mjs`** owns the database: opening it, the schema, the
  one-time import, reads and writes. No other file runs SQL.
- **`stats.mjs`** calls the store instead of reading and writing `HISTORY`.
  `loadHistory()` keeps returning the object shape the renderers read
  (`{ snapshots, traffic, attention }`), built from the database. So
  `downloadsTable()`, `archiveTraffic()`, `windowDownloads()` and the rest are
  unchanged. `updateHistory()` is removed, its 400-snapshot cap with it:
  `generate()` saves the run, then reads the whole record back, so the page
  shows exactly what was stored.
- **`lib/ga.mjs`**: `collectDownloadClicks()` adds the `date` dimension, so
  clicks can be stored per day. `clicksTable()` sums the days. An event count
  is additive, so the sum equals the old figure. Each GA result also carries
  `from` and `to`, the days it asked about, as local dates: the GA property's
  time zone is this machine's (Africa/Johannesburg, checked 2026-10-21).
- **`.claude/rules/stats-dashboard.md`** lists `lib/store.mjs` in its `paths`,
  and its rules change as §11 says.

### 4.2 Schema

```sql
CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
-- schema_version = '1'; history_json_imported = ISO time of the import

CREATE TABLE gh_snapshot (            -- one row per project per run
  at TEXT NOT NULL, slug TEXT NOT NULL,
  win INTEGER, mac INTEGER, linux INTEGER, other INTEGER, total INTEGER,
  stars INTEGER, forks INTEGER, issues INTEGER, prs INTEGER,
  PRIMARY KEY (at, slug));

CREATE TABLE gh_traffic (             -- GitHub's per-day buckets, merged
  slug TEXT NOT NULL, day TEXT NOT NULL,
  views INTEGER, uniques INTEGER, clones INTEGER, clone_uniques INTEGER,
  PRIMARY KEY (slug, day));

CREATE TABLE obs_snapshot (           -- one row per package per run
  at TEXT NOT NULL, slug TEXT NOT NULL, pkg TEXT NOT NULL,
  d1 INTEGER NOT NULL, d7 INTEGER NOT NULL, d30 INTEGER NOT NULL,
  PRIMARY KEY (at, pkg));

CREATE TABLE ga_daily (               -- site-wide, per GA date
  day TEXT PRIMARY KEY,
  active_users INTEGER NOT NULL, sessions INTEGER NOT NULL, views INTEGER NOT NULL);

CREATE TABLE ga_post_daily (day TEXT NOT NULL, path TEXT NOT NULL,
  views INTEGER NOT NULL, PRIMARY KEY (day, path));

CREATE TABLE ga_click_daily (day TEXT NOT NULL, path TEXT NOT NULL,
  clicks INTEGER NOT NULL, PRIMARY KEY (day, path));

CREATE TABLE ga_read (                -- every day each GA table was read
  tbl TEXT NOT NULL, day TEXT NOT NULL, PRIMARY KEY (tbl, day));

CREATE TABLE attention (key TEXT PRIMARY KEY, since TEXT NOT NULL);
```

`day` is `YYYY-MM-DD`. GitHub days are UTC, as `dayKey()` makes them. GA days
are in the GA property's time zone, as GA returns them. A NULL traffic column
means GitHub did not report that half for that day, as the JSON's missing key
did.

GA returns no row for a day or page with nothing to count. So a GA day listed
in `ga_read` for that table with no row is a zero; a day not listed is a gap.

### 4.3 Writing a run

`generate()` collects as now, then makes one `saveRun()` call, inside one
transaction:

- **GitHub:** one `gh_snapshot` row per project whose fetch succeeded
  (`r.ok`). Traffic rows are upserted column by column, so a clones-only
  bucket keeps its stored views.
- **openSUSE:** one `obs_snapshot` row per `collectObs()` result carrying
  `d1`, `d7` and `d30`. An `error`, `uncounted` or `shared` result writes
  nothing.
- **Google:** for each of `ga_daily`, `ga_post_daily` and `ga_click_daily`,
  the rows inside the window the run read are replaced by what GA returned,
  and each day of the window is added to `ga_read` for that table. Replacing
  rather than upserting drops a page GA no longer reports for a day. Days
  outside the window read keep their stored values. A GA call that failed
  writes nothing for that table, `ga_read` included.
- **Attention:** the table is replaced with the run's `history.attention`.

Nothing else is ever deleted.

### 4.4 Opening, importing and backing up

- **Open:** `.stats/stats.db`, created if absent, with `busy_timeout` set so
  a CLI run and the service wait for each other rather than fail.
- **Import:** when `meta` has no `history_json_imported` key and
  `history.json` exists, every snapshot, traffic bucket and attention key is
  copied in, in one transaction, and the key is set. `history.json` is left
  in place, unchanged, as a backup.
- **Backup:** after a successful write, if no backup exists for today (UTC),
  `VACUUM INTO .stats/backup/stats-<YYYY-MM-DD>.db`. Then the newest 14
  backups are kept and older ones deleted. A failed `VACUUM INTO` deletes
  nothing, and the run, already saved, carries on with a warning.
- **A store that cannot be opened or read stops the run** with an error
  naming the file. It never starts again from empty (§2 item 4).

### 4.5 The Trends tab

A seventh `NAV` entry, `["trend", "h-trend", "Trends"]`, last. Its accent
continues the teal-to-violet ramp after `rel`, per the colour rule. The tab
shows these charts, in this order, each one daily series:

| Chart | Series |
|---|---|
| GitHub downloads, all projects | the all-time total: sum over projects of `osTotal()` from each project's newest snapshot on or before the day, so a failed fetch is no drop |
| Repo views per day | sum of `views` over all repos |
| Repo clones per day | sum of `clones` over all repos |
| openSUSE downloads | sum of `d1` over packages, each from its last row that day; a day missing a package that has an earlier row is a gap |
| Site visitors per day | `ga_daily.active_users` |
| Blog views per day | sum of `ga_post_daily.views` |
| Download clicks per day | sum of `ga_click_daily.clicks` |

Each chart is drawn server-side by a new `lineChart()` in `stats.mjs`, as an
inline SVG, so it shows with JavaScript off:

- `role="img"` and an `aria-labelledby` pointing at a visible caption. The
  caption gives the latest value and the first and last dates.
- Axis labels in text ink, never the accent alone, so contrast meets WCAG AA
  on `--bg`.
- **A day with no value is a gap in the line, never a zero** (for GA days,
  §4.2 says which days are zeros).
- The y-axis starts at 0 and tops out at an even whole number, so the middle
  gridline's label is exact. A value with no neighbour is drawn as a dot.
- A GA chart starts at its series' first non-zero day. GA answers for days
  before tracking began (the blog read reaches back to the oldest post), and
  those days are unknown, not zero.
- **Today is left out** of every daily chart: a part-day reads as a drop.
- Under each chart, `<details><summary>Show the numbers</summary>` holds a
  table of every day plotted.
- The GA charts carry the existing floor-not-total caveat. The openSUSE chart
  says MirrorCache does not document what its last-day figure covers.

## 5. Invariants

Every invariant but INV-2 and INV-9 locks code this spec creates, so its test
cannot run yet.

- **INV-1** — The first open of a database with no import key copies every
  snapshot, traffic bucket and attention key from `history.json`, and
  `loadHistory()` then returns an object deep-equal to the JSON's
  `snapshots`, `traffic` and `attention`. A second open imports nothing.
  *Test:* `test/store.test.mjs`, "imports history.json once" — a fixture
  JSON with a clones-only bucket and two snapshots; the fixture isolates the
  import, since nothing else writes to a fresh database.
  *Breaks when:* a field is dropped (`cloneUniques`, `other`), or the import
  runs twice and duplicates snapshots.

- **INV-2** — No code writes, renames or deletes `.stats/history.json`.
  *Test:* `grep -c "writeFile(HISTORY" stats.mjs` → `1` today; `0` after this
  ships.
  *Breaks when:* any write to `HISTORY` survives the change.

- **INV-3** — A failed fetch is never stored. A row with `ok: false`, a
  `null` GA result and an errored openSUSE package each write no row.
  *Test:* `test/store.test.mjs`, "a failed fetch writes nothing" — one run
  with one failed and one good project; the failed slug has no `gh_snapshot`
  row.
  *Breaks when:* a failed project is stored with zeros.

- **INV-4** — Re-reading a GA day overwrites it; a day outside the read
  window keeps its value.
  *Test:* `test/store.test.mjs`, "GA days are overwritten, not added" — save
  days 1–3, then save days 2–3 with new values; day 1 keeps its first value,
  days 2–3 hold the second.
  *Breaks when:* rows are inserted rather than upserted, or older days are
  cleared.

- **INV-5** — Nothing caps history. 450 saved snapshots load as 450.
  *Test:* `test/store.test.mjs`, "no snapshot cap" — the fixture exceeds the
  old 400 cap, so it fails only if a cap exists.
  Also `grep -c "snapshots.length > 400" stats.mjs` → `0`.
  *Breaks when:* a cap is reintroduced in `stats.mjs`, in the store or in
  `loadHistory()`.

- **INV-6** — A store that cannot be read stops the run, and its bytes are
  unchanged afterwards.
  *Test:* `test/store.test.mjs`, "an unreadable store is never replaced" —
  write junk bytes to the database path, open it, expect a throw, compare the
  bytes.
  *Breaks when:* an open or read error falls back to an empty history.

- **INV-7** — A missing day draws a gap, never a zero.
  *Test:* `test/store.test.mjs`, "a missing day is a gap" — `lineChart()`
  with `[5, null, 7]` draws 5 and 7 as two dots, no line joining them, and no
  vertex at y = 0.
  *Breaks when:* `null` is coerced to `0`.

- **INV-8** — Every chart has a text alternative holding every plotted value.
  *Test:* `test/store.test.mjs`, "every point is in the table" — the number of
  table rows equals the number of non-null points.
  *Breaks when:* the table and the line are built from different series.

- **INV-9** — The database never reaches the public site. Trust boundary:
  the filesystem, between `.stats/` and `dist/`. Nothing the site build runs
  names the store.
  *Test:* `grep -l "store.mjs\|stats.db\|node:sqlite\|\.stats" build.mjs
  local-CI.sh .github/workflows/deploy.yml` → no output (exit 1).
  *Breaks when:* the build imports `lib/store.mjs` or copies `.stats/`.

- **INV-10** — At most one backup per UTC day, and only the newest 14 are
  kept. A failed backup deletes nothing.
  *Test:* `test/store.test.mjs`, "backups rotate" — 16 dated backup files
  plus a run leave the newest 14; a run whose `VACUUM INTO` fails leaves
  all 16.
  *Breaks when:* rotation runs before the new backup is confirmed.

## 6. Failure modes

- **`node:sqlite` missing** (Node older than 22.13.0): the stats run
  stops with Node's import error. The site build does not import the store
  (INV-9) and is unaffected.
- **Database locked** by a second run: `busy_timeout` waits; if it expires,
  the run fails and writes nothing. The next run catches up, since GitHub
  keeps traffic for 14 days and GA and MirrorCache are re-read.
- **Database corrupt:** the run stops (INV-6). The user restores the newest
  file from `.stats/backup/`.
- **Disk full during a write:** the transaction rolls back; the database keeps
  the previous run.
- **`history.json` unreadable on first open:** the import fails, the key is
  not set, and the run stops naming the file. A database never starts empty
  while an unreadable history file exists.
- **MirrorCache changes its API:** `collectObs()` already returns an error
  row; no `obs_snapshot` row is written and the chart shows a gap.

## 7. Tests

`test/store.test.mjs`, run by `npm test` (`node --test test/*.test.mjs`) in
the pre-push gate. Each test uses a database in a fresh temporary directory,
never `.stats/`. It locks INV-1, INV-3, INV-4, INV-5, INV-6, INV-7, INV-8 and
INV-10, one test each, named in §10. INV-2 and INV-9 are the grep commands in
§5. Each test must be seen failing against a stub
store before the real one is written.

## 8. Alternatives considered (and rejected)

- **Keep `history.json` and add keys to it.** The file is rewritten whole on
  every run, so one bad write loses everything (§2 item 4). It is already
  over a megabyte and only grows.
- **The `better-sqlite3` package.** It is a native dependency to build and
  keep at latest. `node:sqlite` does the same with nothing installed.
- **A chart library.** It would be a client-side dependency to copy into
  `.stats/`, and would draw nothing with JavaScript off. Inline SVG follows
  `sparkline()`.
- **Storing GA rankings (top pages, sources, countries).** They are 28-day
  windows, not days, so they would chart badly. Google keeps them.

## 9. Out of scope

- Storing GA's top pages, sources, countries and 28-day totals — deferred;
  not yet queued.
- Replacing `sparkline()` in the downloads table with the new charts — not
  queued.
- Feeding stored history to the weekly digest (`scripts/week-digest.mjs`) —
  not queued.

## 10. What checks this

| Rule | What catches a breach |
|------|----------------------|
| INV-1 | `test/store.test.mjs` "imports history.json once" |
| INV-2 | **nothing** automatic — the grep in §5, run by hand |
| INV-3 | `test/store.test.mjs` "a failed fetch writes nothing" |
| INV-4 | `test/store.test.mjs` "GA days are overwritten, not added" |
| INV-5 | `test/store.test.mjs` "no snapshot cap" |
| INV-6 | `test/store.test.mjs` "an unreadable store is never replaced" |
| INV-7 | `test/store.test.mjs` "a missing day is a gap" |
| INV-8 | `test/store.test.mjs` "every point is in the table" |
| INV-9 | **nothing** automatic — the grep in §5, run by hand |
| INV-10 | `test/store.test.mjs` "backups rotate" |
| WCAG AA contrast on charts | **nothing** automatic — checked by hand at build time, per `CLAUDE.md` § Accessibility |

## 11. Cross-doc impact

- `.claude/rules/stats-dashboard.md`: rewrite the GA rule to *stored per day,
  overwritten on re-read*; the history rule to name `.stats/stats.db`, no cap,
  and daily backups; the failed-fetch rule to say *kept out of the store*; add
  `lib/store.mjs` to `paths`. That file is a contract (global rule 14); it is
  gated with this spec.
- `docs/history/claude-md.md`: the GA rule's reason gains a dated line saying
  it was reversed and why.
- `CLAUDE.md` § Private stats dashboard: name `.stats/stats.db` beside the
  existing privacy points.
- Lines saying `npm test` covers only the stats server's port handling now
  also cover the store: `grep -rn "npm test" CLAUDE.md .claude/rules
  docs/history local-CI.sh` lists them.
- The Node floor rises to 22.13.0 in every home `docs/DEPENDENCY_POLICY.md`
  names for it.
- `CHANGELOG.md` `[Unreleased]`: one line.

## 12. Cold-eyes loop log

Rows live in `../reviews/APHW-0029-stats-history-database-loop-log.md`.

## 13. Resource cost

- **No new dependency.** `node:sqlite` ships with Node.
- **Growth:** one `gh_snapshot` row per project per run, one `obs_snapshot`
  row per package per run, one row per day elsewhere. No cap, by the user's
  ask. A size check is out of scope until the file is measured large.
- **Backups:** 14 copies of the database.

## 14. Migration / compatibility

§4.4's import is the migration. `history.json` stays as the pre-migration
backup. Rolling back means reverting the commit: the old code reads the
untouched `history.json` and misses only the runs since.
