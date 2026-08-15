---
title: Starting a log, and a week of small sharp releases
date: 2026-07-18
summary: The first entry — why there is one now, plus DOOM Ants 0.4.0, two Rolodex releases in two days, and a meadow that finally has real grass in it.
projects: doom-ants, rolodex, vestige-engine, ants-terminal
---

A confession to open with. I am writing these first five entries in one sitting,
to catch the log up to where the work actually is. So this one is dated the week
it covers rather than the day I typed it, and the same goes for the four after it.
From here they are written as the week ends, which is the whole point of keeping
one.

The reason for starting at all is simple. I ship a lot of small things across
about twenty projects, and almost none of it is visible unless you happen to be
watching a particular repository on a particular day. A changelog tells you what
changed in one project. It does not tell you that the same afternoon went into
three of them, or why.

So: what the week of 13 July looked like.

## DOOM Ants 0.4.0

The big one. DOOM Ants is my attempt at dragging the 1997 DOOM source onto modern
Linux and then, carefully, into hardware ray tracing without wrecking what makes
it feel like DOOM. 0.4.0 shipped on the 16th and it is mostly about light.

Activated switches now glow. Press a red button and it throws a faint red light
back into the room. Armour pickups' green eyes do the same thing in the path
tracer. Neither is dramatic — that is deliberate, because DOOM's lighting is flat
by design and a room lit like a modern shooter stops reading as DOOM — but walking
into a dark corridor and seeing a switch you have already hit is exactly the kind
of thing the original could not do.

The sky got fixed, twice. The ray-traced view was rendering no sky at all, which
meant distant geometry appeared to float in a void; there is now a proper sky and
a matching occluder in the raster view so it stops floating there too. Then the
seam where the sky cap met the top of a wall — a black line with a white sliver
next to it — got closed.

Also in: a boot menu to pick DOOM 1 or DOOM 2 without relaunching, gamepad
answers to the quit prompt (naming the right button for your controller family,
because "press A" is wrong on half of them), and an on-screen message with its own
sound when you find a secret.

## Rolodex, twice in two days

Rolodex is my encrypted credential vault. It got 1.2.0 on the 16th and 1.3.0 on
the 17th, which is faster than I would normally ship, but the two features were
finished and there was no reason to sit on them.

It now generates two-factor codes. Store an `otpauth://` URI or a base32 setup key
and it renders the rotating six-digit code inline with a countdown ring and a
one-click copy. No new dependency for it — the TOTP maths is about forty lines of
standard library.

The other one is a password health report: every stored secret scored on length
and variety, and — the part I actually wanted — every secret reused across more
than one entry, worst first. It runs entirely in memory over the already-decrypted
vault, so nothing about it leaves the app. I ran it on my own vault and did not
enjoy the result, which I suppose means it works.

## Vestige: the meadow gets real grass

The engine spent the week on ground. Terrain picked up detail normals, triplanar
blending, distance-tiling break-up so a large field stops showing an obvious
repeating pattern, and quality tiers so all of it scales down.

Then the grass itself: a real blade texture with per-blade variation, replacing
the flat billboards. Along with a first pass at scalability for weaker hardware —
render-scale, presets, FXAA and CAS — so the thing is not only pretty on the
machine I develop it on.

## And the rest

Ants Terminal put out 0.7.99 and cut a release candidate for 0.7.100. finbreak had
a heavy week of import work that landed in a release the following week, so it gets
its paragraph then.

Behind all of it, a quiet week of sharpening my own tooling — the prompt library
and agent configuration I use to work on everything above. None of that is public
and none of it is interesting unless you are me, so it will get one line at most
in these posts.
