---
paths:
  - "stats.mjs"
  - "serve.mjs"
  - "lib/ga.mjs"
  - "lib/port.mjs"
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
  behaviour (a bad value still falls back) and must not change. **The tray reads the port
  from the *unit's* environment** (`systemctl --user show ants-stats -p Environment`), never
  from its own. `LWSM_MANAGED=1` drops the icon and logs to stdout instead — a presentation
  hint only, never a reason to grant or skip anything.

- **Google Analytics is read, never written, and never snapshotted.** The "Site visitors"
  section calls the GA4 Data API through `lib/ga.mjs` at render time and keeps nothing. A GA
  failure returns `null` and renders as "could not be read" — never as zeros, and never
  enough to abort the run; the GitHub half of the page still builds. The section also states
  in plain words that opt-in tracking makes every figure a floor rather than a total.

- **A failed fetch is never recorded as zero.** Rate-limited or errored projects are shown
  as "no data", excluded from totals, and kept out of `.stats/history.json`. Keep this
  discipline in new metrics.

- **The token is resolved per run, never once per process.** `resolveAuth()` in
  `lib/github.mjs` re-checks while unauthenticated and caches success; `generate()` calls it
  first, and `serve.mjs` waits for a login before its startup run rather than firing blind.
  `hasToken`/`tokenSource` are `export let` **on purpose**. Don't turn them back into `const`.

- **Authentication is effectively required, but automatic.** `lib/github.mjs` resolves a
  token from `GITHUB_TOKEN`, else from `gh auth token` — so a developer already logged into
  the GitHub CLI needs no setup, and local `node build.mjs` runs authenticated too. If a
  token is ever suggested, it is classic scope `public_repo`, **not** full `repo`. With
  neither, the run degrades: traffic is skipped.

- **History is append-only and local.** Download totals are stored as dated snapshots;
  traffic is merged as per-day buckets.

- **`.stats/` must stay self-contained.** `src/assets/style.css` is *copied* in as
  `site.css`, not linked. Any new asset the page references gets copied in and added to
  `FILES` too. The body class is `admin`, **not** `stats`.

- **Colour on the dashboard is wayfinding, not data.** Each section owns an `--accent`
  (teal → violet down the page) shared with its nav link, and the OS columns are tinted
  blue/magenta/green. Those hues deliberately sit clear of the status language — amber means
  "look at this", teal "up", rose "down". Figures stay in text ink.

- **The sticky nav is progressive enhancement too.** The links are ordinary anchors that
  work without JavaScript; `dashboard.js` only adds the scroll-spy.

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

