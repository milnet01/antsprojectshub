---
title: The map that drew at an eighth of its brightness, and UT Ants draws
date: 2026-09-15
summary: UT Ants went from reading maps to drawing them — and the first map it drew came out at an eighth of the original game's brightness, until the original was photographed and the difference measured. Ants Terminal 0.7.109 went stable while a week of freeze fixes waits in a preview. Pressless can now import a whole WordPress archive. And three projects found checks that said "passed" without looking at anything.
projects: ut-ants, ants-terminal, pressless, doom-ants, games-hub
---

A day early this week. Five projects moved; sixteen were quiet.

## UT Ants draws

Last week **UT Ants** could read an Unreal Tournament map and draw nothing.
This week there is a program that opens a map and lets you fly a camera
through it: mouse to look, WASD to move, fullscreen, lit, with shadows and
with doors and lifts where the level puts them. The camera stops at walls.
Quality settings drop the resolution when needed to hold 60 frames a second,
and an upscaler makes up the difference.

The 1999 textures are rebuilt as modern materials on the way in — larger,
with bumps, shine and depth — and from the Medium setting up, a recessed
panel in a wall actually looks recessed.

**Still nothing to play and nothing to download.** There is no gravity, no
player, no weapons and no monsters. It is a flying camera through a lit map,
and it needs your own copy of the game to build that map from.

### An eighth of the brightness

The first time I flew through DM-Deck16][ it was **much darker than the
original**. The easy response is to turn a brightness dial until it looks
right. It was not done that way.

Instead the original 1999 game was run on a hidden screen, and a small script
inside it photographed the view from all fifteen of the map's starting
points. UT Ants photographed the same fifteen views. **The average brightness
was 9 out of 255, against the original's 72.** Both had loaded the same 231
lights, so nothing was missing — the lights were being worked out wrong.

Two things were wrong. 174 of those lights are a shape the original engine
calls a cylinder, and they had been treated as spheres. And the original keeps
a light at full strength out to half its reach before it starts to fade, where
UT Ants had been fading it straight away.

The first fix overshot and drew square blotches of light. The map's own data
settled where the edge really is: the cylinder lights touch 1,539 surfaces,
and only 2 of those lie wholly outside a sphere. After the fix, **61.1
against the original's 68.2** — close, and measured rather than judged.

A second find came out of the same pictures. Rows of ceiling lights along a
fixture were drawing as strings of round pools instead of one band of light.
Those rows are now built as single strip lights.

### Checks that checked nothing

One test was meant to compare room outlines on real maps. On the real map it
ran against, it examined **32,907 rooms and 0 outlines** — so every one of its
checks was skipped, and a skipped check counts as a pass. It now prints how
many it actually looked at. Deliberately breaking the code turned up four more
checks of the same kind, which could not fail whatever the code did.

### The rest

- **Windows, for real.** The full test run against a real, stock game install
  on Windows: **640,209 of 640,213 checks passed**, and the four that did not
  were tests assuming my own install rather than faults in the reader.
- **Monster Hunt bots.** The tool that plans bot routes had been aiming at a
  stand-in point near a level's exit instead of the exit itself. Fixed, two
  maps — MH-GardenOfDeath_DotD and MH-GardenOfDeath_Hell — became finishable
  at all, which the written prediction had not expected.
- **Memory.** Building a large map used to peak at 2.07 GB and now peaks at
  1.21 GB, with a byte-identical result.

Next: softer light edges, light fixtures with real depth, outdoor skies, and
fog, light shafts and the flashlight.

## Ants Terminal: 0.7.109 goes stable, 0.7.110 waits

**Ants Terminal 0.7.109** was released today. It is last week's preview,
promoted unchanged — nothing written this week is in it. What it brings: typing
`reset` no longer wipes your colours, the selection highlight no longer runs
past Chinese, Japanese, Korean or emoji text, a tab whose program has died no
longer uses a whole processor core, and a crafted image can no longer hang the
terminal.

Everything from this week — 459 changes — is in **0.7.110**, out today as a
preview only. Much of it came from a performance pass, and the theme is
freezes.

**The slowdown that was blamed on the wrong part.** One check froze the window
for **31.7 seconds**. The planned fix went after the obvious suspect — building
one enormous block of text — and measuring first showed that step took a third
of a second. The real cost was a single search being run 17,811 times. A
faster search only got it from 17 seconds to 14. Building an index once instead
got the whole thing to **1.8 seconds**, seventeen times faster, with identical
results.

**Every time Claude wrote to its log, the terminal re-read the log.** On a
large one that was a quarter of a second of frozen window, again and again.
One update now takes **0.09 milliseconds instead of 258**.

Also fixed in the preview: pasting a large screenshot, opening a long
transcript and one review tool — which froze the entire app forever, every
time — no longer freeze anything. Closing a second window no longer cuts every
other window off from its tools. And the terminal's own quick check of your
project could make your `git commit` fail with a "File exists" error.

**Three checks that passed on nothing.** Four end-to-end tests looked for text
that the command you type already contains — so the terminal simply echoing
your typing satisfied them, even if the command never ran. The leak checks on
every push and in CI had leak detection switched off, and four leaks sat
unseen for weeks. And the speed test for Chinese and Japanese text reported a
*better* frame time than plain English — because its test screen was mostly
empty. Measured properly, that text is the closest the terminal comes to
dropping below 60 frames a second, and the test now fails if it draws almost
nothing.

## Pressless can import your archive

**Pressless** gained the big missing piece this week: **import**. It takes the
whole WordPress archive — entries, drafts, comments and photographs — into its
own files in one go, and if any single write fails it leaves nothing half-done
behind. Whatever it could not carry across exactly, it lists entry by entry.

The web page you work in is also finished. It runs on your own computer, can
only be reached from your own computer, and turns every failure into three
parts: what happened, what it means for your site, and what to do next.

Packaging exists — a Linux AppImage and a Windows zip — and the Linux one has
been proven on this machine. **The Windows half, and the automatic release
build, have never run anywhere**; the first release will be their first run.

Two finds. The error messages were cleaned last month so they would not
reveal a folder on your computer — but they still named the GitHub account in
every message that quotes a web address. The test written for it failed at 28
places in one part of the program and 8 in another before the fix. And the
privacy sweep that runs before anything is published claimed to cover
everything a publish sends, but never read the messages attached to release
tags. A test tag in a throwaway copy proved the gap, and then the fix.

Where that leaves a first release: the interface is done, import and
packaging are built, and the part that actually builds your site has an
agreed plan and no code yet.

## DOOM Ants

**DOOM Ants** had one busy day on Saturday, all waiting for the next release.
The two changes I described last week — the network check switched off since
1997, and saves that record which build wrote them — are still waiting with
it.

The pick of the new ones are all **confident wrong answers**:

- The par times for Ultimate Doom's fourth episode were **invented**. The game
  read past the end of its own table into DOOM II's, so E4M1 claimed a par time
  of 3150 — DOOM II's figure multiplied by 35. Episode 4 now shows no par
  time rather than a made-up one.
- A start-position option given an absurd number put the player at an
  unrelated spot and **printed it as a successful placement**.
- An old statistics option said "External statistics registered." and then
  crashed at the end of the level. It has been removed.

On widescreens, the border around a reduced view was simply not drawn — a code
comment had called the missing part "cosmetic" — and PAUSE sat 105 pixels to
the right of centre. Both are fixed. A network game set up across more than
four machines could also write past the end of DOOM's four-player list.

## Games Hub

**Games Hub** is quiet on the release front — 1.0.0 is still current — but a
few things landed for the next one. Draughts can now end in a draw, with a
countdown over the last ten moves. A drawn chess game no longer plays the
losing jingle. The card suits are drawn by the game rather than borrowed from
a font. And closing the app went from leaving 513,080 bytes of memory
un-tidied to 448.

The best find is a **self-test that failed now and then** — it took 35 runs to
catch it. Minesweeper's first click can occasionally win the game outright, and
the test called that a failure. The fix pinned a known winning first click,
found by searching 200,000 shuffles — and that pinned game then failed on
Windows, because Windows' standard shuffle lays the mines out differently.
The game now uses its own shuffle, the same everywhere.

Last week I said keyboard play was next. **It has not started**: the one
decision it waits on is what the keyboard cursor should look like, and that is
mine to make.

## Short notes

**Quiet this week:** Vestige, RetroDB, MAME Curator, perch, RetroArch, Album
Builder, Snatch, Slipcase, Contact List, Rolodex, Rusty PSN, finbreak, OneUp,
LottoTracker, demoreel and Local Web Server Manager — checked against GitHub,
not just my own copies.

## What changed on the site

**UT Ants' own page now says it draws.** Its "Where it stands" section still
described only the groundwork from its first week.

New download picked up this week: Ants Terminal 0.7.109.

**RetroDB's download is still 3.12.0, from June**, for the reason given last
week — nothing newer has been published as a release.
