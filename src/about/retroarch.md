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

- **A missing TLS certificate check.** RetroArch set up its bundled encryption
  library so that it accepted any certificate at all. The Online Updater,
  RetroAchievements and Cloud Sync could all be intercepted on the network — the
  classic man-in-the-middle hole.
- **A path-traversal flaw in cloud sync**, where a crafted filename could write
  outside the folder it was meant to stay in.
- **Cloud sync overwriting a save with a cut-off download.**
- **Weak netplay password handling.**
- Dozens of memory leaks and crash-on-out-of-memory paths across audio, video,
  networking, the menus and the Wayland backend.

## Offered back, and accepted

The point of the fork is to get these fixes into official RetroArch, where they do
the most good. On 26 September 2026 the libretro team merged four of them: the
certificate check, the cloud-sync fixes (the path traversal and the cut-off
downloads), checks on untrusted data from replay files and home routers, and a
batch of crash and leak fixes. A fifth, which hardens the network command
interface, was partly taken: the maintainer rewrote it, fixed its memory-overflow
bug their own way, and made locking the interface to your own machine an opt-in
setting. A bug report from the fork has also been fixed upstream.

Two more followed on 1 October 2026. The team merged a fix that keeps the
certificate check switched on after the settings are reloaded or a per-game
setting is applied. They also made the netplay password handling harder to
guess, writing their own version of the fork's change and crediting it.

Four smaller fixes were merged the same day:

- **Cloud sync login** no longer sends the same fixed value every time, which
  closes a known weakness in that login method.
- **Screenshots** no longer read leftover memory when no screenshot folder is set.
- **Core options** no longer write past the end of memory when a core has more
  option categories than options.
- **OpenGL** now tells the graphics driver that menu and text drawing data changes
  every frame, which is the correct hint.

Scanning a folder of games now uses about half the CPU when many cores are
installed (merged 2 October 2026).

Three more were accepted the same day:

- **Turbo Bind**, a menu setting, no longer reads past the end of its list.
- **Menu start-up, screenshots and replays** now stop cleanly when memory runs
  out, instead of crashing.
- **Cloud sync to S3** now handles save names containing &, = or ?.

Four more followed on 5 October 2026:

- **The Ozone and XMB menus** no longer read past the end of the menu list when
  the selection is out of range.
- **Replay files** are checked more carefully when loaded, so a damaged one
  cannot crash RetroArch.
- **A download that starts on a secure https address** is refused if it is
  redirected to plain http.
- **RetroArch's Linux app-store listing** now includes its recent releases.

Some of these the maintainer committed directly, credited to the fork.

One more was merged on 7 October 2026:

- **The quit button combination** on a controller now asks for confirmation when
  Confirm Quit is on, instead of quitting at once.

Still under review:

- **Saving** made crash-safe.
- **Secure connections** show an on-screen notice when a certificate is refused,
  or when certificate checking is turned off.
- **Replay files** free their memory after a failed read, and a damaged replay is
  refused instead of being saved into a savestate.
- **Seven small crash and memory-leak fixes** found by code scanners, covering the
  PipeWire microphone, the content information menu, GLCore and slang shaders,
  savestate and playlist thumbnails, and images returned by the AI translation
  service.

## Should you use it?

**No — use the official RetroArch.** Upstream ships builds for every platform, gets
updated constantly, and now carries the most serious of these fixes itself.

The fork is built and tested on Linux only. It exists so fixes can be tried in
something real before they go upstream. If you want to read the work or take a
patch from it, it is public: the fixes live on the
[local/fixes-2026-09 branch](https://github.com/milnet01/RetroArch/tree/local/fixes-2026-09).

Credit for RetroArch itself goes entirely to the libretro project.
