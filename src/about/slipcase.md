A game collection browsed on screen is a wall of flat rectangles. The same
collection on a shelf is a row of boxes you can see the thickness of — and it
looks enormously better.

Slipcase turns the first into the second. Give it a flat 2D cover image and it
renders a photorealistic 3D box: front face, spine, top edge, correct proportions,
proper lighting and a soft shadow underneath.

## What it does

- **Knows what the box should look like.** Every case type is modelled at its real
  measurements in millimetres — a SNES cardboard box is 30 mm deep, a Blu-ray case
  12.5 mm, a Game Boy box is small and surprisingly chunky. Fifteen case types
  are built in, covering everything from NES cartridge boxes and Genesis
  clamshells through N64, DVD, Blu-ray and jewel cases to Game Boy Advance, DS,
  3DS, PSP, Vita and Switch, plus a generic cartridge case.
- **Builds a spine when your cover does not have one**, which most scraped cover
  art does not.
- **Understands full scans.** If your image is a whole wrap-around scan — back,
  spine and front in one picture — it finds the spine and uses it. It can also
  split such a scan into three separate images. Give it a back cover, or a full
  scan, and it can render the back of the box as well.
- **Finds the artwork for you.** It searches ScreenScraper, TheGamesDB and the
  libretro thumbnail server directly, so you are not hunting for images by hand.
- **Renders it cleanly.** Everything is drawn at double size and scaled back down,
  which is what stops the edges of the box looking like a staircase. A soft
  reflection under the box is on by default, and can be turned off.
- **Animates the box.** It can swing the box from side to side and save that as
  an animated PNG, which keeps the transparent background, or as a GIF.
- **Outputs what your frontend actually wants** — PNG with a transparent
  background, sized for RetroArch's thumbnail system or LaunchBox's larger 3D box
  art. The box is turned at 30 degrees by default, LaunchBox-style, and you can
  change the angle.

It processes a whole folder at a time, not one cover at a time.

## Where it stands

**Live, with downloads for Linux, Windows and Mac.** The buttons at the top give
you one file for your system, with everything it needs inside.

- **Linux:** an AppImage. Download it, make it executable, and run it; there is
  nothing to install. It needs a 64-bit Intel or AMD computer and a Linux system
  from about 2022 or newer — it is built on Ubuntu 22.04.
- **Windows:** a single portable program for 64-bit Windows. Double-click it;
  nothing is installed. It is not signed, so the first time you run it Windows
  shows a blue "Windows protected your PC" screen. Click **More info**, then
  **Run anyway**.
- **Mac:** a disk image; drag the app onto Applications. The button gives the
  build for Apple silicon (M1 and later). For an older Intel Mac, use
  [the Intel build](https://github.com/milnet01/Slipcase/releases/latest/download/Slipcase-macos-x86_64.dmg)
  instead. It is not signed, so macOS blocks the first launch: try to open it
  once, then go to System Settings, Privacy & Security, scroll down and click
  **Open Anyway**.

One honest caveat about the Mac build: nobody has tried it by hand on a real
Mac yet. It is built on GitHub's Mac machines, where it passes its own
self-check and the full test suite. If it misbehaves for you, please report it.

**Safer downloads, steadier search.** This update makes cover downloads safer
and the search window steadier. Cover-art searches and image downloads now have
firm limits on size and time, so a slow or misbehaving server can no longer hold
a download open. Clicking quickly through search results no longer freezes the
window, and a preview from an earlier search no longer shows up beside a newer
result.

It is built with Python and Qt, and downloads images only from a fixed list of
known art sources over HTTPS, with a size cap, because "fetch this URL and decode
it as an image" is not a thing to leave open-ended.
