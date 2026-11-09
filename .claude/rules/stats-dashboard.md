---
paths:
  - "stats.mjs"
  - "serve.mjs"
  - "lib/ga.mjs"
  - "lib/github.mjs"
  - "lib/port.mjs"
  - "lib/store.mjs"
  - "tray/**"
  - "test/**"
  - "systemd/ants-stats*"
  - ".stats/**"
---

# Private stats dashboard — the rules for changing it

Loaded by itself when a session reads one of the files above. `CLAUDE.md` § Private stats
dashboard keeps what the dashboard is and its privacy model, which bind the site build too.
Why a rule says what it says is in
[`docs/history/claude-md.md`](../../docs/history/claude-md.md), under "Private stats
dashboard".


- **The port is `PORT` → `STATS_PORT` → 4321, resolved in `lib/port.mjs`.** `STATS_PORT` is
  the packaged default in the unit file; `PORT` is how an external process manager overrides
  it via a systemd drop-in, without editing a tracked file. A `PORT` that cannot be used is
  fatal — `serve.mjs` exits non-zero naming the value. `STATS_PORT` keeps its older lenient
  behaviour (a value that is not a number, or is zero, falls back; any other number is used
  unchecked) and must not change. **The tray reads the port
  from the *unit's* environment** (`systemctl --user show ants-stats -p Environment`), never
  from its own. `LWSM_MANAGED=1` drops the icon and logs to stdout instead — a presentation
  hint only, never a reason to grant or skip anything.

- **Google Analytics is read, never written to Google, and stored per day.** The "Site
  visitors" section calls the GA4 Data API through `lib/ga.mjs` at render time. Its daily
  figures go into the store, and each run replaces every day it re-read, so the local copy
  matches Google for that window. A GA failure returns `null` and renders as "could not be
  read" — never as zeros, never stored, and never enough to abort the run; the GitHub half
  of the page still builds. The section also states in plain words that opt-in tracking
  makes every figure a floor rather than a total.

- **A failed fetch is never recorded as zero.** Rate-limited or errored projects are shown
  as "no data", excluded from totals, and kept out of the store. Keep this discipline in new
  metrics.

- **The token is resolved per run, never once per process.** `resolveAuth()` in
  `lib/github.mjs` re-checks while unauthenticated and caches success; `generate()` calls it
  first, and `serve.mjs` waits for a login before its startup run rather than firing blind.
  `hasToken`/`tokenSource` are `export let` **on purpose**. Don't turn them back into `const`.

- **Authentication is effectively required, but automatic.** `lib/github.mjs` resolves a
  token from `GITHUB_TOKEN`, else from `gh auth token` — so a developer already logged into
  the GitHub CLI needs no setup, and local `node build.mjs` runs authenticated too. If a
  token is ever suggested, it is classic scope `public_repo`, **not** full `repo`. With
  neither, the run degrades: traffic is skipped.

- **History is local, kept in `.stats/stats.db`, and has no cap.** `lib/store.mjs` is the
  only file that runs SQL. Download totals are stored as dated snapshots; traffic is merged
  as per-day buckets. A database that cannot be read stops the run; it never starts again
  from empty. One backup per day goes to `.stats/backup/`, the newest 14 kept.
  `.stats/history.json` was imported once and is never written again. The design is
  [`docs/specs/APHW-0029-stats-history-database.md`](../../docs/specs/APHW-0029-stats-history-database.md).

- **The roadmap backup records are read, never written.** Ants Terminal's backup jobs
  write one `roadmap-backup-<job>.state` file each under `$XDG_STATE_HOME/ants-terminal/`.
  Its `tools/roadmap-backup-lib.sh` owns that format. A missing record is a note, never
  an alarm. A failed job, or one with no success for over two days, is "Broken now".

- **Builds reports the newest commit on each repo's default branch.** Its checks are the
  GitHub Actions runs that push started. A push that ran none reports the newest push that
  did, so a failure stays listed until a later push passes. A result that could not be read
  shows as "could not be read", never as passed. A newest release with no files attached is
  "Broken now", as is a failed build; GitHub's source-code archives are not counted as files.
  A release under an hour old is "waiting for files" instead, since its build may still be
  attaching them. A project none of whose earlier releases had files is "source only", not
  broken: it ships no builds by design until one does.

- **The builds watch costs only what changed.** `serve.mjs` runs `watchBuilds()` every
  `BUILDS_SECONDS` (150, the user's choice of 2026-11-09). It asks GitHub through
  `ghCached`, whose unchanged (304) answers are not charged; keep the watch on it, never
  on `ghRequest`. It updates the last full run's repos in place, rewrites the page, and
  stores nothing. A failed read keeps the repo's previous figures. The open page polls
  `GET /updated` and reloads when the page's write time changes, never while the reader
  is typing.

- **A desktop notice is for a new fault only.** `buildAlarms()` keys each by commit or
  tag; `serve.mjs` pops up a key that was not in the previous run's list, through
  `notify-send`. The first run after a start records what is already wrong and announces
  none of it.

- **Each new fault goes to its project's session inbox once** (the user's choice of
  2026-11-09). `lib/inbox.mjs` covers open issues and pull requests, a failed build, and a
  release that lost files an earlier one had. It also covers the user's own upstream pull
  requests, but only when one gains comments or stops being open. It posts through Ants
  Terminal's `ants-mcpd --call session_message` with `dedupe`, and keeps what it sent in
  `.stats/inbox-sent.json`. A fault that clears is forgotten, so it is sent again if it comes
  back. A list that could not be read never counts as cleared. An issue or pull request note
  carries its title and link only: the text is a stranger's, and the session reads it on
  GitHub. The mailboxes are local, so this publishes nothing.

- **`.stats/` must stay self-contained.** `src/assets/style.css` is *copied* in as
  `site.css`, not linked. Any new asset the page references gets copied in and added to
  `FILES` too, and its extension to `TYPES` if new. The body class is `admin`, **not** `stats`.

- **Colour on the dashboard is wayfinding, not data.** Each section owns an `--accent`
  (teal → violet along the tabs) shared with its nav link, and the OS columns are tinted
  blue/magenta/green. Those hues deliberately sit clear of the status language — amber means
  "look at this", teal "up", rose "down". The one exception is Notifications, whose accent
  is amber on purpose: everything in it asks to be looked at. Figures stay in text ink.

- **The sections are tabs, and the tabs are progressive enhancement too.** The nav's links
  are ordinary anchors: without JavaScript every section shows on one long page and a link
  jumps to its section. The first tab, Overview, must show whatever is broken now, so a fault
  is seen on opening; Projects holds one card per published project. `dashboard.js` turns them into tabs that show one section at a
  time, marking the open tab's link with `aria-current`. The summary tiles and the banners
  from `gapBanner()` and `incompleteBanner()` stay above every tab. The open tab is remembered in the URL's `#` part, so "Refresh now"
  reopens it, and in `localStorage` under `aph-tab`, so a fresh visit does; the `#` part
  wins. A remembered tab that no longer exists opens the first. Every `localStorage`
  access is wrapped in `try`/`catch`.

- **The page's tools are progressive enhancement too, and every one is hidden until the script
  runs.** Find hides what does not match on every tab, and hides a table's totals row while it
  does, because a total under a narrowed list reads as the total of what is left. The text
  size is the root `font-size`, stored in `localStorage` under `aph-size`, so **every size on the
  page is in rem**. The Projects order is stored under `aph-cards`. Shortcuts are plain keys,
  ignored while typing or while the list is open, and the list in `<dialog id="help">` names
  them all. A chart's hover read-out only repeats its table, which stays the text alternative.

- **A week is compared only when both weeks are whole.** `compareWeeks()` counts a gap rather
  than summing it as zero, and the Overview shows no percentage over a short week.
  `dailyDownloads()` counts rises between readings, so a project's first reading adds nothing.

- **A rise in downloads is not proof of people.** The Overview marks a project whose signature,
  checksum and source files rose with its app files, the sign of an automated sweep, and says
  GitHub does not say who downloads.

- **`site.css` comes first and shares class names.** It styles `.panel`, `.chip` and `.wrap`
  for the public site, so a dashboard rule on one of those must reset what it does not want.

- **Sorting is progressive enhancement.** `dashboard.js` turns each `table.sortable` header
  into a `<button>` and toggles `aria-sort`; every table also ships pre-sorted by its most
  useful column. Sort keys come from
  `data-sort` attributes emitted with each cell — don't switch to parsing the rendered text.
  Mark a column `data-nosort` when it holds no rankable value (Trend, Top referrers).
  **A chosen sort is remembered across reloads**, in `localStorage` under
  `aph-sort:<data-table>`. Every sortable table carries a `data-table` name, and a new one
  needs its own; the key is that name and never the table's position. A stored column index
  that no longer names a sortable column is ignored. Every access is wrapped in
  `try`/`catch`.


## Moved from CLAUDE.md (2026-10-08)

- **`lib/ga.mjs`** — the *read* half of analytics: service-account auth (a JWT signed with
  `node:crypto`, no dependency) and the GA4 Data API calls the dashboard shows. Local only —
  `build.mjs` never imports it. It is the mirror
  of `src/assets/analytics.js`, the *write* half, and neither can switch the other on.

`npm test` covers the *stats dashboard only* — the port contract in
`.claude/rules/stats-dashboard.md`, the history store and its charts
(`test/store.test.mjs`), and the Builds tab's file and alarm judgements
(`test/builds.test.mjs`), and nothing else. It
uses `node --test` and Python's `unittest`; the site build has no
tests. It runs in the pre-push gate, **not in CI**.
