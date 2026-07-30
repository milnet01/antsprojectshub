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

Runs as a small background server that starts with your desktop session, so the dashboard
is always there at **http://127.0.0.1:4321** — bookmark it.

```bash
mkdir -p ~/.config/systemd/user
ln -sf "$PWD/systemd/ants-stats.service" ~/.config/systemd/user/
systemctl --user daemon-reload
systemctl --user enable --now ants-stats
```

It refreshes when your machine boots, every 24 hours after that, and instantly whenever you
click **Refresh now** on the page itself. The header shows when the numbers were last
updated ("2 hours ago"), turning amber past 36 hours — which means the service has stopped.

The boot refresh waits for your GitHub login to become available before it runs (up to 15
minutes; `STATS_AUTH_WAIT_MINUTES` changes that). At boot the service starts before your
desktop unlocks the keyring `gh` stores the login in, and refreshing before then produces a
half-finished run with no visitor figures. The dashboard is served the whole time you wait —
it just shows the previous run until the fresh one lands.

```bash
systemctl --user status ants-stats      # is it running?
journalctl --user -u ants-stats -f      # watch it work
systemctl --user disable --now ants-stats   # undo
```

### Tray icon

A small icon next to the clock to open the dashboard, refresh the stats, and start, restart
or stop the server without a terminal. **Quit stops the server too.**

```bash
mkdir -p ~/.config/autostart
ln -sf "$PWD/tray/ants-stats-tray.desktop" ~/.config/autostart/
python3 tray/ants-stats-tray.py &   # or just log out and back in
```

It needs PySide6 (`zypper install python3-PySide6`, already present on a KDE desktop) and
talks to the server over the same `POST /refresh` the page's button uses. The icon shows a
solid dot when the server is running and a barred one when it is stopped — the tooltip and
the menu wording say which too, so the state never rests on a 22-pixel icon. To remove it:
`rm ~/.config/autostart/ants-stats-tray.desktop`.

Or generate the page once by hand, without the server (the Refresh button hides itself, since
there's nothing listening):

```bash
cd /path/to/this/repo   # npm looks for package.json in the current folder
npm run stats             # writes .stats/dashboard.html
npm run stats -- --open   # ...and opens it in the browser
```

Shows downloads per OS per project (with change since last run), repo views/visitors/
clones and where they came from, stars and activity, release health, and content checks
like screenshots missing alt text. Click any column heading to sort by it; click again to
reverse.

Each run records a dated reading, which is what the change columns and trend lines are built
from. Download totals are cumulative so they're never lost, but GitHub keeps only 14 days of
visitor data — a gap longer than that loses those days for good, and the page says so when it
detects one.

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
