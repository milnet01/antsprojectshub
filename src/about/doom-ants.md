In 1997, id Software released the source code to DOOM. It is a beautiful piece of
1990s engineering: it fakes 3D with a clever 2D trick and draws every single pixel
on the CPU, because in 1993 there was nothing else to draw them with.

DOOM Ants takes that code and turns the lights on.

## The two halves

**First, make it run today.** The original code expects a 32-bit machine, the X11
graphics system of the era and a sound interface that no longer exists. That part
is finished — it builds and plays on 64-bit Linux and Windows.

**Then, the interesting part.** Evolve the renderer toward real 3D using the
ray-tracing hardware in a modern graphics card, without losing what DOOM feels
like to play. That part is in progress.

## Three ways to see it

You switch between them from the in-game menu, mid-game.

- **Classic** — the original 1997 software renderer, pixel for pixel, now with
  widescreen support. Its menus use the same sharp style as Solid and Ultra,
  drawn over a dimmed view of the game, and its Video menu shows only the
  settings that apply to it.
- **Solid** — the same DOOM world drawn on the graphics card, with dynamic lights,
  contact shadows and surface detail taken from DOOM's own textures.
- **Ultra** — a full path tracer. Ray-traced lighting and shadows, HD physically
  based materials, a flashlight that moves with you, ambient occlusion, and
  grimier surfaces that no longer repeat visibly across a wall.

Ultra needs a graphics card with ray-tracing support. It is developed and tested
on an AMD RX 6600, which is a mid-range card rather than an expensive one.

The downloads include Ultra's HD art, and Ultra keeps it with ray tracing off too.
One wall texture still shows the original art in a download, because its HD maps
are made from your own copy of the game and cannot be shipped. Ultra has been run
from the Linux download and, under Wine, the Windows one, but not yet on real
Windows.

## What you need to play

**A DOOM data file**, which is not included and cannot be — the game's assets are
still commercial property. Freedoom, a free replacement, works. So does the shareware
`doom1.wad`, or a retail `doom.wad` or `doom2.wad` from a copy you own.

Downloads for Linux and Windows are on the buttons above. Classic mode runs
anywhere; Solid and Ultra need a working Vulkan driver.

## Where it stands

Playable, and honestly early. The engine runs, all three renderers work, and the
path-traced mode already looks like something the original could not have
imagined. What is still moving is everything that makes Ultra consistent — the
target is a solid 60 frames a second floor while looking like that. The latest
release also makes invulnerability and the light-amp visor work in Solid and Ultra,
makes the Brightness slider brighten when moved right, and stops Ultra's dirt stains
hiding the art.

The original code is © id Software and this inherits its GPL v2 licence. This is
a fork of their released source, and all the credit for DOOM itself is theirs.

DOOM is a trademark of id Software LLC, a ZeniMax Media company. The logo's DOOM
lettering comes from [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Doom_%E2%80%93_Game%E2%80%99s_logo.svg)
(public domain); "ANTS" and the ant are this project's own.
