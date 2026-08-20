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
  widescreen support.
- **Solid** — the same DOOM world drawn on the graphics card, with dynamic lights
  and contact shadows.
- **Ultra** — a full path tracer. Ray-traced lighting and shadows, HD physically
  based materials, a flashlight that moves with you, ambient occlusion, and
  grimier surfaces that no longer repeat visibly across a wall.

Ultra needs a graphics card with ray-tracing support. It is developed and tested
on an AMD RX 6600, which is a mid-range card rather than an expensive one.

## What you need to play

**A DOOM data file**, which is not included and cannot be — the game's assets are
still commercial property. The shareware `doom1.wad` is freely available and works;
so does a retail `doom.wad` or `doom2.wad` from a copy you own.

Downloads for Linux and Windows are on the buttons above. Classic mode runs
anywhere; Solid and Ultra need a working Vulkan driver.

## Where it stands

Playable, and honestly early. The engine runs, all three renderers work, and the
path-traced mode already looks like something the original could not have
imagined. What is still moving is everything that makes Ultra consistent — the
target is a solid 60 frames a second floor while looking like that.

The original code is © id Software and this inherits its GPL v2 licence. This is
a fork of their released source, and all the credit for DOOM itself is theirs.
