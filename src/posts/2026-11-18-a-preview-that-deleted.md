---
title: A preview that deleted, and Pressless reaches 1.0
date: 2026-11-18
summary: Pressless reached 1.0 and then 1.0.2, with an AI helper and eight new layouts. frameledger published three releases, Local Web Server Manager's download now updates itself, and DeFragR published its first version. Twenty-one projects moved and four were quiet.
projects: pressless, frameledger, vestige-engine, local-web-server-manager, oneup, mame-curator, doom-ants, retrodb, ants-terminal, ut-ants, fin-break, defragr, demoreel, perch, album-builder, snatch, rolodex, games-hub, lotto-tracker, contact-list, retroarch
---

**Twenty-one projects moved this week and four were quiet**, against
twenty-three and one last week. Seven of them published releases with
downloads attached: eleven releases in all.

This week's thread is things that said "done" before they were. MAME
Curator's preview of a purge **deleted the files it was only meant to
list**. Pressless ticked "Put your site on the web" before anything was
published. OneUp said "up to date" when it could not tell. And one
frameledger comparison that judged nothing at all passed.

## Pressless 1.0: an AI helper, eight layouts, and a promise kept

**Pressless 0.15.0** was released on the 13th, **1.0.0** on the 16th and
**1.0.2** on the 17th, for Windows and Linux. 1.0.1 was tagged but never
released: its Windows build failed, and everything meant for it is in
1.0.2.

0.15.0 lets **an AI app on your computer write and edit your site.** One
button connects Claude Desktop. Nothing is published, undone or binned
until you click Yes in Pressless, and the app cannot reach your keys or
settings. 0.15.0 also brings **a manual inside Pressless**, with pictures
and short videos, that needs no internet.

1.0.0 brings:

- **Eight layouts and eleven colour styles.** Five new layouts suit a
  portfolio, a small business, a band, a club and a plain document.
- **Pressless opens on Your site**, with a tile for each part of it, and
  Publish and Undo at the top.
- **A line counts the changes not on your site yet.**
- **The update offer shows what changed in every version since yours.**

1.0.2 is a long list of fixes from a review of every part of the app.
Two of this week's kind. **The getting-started list ticked "Put your
site on the web" before your first publish**, on a site brought in from
WordPress or taken over from GitHub. It now waits until a publish has
landed. And **the privacy policy said the makers receive nothing**,
although Pressless can send opt-in usage reports. It now says what a
report holds and how to turn reports off. A No given while a report was
already on its way could also arrive too late to stop it.

Also in 1.0.2: Undo takes a newly added page off your site again, and
after an update on Linux, Pressless comes back in the same terminal
window.

## frameledger 0.4.0, 0.5.0 and 0.6.0: other people's data

frameledger measures how smoothly a game runs, frame by frame. **0.4.0**
was released on the 11th, **0.5.0** on the 13th and **0.6.0** on the
17th.

Last week's waiting item is in 0.4.0: **a run taken on a busy machine
gets no verdict.** 0.4.0 also adds `alternate`, which runs the old and
new builds in turn and compares them, and Markdown output to paste into
a pull request. 0.5.0 compares against a saved baseline, and judges
several named variants against one base.

0.6.0 opens frameledger to measurements from elsewhere:

- **It reads a PresentMon capture**, so a game frameledger has never
  seen can be measured.
- **Frames a graphics driver generated are marked and left out** by
  default, so a verdict judges the frames the game itself drew.
- **A kit proves that someone else's writer**, built from the
  specification alone, gets the format right.
- **Every change is now tested on macOS.** The first run there found
  that stopping `alternate` could end with no report at all.

**A comparison where nothing could be judged used to pass.** It now says
it is inconclusive.

## Vestige: not one slow frame on the meadow

**Vestige** published nothing. Waiting: **no frame of the meadow
flythrough now takes longer than 16.667 ms**, the budget for 60 frames a
second. Five runs on my RX 6600 passed that check. The old build's
longest frame was 15.3 to 16.2 ms and the new one's 12.5 to 13.5 ms.

Two measured surprises got it there. **Every run stuttered at the same
spot, 8 seconds in**, for one frame of about 22 ms, while the graphics
driver built a shader on first sight of an object. Vestige now draws
every object in a scene's first two frames, so that happens while
loading. And drawing trees made the driver wait on the graphics card.
With that fixed, the middle frame time fell from 10.78–11.04 ms to
9.23–9.28 ms.

Also waiting: **Mute and Solo on the Audio panel only changed the
panel**, and every sound kept playing. They now change what you hear.
Ctrl+S in the script editor saved the scene, not the script, and now
saves the script.

## Local Web Server Manager 0.6.0: a download that updates itself

**Local Web Server Manager 0.6.0** was released on the 15th, as an
AppImage. **It now updates itself**: a banner offers each new version,
with what changed, and nothing downloads until you click Update now. It
checks the download was signed by me before replacing itself, and your
servers keep running. 0.5.1 and older have no updater, so download 0.6.0
by hand once.

**In 0.5.0 and 0.5.1, picking a browser from a project's list did not
stick**: the box went blank and reset the project to the default
browser. It now keeps your choice. A server that printed a flood of short
lines froze the output panel: 65,536 lines took over three seconds, and
now take a few milliseconds.

## OneUp: no more "up to date" when it could not tell

**OneUp** published nothing, so last week's waiting item still waits:
**the AppImage updates itself.**

New and waiting, many fixes for OneUp claiming more than it knew. **When
it could not check which leftover packages had more than one version, it
removed them anyway**, and removing a kernel by name removes every
installed version. It now removes nothing and says why. A check that
crashed said "Everything is up to date", and a download size it failed
to read showed as 0 B. Both now say OneUp could not tell.

Also waiting: **an update that includes 32-bit packages no longer stops
part-way** when OneUp's system service runs it. And closing OneUp during
an update no longer stops the update, as its warning always promised.

## MAME Curator: a preview that deleted

**MAME Curator** published nothing, and last week's waiting list still
waits. New: **`copy --purge-recycle --dry-run` deleted**, though a dry
run is meant only to show what would happen. The purge is now a mode of
its own and cannot be combined with a preview.

Two more. **1942 showed Wikipedia's article on the year**, Joust the one
on jousting and Asteroids the one on asteroids. It now takes only a page
Wikipedia describes as a video or arcade game, and shows nothing rather
than the wrong page. And **scrolling fast hid pictures you already
had**: the download allowance was spent on pictures already on disk, so
after about 30 cards a minute they stopped showing.

A failed copy with "replace and recycle" also no longer loses the
version it was replacing.

## Short notes

**DeFragR 0.1.0** was released on the 17th as source only, with no
download. It lists your drives and shows a read-only report of how
scattered each file is, worst first. It does not defragment yet. Waiting:
a map of the drive as a grid of squares, and the window in thirteen more
languages, as unchecked AI drafts.

**demoreel 1.0.0** was released on the 11th, with both of last week's
waiting fixes: the README's Kate example records on Ubuntu 24.04, and two
clicks at one spot no longer end the run. **GIMP's Flatpak looked open
when it was not**, because its image loaders kept running after every
recording. A run now ends them. Next, a recording window: its design was
written and reviewed this week.

**Perch 2.0.1** was released on the 11th, with last week's waiting
Flatpak fix. **A reopened window went back where you left it only 4
times in 12**, on Plasma Wayland. It now does 12 of 12. Menus and dialogs
are left alone: a mail app no longer shrinks to its last dialog's size.

**Album Builder 1.1.0** was released on the 13th, with two of last
week's waiting items: **the player picks up where you left off**, and
Ctrl+F searches your music. In Arabic, the "Used" column no longer reads
as "User".

**Snatch 1.5.0** was released on the 16th: **a package for openSUSE
Tumbleweed**, installed and updated with zypper or Discover. Snatch
looked for a program named `quickjs`, but QuickJS installs as `qjs`, so
it was never found. It is now.

**DOOM Ants** published nothing, and last week's waiting fixes still
wait. New: **Ultra's doors, walls and ceilings have new art**, and many
walls have real depth. Dim rooms stay dark until a lamp or your torch
lights them. **A gamepad pressed for something else could open the menu
during a timed test run**, even with the window hidden. Loading only the
surfaces a level shows took E1M1 from 766 MB to 538 MB.

**RetroDB** published nothing; 4.0.0 is being built. **Gemini had
refused every AI scrape since 23 October**, and all I saw was empty
fields. RetroDB now says when an AI service refuses. The Cyberpunk
theme's mist took 99% of one processor core; it now runs on the graphics
card. MAME cheats can be switched on from a game's page.

**Ants Terminal** published nothing, and the smaller scrollback still
waits. New and waiting: size a window in columns and rows of text, and put the tab
list on the right. Its Fedora package builds in about 36 minutes instead
of 65.

**UT Ants** still has nothing to download. New: **you can try the guns**,
firing every stock weapon at a target dummy that turns from green to red
as it is hurt. A sound mixer dips every other sound by 12 dB while the
announcer speaks.

**finbreak** published nothing. Waiting: **a failed update on Windows
could delete finbreak**, old program and new, if a virus scanner held the
download open. **Standard Bank home-loan repayments imported as money
out**, so they counted as spending twice. Also a Bank box on each
account, and a warning before importing a statement twice.

**Rolodex** published nothing. Waiting: a Flatpak download, German,
French and Spanish, and in-app updates on Windows.

**Games Hub** published nothing, so last week's waiting items still
wait. New: Ruin Runner, Ruin Runner Lanes, Hold the Line, Mahjong
Solitaire, four-player Mahjong, and Noughts and Crosses. In Sudoku,
pencil marks move from P to N, so P can pause.

**LottoTracker** has still not published a download, but a Linux
AppImage can now be built. **Daily Lotto tickets from February to May
2026 were checked against the wrong night's draw**, because the results
feed began dating those draws a day early.

**Contact List** published nothing. Its own checks now run side by side:
25.0 seconds instead of 96.7.

**RetroArch** (my fork): official RetroArch merged my fix #20074, for a
sample check that failed with FFmpeg 9. Cheats for This Game is built.

**Quiet this week:** Hell's Gate, Slipcase, Rusty PSN and Groundwork.

## What changed on the site

New downloads picked up this week: **Pressless 0.15.0, 1.0.0 and
1.0.2**, **frameledger 0.4.0, 0.5.0 and 0.6.0**, **Local Web Server
Manager 0.6.0**, **demoreel 1.0.0**, **Perch 2.0.1**, **Album Builder
1.1.0** and **Snatch 1.5.0**.

**DeFragR has a new page**, with its logo and first screenshot. Pressless
is live at 1.0.0, with new screenshots, and its privacy page matches its
policy. Perch's button links the AppImage, with the Flatpak under it.
Rolodex has seven new screenshots of 2.0. finbreak's page says its
Windows update was tested on a real PC, and RetroArch's lists the fix
merged upstream. Pages caught up with each release above.

Release lists on project pages now leave out side releases and licence
files. Also: the library that turns these posts into web pages was
updated. The private stats page I keep for myself had a design pass,
re-checks builds every 15 minutes, raises failed builds however they
were started, dims its zeros, and scrolls more lightly.
