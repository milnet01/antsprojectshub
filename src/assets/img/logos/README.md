# Logos

Each project's logo, shown on its card on the landing page. Point at it from
`src/projects.json` with the project's `logo` field, relative to `src/assets/img/`:

```json
"logo": "logos/retrodb.svg"
```

- **A proper logo, not an app icon.** It carries the project's name in designed
  lettering (a wordmark). The app icon may sit beside or inside it, but an icon
  on its own is not accepted. Nor is a screenshot: those go in `shots/`.
- **Supplied by the project's own session**, and made from nothing it does not own:
  no upstream project's or game's logo without the owner's say-so.
- **SVG preferred**, with text converted to outlines so it looks the same without
  the font installed; otherwise a PNG at least 800px wide. Transparent background.
- **Landscape.** It sits centred on a 16:10 panel, at most 62% of its width and
  height, so a roughly 3:1 to 2:1 shape fills it best.
- **It must read on a dark panel** tinted in the project's category colour: light
  lettering, or a dark mark with a light outline.
- It is decorative on the card (`alt=""`), because the card's link already names
  the project.
- A project with no `logo` shows the first letter of its name instead.
