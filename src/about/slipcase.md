A game collection browsed on screen is a wall of flat rectangles. The same
collection on a shelf is a row of boxes you can see the thickness of — and it
looks enormously better.

Slipcase turns the first into the second. Give it a flat 2D cover image and it
renders a photorealistic 3D box: front face, spine, top edge, correct proportions,
proper lighting and a soft shadow underneath.

## What it does

- **Knows what the box should look like.** Every case type is modelled at its real
  measurements in millimetres — a SNES cardboard box is 30 mm deep, a Blu-ray case
  12.5 mm, a Game Boy box is small and surprisingly chunky. Around fifteen case
  types are built in, covering everything from NES cartridge boxes and Genesis
  clamshells through DVD and jewel cases to DS, 3DS, PSP and Vita.
- **Builds a spine when your cover does not have one**, which most scraped cover
  art does not.
- **Finds the artwork for you.** It can search the usual cover-art sources
  directly, so you are not hunting for images by hand.
- **Renders it cleanly.** Everything is drawn at double size and scaled back down,
  which is what stops the edges of the box looking like a staircase.
- **Outputs what your frontend actually wants** — PNG with a transparent
  background, sized for RetroArch's thumbnail system or LaunchBox's larger 3D box
  art, at the same viewing angle those libraries use.

It processes a whole folder at a time, not one cover at a time.

## Where it stands

**Not released yet.** It works, it has a test suite, and it is not packaged for
anyone else to install — which is the remaining work rather than a change of mind.

It is built with Python and Qt, and downloads images only from a fixed list of
known art sources over HTTPS, with a size cap, because "fetch this URL and decode
it as an image" is not a thing to leave open-ended.

When it ships, it will be a Linux download like the rest.
