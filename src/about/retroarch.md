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

Seven more followed on 8 October 2026:

- **A PipeWire microphone** that fails to open no longer crashes RetroArch.
- **Two small memory leaks** are gone: one in the shader loader, one in the
  save-state thumbnail code.
- **The Content Information screen** no longer crashes when the loaded game has
  no file path.
- **The modern OpenGL driver** no longer carries on with a broken shader when
  building it fails without an error message.
- **A game added to the top of a playlist** no longer picks up the thumbnail
  settings of the entry it replaced.
- **The AI translation service** now checks the size of the image a translation
  server sends back, instead of trusting it.

On 8 and 9 October 2026 the team accepted the rest. Every fix this fork has
sent upstream is now either merged or was replaced by the maintainers' own
version.

- **Saving is crash-safe.** Save states, game saves and the disc index are now
  written to a temporary file first and swapped in only when the write has
  finished. A crash or power cut mid-save no longer leaves a damaged save.
- **Secure connections** now say so on screen when a certificate is refused, or
  when certificate checking has been turned off.
- **Run-ahead** now copies the game core only into a private temporary folder,
  so another program on the machine cannot swap it out.
- **Pressing Ctrl+C a second time** now quits RetroArch straight away instead
  of sometimes hanging.
- **Running out of memory** now makes RetroArch fail safely, instead of
  crashing or carrying on in a broken state. Eight fixes cover the OpenGL and
  Vulkan shader chains, Vulkan buffers, the keyboard lookup table, OpenGL
  start-up, the Windows companion window's Add Files dialog, PlayStation 3
  texture uploads, and a helper that grows drawing buffers.
- **Replay files** no longer leak memory when one is damaged or cut short, and
  replay checkpoints are now stored the same way on every kind of processor.
- **Screenshots from games that rotate the screen** no longer write past the
  end of their memory.
- **Display and sound:** no crash when a custom display mode has a zero size,
  no colour smear down the left edge of the NTSC TV filter, and the bare-screen
  video driver stops cleanly when it cannot set up the screen. MIDI on Windows
  now cleans up when a device fails to open.
- **Menus:** animations cope with an out-of-range setting, and a settings
  slider in the desktop menu no longer keeps resetting itself.
- **Battery level on older Linux laptops** is now read. Before, it never was.
- **Five crashes found by a code scan** are fixed: on the 3DS, PS2 and Vita
  versions, in the network controller test, and in naming an emergency save.

## Should you use it?

**No — use the official RetroArch.** Upstream ships builds for every platform, gets
updated constantly, and now carries every one of these fixes itself, some in
the team's own version.

The fork is built and tested on Linux only. It exists so fixes can be tried in
something real before they go upstream. If you want to read the work or take a
patch from it, it is public: the fixes live on the
[local/fixes-2026-09 branch](https://github.com/milnet01/RetroArch/tree/local/fixes-2026-09).

Credit for RetroArch itself goes entirely to the libretro project.
