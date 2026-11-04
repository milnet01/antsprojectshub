---
title: A 36-minute game counted as 36 hours, and nineteen releases
date: 2026-11-04
summary: RetroDB published seven releases, which bring Get RetroArch, cheats, a 3D box you can turn, and play-time totals that stop counting minutes as hours. Snatch now updates itself, DOOM Ants 0.8.0 puts the HD art in its downloads, and Slipcase, MAME Curator, Groundwork, OneUp, finbreak and Ants Terminal published too. Twenty-two projects moved and two were quiet.
projects: retrodb, snatch, doom-ants, slipcase, mame-curator, groundwork, ants-terminal, oneup, fin-break, demoreel, contact-list, vestige-engine, ut-ants, pressless, frameledger, lotto-tracker, games-hub, local-web-server-manager, rolodex, album-builder, retroarch, rusty-psn
---

**Twenty-two projects moved this week and two were quiet**, against fifteen
and nine last week. Nine of them published releases with downloads
attached: nineteen releases in all.

This week's thread is things that said they had worked when they had not.
A game that played for 36 minutes was counted as 36 hours. A choice of
version that said it worked and changed nothing. A Disconnect button that
said you were disconnected while Google still held the grant. A recording
script with a mistyped key that still reported success.

## RetroDB: seven releases, and play time that was 60 times too high

**RetroDB** published seven releases for Windows, macOS and Linux:
**3.33.0** on the 29th, **3.34.0** on the 30th, **3.35.0** on 1 November,
**3.35.1**, **3.35.2** and **3.35.3** on the 2nd, and **3.35.4** on the
3rd.

Last week's waiting item is in 3.33.0: **Get RetroArch from inside
RetroDB.** 3.33.0 also lets RetroDB update itself and shows how well each
PS3 game runs in RPCS3.

3.34.0 brings:

- **Cheats for RetroArch, DuckStation and PCSX2.** Download the free cheat
  packs from Settings, then switch each cheat on or off on the game's page.
- **Import a Slipcase 3D box and turn it in your hands.** Drag it, or use the
  arrow keys, to see the spine, back, top and bottom.
- **AI Fill a whole system at once**, and Anthropic's Claude 5.5 models for
  the AI.
- **A Test saved AI key button.** Before, a refused key looked like a working
  one.

### The totals that were too high

**Times under an hour were counted as hours.** A 36-minute game was counted
as 36 hours, on the dashboard, the collector trophies and the analytics
chart. 3.35.2 fixes it, so some totals and trophies will go down.

The rest of 3.35.1 and 3.35.2 is about the right facts reaching the right
game:

- **A sequel no longer passes for your game.** Street Fighter II no longer
  gets details from Street Fighter, and Double Dragon II no longer gets the
  times of Double Dragon III.
- **Games no longer show another game's achievements.** Resident Evil 4 on
  GameCube no longer shows the set for Resident Evil.
- **A game's series no longer comes from cutting up its title**, so Need For
  Speed is no longer in a series called Need.
- **The AI's answers say they are the AI's.** OutRun from 1987 no longer
  looks officially rated by ESRB.

3.35.3 gives MAME games their real names from MAME's own list, while the
files keep the short names MAME needs. Steam imports fill each game from its
store page and keep your play time. 3.35.4 adds each game's logo and the
back of its box, and **a screenshot you delete stays deleted**; before, the
next scrape could bring it back.

Waiting for the next release: the PS5 box in its real case shape, the game's
logo on its background art while it starts, and an All button on the letter
bar to undo a letter filter.

## Snatch: four releases, and it updates itself

**Snatch** published **1.3.0** and **1.3.1** on 30 October, and **1.4.0**
and **1.4.1** on 3 November.

- **Snatch updates itself on Linux and Windows.** It shows what changed since
  your version, installs the update only if it is signed by the project's own
  key, and reopens with your queue and settings.
- **Your queue is still there after you close Snatch.** Unfinished videos
  come back as Pending and never start by themselves.
- **Queued videos can download up to three at a time.** It starts at one, so
  nothing changes until you raise it.
- **Snatch starts about a second sooner on Linux**, because it no longer
  unpacks itself on every launch.

**1.3.0 broke on newer Linux systems**, such as openSUSE Tumbleweed: Snatch
could not run its download tool, so fetching and downloading failed. 1.3.1
fixed it the same day. Since 1.4.1, every Linux build is started on the
latest Tumbleweed before release, so a break like that stops the release.

1.3.0 also checks every build for published security advisories, and
updates the picture library that 1.2.0 shipped, which had advisories
published against it.

## DOOM Ants 0.8.0: the HD art is in the downloads

**DOOM Ants 0.8.0** was released on the 30th, for Windows and Linux. Last
week I wrote that the downloads had no HD art yet. **They do now**, so a
downloaded copy of Ultra shows its HD art. Each download is about 50 MB
larger. Ultra also keeps its HD art with ray tracing switched off.

Last week's waiting list is in 0.8.0, including:

- **Invulnerability and the light-amp visor work in Solid and Ultra.**
- **E1M8's walls no longer open onto sky** after the two Barons die.
- **Very large custom levels can be saved.**

Also new: **the Brightness slider brightens when moved right.** It ran
backwards in the ray-traced view.

One fix you would not see: **Classic, network games and demos held one CPU
core at 100%** while waiting for the next tic. They no longer do.

Waiting for the next release: bloom, so bright lights read as bright; the
gamma setting in Solid and Ultra; the Spectre as a see-through shimmer
rather than a solid Pinky; and the blue computer wall built with real depth
in Ultra.

## Slipcase 1.4.0: in-app updates and a 3D View

**Slipcase 1.4.0** was released on the 30th, for Windows, macOS and Linux.
Last week's waiting item ships: **a 3D View that turns the box**, showing
all six sides.

- **Slipcase can tell you when a new version is out.** It is off until you
  turn it on. On Linux and Windows, Update now installs it and reopens
  Slipcase; on a Mac it opens the download page.
- **Every download has a signature beside it**, and the updater refuses a
  file whose signature does not match.
- **Cover search is faster.** ScreenScraper, TheGamesDB and libretro are now
  asked at the same time.

Waiting for the next release: **the PS5 and PS3 cases in their real shape**,
with rounded corners, the lip round the cover and the finger recess. Also
six more consoles, Front, Spine and Back buttons in the 3D view, and a Match
RetroDB button so your boxes sit well beside RetroDB's.

## MAME Curator 1.4.1: a choice that changed nothing

**MAME Curator 1.4.1** was released on the 30th, for Windows, macOS and
Linux. **1.4.0 was tagged but never published**: a packaging tool it
downloads had been rebuilt upstream the day before, so its fingerprint no
longer matched. 1.4.1 carries all of 1.4.0.

The fix you would most want from it: **a copy run a second time sent games
that were already up to date to the recycle bin**, and the new playlist
pointed at the missing files. Those games now stay. A cancelled or dry-run
copy now removes nothing.

Waiting for the next release:

- **Choosing a different version of a game could say it worked and change
  nothing.** It happened whenever the version on show was not the game's main
  one, which includes any game you had already changed once. The version you
  pick is now the one you get, and the message names it.
- **First-time setup in the browser, one question per screen.**
- **A copy can only name games in your library.** One crafted request could
  move a file from outside your folders into the recycle bin.

## Groundwork 0.5.1 and 0.5.2: carry a setup to a new install

**Groundwork 0.5.1** was released on the 29th and **0.5.2** on the 30th, for
Linux. Last week all of 0.5.0 was built; **0.5.0 itself was never
published**, because its check on GitHub failed with older Qt versions.
0.5.1 carries it:

- **Save what is set up on this computer to one file**, keeping or dropping
  each part, and **start a new install from it.**
- **Claude Code among the developer tools.**
- **A drive with 4096-byte sectors is read correctly.** Each partition's
  start was read eight times too far along the drive.

0.5.2 adds sharing folders on your home network, connecting extra drives at
start-up, and a window that remembers your colour theme. **The password box
can no longer hide behind the main window.**

Waiting for the next release: copying your GitHub projects to the computer,
and a saved setup that carries firewall rules, printers and shared folders.

## Short notes

**Ants Terminal 0.7.115** was released on the 30th. The welcome window can
install Claude Code on a fresh computer, the status bar shows when
background work is still running, and Claude's test tools run Python,
JavaScript, Rust and Go tests, as I listed last week. Waiting: **the
document checkers refuse a file that does not exist**, where a mistyped
name read as a clean run. Three slow tests went from 60-200 seconds to 4-6.

**OneUp 1.4.11** was released on 1 November. One fix I listed as waiting for
2.0 came early: **a system update that fails part-way ends the run**, and
says the system is only partly updated. **Pressing Stop during a retried
download no longer says the system was updated.** And a run with 122
upgrades and 4 new packages now says 126, not 122. Waiting for 2.0:
updating over SSH asks for the password in the terminal.

**finbreak 1.0.2** was released on the 29th, with security updates to two
bundled libraries. Last week's waiting items ship: **the Linux download
starts in about 0.8 seconds instead of 1.5**, and the Transactions tab opens
quickly however long your history is. The Debian 13 and Ubuntu 24.04
packages serve 1.0.2.

**demoreel** published nothing; it had a full security pass before 1.0.
Two fixes of this week's kind: **a mistyped key name such as `key Retrun`
left the key press out of the video and reported success**, and **a 30-second
recording whose recorder stopped early could hand back 2 seconds and report
success.** Both now fail. A 24-scene film peaks at about 1.1 GB of memory
rather than 4.6 GB. New: YouTube thumbnails, and videos side by side.

**Contact List** published nothing. Waiting: **Disconnect now revokes the
Google grant.** It called a method that does not exist, so the grant stayed
live at Google while the app said it was disconnected. Also an About page,
and dropdowns that show their arrow.

**Vestige** published nothing. Waiting: **the Memory tab dropped a CPU heap
figure that was always zero**, because nothing reported it. Spot lights now
turn with their object, and autosave recovery brings back terrain, foliage
and music. New formulas went to DOOM Ants, which now uses them for its
highlights.

**UT Ants** still has nothing to download: 0.1.0 is tagged, not released.
**Shadow planning takes 12 microseconds a frame, not 660**, on a map with
859 lights. The haze costs up to a millisecond less: DM-ArchNemesis went
from 2.25 to 1.27 ms on an RX 6600 at High, 2560x1440.

**Pressless** published nothing; last week's list still waits. New: visitors
can like or dislike an entry, your YouTube channel's figures, a wizard for
your own domain name, and bringing in a site that is a folder of web pages.

**frameledger** published nothing; `compare` and the bisect mode still wait,
for 0.2.0. New: `report` shows **frame pacing**, because a run can hold its
frame rate and still judder. `compare` judges memory too.

**LottoTracker 0.1.0** was released on the 30th with no files attached, so
there is still nothing to download. Waiting: **Lotto wins with two numbers
and no bonus ball were scored as losses**, so the totals ran below what the
bank paid. Daily Lotto Plus entries are now checked, to the cent.

**Games Hub** 1.3.0 is tagged, not yet released. In it: a Games menu that goes
straight from one game to another, favourites, and **Hearts shows the
scores between hands.** The "(0)" beside each name counted cards in hand,
so it read as a score of nought.

**Local Web Server Manager** published nothing. Waiting: change the port a
project starts on, and **RetroArch no longer crashes when RetroDB starts
it** from the manager.

**Rolodex** published nothing. Waiting: a second click in the list no longer
selects both entries, and a name such as "AT&T" shows in Password Health.

**Album Builder** published nothing. Waiting: undo removing a song, and a
report that prints on white. The 1.0 release now waits on me.

**RetroArch** (my fork) sent official RetroArch two more fixes, #19954 and
#19956. An earlier one, #19904, has landed in official RetroArch.

**Rusty PSN** had 14 commits on GitHub. I have no local copy, so I cannot
say what they hold.

**Quiet this week:** Perch and Hell's Gate.

## What changed on the site

New downloads picked up this week: **RetroDB 3.33.0 to 3.35.4**, **Snatch
1.3.0 to 1.4.1**, **DOOM Ants 0.8.0**, **Slipcase 1.4.0**, **MAME Curator
1.4.1**, **Groundwork 0.5.1 and 0.5.2**, **Ants Terminal 0.7.115**, **OneUp
1.4.11** and **finbreak 1.0.2**.

**The MAME Curator and LottoTracker pages play their new trailers.**
Groundwork's page has new screenshots of the 0.5.2 window. The DOOM Ants
trailer is on hold until DOOM Ants has more graphics features to show.

Pages caught up with each release above, and finbreak's says its native
packages now include Debian 13 and Ubuntu 24.04.

Also: **when a visitor withdraws consent, measuring stops at once.** A post
with an impossible date, or the same name as another post, is refused. The
build reads each project's changelog a little faster, and closing the
changelog keeps a blank line between entries. The library that turns these
posts into web pages, and a tool the build runs on GitHub, were updated.
The private stats page I keep for myself has a new look, with Overview and
Projects tabs, find, text size and shortcuts. It also counts open issues and
pull requests, including this site's own and those of projects the site
does not list, fetches openSUSE figures alongside GitHub's, and no longer
fails to load when its address carries extra settings.
