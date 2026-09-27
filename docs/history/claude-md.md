# Why CLAUDE.md says what it says

`CLAUDE.md` states what is true now and what a breach looks like. The
arguments that settled those rules live here, so the instructions stay short
without losing the reasoning.

Each heading names the `CLAUDE.md` section and the opening words of the rule
it explains. A reason `CLAUDE.md` still states is not repeated here.

## Architecture: "`src/about/<slug>.md` — the hand-written About section"

Until 2026-08-20 a project page rendered that project's GitHub README in the
About slot. A README opens with badges and build flags, buries what the thing
does, and changed the page shape whenever the repo was edited. Hand-written
`src/about/<slug>.md` files replaced it.

## Key behaviours: "A release with no notes falls back to the repo's `CHANGELOG.md`"

Measured 2026-08: 24 of 180 releases across the site's projects were cut with
an empty body, including every OneUp release then published. Without the
fallback the changelog page read "shipped without written notes" over and over.

## What this is: "`assets/dates.js` — rewrites a release date"

A build on a CI runner cannot know a visitor's locale. The page therefore
ships `2026-08-19` — unambiguous, and it sorts. `assets/dates.js` asks
`navigator.languages` and upgrades only what a human reads.

## Key behaviours: "Demo videos are native `<video controls>`"

Unrequested motion is a barrier. `preload="none"` plus a poster means a
visitor who does not press play downloads nothing.

The screencasts are silent, so the visible caption *is* the accessible
alternative under WCAG 1.2.1. That is why it is required rather than
decorative.

## Key behaviours: "Analytics is opt-in, and the measurement ID has exactly one home"

A cookie recording that you refused cookies is its own punchline. A visitor
who never accepted therefore has no Google cookie at all.

## Key behaviours: "`/privacy/` and `analytics.js` are one fact written twice"

The page says in English what the script does in code, and English is the half
no compiler checks. `assertAnalyticsContract()` exists so a privacy notice
cannot quietly become a lie.

## Key behaviours: "An About page's claim to be unpublished must stay true"

Slipcase's About page said the project had no download after it had shipped one. Nothing
caught it; a person reading the site did, and the fix was commit 6ab16ab.

Only the contradiction a machine can see is checked. Reading prose for truth is the
weekly post's fact-checker, which needs a digest; an About page has none.

The check warns in the build and fails in `local-CI.sh` because the daily rebuild exists
to keep release notes fresh. Stopping it over a stale sentence would cost the whole
site's freshness to report one page's drift.

## Changelog: "The site deploys continuously, so dated sections stand in for versions"

`CHANGELOG.md` said from the start that dated sections stand in for versions, and nothing
closed one, so every entry accumulated under `[Unreleased]`. The weekly post already runs
on a timer and already commits, so it closes the section too — a cadence that exists
beats one that must be remembered.

## Key behaviours: "Download links point at matched release assets per OS"

Several companion files carry an OS name, and GitHub lists assets
alphabetically, so `foo-windows.cdx.json` would sort ahead of `foo.exe` and
become the Windows download.

## Architecture: "`lib/github.mjs` — shared GitHub I/O"

If `build.mjs` and `stats.mjs` kept separate matchers and they drifted, the
private dashboard would report download numbers the public site does not show.

## Private stats dashboard: "`tray/ants-stats-tray.py` is an optional PySide6 tray icon"

A tray icon needs a desktop toolkit, and the Node route to one is Electron.

## Private stats dashboard: "The privacy model is "it is never published", and nothing weaker works"

This is a static site on public GitHub Pages. Anything in `dist/` is
world-readable. A password box would be defeated by View Source, because the
numbers are already in the page, and a secret URL is only as secret as the
URL. Being unpublished is the only privacy model that works here.

## Private stats dashboard: "The port is `PORT` → `STATS_PORT` → 4321"

Binding 4321 after an unusable `PORT` would look healthy while nothing reached
it. `STATS_PORT` keeps its older lenient behaviour because that path predates
the rule.

## Private stats dashboard: "The tray reads the port from the *unit's* environment"

The server is started by systemd, so an override via a drop-in never reaches
the tray's own environment. A tray that guessed would open a dead port while
the server was fine.

## Private stats dashboard: "The token is resolved per run, never once per process"

`gh` keeps the token in the desktop keyring, which is still locked when the
service starts at boot. A token resolved at import would leave a long-lived
server permanently unauthenticated — traffic blank, every run capped at 60
calls an hour, even after a manual refresh hours later.

## Private stats dashboard: "Authentication is effectively required, but automatic"

A full run needs roughly 90 API calls against an unauthenticated ceiling of 60
an hour, and the traffic endpoints need push access or return 403. If a token
is ever suggested it is classic scope `public_repo`, never full `repo`: every
site repo is public, and `repo` would also grant control of the owner's
private ones.

## Private stats dashboard: "Google Analytics is read, never written, and never snapshotted"

Unlike GitHub's 14-day traffic window, Google retains the history itself, so a
local copy would only be a second version able to drift from the first.

The section states in plain words that opt-in tracking makes every figure a
floor rather than a total, because a number carrying no such caveat gets read
as the whole truth.

## Private stats dashboard: "A failed fetch is never recorded as zero"

A false zero poisons every future delta. The same discipline produced the
weekly digest's literal "could not be read".

## Private stats dashboard: "`.stats/` must stay self-contained"

A relative path to `../src/assets/style.css` resolves when the file is opened
from disk but 404s when `serve.mjs` serves it, silently dropping every colour
and font to browser defaults.

The dashboard body class is `admin` because the site's own `.stats` rule is a
flex container and would wreck the layout.

## Private stats dashboard: "Colour on the dashboard is wayfinding, not data"

The OS column tints sit clear of the status language — amber means "look at
this", teal "up", rose "down" — so a tinted column can never read as a
warning.

## Private stats dashboard: "Sorting is progressive enhancement"

Rendered text carries thousands separators, `d` suffixes and a delta line.

The stored sort key is the table's `data-table` name and never its position,
so inserting a section cannot transplant one table's preference onto another.
Every `localStorage` access is wrapped because it throws outright in some
privacy modes and on a `file://` page — forgetting the sort is a far better
failure than a dashboard that does not render. Refresh re-renders from a fresh
run, so without this the reader's chosen order was thrown away every time.

## Weekly blog post: "Three stages, and the split is the point"

The digest is where the token saving lives: the writer reads one compact file
instead of hundreds of commits. The reviewer never saw the writing, so its
checks are independent.

---

Rules live in [`../../CLAUDE.md`](../../CLAUDE.md).
