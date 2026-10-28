---
title: A frozen second that read 98 FPS, and three RetroDB releases
date: 2026-10-28
summary: RetroDB published three releases with last week's waiting list in them, plus search from every page and a Library you can sort. Pressless 0.10.0 and 0.10.1 are out, and 0.10.1 brings a WordPress site in. frameledger, a new tool that checks a game's frame rate, had its first release. Fifteen projects moved and nine were quiet.
projects: retrodb, pressless, frameledger, oneup, vestige-engine, doom-ants, ut-ants, ants-terminal, slipcase, demoreel, fin-break, groundwork, games-hub, local-web-server-manager, retroarch
---

**Fifteen projects moved this week and nine were quiet**, against twenty-one
and two last week. Three of them published releases with downloads
attached: six releases in all.

This week's thread is numbers that hid what they measured. A frame-rate log
that read 98.1 FPS for a second that froze for half of it. An update check
that counted 524 updates for an update that changed 953. A search tool that
handed back 6 of 14 results as if they were all of them. And a new project,
frameledger, built to catch the first kind.

## RetroDB: three releases, and buttons that did nothing

**RetroDB** published **3.30.0** on the 21st and **3.31.0** and **3.32.0**
on the 23rd, each for Windows, macOS and Linux.

Everything I listed as waiting last week is in 3.30.0:

- **Regional versions of a game show as one game**, with one card that plays
  the version from your Default Region.
- **Passwords must be at least 12 characters everywhere**, setup included.
- **Game videos can be up to 500 MB**, up from 50 MB.
- **Sequels keep their own achievements**, so Donkey Kong Country 2 no
  longer shows the first game's.
- **A Next disk button** for multi-disk games started in RetroArch.

Also in 3.30.0: a game's manual opens on its page and turns like a book, and
scrapes finish sooner because small pictures are sharpened afterwards.

3.31.0 and 3.32.0 bring:

- **Search for any game or console from every page**, from a box in the
  sidebar.
- **Sort the Library** by name, release date, score or when it was added, and
  show only the games no scraper has filled in yet.
- **Filter by several genres, series or publishers at once.**
- **A bar along the top and bottom on a phone.** On tablet-sized windows the
  menu button was missing, so the menu could not be opened at all.
- **Official names, checked by you.** The AI suggests each game's official
  name in its ROM's own region, so a Japanese Mega Man ROM becomes Rockman.
  Nothing changes until you accept it.
- **A title you type is kept when scraping.** Before, even a re-scrape
  replaced it with the scraper's name.

### The buttons that did nothing

**The Scan Library buttons on the Systems page and in Settings did nothing
when pressed.** Only the Dashboard's worked. The test written first showed
the Systems button sending 0 scan requests. 3.31.0 fixes both.

Two more from 3.31.0:

- **A new Windows or Mac install gave RetroArch's cores their Linux file
  names**, so no core was found. A new install now uses each computer's own
  names.
- **The Players box stopped at 16.** MAG on the PS3 takes 256, and a game a
  scraper had given more than 16 could not be saved at all.

Waiting for the next release, 3.33.0: **Get RetroArch from inside RetroDB.**
It downloads the official RetroArch from libretro, checks the file is
exactly the expected one, and keeps its settings and saves apart from any
RetroArch you already use.

## Pressless 0.10.0 and 0.10.1: last week's list, and WordPress

**Pressless 0.10.0 and 0.10.1** were released on the 22nd, for Windows and
Linux. 0.10.0 was tagged on the 19th; it is now on GitHub, so everything I
listed as waiting last week ships:

- **One copy of Pressless looks after several websites.**
- **A whole site saves to one file**, and Pressless backs up every site by
  itself each day, keeping the last seven. A guide moves Pressless to a new
  computer.
- **A Look screen** changes colours, fonts, text size and layout, with a
  live preview, and warns about text that is hard to read.
- Upload songs, videos, PDFs and ZIP files, up to 50 MiB each, and choose
  your site's icon and sharing picture.

**0.10.1 brings your own WordPress site in**: its posts, pages, menu,
comments, photographs and files. A page that was not published arrives as a
draft, and a report lists anything that did not come across.

Waiting for the next release:

- **Typing while a page was renamed or removed could bring it back.** The
  save of that typing went to the page being moved. Saving now waits until
  the move is done.
- **On some Linux systems, Import could not fetch files from a secure old
  site**, because the download looked for certificates where the system
  keeps none. It now uses the ones it carries.
- **Opening a saved site file could lose the site that was open**, if the
  last step failed. The old site is now kept until the new one is in place.
- Import's report is in plain words, such as "a list, kept as plain lines",
  rather than web code.

## frameledger 0.1.0: a new tool, and its first release

**frameledger** is new on the site this week, and **0.1.0** was released on
the 26th. It reads the log a game engine writes while it runs and says where
each frame's time went. It is built for Vestige, UT Ants and DOOM
Ants first.

- **`report`** ranks what took the time and lists the worst frames.
- **`floor`** says whether a run held a frame rate in every one-second
  window. It answers "inconclusive", not pass, when rows were dropped, the
  run did not finish or the timeline has a gap.
- It warns when a run's numbers should not be trusted: a debug build, a busy
  computer before the run, or fewer than 100 measured frames.

Waiting for the next release: **`compare`** says whether new runs got slower
than old ones, and a **bisect** mode lets git find the change that made
them slower. Vestige, UT Ants and DOOM Ants each checked the bisect by hand
before it was marked done.

frameledger also found a fault in Ants Terminal: **its release check reported
five false findings on frameledger's 0.1.0 notes**, because it did not read
the second line of a bullet. Ants Terminal has fixed it, for its next
release.

## OneUp: a count that missed half the update

**OneUp** published nothing this week, so all of this waits for OneUp 2.0.

The find of the week: **one check on 23 October said 524 updates; the update
then changed 953.** The check missed the packages the update would add or
remove. Now it asks OneUp's system service to try the update without
installing anything. Where that cannot run, such as the AppImage, the count
says "at least".

The same fix ends a count that climbed during an update, **642, then 927,
then 931**, and a total like 1.75 GiB showing as 1.7 GiB. Also waiting:

- A system update that fails part-way no longer runs the steps after it, and
  the summary says the system is half-updated.
- The Flatpak step says which pass it is on: "Updating your apps: 3 of 12".
- The download size shows by itself where no password is needed.
- The update lists grow with Text size, like the rest of the window.

## Vestige: the frozen second that read 98 FPS

**Vestige** published nothing; everything waits.

**The engine's frame-rate log averaged each frame's own FPS.** A second of
50 fast frames and one half-second freeze read **98.1 FPS**, when it really
ran 51 frames. The log now divides frames by the seconds they took, so a
floor check sees that second fail. Its frame-time column had a twin fault:
it smoothed a stutter across five seconds.

Two more:

- **Three of the meadow's moss rocks rendered as glossy blue-white foil.**
  Every glTF model read its textures upside down. Rocks whose picture sits in
  the middle looked right by luck. With that fixed, **birch trees are back**:
  their leaves had rendered as bark.
- **The sky capped every pixel's brightness at 50.** The meadow's sun peaks
  near 60,000, so it came out no brighter than the clouds.

Also waiting: the physics walk no longer passes through the meadow's rocks,
logs and trees; light edits can be undone; and a new lamp is bright enough
to see in daylight.

## DOOM Ants: Freedoom in full, and powerups in Solid and Ultra

**DOOM Ants** published nothing. Last week's list still waits, and this week
adds:

- **Freedoom Phase 1 plays all four episodes.** It used to start as the
  one-episode shareware demo.
- **Plutonia and TNT show their own level names and story**, not DOOM 2's.
- **Invulnerability and the light-amp visor work in Solid and Ultra.**
  Picking either up used to change nothing on screen outside Classic.
- **E1M8's walls no longer open onto sky** after the two Barons die.
- **Very large custom levels can be saved.** A save had a fixed amount of
  room.
- An About row on the main menu says DOOM Ants ships no DOOM game data.

One that said nothing: **without its HD art, Ultra looked like Solid and
never said so.** It now reads "Ultra (no HD art)". The downloads do not
include the HD art yet, so a downloaded copy will show it.

## UT Ants: water that cost twice as much

**UT Ants** still has nothing to download.

**A water sheet that is also a doorway between areas was lit the slow way**,
reading every nearby light's shadow nine times a pixel. At 4K High,
DM-Fool'sBravado's worst view went from 20-21 ms to 12 ms, and both maps
measured now hold 60 fps.

**Bounced light seeped through thin floors and walls.** In TheBoat's sand
room the tops of the walls glowed with light from the hold above. Measured
against exact light, the room's error almost halves. TheBoat's sky no longer
looks painted on a box, and a stone triangle in its open sea is gone; the
original game shows it too.

## Short notes

**Ants Terminal** published nothing, so everything waits. Its search tool
**handed back 6 of 14 results as if they were the whole answer** when it ran
out of time. It now says why a reply is partial. **The roadmap reader
refused Ants Terminal's own roadmap**: its limit was 3,500 items. It now
takes 7,000. Claude's test tools now also run Python, JavaScript, Rust and
Go tests, and say so when no test ran at all.

**Slipcase** published nothing. Waiting: **a 3D View that turns the box**,
and PlayStation and Dreamcast games in their real jewel cases, picked from
the region in the cover's file name. A ScreenScraper search waits 90 seconds instead of
giving up at 30. And **an exported animation's box looked over a third
taller at a sharp angle than face-on**; it keeps one size now.

**demoreel** published nothing; last week's list still waits. New: apps
built with winit, such as egui, Bevy and Alacritty, start under demoreel
instead of quitting, and a scripted click can use the right or middle
button.

**finbreak** published nothing. Waiting: **the Linux download starts in
about 0.8 seconds instead of 1.5**, and the Transactions tab opens in about
0.1 seconds instead of 1.3 with 20,000 transactions.

**Groundwork**: all of 0.5.0 is built, with hand checks still to do. New:
Claude Code among the developer tools, and **one unreadable file no longer
fails a whole save**.

**Games Hub** published nothing. Waiting: Pyramid's draw slides to the waste,
the turn light is a glow with no ring, and the keyboard cursor stays hidden
until you use the keys.

**Local Web Server Manager**: clicking a project no longer draws a thick
outline round it; the outline is for keyboard users. Waiting, with last
week's list.

**RetroArch** (my fork) sent official RetroArch a fix for two freezes when
you press Scan, one in the Playlists tab and one in the sidebar. RetroDB will
play the official stable RetroArch rather than my fork.

**Quiet this week:** MAME Curator, Perch, Hell's Gate, Album Builder, Snatch,
Contact List, Rolodex, Rusty PSN and LottoTracker.

## What changed on the site

New downloads picked up this week: **frameledger 0.1.0**, **Pressless
0.10.1** and **RetroDB 3.32.0**.

**frameledger has its own page**, with its logo on the card and the page
heading.

**Screenshot thumbnails scroll in one row**, with ‹ › buttons and a bar you
can drag or click. **Every page asks for support near the top**, and each
project page says why. The home page title has stronger flowing colours. A
project can now set its own install line for each system; RetroDB's names
its start files.

Pages caught up with what each project shipped: RetroDB's 3.30 to 3.32
releases; Pressless's 0.10.0 and 0.10.1, with Look and Sites screenshots and
its privacy text.

Also: a release file named PKGBUILD is treated as a companion file, not a
download. The two libraries that turn the About sections and these posts into web pages were
updated. The private stats page I keep for myself now keeps every figure's
history and charts it on a Trends tab, and its tray icon follows only the
port the page runs on. The notes that describe how the site is built were
brought up to date.
