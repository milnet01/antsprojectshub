---
title: A freeze one launch in forty, and fourteen games in one window
date: 2026-08-15
summary: DOOM Ants had a Windows startup freeze that only happened about 2% of the time, which is the worst rate a bug can have. Games Hub shipped 0.3.0, this site got a Games section, and now it has this.
projects: doom-ants, games-hub, oneup, ants-terminal, local-web-server-manager, lotto-tracker
---

## The worst rate a bug can have

DOOM Ants on Windows would occasionally freeze on a black screen at startup. Not
often — roughly one launch in forty. That is the worst possible rate. Frequent enough
that people hit it, rare enough that you cannot reproduce it on demand, and rare
enough that every "fix" appears to work.

The cause was two things meeting. The game clock does some sub-second arithmetic
that overflows on Windows, where a `long` is half the size it is on Linux, so the
clock was stepping *backwards* several times a second. Most of the time nothing
cares. But DOOM's startup runs a screen-melt transition, and the melt asks the clock
how many steps have passed — so if the clock went backwards during it, the melt got
handed a negative number of steps and spun forever.

Fixing the arithmetic fixed the freeze and made Windows timing steadier throughout,
not only at startup. I ran 350 launches on real Windows hardware afterwards with no
freezes, against a 2–3% rate before.

The related one: on Windows, every diagnostic message the engine wrote was going into
a buffer nothing ever emptied, so all of them were lost. Including the ones that
explain why sound or music is unavailable. Anyone reporting silent audio had nothing
to send me. Those appear now, the way they already did on Linux.

0.7.0 itself went out on the 12th, and its best feature is invisible: continuous
integration now compiles the whole tree with the Windows compiler on every push, in
about eight seconds, alongside the Linux job. Previously the Windows build was only
compiled when cutting a release, so it could sit broken for months — and it had. Two
Windows-only compile errors had accumulated silently across the 193 commits between
0.5.0 and 0.6.0.

## Games Hub 0.3.0

Fourteen games in one small window: chess, draughts, reversi, minesweeper, sudoku,
snake, 2048, pinball, hearts, canasta, and five kinds of patience. The board games
play against the computer at three strengths. Each download carries its own copy of
Qt, so it runs on a machine that has never had it.

The fix I want to point at is 2048. Its tile numbers were unreadable on nine of the
twelve tiles, because the text colour was being picked from the tile's *number* rather
than from how bright the tile actually is. So every tile from 8 upward got near-white
text on mid-orange or mid-yellow. Measured at 1.50:1 in the worst case, where 3:1 is
the absolute minimum a person can read.

It is now picked from the tile's actual brightness and every tile clears 4.9:1. I
fixed it for everybody rather than hiding it behind the new legibility switch that
went in the same release, because a tile nobody can read is a bug, not a preference.
I am partially sighted, which is why there is a legibility switch at all — but that
switch is for making things comfortable, not for making broken things work.

There is also a new Games section on this site, and four more projects listed.

## Short notes

**OneUp 1.4.3** — automatic weekly updates now switch themselves off if the
passwordless permission they need stops working. OneUp already handled you turning
that setting off yourself; it did not notice the permission being removed some other
way. The weekly update then kept firing into a password box nobody was looking at,
installing nothing, silently, every week.

**Ants Terminal** — 0.7.104 out on the 12th, and it now installs on openSUSE with
`zypper`. There are packages for Leap 16.0 and Mageia 10, from one distro-portable
spec file rather than three that drift apart.

**Local Web Server Manager** — third phase closed. It has a Rescan button that finds
new projects and folds them into the list without losing anything you have changed,
and an Open button that reads the port the server is *actually* listening on at the
moment you click, rather than the one it remembered from earlier.

**LottoTracker** — tickets now arrive without a cable. It listens over KDE Connect,
so a ticket bought on the phone reaches the page by itself. The interesting part was
being wrong: my first version subscribed to a "new conversation" signal, which fires
only the first time the daemon learns of a conversation. So it reported 202 on the
first run and zero every time after, against a phone holding 951 matching messages.
It now reads the active conversation list and waits for it to stop growing. Live, with
the cable unplugged: 2,325 threads read in 21 seconds.

## And this

You are reading the other thing that shipped this week. The site has a blog now,
because none of the above was visible anywhere unless you were watching a specific
repository on a specific day.

Project pages got a going-over at the same time. They were showing about 2% of each
project's README — everything up to the second heading, with the rest behind a button
— which on DOOM Ants meant 163 characters out of 6,485. Now they show a proper chunk
of it, the screenshots are shown whole rather than cropped to a letterbox slice, and
each page finally says in one line what the project actually is.

Weekly-ish from here.
