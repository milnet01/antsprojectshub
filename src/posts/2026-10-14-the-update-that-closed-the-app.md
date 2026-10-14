---
title: The update that closed the app, and finbreak reaches 1.0
date: 2026-10-14
summary: On Windows, pressing "Update now" in finbreak closed it and then nothing happened, in every release since 0.1.10, and Pressless did the same; both are fixed. finbreak reached 1.0, Groundwork published its first two releases, and Pressless can now take someone with no website at all and give them one. Twenty projects moved and two were quiet.
projects: fin-break, pressless, groundwork, oneup, ants-terminal, vestige-engine, demoreel, doom-ants, album-builder, ut-ants, local-web-server-manager, perch, snatch, slipcase, games-hub, retroarch, lotto-tracker, retrodb, contact-list, hells-gate
---

**Twenty projects moved this week and two were quiet**, against fifteen and
five last week. Eleven of them published releases with downloads attached:
eighteen releases in all.

This week's thread is the step after the one everyone checks. On Windows,
two apps downloaded their update, closed themselves to install it, and
never came back. Two more apps put up release pages that held nothing but
a link. And several checks answered yes or "can't tell" without looking at
the thing they were meant to check.

## finbreak: 1.0, and an update button that never worked on Windows

**finbreak 1.0.0** was released on the 8th, with downloads for Linux and
Windows. Each download is signed. **1.0.1** followed on the 10th. finbreak
is now listed as Live on this site.

### The helper that died as it started

1.0.1 exists for one fault. **Since 0.1.10, clicking "Update now" on Windows
downloaded the update, closed finbreak, and then did nothing.** The small
helper that swaps in the new version was shut down by Windows before it
could start. It was measured on a Windows 10 test machine: the helper died
before running its first line.

The fix cannot reach anyone through the old button, because the old version
is the one that runs the update. **If you use finbreak on Windows with any
version from 0.1.10 to 1.0.0, download 1.0.1 by hand once** and replace your
old `.exe`. Your data was never touched. Each failed attempt also left a
leftover download file beside the app; finbreak now deletes those when they
are over an hour old.

The test written for the fix had a fault of its own. **It could not fail on
Linux**, because on Linux every one of those Windows settings is zero, so
the broken setting and the fixed one looked the same. It now swaps in
values that tell them apart.

1.0.1 also stops Fedora 44 reporting "Transaction failed" when you install
finbreak. The app always installed and ran; a step after the install
called commands Fedora 44 no longer has.

### What else is in 1.0

Last week I listed audit findings as waiting. 1.0.0 carries the first one
I named: **amounts in Arabic or Persian digits showed the cents in Western
digits**. Also in 1.0.0:

- **Moving a statement to another account could leave a transfer with both
  sides in one account**, and its amounts missing from your totals.
- **A Standard Bank row dated just before the statement period pushed that
  row, and every row after it, into the following year.**
- Saving a backup could delete a file of yours that happened to share the
  backup's name plus ".tmp".
- A mistyped time zone is refused with a message, instead of quietly
  switching to your computer's zone.

## Pressless: a website for someone who has none

**Pressless 0.8.2 and 0.8.3** were released on the 12th, for Windows and
Linux. 0.8.0 and 0.8.1 were tagged and never published, so 0.8.2 is the
first release that carries what they hold. Its theme says it: "a stranger
can start from nothing".

What you get:

- **A starter site in three looks**, Sunrise, Meadow and Harbour, each with
  large, clear text and strong contrast.
- **Setup that walks you through GitHub** and signs in with a short code.
- **Buttons that stay where they are.** A warning or hint opens in a box
  over the page instead of pushing everything down.
- From 0.8.3: a Privacy link wherever Google is offered, and **turning off
  visitor numbers now deletes the Google key and the saved figures** from
  your computer, even when Google cannot be reached.

### The same Windows fault

Checking 0.8.1 by hand on Windows found the same symptom as finbreak's.
**On Windows, Update closed Pressless and nothing came back**, so the update
never happened. 0.8.2 fixes it. As with finbreak, an older copy cannot be
mended by its own button: update by downloading 0.8.2's zip.

An earlier hand check, of 0.8.0, found two faults with odd shapes. **A copy of Pressless
moved to another folder kept building your site in the folder it had been
moved from**, and the first publish failed. And with the Meadow look, **your
site's own styling laid out Pressless's editor in two columns.**

The checks only a person can do, which I said last week were still open,
are done: an update from 0.8.2 to 0.8.3 passed on both systems.

Waiting for the next release, and it changes how you write: **you edit a
page by clicking on it and typing, shown as it will look**, with a panel
beside it for pictures, buttons, video, music and columns. You can add,
remove and rename pages, and the menu keeps up. And Pressless will ask,
once, whether it may send anonymous usage reports. Nothing is sent unless
you say yes, and a report never holds your writing or your site's address.

## Groundwork: its first two releases

**Groundwork** is new here. It sets up a fresh openSUSE computer: you choose
a language, pick what you want level by level, review it, and apply it all
with one password. **0.1.0** came out on the 10th and **0.3.0** on the 13th,
each with a Linux download. 0.2.0 was never released; its two finished
items are in 0.3.0.

0.3.0 is themed "A machine that keeps running". Among its new items:

- **RAM protection.** When memory runs short, the most memory-hungry app is
  closed before the desktop freezes.
- **A freeze recorder**, which notes what was using memory whenever it runs
  short, so the cause of a freeze can be found afterwards.
- Video playback on the graphics card for AMD graphics, virtual machines,
  game controllers and GameMode, a 1 GB cap on the system log, and a 3-second
  boot menu.
- Two of my own apps: **OneUp**, offered beside openSUSE's own updates, and
  **Ants Terminal**, set as the terminal.
- **Colour themes**, following the desktop's light or dark, with high
  contrast among them. A test holds every theme's text to readable contrast,
  and it caught one theme's selection colour at 4.0:1, below the 4.5:1 floor.

### A setting that could never be applied

The find was in the boot-menu item, before it shipped. On computers whose
boot-menu wait had never been changed through openSUSE's tool, **its check
needed administrator rights to read the setting, and the check never runs
with them.** So it always answered "couldn't tell".
Groundwork only applies an item that reads "not done", so it skipped this
one every time. On those computers the shorter boot menu could never have
been applied. It now reads "not done" there.

A run on a fresh Tumbleweed install found the other: **on Wayland, the
window grew past the bottom of the screen** from the second page on, hiding
Back, Next and Apply. 0.3.0 keeps it on screen.

## OneUp: three releases, and one that never appeared

**OneUp** published **1.4.7** on the 10th and **1.4.8 and 1.4.9** on the
13th, each with the Linux download.

**1.4.6 was tagged on the 8th and never appeared on GitHub.** Its build sat
on one test for six hours before GitHub gave up. 1.4.7 is the same app with
that test fixed, so 1.4.6's fixes reach you through it. Two of them were on
last week's waiting list: **an update that first updated the package manager
itself now finishes the rest**, and removing leftover packages no longer
trips on a package called "Name". A stalled build now stops after 30
minutes.

1.4.8 is mostly about reading the window:

- **Blue links and outlined buttons were hard to read in the light theme.**
  They used the dark theme's pale blue, which measured 1.84:1 to 2.63:1
  against the 4.5:1 that text needs. The light theme's own blue measures
  5.37:1.
- **A run could offer a restore point that did not exist.** When the
  snapshot tool printed an error in its list, OneUp read the error line as a
  snapshot to roll back to.
- Pressing Enter on "Restart now?" now picks No, never Yes.
- Three buttons read "Roll back _reboot" and the like, where an "&"
  belonged.

1.4.9 fixes the release page itself: **1.4.7's and 1.4.8's GitHub pages held
only a "Full Changelog" link.** Each now lists that version's changes.

Waiting for the next release: three window layouts to choose from, a
download size and progress for each package, and clicking a package to see
what it is and what changed. Old update logs are deleted after 30 days, and
a switch stops OneUp asking GitHub for a new version as it starts. And one
of OneUp's own tests, for a setting typed as something other than a number,
could never fail. It can now.

## Ants Terminal 0.7.114: every tab by name

**Ants Terminal 0.7.114** was released on the 12th, with the Linux download.

- **A Tab List panel** shows every open tab by its full name, down the left
  of the window, and sorts them four ways.
- **Go to Tab**: press Ctrl+Shift+H, type part of a tab's name, press Enter.
- Tabs survive restarts, shutdowns and log-outs.
- Two from last week's waiting list: **the AI Assistant shows its answer as
  it arrives**, and Ants Terminal ships a copy of demoreel.

Last week's find was a check that skipped itself whenever its cache was
cold, and still let the push through. 0.7.114 closes a second gap of the
same kind: a nightly job keeps the memory-safety test build ready, so that
step of the check runs instead of being skipped.

This week's check went the other way. **The nightly memory-safety test run
was killed two nights running with every test it had finished passing**,
because it ran out of its 22 minutes. It has 30 minutes now.

Waiting for the next release: **searching the scrollback for a space froze
the window**. It now skips the blank space after the end of each line, and
is about ten times faster over 50,000 lines. A large picture shown in the
terminal no longer holds the window for about a tenth of a second, and
eight more windows can be resized and remember their size.

## Vestige 0.1.76: the meadow gets its trees, for real

**Vestige 0.1.76** was released on the 12th, for Linux and Windows. Its theme
is "Menus, sound and a meadow with trees", and it carries everything I
listed as waiting last week: the menus that had never been drawn, now drawn
and clickable; graphics presets from Low to Ultra; the interface in five
more languages; background sound zones; spoken lines with captions; and the
cloudy sky.

### Trees that lived on one computer

The find came while cutting the release. **The downloaded meadow had no
trees, pond plants, shrubs, rocks or logs.** Those models lived only on my
machine, so the release builds never got them. Two weeks ago the meadow
lost its trees to a safety check; this was a second way to lose them. 0.1.76
ships them.

The release page was the next fault. **Like OneUp's, it held only a "Full
Changelog" link.** It was fixed by hand, and the next release will be the
first to take its notes from the changelog by itself.

Filming a trailer from the 0.1.76 download turned up seven faults. Among
them, all fixed and waiting:

- **The game forgot the language you chose on every start**, resetting to
  English.
- **The editor's Audio panel existed, but no menu could open it.**
- The pause menu showed faintly through Settings.

Also waiting: **the meadow has sound**, wind in the grass, birdsong and
insects, from three free field recordings. The birds fall silent at night.

## demoreel: three releases, from languages to trailers

**demoreel** released **0.4.0, 0.7.0 and 0.8.0**, with no files attached. It
is still installed from source. demoreel records short demo videos of an
app, and this week it learned to make trailers.

- **0.4.0, "Speaks your language"**: last week's waiting list. Messages in
  sixteen draft languages, and typed text can come from a file, so it no
  longer sits on a command line other users can read.
- **0.7.0, sound**: a film keeps its clips' own sound and can have music,
  and a recording can include the app's sound. A recorded app is never
  heard on your speakers.
- **0.8.0, trailers**: a clip in a window with rounded corners and a
  shadow, a slow push-in or zoom on one spot, text that slides in, a logo
  that grows as it fades in, wipes and slides between scenes, slow motion
  and freeze frames, and a sound at a chosen moment.

The finds were mostly measurements that came out wrong:

- **`demoreel check` said the faster recorder was ready when it could not
  write the video**, and then when it could not even start.
- **A 5-second recording measured up to 5.55 seconds** on a busy machine. It
  now measures 5.03 to 5.16.
- The note that warns of a stuttering video **read 39% new frames as 73%**,
  and so stayed silent.
- Music taken from a video whose picture runs 8 seconds but whose sound runs
  2.5 **left the film silent after 2.5 seconds.**

Waiting for the next release: install packages for Debian and Ubuntu, Fedora
and openSUSE, and Arch, and an openSUSE Build Service repository so updates
arrive with your system's own.

## DOOM Ants 0.7.4: last week's list ships

**DOOM Ants 0.7.4** was released on the 8th, for Windows and Linux, with 33
items shipped since 0.7.3. Everything I listed as waiting last week is in
it: the glowing wall counted twice, the window that ended the game when
minimised, the game that opened the wrong game from another folder, and the
map that could stall the ray-traced view.

New in it:

- **Classic's menus use the same sharp text as the other two views**, and
  its Video menu lists only the settings Classic uses.
- **Outdoor floors in the most detailed view showed a repeating grid.** The
  patches meant to hide the repeat were exactly one floor tile wide, so
  their seams lined up with it.
- **The noise filter in the ray-traced view switched off its own edge
  detection**, by overestimating how noisy each pixel was, and blurred
  across real detail.
- A setting of more than 8 sound channels was ignored. **The mixer always
  had 8**, so a ninth sound at once was dropped.

## Album Builder: three releases, and a familiar break

**Album Builder** released **0.9.4 and 0.9.5** on the 8th and **0.9.6** on
the 10th.

- **Add music**: drag songs or whole folders onto the window. They are
  copied into your music folder and your originals are left alone. A song
  with a taken name is kept as "Song (2).mp3", and you are told.
- **Find Duplicates** lists exact copies and likely copies. It never deletes
  a song.
- An older copy of the app no longer wipes settings a newer one saved.

0.9.4 went out with only a Windows download. **A file the Linux build
downloads was replaced upstream by a newer one with a different name**,
and the build stopped. The note on the fix says 0.8.0 broke the same way, as I wrote two
weeks ago.
0.9.5 brought the Linux download back, and the build now follows the
replacement by itself.

Waiting: **stopping music as the window closed could, rarely, freeze the
app.** A watchdog added to the tests caught it in 3 of 60 runs before the
fix and none of 60 after.

## UT Ants: light, measured

**UT Ants** still has nothing to download. The week went into lighting, and
into checking it against a reference that traces how light really travels.

- **The sky now lights the rooms open to it**, and maps with a clear sky
  have a sun, drawn as a disc in the sky and in water.
- **Bounced light is four times stronger**, because the original game's
  textures are stored about four times darker than the surfaces they show.
- **A flat fill light added up to 1.6 times the true light**, measured
  against the reference. It is gone.
- **Shadows are worked out ahead of time.** On the map DM-Bishop at 4K, a
  frame went from about 80 milliseconds to about 18.

The finds: **a glowing white panel between two wall lights** on DM-Phobos
was a secret door whose surfaces named no texture. And on one map **the
sky drew black** once that flat fill was gone, because the sky was painted
on the inside of a closed box. It is a real sky now.

All 127 maps added on the 7th were prepared and timed at 4K on High. Six
still miss 60 frames a second.

## Local Web Server Manager: a review before 0.3.0

**Local Web Server Manager** published nothing. The next release will be
**one release, 0.3.0**, carrying what was planned for 0.2.0, after a review
that returned 84 findings. They are now worked through.

What waits in it:

- **It can ask a running site whether it works**, showing "HTTP 200", "HTTP
  500" or "no response", so a site that is running but broken no longer
  looks fine.
- **It remembers the port each project really ran on.**
- **A starting project shows how long it has taken**, and says "slow" past
  30 seconds.

The finds a person would have met: **a slow system froze the window once a
second**; "Firefox" showed as "Firefo"; and a server on an unusual address
showed as running when Open would have reached nothing. And for people who
read the screen as I do: **a row's buttons stay inside a 600-pixel magnifier
view again.**

Last week's waiting list is still waiting for 0.3.0.

## Short notes

**Perch 2.0.0** was released on the 8th, with the Linux download, and last
week's table fix is in it. **With Start at login on, the download never
started at login**: the login entry ran a command the download does not
install. A position in a rule now counts from the monitor the rule names.

**Snatch 1.2.0** was released on the 8th, for Windows, macOS and Linux.
Search can keep only recent videos, results show when a video was uploaded,
and every build now starts the app it built and checks that it works.

**Slipcase 1.3.1** was released on the 10th, for all three systems, with the
three fixes I listed last week as waiting: clicking quickly through search
results no longer freezes the window, a cover sent one byte at a time is
cut off at the time limit, and replies from the cover-art services are
capped at 25 MB. Also: a cover from an earlier search no longer appears
beside a newer result.

**Games Hub** published nothing. Waiting: Klondike, Spider and FreeCell now
move cards by clicking as well as dragging. **In FreeCell, double-clicking a
card buried under others sent the column's top card home instead.**

**RetroArch** (my fork) had more fixes taken into official RetroArch. On the
9th none of the fixes I had sent was still waiting there. Four more, sent
on the 10th, were accepted the same day, and one more was sent on the 11th.

**LottoTracker** now refuses a commit holding text from a lottery SMS when
the commit is made, not only when it is pushed.

**RetroDB** updated two parts it builds on, for published security flaws,
and published nothing. **Contact List** moved only in its own records.

**Hell's Gate**, my openSUSE build support for a port of Dante's Inferno, has
three new changes on GitHub. I keep no copy of it on this machine, so I can
say no more about them.

**Quiet this week:** MAME Curator and Rolodex. Rusty PSN has no public
repository yet, so there is nothing to read.

## What changed on the site

New downloads picked up this week: **Album Builder 0.9.6**, **Ants Terminal
0.7.114**, **DOOM Ants 0.7.4**, **finbreak 1.0.1**, **Groundwork 0.3.0**,
**OneUp 1.4.9**, **Perch 2.0.0**, **Pressless 0.8.3**, **Slipcase 1.3.1**,
**Snatch 1.2.0** and **Vestige 0.1.76**.

**finbreak is now listed as Live.**

**Three new pages.** Groundwork's, with its logo and four screenshots.
Hell's Gate's. And Rusty PSN's, with its new logo, three screenshots and a
plain credit to RainbowCookie32.

**Trailers.** Pressless, Slipcase, OneUp, Album Builder, Ants Terminal,
Vestige and demoreel have trailers on their pages, and the site links to
the YouTube channel.

**Pressless has a privacy policy page** on this site, and its page describes
the new setup and the starter site.

**Vestige's page claims only what its download can show.** It calls the
script editor early and unfinished, and confirms the photosensitive safe
mode in 0.1.76. RetroArch's page lists the fixes accepted on 2, 5, 8 and
10 October.

Other pages caught up with what each project shipped: OneUp's 1.4.8 and
1.4.9, demoreel's three releases, finbreak's Windows update fix, Album
Builder's Add music and duplicate finder, Slipcase's 1.3.1, Perch's rules,
and the Ants Terminal and Vestige releases. Groundwork's page describes its
second release, names openSUSE Slowroll, and says where OneUp and Ants
Terminal are offered. Contact List's page claims less about GNOME, UT
Ants's page has a note on its torches, and Slipcase's box animation now
turns to an angle and back.

Also: the "Report an issue" link is hidden for projects that have issues
switched off, and the private stats page I keep for myself is sized for my
4K monitor, with its tables side by side and flags beside the visitor
countries. The rules for building the site moved into files that load
only when needed.
