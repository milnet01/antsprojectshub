---
title: The playtime search that found nothing, and Pressless edits on the page
date: 2026-10-21
summary: Since 22 September, RetroDB's HowLongToBeat lookup had answered "not found" for every game, and its platform and year filters were doing nothing; ten RetroDB releases this week fix that and much more. Pressless shipped last week's waiting list, so you now edit a page by clicking on it and typing. Games Hub 1.2.0 shows every move in motion and plays without a mouse. Twenty-one projects moved and two were quiet.
projects: retrodb, pressless, games-hub, groundwork, oneup, demoreel, local-web-server-manager, ants-terminal, ut-ants, vestige-engine, doom-ants, album-builder, fin-break, lotto-tracker, rolodex, mame-curator, snatch, slipcase, perch, contact-list, retroarch
---

**Twenty-one projects moved this week and two were quiet**, against twenty
and two last week. Six of them published releases with downloads attached:
seventeen releases in all.

This week's thread is checks that passed without looking. A search filter
that was ignored. A size test that passed because two different figures
printed the same. A self-test that said "ok" while saving was broken. A
Windows test that reported a pass when the game never started. And, the
other way round, two faults in a RetroDB download that only filming a
trailer found.

## RetroDB: ten releases, and a search that found nothing

**RetroDB** published ten releases, **3.23.14 to 3.26.0**, on the 15th and
17th, each for Windows, macOS and Linux.

What you get:

- **A Play button on every game card** in the Library and on each system's
  page. Press it and the game starts without leaving the list.
- **Every page fits its window.** On a phone, the trophy pages, Help,
  Settings and others no longer scroll sideways.
- **A tidier sidebar**: the five trophy links are one Achievements page
  with a tab for each service, and it reopens the last tab you used.
- On a game's page, other names for the game sit in an "Also Known As" card,
  and an anti-piracy disclaimer sits in About.

### The search that answered "not found"

The find of the week. **From 22 September, every HowLongToBeat lookup
reported "not found".** HowLongToBeat had renamed its search a third time,
and the old address answered with an error. Fixing it turned up something
more: **the platform and year filters were being ignored.** A test search for
"Halo 3" filtered to the NES still returned Halo 3. Both are fixed in 3.23.21.
Super Mario World now comes back at 5.0 hours.

Two more were found while filming RetroDB's trailer on a fresh install:

- **3.23.14's download had no trophy or platform icons.** Every
  RetroAchievements badge showed as a broken picture. The folder they live
  in also holds each user's own downloaded trophy art, so it was left out of
  the build. 3.23.15 ships the icons.
- **Picking a language in Settings did nothing**, and the page stayed in its
  old language. It had been broken since 3.23.8. 3.23.16 fixes it.

And one release fixed the one before: **3.24.0's Windows download stopped at
"Core dependencies failed to install"**, because one part it needs on Windows
only was missing from its list. 3.24.1 installs again.

Waiting for the next release, now numbered 3.30.0:

- **Regional versions of a game show as one game.** The first try on my own
  library paired sequels with their first game: **30 of 56 suggestions were
  pairs like Doom 2 and Doom.** It no longer suggests a sequel.
- **The setup page accepted a 4-character password** in the browser, while
  the server refused anything under 12. Every password form now asks for 12.
- **Uploading a PS4 trailer replaced the game page with a bare error.**
  Videos were capped at 50 MB. They can now be 500 MB.
- RetroAchievements matched "Donkey Kong Country 2" to "Donkey Kong
  Country". Sequels now keep their own entry.
- A Next disk button for multi-disk games started in RetroArch.

## Pressless: last week's list ships, and the next one is bigger

**Pressless 0.9.0 and 0.9.1** were released on the 15th, for Windows and
Linux. Everything I listed as waiting last week is in 0.9.0:

- **You edit a page by clicking on it and typing**, shown as it will look,
  with a panel beside it for pictures, buttons, video, music and columns.
- **You can add, remove and rename pages**, and the menu keeps up. A renamed
  page's old address still reaches it.
- **Pressless asks once whether it may send anonymous usage reports.**
  Nothing is sent unless you say yes.

Also new in 0.9.0: the header, footer and menu change without code; sections
can be dragged into place; and a page can hold a slideshow, questions that
fold open, a picture that enlarges when clicked, a back-to-top link or a
countdown.

One security fix: **a preview page opened on its own, outside the editor,
could run a script from your site with Pressless's own access.** No file
Pressless serves runs a script now. Your published site is unchanged.

0.9.1 is small: **Google has approved Pressless**, so the visitor-numbers
setup drops its steps for getting past Google's warning.

**0.10.0 was tagged on the 19th but is not yet on GitHub**, so all of it
waits:

- **One copy of Pressless looks after several websites.**
- **A whole site saves to one file**, and Pressless backs up every site by
  itself each day, keeping the last seven. A guide moves Pressless to a new
  computer.
- **A Look screen** changes colours, fonts, text size and layout, with a
  live preview, and warns about text that is hard to read.
- Upload songs, videos, PDFs and ZIP files, up to 50 MiB each; choose your
  site's icon and sharing picture; and the three starter looks turn dark for
  a visitor whose computer is set to dark, keeping every text colour at 7:1
  or better.

The browser checks now also run on my Windows test machine with nobody at
the screen. Edge passed 120 of 120, and so did Firefox.

## Games Hub 1.2.0: every move in motion

**Games Hub 1.2.0** was released on the 20th, for Windows and Linux.

- **Every game shows its moves instead of jumping to the result.** A chess
  piece slides to its square, a draughts jump travels hop by hop, and
  captured Reversi discs turn over nearest first. New Game deals in motion
  in Klondike, Spider, FreeCell, Pyramid and Hearts.
- **Every card game can be played without a mouse.** Arrow keys move a gold
  cursor, Space lifts and drops a card, and Escape puts it back.
- From last week's waiting list: **Klondike, Spider and FreeCell move cards
  by clicking as well as dragging**, and **in FreeCell, double-clicking a
  buried card no longer sends the column's top card home instead.**
- Minesweeper makes a sound only when a click does something, so the sound
  tells you it worked.

A small one with a familiar shape: **the step that publishes a release always
titled it "Games X.Y.Z"**, whatever its name. 1.1.0 had been renamed by hand.

## Groundwork: two releases, and a drive ready for openSUSE

**Groundwork 0.3.1** came out on the 15th and **0.4.0** on the 16th, each
with a Linux download.

- **0.3.1: Groundwork installs as an openSUSE package**, from its own
  repository for Tumbleweed, Slowroll and Leap 16.0.
- **0.4.0: it prepares a drive for installing openSUSE.** It lays out a
  whole drive, or the free space beside Windows, then lists what to choose
  for each partition in the installer. Nothing is written until you switch
  on "I understand".
- Two switches for developers: tools for Claude Code, and tree-sitter.
- Started from a USB stick or disc, Groundwork no longer sets anything up,
  since nothing there lasts a restart.

### The switch that would have erased Windows

Caught before 0.4.0 shipped: **on a drive with Windows, switching on "Room to
hibernate" could make the layout page pick the whole drive**, which erases
Windows. That happened when the bigger swap no longer fitted beside it. Now
it picks nothing, and Next stays off until you choose.

A test in Arabic found another: drive names like "/dev/vda3" showed as
"dev/vda3/". They keep their direction now.

Waiting for 0.5.0: **save this computer's setup to one file**, a USB stick
being the usual place, and **start a new install from it.**

## OneUp 1.4.10, and a size test that could not tell

**OneUp 1.4.10** was released on the 14th, with the Linux download. Its
openSUSE package moved to a new address; the old one keeps getting updates
until 2.0.0.

- **Pressing Stop during a download said the update had failed**, with a
  red badge. Nothing had gone wrong. It now says it stopped.
- **If a package with "gpg" or "key" in its name was in a failed update,
  OneUp blamed your signing keys** and offered to import new ones. It now
  does that only for a real key error.
- The download figure could never reach the end after a stopped run.
- A run that updated only Flatpak apps said everything was already up to
  date.

The rest waits for OneUp 2.0, including everything on last week's waiting
list. New this week: an estimate of the time left while packages download,
and a password box that says whose password it needs.

The find: sizes now print with one decimal place, "14.8 MiB" rather than
"15 MiB". **A test wrote 86.0 MiB against a total of 86.4 MiB, and both
printed as "86 MiB"**, so the check that the download reaches its total
passed without it reaching it.

## demoreel 0.9.0: installs like any other program

**demoreel 0.9.0** was released on the 14th, and for the first time it has
downloads: **packages for Debian and Ubuntu, Fedora and Arch**, plus an
openSUSE Build Service repository for 11 systems. That is last week's waiting
list.

Waiting for the next release:

- **`demoreel check` said "ready" when it could not tell.** On a busy
  computer, its question to the video tool timed out and was read as yes.
  It now says the question took too long. That is the same shape as last
  week's find.
- **A trailer with windowed scenes failed on a computer with 8 GB or less.**
  The video tool reserved 4 to 6 GB while using 1.3 GB, and the limit
  counted what it reserved.
- On Mageia, `check` gave Fedora's install commands, because Mageia's system
  file names Fedora as a relative.

## Local Web Server Manager 0.3.0

**Local Web Server Manager 0.3.0** was released on the 15th, with **no files
attached**, so there is still nothing to download. It carries last week's
waiting list: a health check that asks a running site whether it works, the
port each project really ran on, and how long a start has taken.

The check gained a plain word beside its number after a hand try-out.
**RetroDB sends its front page on to its dashboard, and the bare "HTTP 302"
read as an error.** It now says "HTTP 302 redirects".

Waiting: **quitting the app from the desktop stopped every server it had
started.** They now keep running. A start refused because the port is taken
names what is taking it. And one of its tests, which flaked under load,
**could not fail at all.** It can now.

## Short notes

**Ants Terminal** published nothing, so everything waits, including last
week's list. **A tab where Claude waits on you is now bright red**; it was
orange, close to the yellow of a tab reading files. The status bar says when
Claude's background work is still running, and **it could say "Claude: idle"
while a question was waiting for you.** That is fixed. The welcome window
offers to install Claude Code. And a new speed test found that **copying a
large selection builds its text twice**, about 430 milliseconds each time
for 9.06 million characters.

**UT Ants** still has nothing to download. **Light now bounces more than
once.** Against the reference that traces real light, AS-Frigate's outdoor
views went from a gap of 0.25 to 0.29 to one of 0.06 to 0.10. Flags, sails
and curtains sway, and water rises and falls. **TheBoat's lower decks were
nearly black**, at 0.01 to 0.18 of the original's brightness; 18 lantern
lights bring them to 0.62 to 0.87. And a map with no navigation points could
make the lighting step run for days.

**Vestige** published nothing; last week's waiting list still waits. New:
**the game's Audio, Controls and Accessibility settings were names with no
pages.** They have pages now. **The physics walk fell through the meadow**,
because its only ground was a flat box metres below. Fog and light shafts
can be switched off in Settings. The birdsong is now a song thrush: the
first recording's birds were only about 2 dB louder than its own wind and
microphone noise.

**DOOM Ants** published nothing. Waiting: Solid and Ultra show the damage
flash, pickup flash and radiation-suit tint, and the screen melts between
levels. **Loading a mod froze the game at startup**, waiting for Enter in a
terminal that does not exist when you start it from an icon. And **the
Windows test reported a pass when the game was never started.**

**Album Builder** published nothing. Waiting: **its self-test only made a
PDF, so it printed "selftest: ok" while saving was broken** — which is how
the Windows save crash in 0.9.1 got out. It now saves a file too. Report PDFs
printed wrong on some printers because of a damaged font. A 1,000-song
library opens in about 3 seconds.

**finbreak** published nothing. It will not be listed on Flathub after all;
on Linux, use the AppImage or the openSUSE packages. Waiting: **the dashboard
refreshes four times faster**, 145 milliseconds at 20,000 transactions
against 603. And the queued test findings from the September audit are done.
One test checked running totals in a way that was always true. Another looked for
"500" in an amount, and would still pass at "R 1 500.00".

**LottoTracker** published nothing; its first release is planned next. It
now says which wins the bank **has not yet paid**, instead of "still
claimable", since the bank pays by itself. **A lottery text from a sender
the bank does not use is flagged**, so a forged "winnings paid" message
cannot hide a real unpaid win.

**Rolodex** published nothing. Waiting: select several entries to move or
delete them, a layout for narrow windows, and seed phrases always hidden.
**"Qwerty123!" used to rate Fair or better** in Password Health; the thousand
most common passwords now rate Weak. And its check before each commit had
**printed "NOTHING WAS CHECKED" on every commit**. It checks again.

**MAME Curator** starts even when its settings file holds a setting it does
not know. Rolling back an update could leave one there, and the app refused
to start. Settings → About gains a support link and a disclaimer.

**Snatch**'s Windows build broke because the video-player part it bundles
was deleted upstream, which keeps about 30 days of builds. Snatch now keeps
its own copy.

**Contact List**: ticking several contacts no longer unticks the first,
waiting for a release. **RetroArch** (my fork) sent four more fixes to
official RetroArch on the 15th; one sent earlier was merged on the 11th.
**Slipcase** and **Perch** moved only in their own records.

**Quiet this week:** Hell's Gate and Rusty PSN.

## What changed on the site

New downloads picked up this week: **demoreel 0.9.0**, **Games Hub 1.2.0**,
**Groundwork 0.4.0**, **OneUp 1.4.10**, **Pressless 0.9.1** and **RetroDB
3.26.0**.

**Project pages are centred**, and each download button says what kind of
file it is and how big, with install help and a View source link. demoreel
has a button for each family of Linux systems. **Mac buttons say "Apple
Silicon"** when the file is for Apple Silicon Macs only. Vestige's Linux button
gives the AppImage, and RetroDB's give the build with Python included.

**A "Just released" row on the home page**, swiping between screenshots, and
a screenshot viewer that stops at the first and last shot. Each video's
description now folds away under it.

**Trailers** for Games Hub, Groundwork, RetroDB, Contact List and Album
Builder, and a new one for Ants Terminal, with the first kept below.

Pages caught up with what each project shipped: RetroDB's 3.23 to 3.26
releases, with fresh screenshots; Pressless's page editor, Google's approval,
and a privacy policy that covers its usage reports; Groundwork's 0.4.0 and
its disclaimer; Games Hub's 1.2.0, Large play and turn light; Album Builder's note on
Windows Developer Mode; news for Groundwork, Snatch and RetroArch; OneUp's 1.4.10 and new repository; Local
Web Server Manager's 0.3.0; Lotto Tracker's "Not yet paid"; and the features
Ants Terminal's page was missing. RetroDB's page says I do not condone
piracy.

Also: a new script pushes a change, waits for the deploy and checks the live
page. The private stats page I keep for myself now has tabs, a list of open
issues and pull requests, and counts openSUSE installs per project.
