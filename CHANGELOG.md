# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
The site deploys continuously from `main` rather than in numbered releases,
so dated sections stand in for versions. Planned work lives in
[ROADMAP.md](ROADMAP.md).

## [Unreleased]

### Added

- **The dashboard shows how many people read each weekly post.** (APHW-0014)
  A Blog posts table under Site visitors gives each post's views in its
  first week and in total. A post published before tracking began says
  so rather than showing zero, and a failed read says it failed.

- **The dashboard shows the weekly post's last run.** (APHW-0013)
  `scripts/weekly-post.sh` records every real run's outcome in
  `.stats/weekly-post.json`. The dashboard's Site content section shows
  it, and a stopped run, or no run for over a week, goes under Needs
  attention.

- **Project pages describe themselves to search engines.** (APHW-0012)
  Each published project page carries a schema.org SoftwareApplication
  block: name, tagline, systems, latest version, and that it is free.
  It is data, not script, so the page's security policy is unchanged.

- **Download clicks are counted, for visitors who accepted analytics.** (APHW-0010)
  Each Download button reports a `download_click` event naming the
  project and the system, and nothing else. The privacy page says so, and
  the build fails if the script ever sends more than that.

## 2026-09-22

### Added

- **An About page can no longer quietly claim a project has no download after it
  has shipped one.** The build compares each About page against the release history
  it just fetched, and `local-CI.sh` fails on a contradiction — so it is caught
  before a push, while the daily rebuild keeps refreshing the site regardless.

### Changed

- **The changelog now closes a dated section each week instead of growing forever
  under `[Unreleased]`.** This file said from the start that dated sections stand in
  for version numbers, and nothing was closing one. The weekly post script does it
  now, in the same commit as the post.

- **The original June design documents moved to `docs/history/`**, marked as the
  record of the first build. They describe the site as it was launched, not as it
  stands, and nothing links to them.

## 2026-09-21

### Fixed

- **Ants Terminal's on-site changelog was empty, and said so in 100 different
  ways.** Its `CHANGELOG.md` is 1.29 MB, and GitHub's contents API refuses to
  inline a file over 1 MB: it answers `200` with `encoding: "none"` and an
  empty `content`, which the build could not tell apart from a repo that keeps
  no changelog. So the fallback that fills in notes for a release cut with an
  empty body had nothing to fall back to, for all 100 releases. Oversized files
  are now read from `raw.githubusercontent.com`, which has no cap — one extra
  request, for the one repo here that needs it. 165 of the 174 versions on that
  page now carry their real notes; the 9 that do not are release candidates,
  which genuinely have none of their own.

- **A release note that only points at the repo's CHANGELOG.md is no longer
  rendered as notes.** Ants Terminal's release tool writes one on every cut, in
  two shapes ("See [CHANGELOG.md](…) for release notes." and "Full release
  notes: CHANGELOG.md at this tag — <url>"). On 50 of its 106 releases the
  pointer was the whole body, and on 8 more it trailed a real set of notes — so
  the page read as a wall of links back to GitHub, which is the one thing it
  exists to remove. The paragraph is now stripped, exactly as GitHub's own
  "Full Changelog" compare trailer already was: a body that was nothing else
  falls through to `CHANGELOG.md`, and a real note loses a redundant last line.
  Judged per paragraph — delete the links to *this* repo's changelog and see
  what is left — rather than matched against those two wordings, so a note that
  cites the changelog while saying something keeps its substance.

### Added

- **Downloads for the last 7 and 30 days on the private dashboard** (APHW-0008)
  A cumulative counter can't tell a steady trickle from a dead project
  that had one good week, so a second table under Downloads reports each
  project's last 7 and 30 days beside its all-time figure, with the date
  its record starts. The figures are differences between two dated
  readings, so a day the dashboard didn't run costs nothing. Where a
  project has been watched for less time than the rest, the cell says how
  far its own record reaches and the totals row leaves it out rather than
  folding it in short.

- **The traffic GitHub has already deleted, on the private dashboard** (APHW-0007)
  The dashboard has been quietly archiving GitHub's daily traffic buckets
  since its first run, because GitHub throws them away after 14 days.
  Nothing ever read them back. "Repo traffic" now carries two tables: the
  live 14 days, and the longer record — 41 days today, 29 of them beyond
  anything GitHub will still serve.

  Each project shows its last 14 archived days against the 14 before, with
  a sparkline over its whole held span. Gaps stay gaps: a day that was
  never recorded is not counted as a zero, and a change is shown only where
  both windows recorded the same number of days — otherwise the row says
  "no comparison", because the older window is short of data, not short of
  visitors.

  The window ends at the newest day archived rather than at today. GitHub's
  buckets run about two days behind the clock, so anchoring on today left
  every window short and silently suppressed every comparison on the page.

  Unlike every other table, this one is driven by the whole project list
  rather than the current run's successes — a repo whose traffic call is
  denied or rate-limited still shows its recorded past.

- **Site visitors from Google Analytics on the private dashboard**
  A "Site visitors" section reads the GA4 Data API directly — visitors, sessions, page views, top pages, referrers and countries. Read-only, local-only, and it says plainly that opt-in tracking makes every figure a floor rather than a total. A read failure renders as "could not be read", never as zero.

- **Google Analytics, behind an opt-in — plus a `/privacy/` page that cannot go stale.**
  The measurement ID lives in exactly one place, `src/projects.json`
  (`analytics.measurementId`); the build writes it onto the script tag and
  `src/assets/analytics.js` reads it back off. Blank it and the tag, the
  consent bar and the third-party request all disappear together.

  Nothing is loaded until a visitor presses Accept — no script, no cookie,
  no request to Google. Declining is remembered and never asked again; a
  "Cookie settings" link in the footer brings the bar back. The choice is
  kept in `localStorage`, not a cookie, so a visitor who never accepted has
  no Google cookie at all. Google Signals and ad personalisation are both
  switched off (`npa=1` in the outgoing hit).

  Google's copy-paste snippet could not be used as given: it is an inline
  `<script>`, which this site's CSP forbids. The same job is done from a
  self-hosted file, and `googletagmanager.com` is the one third-party origin
  the CSP now allows.

  The privacy page states in prose what `analytics.js` does in code — the
  one pair a compiler cannot keep honest. So the build checks it:
  `assertAnalyticsContract()` fails the build if ad personalisation is
  switched back on, or if the script fetches a host the CSP does not allow.
  Verified by breaking each on purpose.

- **A full changelog for every project, on this site — `/p/<slug>/changelog.html`.**
  Every release, newest first, with its notes and date, and an anchor per
  version so a release can be linked to directly. "What's new" on the
  project page now links there instead of to "All releases on GitHub →".
  It costs no extra API calls: the build already downloaded every release
  to tally the download counts, and threw the notes away.

  Where a release was cut with an empty body — 24 of 180 here, including all
  11 of OneUp's — the notes are taken from the repo's `CHANGELOG.md`,
  matched by version. A project that keeps a changelog but has cut no
  release gets a history too. Where neither exists the page says so plainly
  rather than hiding the version.

- **Client demo previews — anything in `src/demos/` is published at `/<name>/`.**
  A self-contained static site dropped into `src/demos/<name>/` is copied
  verbatim to `/<name>/` at build time, so a client can see work in
  progress before they own any hosting. Demos are deliberately invisible
  to the hub itself: no nav entry, no card, no sitemap row, and each gets
  a `Disallow:` line in `robots.txt` — a demo mirrors a client's real
  site, so letting it be indexed would put duplicate content on a domain
  they do not own and compete with the site it previews. The disallow
  list is derived from the same folder listing the copy loop uses, so
  adding or removing a demo needs no second edit. An absent `src/demos/`
  is the normal case and is not an error. First demo is `18_down`, a
  preview for musician Charl Jordaan (18 Down), which comes down once he
  takes over hosting on his own account.

- **A header nav (Projects · Blog) on every page.**
  Two plain links, no JavaScript. The current section is marked with
  `aria-current` and named rather than only tinted. The old "← All
  projects" header link became a breadcrumb above the page content, and
  blog posts get "← All posts" the same way.

- **A blog — /blog/, an RSS feed, and the newest post on the home page.**
  Posts are Markdown files in `src/posts/`, one per post, named
  `YYYY-MM-DD-slug.md` with a small `---` header block (title, date,
  summary, projects). `lib/posts.mjs` reads and renders them; adding a
  post is dropping a file in that folder and nothing else. The build
  emits `/blog/` (the index), `/blog/<slug>/` per post, `/blog/feed.xml`,
  and adds all of them to the sitemap. A post names the projects it
  covers by slug and each becomes a chip linking to that project's page;
  an unknown slug warns and is dropped rather than failing the build.
  The home page carries the newest post capped at its opening paragraphs,
  so a long entry can never push the projects below the fold. Five
  opening entries cover 13 July to 15 August.

- **Four more projects on the site, and a Games section to put them in.**
  Games Hub (fourteen desktop games in one Qt 6 window, with Windows and
  Linux downloads), LottoTracker, demoreel and Local Web Server Manager
  are now listed. A new **Games** landing-page section sits between
  Engines & Graphics and Emulation & Retro, and DOOM Ants moved into it
  from Engines — it is a game you play, the ray tracing is how it is
  built. The hero tagline and meta description name games too.

- **Project pages can carry a demo video, and finbreak now has one.**
  A new optional `video` field in `src/projects.json` renders a **Demo**
  section at the top of a project page — above the screenshots, with its
  own jump-nav entry. finbreak leads with a silent 34-second tour of the
  dashboard, transactions, categories, recurring items, forecast and
  accounts.

  It is a plain `<video controls>`: no player library, no extra
  JavaScript, and it never autoplays. With `preload="none"` and a poster
  frame, a visitor who doesn't press play downloads nothing but the
  poster. Because the screencasts are silent, the caption printed under
  the player is the accessible alternative and is required, not
  decorative.

- Private stats dashboard leaves an OS column blank when a project has no
  build for that system, instead of printing a misleading `0`. A zero now
  means "offered, nobody downloaded it"; a blank means "no such build".
  Screen readers get "not offered for macOS", and blanks sort below real
  figures.

### Changed

- **"Needs attention" is ranked by what it costs, not listed flat** (APHW-0009)
  A broken download button and a project without screenshots sat at the
  same weight in one flat list. They are now two groups — Broken now, and
  Incomplete — ordered within by cost, with the grouping and the wording
  carrying the difference rather than the colour. Each heading counts the
  things to fix rather than the bullets, so a single line covering
  thirteen projects no longer reads as one job.

- **Every download button starts a file — none lands the visitor on a GitHub page first.**
  26 of the 31 buttons already went straight to the release asset. The
  other five fell back to a GitHub page: mame-curator's "Download ·
  Self-host" to the Releases list, and RetroArch, LottoTracker, demoreel
  and Local Web Server Manager to the repo home, since none of the four
  publishes a release binary.

  All five now point at GitHub's source archive, which is a real file
  served immediately — `archive/refs/tags/&lt;tag&gt;.zip` for a released
  version, `archive/HEAD.zip` where there is no release. Neither costs an
  API call, and `HEAD` avoids having to look up a default branch that
  differs across the repos. That is also the documented way to run every
  one of them: mame-curator says clone and run `./run.sh`, and the other
  three say outright that there is no packaged build yet.

  The label reads "Download source" rather than "Download", so a visitor
  expecting an installer learns it from the button rather than from the
  file. A project `homepage` still wins where one is set.

- **Only what GitHub alone can serve still links to GitHub.**
  That is the release binaries, the issue tracker, and credit to a fork's
  upstream. Everything a visitor reads is now on this site. GitHub's own
  "**Full Changelog**: <compare URL>" trailer is stripped from release
  notes — 54 of them, each rendering as a bare URL used as its own link
  text, and each pointing back out for history the page already shows.

- **The About section on every project page is hand-written, and no longer the project's GitHub README.**
  A README is written for someone who has already decided to clone the repo:
  it opens with badges, build flags and a licence, and buries what the thing
  actually does. It also changed the page's shape whenever the repo was
  edited. Each project now has `src/about/<slug>.md` — written for a visitor
  who has just arrived — and the build no longer fetches READMEs at all. All
  19 projects were re-reviewed against their real source and given one,
  including the two marked `soon`, whose pages previously showed a
  four-word "coming soon" callout and nothing else. A project without About
  copy now fails the build with its slug named, rather than shipping a page
  with a hole in it. `src/about/README.md` owns what goes in one.

- **Snatch's repository moved, and Local Web Server Manager's description
  caught up with the app.**
  The yt-dlp front end was renamed from `ytdlp-gui` to `snatch` upstream,
  so `src/projects.json` points at `milnet01/snatch` — GitHub's redirect
  kept the old path working, which is exactly why a stale path can sit
  unnoticed. Local Web Server Manager's blurb still said there was no
  usable application; it now describes the window, the keyboard
  navigation and the eight themes, and says the download is still to
  come.

- **`marked` 18.0.10, `sanitize-html` 2.17.7, and `nanoid` 3.3.18 through
  the lockfile.**
  Routine latest-stable maintenance per `docs/DEPENDENCY_POLICY.md`. The
  `nanoid` bump clears a high-severity advisory (GHSA-2v37-7h3g-55p8);
  it reaches us three levels down, through `sanitize-html` → `postcss`,
  and like every dependency here it is build-time only and never ships
  to a visitor.

- **Project pages state what the project is, and stop printing "0 downloads".**
  The tagline now appears under the title. Before this the page went
  straight from a two-word name to the download buttons, and the only
  description a visitor got was whatever the README's first line happened
  to be. A download count of zero — which is what a freshly cut release
  honestly has — is now omitted rather than printed. The section jump-nav
  was made sticky and then reverted: a sticky bar needs a background to
  keep prose legible underneath it, and any background is a visible dark
  band across the mesh-glow backdrop while the bar sits at its natural
  position. Hiding it until the bar actually sticks needs a scroll
  listener, and no page here loads JavaScript for layout.

- **The five landing categories each own an accent colour, teal → pink down the page.**
  The same wayfinding idea the private stats dashboard already uses. The
  accent lands on the section label, a hairline above each card and the
  monogram covers — never on a pill, so status language (teal LIVE, amber
  BETA, violet EARLY WIP) stays the pills' alone and a tinted card can
  never be read as a state.

- **Landing cards carry a picture, and a lone project no longer fills the row.**
  Each card gets a 16:10 cover: its first screenshot where it has one,
  otherwise a monogram panel in the category's accent, so the grid stays
  even while the other fourteen projects are unshot. The grid switched
  from `auto-fit` to `auto-fill` — `auto-fit` collapses the empty tracks,
  so Vestige, alone in Engines & Graphics, was stretched across the full
  1140px and an accident of counting read as a statement of importance.
  Card names dropped from `h2` to `h3`, which is where they belong under
  their section's heading.

- **The dashboard row you point at actually lights up.** (APHW-0005)
  The hover highlight was a 3% wash — effectively invisible, which is no
  use when you are tracking one project across nine columns. It is now
  clearly visible and crosses the tinted OS columns instead of stopping at
  them, and faint striping keeps rows separable without hovering. Both are
  neutral white, well clear of the amber/teal/rose status colours, so a
  highlighted row can never read as a warning.

- **Wide dashboard tables slide sideways instead of crushing.** (APHW-0004)
  "Audience & activity" is nine columns and had no overflow rule at all,
  so on a phone or a half-width window it simply squashed. Each table now
  keeps its column widths inside a scrollable region that is focusable and
  labelled, so it can be scrolled from the keyboard rather than only by
  dragging. Captions still wrap to the screen rather than scrolling out of
  view.

- **Nothing on the dashboard is smaller than ~0.8rem any more.** (APHW-0001)
  Repo slugs, delta lines, column headings, tile labels and the
  "pre"/"archived" badges were 11-12px. Nothing on the page is dense
  enough to need type that small. All text now sits at 0.8rem or above;
  the dimmest text still clears WCAG AA on every row background
  (6.65:1 plain, 6.20:1 striped, 5.20:1 hovered).

- **The private stats dashboard says nothing where nothing happened.** (APHW-0002)
  A figure that hasn't moved since the last run no longer prints a `±0`
  under it (54 of them on the page before this), and a project whose
  numbers never changed no longer gets a dead-flat trend line (11 of 13).
  The handful of real movements now stand alone, and every table row is
  half the height it was. Real deltas keep their arrow and sign, so they
  still read without colour.

- **MAME Curator is listed as a self-hosted web app rather than a Windows/macOS/Linux download.**
  Its releases carry a Python package and a source archive, not per-OS
  installers, so the three OS badges promised downloads the site could
  never offer and the button quietly fell back to the Releases page. It
  now shows a single "Download · Self-host" button and a WEB badge, which
  is how the app is actually installed: fetch it, run `run.sh` (or
  `run.bat`), and it opens in your browser.

### Fixed

- **A chosen table sort now survives a refresh**
  The dashboard threw the reader's sort away on every reload and snapped back to its own default. It is now remembered per table in localStorage. Audience & activity also ships pre-sorted by stars, highest first — the column it is actually read for.

- **Screenshot thumbnails are shown whole, at their own shape.**
  The tiles were `object-fit: cover` at 16:9, so a tall application
  window was cut to a slice of whatever sat in its middle — both OneUp
  shots read as fragments of something. Letterboxing them into a fixed
  tile was no better: the same window became a thin strip between two
  black bars. The gallery is now CSS multi-column, so each tile takes
  its screenshot's own aspect ratio — a tall shot stays tall, a wide one
  stays wide, and nothing is cropped or padded. Still no JavaScript.

- **Project pages showed about 2% of the README; they now show a substantial chunk or all of it.**
  The split cut at the README's SECOND heading, which on most projects is
  the title plus one sentence: 163 characters of DOOM Ants' 6,485 and 202
  of OneUp's 8,487. Everything else sat behind a "Read the full guide"
  button. It now cuts at a 4,000-character budget of visible text, at a
  top-level block boundary so neither half can be left with unbalanced
  tags, and shows the README whole when it fits or when the tail would be
  under 400 characters. Measured across all 17 enriched pages: every one
  moved, five now show 100% with no reveal at all, and the lowest is
  27.8% against 0.7% before.

- **Dashboard tables render the rounded corners they ask for.** (APHW-0006)
  The tables set a border radius and then defeated it with
  `border-collapse: collapse`, so they sat square-cornered next to
  round-cornered tiles and notes. Cosmetic only; no numbers change.
