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
export GITHUB_TOKEN=ghp_yourtoken
npm run stats           # writes .stats/dashboard.html and opens it
```

Shows downloads per OS per project (with change since last run), repo views/visitors/
clones and where they came from, stars and activity, release health, and content checks
like screenshots missing alt text.

**It is never published.** A static site on GitHub Pages can't keep a page private — a
password box would be defeated by View Source — so this dashboard is written to `.stats/`,
which is git-ignored and untouched by the build and deploy. It only ever exists on the
machine that generated it.

Getting a token (needed once): **github.com → your avatar → Settings → Developer settings
→ Personal access tokens → Tokens (classic) → Generate new token (classic)**. Tick
**`public_repo`** — the indented item under `repo`, *not* `repo` itself, which would also
grant full control of your private repositories. Every repo on the site is public, so
`public_repo` is enough; the traffic endpoints need push access, which it grants. Give it a
long expiry, generate, and copy it — GitHub shows it once.

Run it from the project folder (`npm` looks for `package.json` in the current directory);
the `export` itself works anywhere. Put the `export` line in `~/.bashrc` to set it once for
every terminal. Without a token the run still works but skips the visitor figures, which
GitHub shares only with the repo owner.
