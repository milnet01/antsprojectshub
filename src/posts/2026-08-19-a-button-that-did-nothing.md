---
title: A button that did nothing, and the settings Windows kept throwing away
date: 2026-08-19
summary: OneUp's Restart-services button turned out to do absolutely nothing, and had been doing nothing quietly. DOOM Ants 0.7.1, finbreak 0.1.21 and OneUp 1.4.5 all went out, and Vestige spent a week with no light shafts on two of its three quality settings.
projects: oneup, doom-ants, fin-break, ants-terminal, vestige-engine, games-hub, local-web-server-manager, snatch, lotto-tracker
---

## A button that did nothing

After a big system update, some programs are still running the old version of
things they depend on. OneUp offers to restart those for you, so you don't have
to reboot. That button did nothing at all. No error, no message, no restart —
you clicked it and the window sat there.

Before handing a name to the system, OneUp checks it, so that nothing strange
can be smuggled through as a command. The check insisted every name end in
`.service`. The list OneUp actually receives uses bare names, without the
suffix. So every single name failed the check, and the whole job gave up
silently. A safety check that rejected everything looked exactly like a button
that had nothing to do.

Then the fix uncovered the real problem. Some of the things on that list *run
your desktop* — the login manager, your own session, the bus the desktop talks
over. Restarting those would have logged you out in the middle of an update,
taking OneUp with it. So 1.4.4 restarts only what is safe and tells you plainly
that the rest need a reboot.

And 1.4.5 finished the thought. When the only things left are the ones that
would log you out, offering a "Restart services" button is pointing you at the
wrong thing: what you actually need is the reboot, which was a different button
somewhere else. Now you get offered the reboot directly. When some are safe and
some are not, you get both.

**OneUp 1.4.5** is on the site.

## DOOM Ants 0.7.1

Last week I wrote about the Windows launch freeze — the one that hit roughly one
launch in forty. That fix, and the one for Windows swallowing its own diagnostic
messages, are now in a release rather than just in the code. **0.7.1** went out
this morning, with Windows and Linux downloads on its page.

The new one in this release: on Windows, DOOM Ants was throwing away your
settings every single time you quit. Volume, resolution, render quality, key
bindings — all fine while the game was open, all back to defaults next launch.

Saving settings safely means writing a temporary file first and then moving it
over the real one, so a crash mid-write can't leave you with half a file. That
move replaces the old file on Linux. Windows refuses it outright once the real
file exists. Windows now gets its own replace-in-one-step move, and the settings
stick. Linux was never affected.

There was also a tidy-up in the ray-traced renderer: the pass that draws your
weapon and the HUD on top of the ray-traced picture was set up with slightly
different rules from the surface it was drawing onto, which made the graphics
debug layer log 20 complaints per run. The picture was always correct — the
paperwork wasn't. It's now zero.

## finbreak 0.1.21

The one worth naming: on the import screen you can type your own date pattern to
tell finbreak how the dates in your statement are written. If you typed one with
no year in it — `%d/%m` rather than `%d/%m/%Y` — finbreak accepted it and dated
every transaction in the statement to the year 1900, without a word. It now
stops and tells you the year is missing.

Three more from the same import screen:

- A warning that the day and month might be swapped appeared on every statement
  dated in May. May is the one month whose short and long name are the same
  word, and that was enough to confuse the check. It now only warns when the two
  readings would genuinely give different dates.
- When nothing in a statement could be imported, finbreak told you to go back
  and check the column mapping — and there was no way back. There is now.
- Ticking "remember this password" for a locked PDF statement could leave that
  password sitting on an account it had nothing to do with. It now moves to the
  right one, and puts back anything it displaced.

## Short notes

**Ants Terminal 0.7.105** — mostly work under the floorboards. The one I'd point
at: a check that compiles the whole project against the oldest version of Qt it
promises to support now runs before every push, and takes 5 to 7 seconds where
it used to take about 25 minutes. That is the failure that broke the build three
times running and could not be caught on this machine at all. The roadmap that
the terminal shows you also moved out of a text file and into a proper store, so
two sessions writing to it can no longer tread on each other.

**Vestige** — below the High quality setting, the engine was drawing no light
shafts at all. The question "is the expensive volumetric fog running this
frame?" had been written out twice in two places, and the second copy had lost
the part about quality level. Low and Medium switch that expensive pass off on
purpose and fall back to a cheap version of the effect — but the cheap version
asked the broken copy, was told the expensive pass was running, and stood down
to avoid drawing the shafts twice. So the fallback removed itself exactly where
it was the only thing available. Both places now ask one question that only
exists once. Separately, fog's frame-time budget is now set per quality level
rather than one figure for every PC, after a GTX 1050 missed the single figure
by 8% and turned out to be the first machine ever to contradict it.

**Games Hub** — the legibility switch from last week is being taken through the
games one at a time; Canasta and Sudoku answer it now, which is two of fourteen.
Canasta got real rules work too: a hand nobody goes out on can be scored as
dead, the computer stops throwing you the exact card that completes your meld,
and it now knows that a first-round discard can't be taken. There is no new
release, deliberately — cutting one would advertise a legibility switch across
the collection while twelve games still ignore it. 0.3.1 is still the download.

**Local Web Server Manager** — it grew a keyboard: `/` jumps to a filter box and
narrows the list as you type, number keys jump straight to a project, Enter
starts the one you're on or stops it if it's already running. Eight colour
themes including two high-contrast ones, remembered between runs, starting dark.
A menu bar and a desktop entry, so it launches like a normal application rather
than from a terminal. Its page on this site said there was no usable application
yet; that stopped being true this week, and the page now says what it actually
does. Still no download — that's next.

**Snatch** — the yt-dlp front end has been renamed from ytdlp-gui to Snatch, and
its home on GitHub moved with it, so its page here now points at the new
address. It also builds for Linux and macOS on every push, where before there
was only a Windows build. No release yet: I want all three proven first.

**LottoTracker** — the part that watches for ticket messages now survives a
restart, two things writing at once, and a cold start against a phone full of
history. The measurement I liked: with the safety lock taken out, 105 of 120
rows landed on top of each other, three runs out of three.

## What changed on the site

New downloads: DOOM Ants 0.7.1 (Windows and Linux), OneUp 1.4.5, finbreak
0.1.21. Ants Terminal 0.7.105 is out too, and still installs from the openSUSE,
Leap and Mageia packages rather than a file you download. Snatch and Local Web
Server Manager both had their descriptions corrected.
