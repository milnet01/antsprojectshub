# Logos

Each project's logo, shown on its card on the landing page. Point at it from
`src/projects.json` with the project's `logo` field, relative to `src/assets/img/`:

```json
"logo": "logos/retrodb.svg"
```

- **The project's own logo or app icon**, supplied by that project. Not a
  screenshot: those go in `shots/` and appear on the project page.
- **SVG preferred**; otherwise a PNG at least 256px on its longer side, with a
  transparent background.
- It is centred on a dark panel tinted in the project's category colour, so it
  must read on a dark background.
- It is decorative on the card (`alt=""`), because the card's link already names
  the project.
- A project with no `logo` shows the first letter of its name instead.
