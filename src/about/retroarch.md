RetroArch is the program most people use to play retro games. Rather than a
separate emulator for every console, it loads "cores" — one per system — behind a
single interface, with one set of controls, one save-state system and one library.
It runs on essentially everything, from a Linux desktop to a phone to a Wii.

It is not mine. It is the work of the libretro team and hundreds of contributors,
and it is one of the best-loved projects in emulation.

## What this fork is

This is my own copy, tracking upstream and carrying my changes on top. Those
changes are not features. They are **corrections**.

RetroArch is a very large C codebase with two decades of history, and a codebase
that size accumulates the kind of bug that never announces itself: a buffer written
past its end, memory that is never handed back, a pointer used after a failed
allocation. Most of the time nothing visible happens. Occasionally something
crashes and nobody can reproduce it.

So the fork runs the code through static analysers and sanitisers, chases what they
find, fixes it properly rather than silencing the warning, and adds a test that
fails if the bug ever comes back. At the time of writing it sits around 160 commits
ahead of upstream.

## What has been fixed

Among the more serious ones:

- **A missing TLS certificate check**, which left one build able to be intercepted
  on the network — the classic man-in-the-middle hole.
- **A path-traversal flaw in cloud sync**, where a crafted filename could write
  outside the folder it was meant to stay in.
- **A heap buffer overflow** in the HTTP download path, and a 32 KiB stack overflow
  in the FLAC audio mixer.
- **Weak netplay password handling.**
- Dozens of memory leaks and crash-on-out-of-memory paths across audio, video,
  networking, the menus and the Wayland backend.

Alongside that: signed-overflow undefined behaviour swept out, array bounds
corrected, and a written set of engineering standards the fork holds itself to.

## Should you use it?

**Probably not — use the official RetroArch.** Upstream ships builds for every
platform, gets updated constantly, and is what everyone else is running.

This fork exists so the fixes can be tested in something real before being offered
back upstream, which is where they belong and where they do the most good. If you
want to read the work, follow it, or take a patch from it, it is all public.

Credit for RetroArch itself goes entirely to the libretro project.
