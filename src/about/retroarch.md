RetroArch is the program most people use to play retro games. Rather than a
separate emulator for every console, it loads "cores" — one per system — behind a
single interface, with one set of controls, one save-state system and one library.
It runs on essentially everything, from a Linux desktop to a phone to a Wii.

It is not mine. It is the work of the libretro team and hundreds of contributors,
and it is one of the best-loved projects in emulation.

## What this fork is

This is my own copy, kept in step with upstream (the official project) and
carrying my changes on top. Those changes are not features. They are
**corrections**.

RetroArch is a very large C codebase with two decades of history, and a codebase
that size accumulates the kind of bug that never announces itself: a buffer written
past its end, memory that is never handed back, a pointer used after a failed
allocation. Most of the time nothing visible happens. Occasionally something
crashes and nobody can reproduce it.

So the fork runs the code through static analysers and sanitisers (tools that hunt
for these bugs), chases what they find, and fixes it properly rather than silencing
the warning. It adds a test that fails if the bug comes back wherever one can be
written. Some of the most serious fixes do not have one yet.

## What has been fixed

Among the more serious ones:

- **A missing TLS certificate check.** The bundled encryption library accepted any
  certificate at all, so the Online Updater, RetroAchievements and Cloud Sync could
  be intercepted on the network — the classic man-in-the-middle hole.
- **A path-traversal flaw in cloud sync**, where a crafted filename could write
  outside the folder it was meant to stay in.
- **Cloud sync overwriting a save with a cut-off download.**
- **Weak netplay password handling.**
- Dozens of memory leaks and crash-on-out-of-memory paths across audio, video,
  networking, the menus and the Wayland backend.

## Offered back, and accepted

The point of the fork is to get these fixes into official RetroArch, where they do
the most good. On 26 September 2026 the libretro team merged four of them: the
certificate check, the cloud-sync hardening (both the path traversal and the cut-off
downloads) and a batch of crash and leak fixes. A fifth, which hardens the network
command interface, was partly taken: the maintainer rewrote it and made its main
change an opt-in setting. One more,
which makes saving crash-safe, is still under review.

## Should you use it?

**No — use the official RetroArch.** Upstream ships builds for every platform, gets
updated constantly, and now carries the most serious of these fixes itself.

The fork is built and tested on Linux only. It exists so fixes can be tried in
something real before they go upstream. If you want to read the work or take a
patch from it, it is public: the fixes live on the
[local/fixes-2026-09 branch](https://github.com/milnet01/RetroArch/tree/local/fixes-2026-09).

Credit for RetroArch itself goes entirely to the libretro project.
