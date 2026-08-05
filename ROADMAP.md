<!-- ants-roadmap-format: 1 -->
# Ants Projects Hub — Roadmap

> **What this is:** the planned work for
> [antsprojectshub.co.za](https://antsprojectshub.co.za) and its private
> stats dashboard. Shipped work leaves this file and lands in
> [CHANGELOG.md](CHANGELOG.md).
>
> **Format:** Ants roadmap spec v1.1. Every actionable bullet carries a
> stable `APHW-NNNN` ID and the full field set — `Layman:`, `Kind:`,
> `Source:`, `Priority:`, `Lanes:`. **ID is identity, position is
> priority:** items are worked top-to-bottom within a section, whatever
> their numbers say. IDs are append-only and never reused.

**Legend**

- ✅ Done (shipped) · 🚧 In progress · 📋 Planned · 💭 Considered

**Themes**

- 🎨 Features · ⚡ Performance · 🖥 Platform & accessibility
- 🔒 Security · 🧰 Dev experience · 📚 Documentation
- 📦 Packaging · 🐛 Bug fixes · 🧹 Cleanup / debt · 🔍 Findings fold-in

**Priority bands**

- `1` CRITICAL · `2` HIGH · `3` MEDIUM · `4` LOW · `5` someday-maybe

---

## P01 — Dashboard readability (target: 2026-08)

**Theme:** make the private stats page easy to read at a glance. Today it
prints a lot of ink that carries no information — 52 `±0` markers and 11
flat sparklines on the 2026-08-03 page — and a lot of type below 12px.
Nothing here changes what is measured, only what the eye lands on.

### 🖥 Platform & accessibility

- ✅ [APHW-0001] **Raise the dashboard's minimum text size to ~0.8rem.**
  The delta lines and repo slugs are `.74rem` (`.d`, `.repo` in the CSS
  block of `stats.mjs:900` and `stats.mjs:898`), the `pre` / `archived`
  badges `.68rem` (`stats.mjs:916`) and the tile labels `.75rem`
  (`stats.mjs:860`) — roughly 11–12px. Nothing on the page is dense
  enough to need type that small, and the site owner is partially
  sighted, so this is a hard requirement rather than a preference. Raise
  the floor and let the page get taller; re-check contrast on
  `--text-dim` at the new sizes.
  **Layman:** Make the small print on the stats page big enough to read
  comfortably.
  Kind: accessibility.
  Source: in-session-2026-08-03.
  Priority: 2.
  Lanes: dashboard-css.
  Resolved (2026-08-05): floor raised to .8rem — .tile__label,
  .tbl thead th, .repo, .d and .flag; inline `code` to .95em. Contrast
  re-checked on --text-dim: 6.65:1 plain row, 6.20:1 striped, 5.20:1
  hovered (AA needs 4.5:1).

- ✅ [APHW-0004] **Give wide tables somewhere to scroll on a narrow
  screen.** "Audience & activity" is nine columns and the CSS has no
  horizontal-overflow rule anywhere — the only concession to small
  screens is a font-size drop at 720px (`stats.mjs:926`). On a phone or
  a half-width window the table simply crushes. Wrap each table in a
  scrollable container so the columns keep their width and the container
  scrolls instead. Keep the wrapper keyboard-reachable (`tabindex="0"`
  plus a label) so a scrollable region isn't mouse-only.
  **Layman:** Stop the widest tables from squashing on a small screen —
  let them slide sideways instead.
  Kind: ux.
  Source: in-session-2026-08-03.
  Priority: 3.
  Lanes: dashboard-css.
  Resolved (2026-08-05): scrollTable() wraps all four tables in a
  .tbl-scroll region (tabindex="0", role="region", aria-label); .tbl gets
  a 40rem floor so columns keep their width, .tbl--rel opts out. Captions
  are capped to the visible width and pinned left so prose still wraps to
  the screen — caught by the 390px capture, which showed them scrolling
  out of view on the first pass.

- ✅ [APHW-0005] **Make the row highlight visible enough to track a row
  across nine columns.** `.tbl tbody tr:hover` is
  `rgba(255,255,255,.03)` (`stats.mjs:885`) — a 3% wash that is
  effectively invisible. Tracking one project from its name across to
  its last-commit age is exactly when a row highlight earns its keep.
  Turn the hover up to something legible and consider faint zebra
  striping so rows stay separable without hovering. Both must stay clear
  of the amber/teal/rose status language so a highlighted row can never
  read as a warning.
  **Layman:** Make the row you're pointing at actually light up, so your
  eye doesn't slip a line on the wide tables.
  Kind: accessibility.
  Source: in-session-2026-08-03.
  Priority: 3.
  Lanes: dashboard-css.
  Resolved (2026-08-05): hover raised from 3% to 9% and faint 2.8%
  striping added. Layered as a background-image so the OS column tints
  (cell background-colours) show through rather than being painted over —
  measured on the render: an even row lifts 22,22,25 → 29,29,31 in a plain
  column and keeps its magenta bias in a tinted one. Neutral white, clear
  of the status language.

### 🎨 Signal over noise

- ✅ [APHW-0002] **Show nothing instead of `±0` when a figure hasn't
  moved.** `delta()` (`stats.mjs:276`) prints a `±0` span for every
  unchanged number: 52 of them on the current page. It doubles the
  height of every table row and buries the handful of real movements
  (finbreak's ▲+6). Return an empty string for the flat case and let the
  changes stand alone. Same reasoning as the blank OS cells shipped on
  2026-08-03 — a symbol for "nothing happened" is noise, not data. Keep
  the arrows and signs on real deltas: they must stay readable without
  colour.
  **Layman:** Hide the "±0" under every number that didn't change, so the
  ones that did change jump out.
  Kind: enhancement.
  Source: in-session-2026-08-03.
  Priority: 3.
  Lanes: stats.mjs.
  Resolved (2026-08-05): delta() returns "" for the flat and
  no-baseline cases; a new deltaLine() owns the <br> so an unchanged
  figure leaves no empty second line. 54 ±0 markers on the page → 0, and
  the real-delta path is unchanged (verified directly: delta(11,5) still
  renders ▲ +6).

- ✅ [APHW-0003] **Draw no sparkline when the series never moved.**
  `sparkline()` (`stats.mjs:284`) already returns nothing for a series
  shorter than two points, but a series of identical values still draws
  a dead-flat line — 11 of the 13 rows on the current page. A flat line
  looks like a measurement when it is really an absence. Return empty
  when min equals max, matching the blank-cell rule.
  **Layman:** Don't draw a flat trend line for projects whose numbers
  never changed — leave the space empty.
  Kind: enhancement.
  Source: in-session-2026-08-03.
  Priority: 3.
  Lanes: stats.mjs.
  Resolved (2026-08-05): sparkline() returns "" when min === max.
  13 lines on the page → 2, matching the 11 flat series the bullet
  counted. The `|| 1` span guard went with it — unreachable once min and
  max must differ.

### 🧹 Cleanup / debt

- ✅ [APHW-0006] **Tables ask for rounded corners and render square.**
  `.tbl` sets both `border-collapse: collapse` and `border-radius`
  (`stats.mjs:864`), and collapse defeats the radius — so the tables sit
  square-cornered next to round-cornered tiles and notes. Either drop
  the radius or switch to `border-collapse: separate` with
  `border-spacing: 0` and clipped corners. Cosmetic only; no numbers
  change.
  **Layman:** The tables are meant to have rounded corners but don't —
  make them match the rest of the page.
  Kind: fix.
  Source: in-session-2026-08-03.
  Priority: 4.
  Lanes: dashboard-css.
  Resolved (2026-08-05): .tbl switched to border-collapse: separate
  with border-spacing: 0 and overflow: hidden, so the radius survives;
  the last body row drops its bottom border where no tfoot follows, to
  stop it doubling against the table border. Confirmed on the render.

---

## P02 — What the numbers actually say (target: TBD)

**Theme:** the dashboard reports totals since forever and a 14-day
window it doesn't own. Both hide the thing worth knowing — whether
anything is picking up. The stored history already supports better
answers than the page asks of it.

### 🎨 Features

- 📋 [APHW-0007] **Surface the archived visitor history the dashboard is
  already collecting.** `updateHistory()` (`stats.mjs:188`) merges
  GitHub's daily traffic buckets into `.stats/history.json` precisely
  because GitHub deletes them after 14 days — and as of 2026-08-03 that
  archive holds 18–20 days per project going back to 2026-07-13, i.e.
  a week of data GitHub itself has already thrown away. Nothing on the
  page ever reads it: `trafficSection()` (`stats.mjs:381`) shows only
  the live 14-day figures. Add a view over the archive — a per-project
  trend, or "this fortnight vs the one before". Keep the "a failed fetch
  is never a zero" discipline: a day with no bucket is a gap, not a
  zero.
  **Layman:** You're quietly saving visitor numbers that GitHub deletes
  after two weeks, but the page never shows them. Put them on screen.
  Kind: feature.
  Source: in-session-2026-08-03.
  Priority: 2.
  Lanes: stats.mjs, dashboard-css.

- 📋 [APHW-0008] **Report downloads for a recent window, not just
  all-time.** Every download figure on the page is cumulative since the
  first release, so "finbreak: 23" can't distinguish a steady trickle
  from a dead project that had a good week in June. The dated snapshots
  in `.stats/history.json` (28 of them as of 2026-08-03) make "downloads
  in the last 7 / 30 days" straightforward to derive. Show it beside the
  all-time figure, and say plainly when the history is too short to fill
  the window rather than reporting a small number as if it were the
  answer.
  **Layman:** Add "downloads in the last week / month" next to the
  all-time totals, so you can tell what's picking up.
  Kind: feature.
  Source: in-session-2026-08-03.
  Priority: 2.
  Lanes: stats.mjs.

- 📋 [APHW-0009] **Rank "Needs attention" by how much it costs you.**
  `issuesSection()` (`stats.mjs:462`) emits one flat list, so "MAME
  Curator's download buttons fall back to the repo page" sits at the
  same weight as "Vestige Engine has no screenshots". The first is
  losing downloads today; the second is a nice-to-have. Split into
  broken-now versus incomplete, each with a count, and order within the
  list by severity. Colour must not be the only cue — the grouping and
  the wording carry it.
  **Layman:** Sort the "needs attention" list so the things actually
  costing you downloads sit above the cosmetic ones.
  Kind: enhancement.
  Source: in-session-2026-08-03.
  Priority: 3.
  Lanes: stats.mjs.

---

## How to add an item

Prefer the MCP verb — it allocates the ID, formats the bullet and writes
it atomically:

```
roadmap_log op:append section:<slug> status:planned
            headline:"…" kind:… source:… layman:"…"
```

By hand:

1. Allocate the next ID:
   ```bash
   echo $(($(cat .roadmap-counter) + 1)) > .roadmap-counter
   printf "APHW-%04d\n" $(cat .roadmap-counter)
   ```
2. Insert it at the **position** it should be tackled, not at the end —
   position is priority.
3. Set the status emoji (📋 Planned, 💭 Considered).
4. Write every field: `Layman:`, `Kind:`, `Source:`, `Priority:`, and
   `Lanes:` where ownership is known.
5. Use a **dated** `Source:` (`user-YYYY-MM-DD`, `in-session-YYYY-MM-DD`,
   `audit-YYYY-MM-DD`, …) — it is the item's created date and survives
   archive rotation.

`.roadmap-counter` is a per-machine cache, not source: it is gitignored,
and its true value is the highest ID across `ROADMAP.md` and
`CHANGELOG.md`.
