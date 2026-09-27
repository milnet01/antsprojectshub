# Why CLAUDE.md says what it says

`CLAUDE.md` states what is true now and what a breach looks like. The
arguments that settled those rules live here, so the instructions stay short
without losing the reasoning.

Each heading names the `CLAUDE.md` section and the opening words of the rule
it explains, as read, with markup and line breaks stripped. A reason
`CLAUDE.md` still states is not repeated here.

A list headed "Moved verbatim from CLAUDE.md" holds clauses cut out of that
rule, word for word, when all of its "why" moved here.

## Build & preview: "local-CI.sh is the build"

Moved verbatim from CLAUDE.md on 2026-09-27:

- they cannot run locally

## Build & preview: "The push hook runs it"

Until 2026-09-27 this rule said the hook "skips the gate for a push it takes to
be documentation only" and "Its default guess counts every `*.md`". Neither was
true then. The hook only chooses a documentation mode, which `local-CI.sh`
lacks. Since `~/.claude` commit f071667 the hook has no default glob either.
Without the glob set, a documentation mode added later could skip the About pages or
the posts.

Moved verbatim from CLAUDE.md on 2026-09-27:

- Git config is never committed, so

## Build & preview: "The build authenticates with GITHUB_TOKEN if set"

Moved verbatim from CLAUDE.md on 2026-09-27, and the instruction written
afresh, because the sentence had no verb without its reason:

- Authentication avoids GitHub API rate limits: `GITHUB_TOKEN` if set (CI
  passes the Actions token automatically), otherwise the GitHub CLI's login
  via `gh auth token`.

## Build & preview: "npm test covers the stats server only"

Moved verbatim from CLAUDE.md on 2026-09-27:

- so it adds no dependency
- the tray half needs PySide6, which the deploy runner does not have, and the
  deploy workflow deliberately touches nothing under `.stats/`

## Architecture: "src/about/<slug>.md — the hand-written About section"

Until 2026-08-20 a project page rendered that project's GitHub README in the
About slot. A README opens with badges and build flags, buries what the thing
does, and changed the page shape whenever the repo was edited. Hand-written
`src/about/<slug>.md` files replaced it.

## Architecture: "lib/about.mjs — reads and renders src/about/*.md"

Moved verbatim from CLAUDE.md on 2026-09-27:

- this is our own copy, so an internal link stays internal

## Architecture: "lib/github.mjs — shared GitHub I/O"

If `build.mjs` and `stats.mjs` kept separate matchers and they drifted, the
private dashboard would report download numbers the public site does not show.

## Architecture: "lib/ga.mjs — the read half of analytics"

Moved verbatim from CLAUDE.md on 2026-09-27:

- so no GA figure can reach the public site

## What this is: "assets/dates.js — rewrites a release date"

A build on a CI runner cannot know a visitor's locale. The page therefore
ships `2026-08-19` — unambiguous, and it sorts. `assets/dates.js` asks
`navigator.languages` and upgrades only what a human reads.

## Key behaviours: "Release-note HTML is untrusted"

Moved verbatim from CLAUDE.md on 2026-09-27:

- (a fork's upstream writes some of it)

## Key behaviours: "A release with no notes falls back to the repo's CHANGELOG.md"

Measured 2026-08: 24 of 180 releases across the site's projects were cut with
an empty body, including every OneUp release then published. Without the
fallback the changelog page read "shipped without written notes" over and over.

## Key behaviours: "marked and sanitize-html are build-time only"

Moved verbatim from CLAUDE.md on 2026-09-27:

- so nothing else on the page can drift
- With no JavaScript there is nothing to track, so `analytics.js` correctly
  does nothing at all.

## Key behaviours: "Demo videos are native <video controls>"

Unrequested motion is a barrier. `preload="none"` plus a poster means a
visitor who does not press play downloads nothing.

The screencasts are silent, which puts them under WCAG 1.2.1.

## Key behaviours: "Analytics is opt-in, and the measurement ID has exactly one home"

A cookie recording that you refused cookies is its own punchline.

Moved verbatim from CLAUDE.md on 2026-09-27:

- it is an inline `<script>`, and the CSP forbids those

## Key behaviours: "/privacy/ and analytics.js are one fact written twice"

The page says in English what the script does in code, and English is the half
no compiler checks. `assertAnalyticsContract()` exists so a privacy notice
cannot quietly become a lie.

## Key behaviours: "Security headers ship via <meta>"

Moved verbatim from CLAUDE.md on 2026-09-27:

- (GitHub Pages cannot set HTTP headers)

## Key behaviours: "An About page's claim to be unpublished must stay true"

Slipcase's About page said the project had no download after it had shipped one. Nothing
caught it; a person reading the site did, and the fix was commit 6ab16ab.

Only the contradiction a machine can see is checked. Reading prose for truth is the
weekly post's fact-checker, which needs a digest; an About page has none.

The daily rebuild exists to keep release notes fresh. Stopping it over a stale sentence would cost the whole
site's freshness to report one page's drift.

Moved verbatim from CLAUDE.md on 2026-09-27:

- The copy is hand-written and the release history is not, so a page saying
  "no download yet" outlives the release that gave it one.

## Key behaviours: "Download links point at matched release assets per OS"

Several companion files carry an OS name, and GitHub lists assets
alphabetically, so `foo-windows.cdx.json` would sort ahead of `foo.exe` and
become the Windows download.

Moved verbatim from CLAUDE.md on 2026-09-27:

- so a source tarball is not mistaken for a Linux binary

## Deploy: ".github/workflows/deploy.yml runs the build and publishes dist/"

Moved verbatim from CLAUDE.md on 2026-09-27:

- (to refresh release notes and changelogs)

## Deploy: "The deploy job runs only on GitHub Pages infrastructure"

Moved verbatim from CLAUDE.md on 2026-09-27:

- so the failures that *are* our fault are caught before pushing

## Private stats dashboard: "stats.mjs builds an owner-only dashboard"

A tray icon needs a desktop toolkit, and the Node route to one is Electron.

## Private stats dashboard: "The privacy model is "it is never published", and nothing weaker works"

This is a static site on public GitHub Pages. Anything in `dist/` is
world-readable. A password box would be defeated by View Source, because the
numbers are already in the page, and a secret URL is only as secret as the
URL.

Moved verbatim from CLAUDE.md on 2026-09-27:

- `build.mjs` copies that whole directory into `dist/`, which would publish it

## Private stats dashboard: "The port is PORT → STATS_PORT → 4321"

Binding 4321 after an unusable `PORT` would look healthy while nothing reached
it. The lenient `STATS_PORT` path predates the rule.

The server is started by systemd, so an override via a drop-in never reaches
the tray's own environment. A tray that guessed would open a dead port while
the server was fine.

## Private stats dashboard: "Google Analytics is read, never written, and never snapshotted"

Unlike GitHub's 14-day traffic window, Google retains the history itself, so a
local copy would only be a second version able to drift from the first.

A number carrying no floor-not-total caveat gets read as the whole truth.

## Private stats dashboard: "A failed fetch is never recorded as zero"

A false zero poisons every future delta. The same discipline produced the
weekly digest's literal "could not be read".

## Private stats dashboard: "The token is resolved per run, never once per process"

`gh` keeps the token in the desktop keyring, which is still locked when the
service starts at boot. A token resolved at import would leave a long-lived
server permanently unauthenticated — traffic blank, every run capped at 60
calls an hour, even after a manual refresh hours later.

Moved verbatim from CLAUDE.md on 2026-09-27:

- importers rely on the live binding to see the update

## Private stats dashboard: "Authentication is effectively required, but automatic"

A full run needs roughly 90 API calls against an unauthenticated ceiling of 60
an hour, and the traffic endpoints need push access or return 403. Every
site repo is public, and full `repo` would also grant control of the owner's
private ones.

Moved verbatim from CLAUDE.md on 2026-09-27:

- which keeps the call count under the unauthenticated ceiling so the rest
  still fills in

## Private stats dashboard: "History is append-only and local"

Moved verbatim from CLAUDE.md on 2026-09-27:

- because GitHub deletes traffic data after 14 days

## Private stats dashboard: ".stats/ must stay self-contained"

A relative path to `../src/assets/style.css` resolves when the file is opened
from disk but 404s when `serve.mjs` serves it, silently dropping every colour
and font to browser defaults.

A body class of `stats` would pick up the site's own `.stats` rule, a flex
container, and wreck the layout.

## Private stats dashboard: "Colour on the dashboard is wayfinding, not data"

A tinted OS column can then never read as a warning.

Moved verbatim from CLAUDE.md on 2026-09-27:

- the colour never competes with the numbers

## Private stats dashboard: "Sorting is progressive enhancement"

Rendered text carries thousands separators, `d` suffixes and a delta line.

Keying on position would let an inserted section transplant one table's
preference onto another. `localStorage` throws outright in some privacy modes
and on a `file://` page — forgetting the sort is a far better failure than a
dashboard that does not render. Refresh re-renders from a fresh
run, so without this the reader's chosen order was thrown away every time.

Moved verbatim from CLAUDE.md on 2026-09-27:

- so the page is complete if the script never runs

## Weekly blog post: "A user timer (systemd/ants-weekly-post.timer, Wednesdays 09:00"

The digest is where the token saving lives: the writer reads one compact file
instead of hundreds of commits. The split makes the review independent.

Moved verbatim from CLAUDE.md on 2026-09-27:

- and the split is the point

## Weekly blog post: "Gather — scripts/week-digest.mjs, no AI."

Moved verbatim from CLAUDE.md on 2026-09-27:

- because a promoted preview carries nothing new

## Weekly blog post: "Write, then review — two separate claude -p sessions"

Moved verbatim from CLAUDE.md on 2026-09-27:

- a wildcard before the subcommand would also approve `git -c`, which runs
  commands

## Weekly blog post: "Build and publish."

Moved verbatim from CLAUDE.md on 2026-09-27:

- so nothing unreviewed goes live

## Dependencies: "All dependencies are kept at their latest stable version"

Moved verbatim from CLAUDE.md on 2026-09-27:

- for security as much as features
- so a later release can be re-tested and the pin lifted

## Changelog: "The site deploys continuously, so dated sections stand in for versions"

`CHANGELOG.md` said from the start that dated sections stand in for versions, and nothing
closed one, so every entry accumulated under `[Unreleased]`. The weekly post already runs
on a timer and already commits — a cadence that exists beats one that must be
remembered.

Moved verbatim from CLAUDE.md on 2026-09-27:

- so no section stays open

---

Rules live in [`../../CLAUDE.md`](../../CLAUDE.md).
