---
paths:
  - "src/projects.json"
  - "src/about/**"
  - "src/assets/img/**"
  - "src/assets/video/**"
---

# Site content — projects.json fields and About rules

Loaded by itself when a session reads one of the files above. Moved verbatim from
`CLAUDE.md` on 2026-10-08 to keep start-up load down.

- **`src/projects.json`** — the single source of content and the file you edit most. Holds
  the `projects` array and `support` links. Adding or editing a project means editing this
  file and nothing else. Fields: `status` is `live` · `beta` · `wip` · `soon`; `platforms`
  is any of `win` · `mac` · `linux` · `web`; `repo` is `owner/name` (null = unpublished);
  `isFork`/`upstream`/`homepage` drive header credit and download fallbacks. `category`
  groups the project into a landing-page section (`engines` · `games` · `emulation` ·
  `media` · `utilities`); `screenshots` is an array of `{src, alt}` rendered as a gallery on the
  project page (`src` relative to `assets/img/`, `alt` required — see
  `src/assets/img/shots/README.md`); `video` is an optional single `{src, poster, caption}`
  rendered as a Demo section above the gallery (both paths relative to `assets/video/`,
  `caption` required — see `src/assets/video/README.md`); `logo` is the optional wordmark on
  the project's landing-page card and, as the `<h1>` with the name as its alt, at the top
  of its page and changelog (relative to `assets/img/`, see
  `src/assets/img/logos/README.md`) — without one the card shows the name's first letter,
  never a screenshot, and the pages a text heading.

- **`src/about/<slug>.md`** — the hand-written About section for one project, named for its
  slug. **Every project needs one, `soon` ones included**; a missing file fails the build
  with the slug named. `src/about/README.md` owns what goes in one and the house style.
  Plain markdown, no header block, headings start at `##`.

- **An About page's claim to be unpublished must stay true.** `build.mjs` compares each About page against the history it has just
  fetched and warns; `local-CI.sh` turns that warning into a failure (except under
  `--ci`, the daily rebuild). The phrases it
  recognises are `UNPUBLISHED_CLAIMS` in `build.mjs` — extend that list rather than adding
  a second check. No About page states a version number, so nothing reads one; add that
  check when one does.

- **A project at 1.0.0 or later is `live`.** 1.0.0 means complete; a single version may be
  a pre-release, which does not count. `statusDrift()` in `build.mjs` warns and
  `local-CI.sh` fails on it, as for the About check. Below 1.0.0 the status is a judgment.
