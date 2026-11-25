---
title: Four times faster, and a code read backwards
date: 2026-11-25
summary: Pressless published four releases in a week, and now publishes photographs about four times faster. LottoTracker published its first downloads and reached 1.0, Ants Terminal published its first release in almost a month, and OneUp 2.1.0 brought everything last week's post said was waiting. Twenty-one projects moved and four were quiet.
projects: pressless, lotto-tracker, ants-terminal, frameledger, oneup, rolodex, fin-break, album-builder, local-web-server-manager, perch, doom-ants, ut-ants, retrodb, defragr, vestige-engine, snatch, mame-curator, games-hub, demoreel, groundwork, retroarch
---

**Twenty-one projects moved this week and four were quiet**, the same
as last week. Ten of them published releases with downloads attached:
nineteen releases in all.

This week's thread is speed. Pressless publishes a batch of photographs
in about a quarter of the time. A full tab of Ants Terminal's history
fell from 614 MiB to 105.6. DOOM Ants loads its HD art in a fraction of
a second.
And the oddest bug of the week: in Hebrew or Arabic, **Rolodex showed a
two-factor code "123 456" as "456 123"**.

## Pressless 1.1 and 1.2: your language, a tray icon, and much faster

**Pressless 1.1.0** and **1.1.1** were released on the 21st, **1.2.0**
on the 23rd and **1.2.2** on the 24th, for Windows and Linux. 1.2.1 was
tagged but never released: its build failed on Linux and Windows, and
everything meant for it is in 1.2.2.

1.1.0 brings **Pressless in Spanish, Afrikaans, French and German**:
its screens, its manual and its video captions. Each site has its own
language too, which its dates and words such as "Older →" follow. **A
Pressless icon sits by the clock**, so you can open it again after
closing the browser, or restart and stop it.

1.1.1 adds **Send my log**. When something goes wrong, one button sends
Pressless's two log files privately to me, and nothing goes until you
press Send. 1.2.0 then carries on in the tab you were in after a restart
or an update, instead of opening a new one.

1.2.2 is the fixes from a code review on the 23rd, and much of it is
speed. All of these were measured:

- **A publish of 24 camera photographs and 4 large PNGs** went from 16.3
  seconds to about 4.1.
- **Building a site of 300 entries** went from 12.5 seconds to 3.3.
- **Bringing a site in from GitHub** went from 80.5 seconds to 12.7,
  against a stand-in.

Pressless also uses fewer photograph helpers when your computer is short
of memory. A publish too big for GitHub's hourly allowance now waits it
out with a countdown, rather than failing.

One fix has a memorable shape. **Saving a new look for your site sent
it out with the next entry you published**, whether you were ready or
not. A saved look now waits until you press Press to site on the Look
screen, which shows you what will change first.

## LottoTracker: a first download, 1.0, and older Linux

**LottoTracker** published its first downloads this week, after last
week's post said it had none. **0.2.0** and **1.0.0** were released on
the 18th, and **1.1.0** and **1.1.1** on the 21st, each as a Linux
AppImage.

1.0.0 gives the page a finished look. **Every win is a small lottery
slip in its game's colour**, and payment shows as a rubber stamp. A win
that cannot be checked has a dashed outline, so it can never pass for
R0.00. **You can now accept a win the bank has not fully paid**, so it
stops showing as waiting. Every section on every tab folds away.

The 0.2.0 download needed openSUSE Tumbleweed's very new C library, so
it would not start on many older systems. **1.1.1 runs on Ubuntu 22.04,
Linux Mint 21, Debian 12 and newer.**

Waiting: **an Android app**, which builds but is in no release yet. The
first test on a phone found that **a locked phone showed the ticket's
game and draw date** in its evening reminder. The reminder now says only
that LottoTracker has one for you. Google Play Protect blocks the app
because it reads SMS, so the README explains installing it through
Obtainium, a free app installer.

## Ants Terminal 0.7.116: far less memory

**Ants Terminal 0.7.116** was released on the 24th, as an AppImage. It
is the first release since 0.7.115 on 30 October, and it holds last
week's waiting items.

**The scroll history takes far less memory.** A tab holding 50,000
lines at 200 columns used 614 MiB, and now uses 105.6 MiB. Each tab's
history also has a limit, 256 MiB by default, set in Settings.
**Re-wrapping a large history after a resize** is about 2.5 times
faster: from about 86 ms to about 35 ms on a full 50,000 lines.

Also in 0.7.116: **size a window in columns and rows of text**, and put
the tab list on the right. Running the AppImage adds Ants Terminal to
your app menu. Searching a very long history no longer freezes the
window.

Waiting: Help → Report an Issue opens GitHub's issue form with your
system details filled in. You send it yourself, and no log is attached
unless you choose to.

## frameledger 0.7, 0.8 and 0.9: ready for strangers

frameledger measures how smoothly a game runs, frame by frame.
**0.7.0** was released on the 19th, **0.8.0** on the 21st and **0.9.0**
on the 23rd.

- **0.7.0 draws a run as a graph on a web page**, which opens from disk
  and fetches nothing. A "Larger text and lines" switch comes first on
  the page.
- **0.8.0 promises that a run file it reads today** will be read the
  same by every later release.
- **0.9.0 installs with pip or pipx**, and has a user guide whose
  examples are run and checked on every change.

One fix in 0.9.0 has this week's best shape. **A mistyped page name,
such as `--html old-1.csv`, could destroy a recording**, because the
graph page was written over it. frameledger now replaces only an earlier
frameledger page.

Waiting: **a run whose frames claim to take days made one check run for
hours.** It now judges at most 24 hours. An error inside frameledger
used to end with the same code as a failed comparison, so an automatic
check read it as a slowdown. It now ends with a code of its own.

## OneUp 2.1.0: what was waiting, and a setting to switch on again

**OneUp 2.1.0** was released on the 23rd, with everything last week's
post said was waiting. **The AppImage updates itself.** A check that
could not tell no longer says "Everything is up to date". OneUp no
longer removes leftover packages it could not check. An update with
32-bit packages no longer stops part-way.

**If you use password-free updates, switch them on once more.** 2.1.0
changes the small helper that setting installs. OneUp trusts only the
helper it would install itself, so the setting shows as off until you
do.

Two more from a code review. **Pressing Ctrl-C while packages
downloaded left the download running on its own**, with the package
manager locked. And the Restart services button could act on a wrong
name in an update's report, which **could have restarted or powered off
the computer**. It now restarts only services that are running.

Waiting: "Open log file" opens the log again in the AppImage, and
"What's new" opens at the newest notes, not scrolled to the end.

## Rolodex 2.1 and 2.2: seven new languages, two right to left

**Rolodex 2.1.0** and **2.2.0** were both released on the 18th, with
last week's waiting items: **a Flatpak download, German, French and
Spanish, and in-app updates on Windows.**

2.2.0 adds **Simplified Chinese and Japanese**, and **Hebrew and
Arabic** with the window laid out right to left. Mirroring the window
turned up the week's oddest bug: **a two-factor code "123 456" showed
as "456 123"**, and phone and card numbers ran backwards. Digits now
keep their order.

Waiting: **Rolodex is to be renamed Tinbox**, with a new app ID, in a
single release.

## Short notes

**finbreak 1.1.0** was released on the 18th, with last week's waiting
fixes: **a failed update on Windows no longer deletes finbreak**, and
Standard Bank home-loan repayments show as money in. It comes in
Arabic, Simplified Chinese, French, Hindi and Spanish, marked
machine-translated until a native speaker checks them. **A transaction
described as a "closing balance transfer" was read as the statement's
closing balance.** Waiting: each account can have its own currency, and
finbreak never adds two currencies together.

**Album Builder 1.2.0** was released on the 18th. **The Linux AppImage
updates itself**, and a damaged playlists file no longer stops the app
starting. Waiting: a mini player, browsing by artist or album, favourite
hearts and play counts, and a Windows installer that updates itself.

**Local Web Server Manager 0.6.1** was released on the 18th. Messages
now sit in a box at the foot of the window, so nothing moves when one
comes or goes. Waiting: **a tray icon**, a Stop all button, and an
offer to start again any servers it left running that have since
stopped, after a restart for example.

**Perch 2.0.2** was released on the 21st. **An app that locks behind a
small password window reopened tiny**, because Perch saved the password
window's size as the app's. Quitting no longer leaves Perch hanging.

**DOOM Ants** published nothing, and last week's waiting fixes still
wait. New: **Ultra's HD art loads in 0.14 to 0.29 seconds** once
cached, against 4.3 to 15.7 from PNGs, and takes 156.4 MB of video
memory instead of 814.4. **The 3D views drew every floor and ceiling
picture mirrored**, so skulls and arrows pointed the wrong way. The game now
adjusts its own resolution to hold the frame rate.

**UT Ants** still has nothing to download. New: **weapons make their
sounds**, maps hum, and the Redeemer and Translocator work. **On
DM-Deck16][, 49 of 198 test jumps left the player hanging in the air**
against an edge. None does now.

**RetroDB** published nothing; 4.0.0 is being built. **The 3D box
opens**, showing the disc or cartridge inside, and cases follow each
region's real shape, some measured with my own ruler. **Calculate File Sizes
always said "Updated file sizes for 0 games".** It now says what it
found.

**DeFragR 0.2.0** and **0.2.1** were released on the 18th as source
only, with no download. They bring last week's waiting drive map and
the window's translations, and 0.2.1 has packages on OBS for openSUSE,
Fedora, Debian, Ubuntu and Arch. Waiting: **DeFragR defragments**: pick
a folder on an ext4 drive and watch the moves on the map. It checks each
file reads the same after its move, and stops at once if one does not.

**Vestige** published nothing. Waiting: **the interface size setting
grew the menus' boxes but not their words.** The text now grows too. A
deleted object kept playing its looping sound, and lip-sync moved half
as fast at 30 frames a second as at 60.

**Snatch** published nothing. Waiting: **Refresh Cookies deleted your
saved cookies.txt**, and it no longer does. A queue with failures said
"All queued downloads finished!". A subtitle that fails to download no
longer loses the video.

**MAME Curator** published nothing, so last week's waiting list still
waits. New: **a very large library made the app refuse to read the
file it had just written**, past a 1 MiB limit. The Library now loads
more games as you scroll, where it stopped at the first 200.

**Games Hub** published nothing. New: **Twisty Cube**, Mahjong under
Chinese Official and Japanese Riichi rules, and seasons along Ruin
Runner. **On a 4K screen Ruin Runner Lanes ran at about a third of its
speed.** It now keeps real time.

**demoreel** published nothing. Last week's next step is built:
**`demoreel window` records an app from a window**, and it is in the
applications menu.

**Groundwork** published nothing. Sharing folders on the network no
longer fails when part of a folder's path is missing, such as an
unplugged drive.

**RetroArch** (my fork): I opened pull request #20166 with official
RetroArch, for a time test that fails in a 24-hour locale.

**Quiet this week:** Hell's Gate, Slipcase, Contact List and Rusty PSN.

## What changed on the site

New downloads picked up this week: **Pressless 1.1.0, 1.1.1, 1.2.0 and
1.2.2**, **LottoTracker 0.2.0, 1.0.0, 1.1.0 and 1.1.1**, **frameledger
0.7.0, 0.8.0 and 0.9.0**, **Rolodex 2.1.0 and 2.2.0**, **Ants Terminal
0.7.116**, **OneUp 2.1.0**, **finbreak 1.1.0**, **Album Builder
1.2.0**, **Local Web Server Manager 0.6.1** and **Perch 2.0.2**.

**LottoTracker is live at 1.0.0.** Pressless's page covers each
release, and its privacy policy follows the app's own: it says what Send
my log sends, that a sent log can hold Google's error text, and where
your keys go with no password store. DeFragR's page lists its packages,
Snatch's names its Tumbleweed package, and Album Builder's says it is on
OBS and asks speakers to check its translations. Rolodex's page covers
its four new languages. Pages caught up with each release above.

The libraries that turn these posts into web pages were updated.
