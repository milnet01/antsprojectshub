---
title: A package six versions behind, and fourteen releases
date: 2026-11-11
summary: OneUp 2.0 brings three window layouts and asks for your password the way Discover does. Rolodex 2.0 imports from other password managers, Album Builder reached 1.0, and Pressless, Groundwork, Local Web Server Manager, finbreak, Games Hub and frameledger published too. Twenty-three projects moved and one was quiet.
projects: oneup, rolodex, pressless, album-builder, groundwork, local-web-server-manager, fin-break, games-hub, frameledger, ants-terminal, retrodb, mame-curator, vestige-engine, doom-ants, ut-ants, demoreel, contact-list, perch, slipcase, lotto-tracker, snatch, retroarch, rusty-psn
---

**Twenty-three projects moved this week and one was quiet**, against
twenty-two and two last week. Nine of them published releases with
downloads attached: fourteen releases in all.

This week's thread is checks that could not fail. finbreak's packaging
script said "OK" whatever happened, so its openSUSE packages sat six
versions behind. Ants Terminal had six tests that could never fail, and
RetroDB had nine. MAME Curator read four of its game lists as empty, so
two of its filters did nothing.

## OneUp 2.0: three layouts, and a password asked the way Discover asks

**OneUp 2.0.0** was released on the 6th and **1.4.12** on the 5th, both as
an AppImage.

Last week's waiting item is in 1.4.12: **updating over SSH asks for the
password in the terminal.** Before, every update over an SSH login with
no desktop failed. 1.4.12 also names the month in your own language, and
makes the progress bar easy to see in the light theme.

2.0 brings:

- **Three window layouts, Rows, Rail and Spotlight**, chosen in Settings.
  None of them moves or resizes while an update runs.
- **Installed from the openSUSE repository, OneUp asks for your password
  the way Discover does**, once per update. The AppImage keeps its
  Passwordless setting.
- **Click a package or a Flatpak app to see what it is**, and what changed
  in its new version.
- **Each package shows its download size and where it comes from**, and
  an estimated time left while updates download.
- **Old update logs are deleted after 30 days** by default.

Two fixes of this week's kind. **The leftover step said "17 removed" when
zypper had removed 48.** It now reports zypper's own total. And after the
last package installed, the window sat on "Installing 767 of 767" while
zypper finished up; it now says "Finishing up".

2.0.0 had a rough release day. Its first build failed a test, and every
openSUSE build of it failed too, because the package installed into
folders no package owned. I chose to fix both under the same number
rather than release a 2.0.1.

Waiting for the next release: **the AppImage updates itself**, installing
only a download signed with the project's own key, and shows what is new
in every version since yours.

## Rolodex 2.0: bring your passwords in from elsewhere

**Rolodex 2.0.0** was released on the 8th, for Linux, Windows and macOS.
Last week's waiting items are in it: a second click in the list selects
just that entry, and a name such as "AT&T" shows in Password Health.

- **Import from Bitwarden, KeePassXC, Chrome, Edge, Brave, Firefox or
  1Password**, and export as CSV.
- **A stronger lock on your vault.** Each guess at your password now needs
  256 MB of memory, which makes guessing on graphics cards far costlier.
  **Once 2.0 has opened a vault, Rolodex 1.6 and older cannot open it**,
  so keep an old backup if you might go back.
- **Themes, including High contrast**, and accent colours that stay
  readable.
- **Screen readers name the controls they used to skip.**
- **Select several entries** to move or delete them together.

**Password Health rated "password1" as Fair or better.** The thousand
most-guessed passwords now rate Weak. And **a change a sync tool made
while Rolodex was unlocking could be saved over** without asking. Now it
asks.

## Pressless 0.13.0 and 0.14.0: easier to find your way, and more ways in

**Pressless 0.13.0** was released on the 6th and **0.14.0** on the 10th,
for Windows and Linux.

0.13.0 is about finding your way around:

- **A text size for Pressless's own screens**, up to twice the normal
  size.
- **Journal entries are edited as they look**, as pages already were.
- **Press to site lists what will change before it goes live**, with
  Publish now and Not yet.
- **A new site opens with a finish-setting-up list** of five things to do.
- **Publishing a large site uses far less memory.** On a 500 MiB test site
  the peak went from 717 MiB to 267 MiB.

0.14.0 brings more ways to bring a site in. Setup lists the sites already
in your GitHub account. Import takes a folder of web pages with no ZIP to
make first. A site with its own stylesheets can use the Look screen, and
photographs in JPEG XL can be added.

## Album Builder 1.0.0

**Album Builder 1.0.0** was released on the 4th, for Windows and Linux.
Last week I wrote that 1.0 waited on me. It is out, with undo for removing
a song and a report that prints on white. **Each new download now proves
it can save a file before it is published**, so a fault like the one that
closed the Windows app in 0.9.1 would stop the release instead.

Waiting for the next release: **the player picks up where you left off**,
Ctrl+F jumps to the search box, and synced lyrics light up at the right
moment more often. Before, if the singing ran two lyric lines together,
every later line showed a line late.

## Groundwork 0.6.0 and 0.6.1: your own set-up

**Groundwork 0.6.0** and **0.6.1** were released on the 6th, for Linux.
Both of last week's waiting items are in 0.6.0:

- **Copy your GitHub projects to this computer**, each with a switch.
- **A saved setup can carry firewall rules, printers, extra drives and
  shared folders.**

0.6.1 adds a switch to **hibernate instead of sleep**, for computers that
do not wake properly. It is offered only where it is safe to.

**Saving a setup with no app settings switched on never finished.** It now
saves.

## Local Web Server Manager: a download at last

**Local Web Server Manager 0.5.1** was released on the 10th, and it is the
first with a download: **an AppImage that needs nothing installed first.**
0.4.0 on the 5th and 0.5.0 on the 10th were published with no files.

Last week's waiting item is in 0.4.0: **change the port a project starts
on.** 0.5.0 adds **a live output panel**, and Jump to last error finds the
error in it for you.

**Open went to the port you asked for, even when the server was on
another**, so it opened a page where nothing listened. It now opens the
port the server really holds. 0.5.1's install also shrank: its Qt files
went from 673 MB to 245 MB.

## Short notes

**finbreak 1.0.3** was released on the 4th and **1.0.4** on the 8th. 1.0.3
makes one-period reports and the Transfers tab faster. 1.0.4 makes **a
remembered statement password work whichever account you pick.** The
packaging script **printed "OK — committed" and finished cleanly whatever
the build service held**, so the openSUSE packages sat six versions
behind. It now fails unless the release really arrived.

**Games Hub 1.3.0** was released on the 4th, with the Games menu,
favourites and Hearts scores I listed last week. Waiting: **every game
explains how to play it** (F1), and Sudoku plays with the mouse alone.
**Moving one Solitaire card down and up again added points every time**,
so a score of 100 became 115. It now costs points.

**frameledger 0.2.0** was released on the 4th, with `compare` and the
bisect mode that waited last week. **0.3.0** followed on the 10th:
`survey` ranks many runs, and `compare --by-scene` compares two builds map
by map. Waiting: **a run taken on a busy machine gets no verdict.**

**Ants Terminal** published nothing. Waiting: **scrollback uses far less
memory.** A tab of 50,000 lines at 200 columns took 614 MiB and now takes
105.6 MiB. **Six feature tests could never fail**, because none checked its
failure count.

**RetroDB** published nothing; 4.0.0 is being built. Waiting: **a filter
for "Action" no longer finds "Action-Adventure"**, and "Doom" and "DOOM"
become one name. Removing a museum background took the server to about
9 GB. It now runs in a helper that peaked at 2.5 GB and exits when idle.
**Nine tests that could not fail can now fail.**

**MAME Curator** published nothing, and last week's waiting list still
waits. New: **four game lists were read as empty**, so Drop Japanese-only
text and the mature list did nothing. With them on, a test library went
from 6262 games to 5609. **A copy that skipped games said "Your games are
copied."** It now says what it left out. Also: hide compilations, and keep
only games in languages you can read.

**Vestige** published nothing. Waiting: **turning a door by 90 degrees
turned its collision shape by about 1.6.** Walls and roofs made with the
building tools came back as empty, invisible objects after a save. A
minimised Vestige no longer keeps a processor core busy.

**DOOM Ants** published nothing. Waiting: **the FPS counter read 60/58 on
a steady 60**, and the frame recorder caused the very hitches it recorded.
Ultra's hex floors are bevelled tiles, and the ray-traced view gains a
Sharpness slider.

**UT Ants** still has nothing to download: 0.1.0 is source only. New:
**grass floors grow blades of grass that sway in the wind**, at 0.5 to
0.8 ms a frame. Pipes, barrels, lamps and crates that were missing are
drawn, and window glass reflects the sky.

**demoreel** published nothing; 1.0.0 is being prepared. Waiting: the
README's first example, recording Kate, failed on Ubuntu 24.04, and **two
clicks at one spot ended the run** there. Both now work.

**Contact List** published nothing. Waiting: **an edit saved while a sync
was running never reached Google**, and a later change on Google could
overwrite it. The next sync now sends it.

**Perch** published nothing. Waiting: **a KDE runtime update no longer
breaks the Flatpak**, which now carries its own Qt.

**Slipcase** published nothing. New: the Xbox One and Series X cases have
their real shape in the 3D view, measured from a 3D model.

**LottoTracker** has still not published a download. Waiting: **stopping
it no longer closes your browser**, and it starts quietly at login.

**Snatch** published nothing. Its README now says plainly that the Mac
build is untested.

**RetroArch** (my fork) is now the RetroArch I use every day. I sent
official RetroArch two more fixes, #19992 and #19993.

**Rusty PSN** had 8 commits on GitHub. I have no local copy, so I cannot
say what they hold.

**Quiet this week:** Hell's Gate.

## What changed on the site

New downloads picked up this week: **OneUp 1.4.12 and 2.0.0**, **Rolodex
2.0.0**, **Pressless 0.13.0 and 0.14.0**, **Album Builder 1.0.0**,
**Groundwork 0.6.0 and 0.6.1**, **Local Web Server Manager 0.5.1**,
**finbreak 1.0.3 and 1.0.4**, **Games Hub 1.3.0** and **frameledger 0.2.0
and 0.3.0**.

**The Snatch page plays its new trailer.** OneUp's page covers 2.0, with
new screenshots, and its old 1.x trailer is gone. Pressless has new
screenshots of 0.13.0, including the dark theme. Rolodex has a 2.0.0 page,
and Album Builder is marked live at 1.0.0.

UT Ants is now listed as a work in progress, and its page links the
build steps, since 0.1.0 is source only. Pages caught up with each release
above.

Also: the library that turns these posts into web pages was updated. The
private stats page I keep for myself gained a Builds tab, which shows each
project's last checks and newest release files. It pops up a desktop
notice when a build fails. It also leaves a note for each new fault where
that project's own work is tracked, watches the daily roadmap backups,
and gained an install script.
