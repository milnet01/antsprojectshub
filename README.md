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
