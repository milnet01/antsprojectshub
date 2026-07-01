# Screenshots

Drop project screenshots here, then list them in `src/projects.json` under the
project's `screenshots` array. Each entry needs both fields:

```json
"screenshots": [
  { "src": "shots/retrodb-dashboard.png", "alt": "RetroDB dashboard showing the collection grid" },
  { "src": "shots/retrodb-scraper.png",   "alt": "Metadata scraper matching a ROM to its box art" }
]
```

- `src` is relative to `src/assets/img/` (so prefix the filename with `shots/`).
- `alt` is **required** — it's the text screen readers announce, and the site
  owner is partially sighted. Describe what the screenshot shows, not "screenshot".
- Suggested width ~1280px; PNG or JPG. They render as a thumbnail grid near the
  top of the project page — any number of shots (2 or 20) lays out cleanly.
  Clicking one opens a full-screen viewer with ‹ / › arrows to move between shots
  and a ✕ (or click-outside / browser Back) to close. It's pure CSS — no
  JavaScript ships.
