# Ants Projects Hub

Source for **[antsprojectshub.co.za](https://antsprojectshub.co.za)** — a static
showcase site for my projects. Each project page pulls its README, latest version and
downloads straight from GitHub at build time, so it stays current with no manual upkeep.

## How it works

- **`src/projects.json`** — the one file you edit. Every project (and the support
  links) lives here.
- **`build.mjs`** — reads that file, fetches each published project's README + latest
  release from GitHub, and writes finished static HTML into `dist/`.
- **`.github/workflows/deploy.yml`** — on every push to `main` and once a day, GitHub
  Actions runs the build and deploys `dist/` to GitHub Pages.

You never run the build by hand — pushing is enough.

## Common edits

| I want to… | Do this |
|---|---|
| Add a project | Add one entry to `projects` in `src/projects.json` |
| Publish a "coming soon" project | Set its `repo` and change `status` from `"soon"` |
| Add a support link | Fill in a `url` in the `support` array |
| Re-skin the site | Edit the `:root` tokens at the top of `src/assets/style.css` |

`status` is one of `live` · `beta` · `wip` · `soon`. `platforms` is any of
`win` · `mac` · `linux` · `web`.

## Build locally (optional)

```bash
npm ci
node build.mjs          # writes dist/ (set GITHUB_TOKEN to avoid API rate limits)
npx serve dist          # preview at http://localhost:3000
```

The deployed site is pure static HTML/CSS — `marked` and `sanitize-html` are used only
during the build and are never shipped to visitors.

## Private stats dashboard

```bash
cd /path/to/this/repo   # npm looks for package.json in the current folder
npm run stats           # writes .stats/dashboard.html and opens it
```

Shows downloads per OS per project (with change since last run), repo views/visitors/
clones and where they came from, stars and activity, release health, and content checks
like screenshots missing alt text. Click any column heading to sort by it; click again to
reverse.

It's a snapshot, not a live page — re-run the command to refresh the numbers. Each run also
records a dated reading, which is what the change columns and trend lines are built from.

**It is never published.** A static site on GitHub Pages can't keep a page private — a
password box would be defeated by View Source — so this dashboard is written to `.stats/`,
which is git-ignored and untouched by the build and deploy. It only ever exists on the
machine that generated it.

**No token setup needed.** If you're logged in with the GitHub CLI (`gh auth login`), the
build borrows that login automatically — that's what lifts the anonymous 60-calls-per-hour
limit and unlocks the owner-only visitor figures. Check with `gh auth status`.

Set `GITHUB_TOKEN` only if you'd rather not depend on `gh` (it takes precedence when
present); a classic token with the **`public_repo`** scope is enough, since every repo on
the site is public. With neither, the run still works but skips the visitor figures and
may hit the rate limit — the page says so at the top and never records partial data.
