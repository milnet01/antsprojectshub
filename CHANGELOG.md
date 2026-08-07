# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
The site deploys continuously from `main` rather than in numbered releases,
so dated sections stand in for versions. Planned work lives in
[ROADMAP.md](ROADMAP.md).

## [Unreleased]

### Added

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

- **Dashboard tables render the rounded corners they ask for.** (APHW-0006)
  The tables set a border radius and then defeated it with
  `border-collapse: collapse`, so they sat square-cornered next to
  round-cornered tiles and notes. Cosmetic only; no numbers change.
