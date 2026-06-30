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
- Suggested width ~1280px; PNG or JPG. They render as a swipeable strip near the
  top of the project page, and clicking one opens it full-size.
