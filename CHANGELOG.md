# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
The site deploys continuously from `main` rather than in numbered releases,
so dated sections stand in for versions. Planned work lives in
[ROADMAP.md](ROADMAP.md).

## [Unreleased]

### Added

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
