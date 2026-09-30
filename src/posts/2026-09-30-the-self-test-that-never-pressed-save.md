---
title: The self-test that never pressed Save, and ten projects with new downloads
date: 2026-09-30
summary: Two Windows downloads, Album Builder's and Snatch's, failed the moment they saved a file — and both had passed their release checks, because no check ever saved one. Every one of the twenty projects moved this week and ten of them published new downloads. Four learned to update themselves, and Pressless tripped on the same missing signing key that Rolodex did last week.
projects: album-builder, snatch, pressless, vestige-engine, mame-curator, doom-ants, ut-ants, ants-terminal, fin-break, demoreel, contact-list, games-hub, rolodex, perch, slipcase, lotto-tracker, local-web-server-manager, oneup, retrodb, retroarch
---

**All twenty projects moved this week and none was quiet**, against sixteen
and four last week. Ten of them published a release with downloads attached.

Two threads ran through it. The first is in the title: a Windows download
that passes every check and then fails at the one thing every program must do,
which is save a file. It happened twice, in two unrelated apps.

The second is last week's headline coming back. Last week Rolodex's "Update
now" button turned out to be checking updates against a blank key. This week
four more projects learned to update themselves — and one of them repeated
the mistake before it was caught.

## Album Builder: six releases, and a Windows download that closed itself

**Album Builder** published six releases between the 25th and the 28th,
**0.8.0 to 0.9.3**, with downloads for Windows and Linux.

What is new if you use it:

- **Every kind of music file now shows its details.** Last week I wrote that
  nine of the twelve formats showed no information at all. 0.8.0 fixes that:
  title, artist, album, artwork and volume levelling now work for FLAC, Ogg,
  Opus, M4A, WMA, WAV and AIFF as well as MP3, and five more kinds of file are
  picked up.
- **Eight languages**, including Arabic and Hebrew, which mirror the whole
  window right to left. The translations are AI drafts and have not been
  checked by native speakers yet.
- **The Player tab has its own library**, so you can search and play without
  switching tabs.
- **Choose your music folder from inside the app**, and **bring back an album
  you deleted**.

### The download that vanished a moment after opening

0.9.2 exists for one reason. I ran the 0.9.1 Windows download on a test
machine and **it closed itself within seconds**.

The cause: when the app saves a file, it finishes with a step that exists on
Linux and does not exist on Windows. The save itself had already worked. The
step after it failed, and the failure took the whole app down. So the app
died the first time it saved its settings, which is a moment after it opens.

The part worth keeping is why nothing caught it. The note on the fix says
**likely every Windows build since 0.8.0 was affected** — and the two checks
every release runs on the finished download, asking it for its version and
running its self-test, both passed each time. **Neither of them ever saves
anything.**

It also gives 0.8.0 an unhappy shape. That release went out with only a
Windows download, because the Linux build failed: a part it downloads had
been withdrawn and replaced upstream. 0.8.1 brought the Linux download back
the same day.

Two more from the same few days. On a 1280-pixel-wide screen the window
opened 1,451 pixels wide, hiding the menu and tabs off the right edge; 0.9.3
makes it fit. And one of the Linux build's own checks **could never fail**:
it was written in a form that the build script is allowed to ignore, so it
passed whatever it found.

Waiting for the next release: on Windows the two main tabs drew as white
boxes with faint text.

## Snatch: the same bug, one project over

**Snatch 1.1.1** was released on the 25th, with downloads for Windows, macOS
and Linux. Last week it was quiet.

Its headline is the same story. **Since 1.1.0, the Windows build could not
save your settings, your download history or your Firefox cookies.** The save
code used a file-permission call that the Windows build's version of Python
does not have, and the error stopped every save. 1.1.1 skips the call where
it does not exist.

And the same reason nothing caught it: the build could pass and still produce
an app that fails when started. That is closed now. **Every build starts the
app it just built**, and the check includes saving a settings file.

Also in 1.1.1: the built-in player uses your selected browser's login, as
downloads already did — it could be playing with an old saved copy instead.

Waiting for the next release: a filter to keep only recent videos in search,
an upload date on each result, and a Log button that says where the
diagnostic log is. The Resolution column, **which never showed anything**, is
gone.

## Pressless: three numbers, one release

**Pressless 0.6.1** is out, for Windows and Linux. It is the first release
since 0.1.2, and it carries everything from two releases that were tagged and
never published, 0.5.0 and 0.6.0. The number jumps because release numbers
now follow the roadmap's milestones.

What it brings:

- **Undo the last publish**, which I described last week as waiting.
- **Photographs.** A button in the editor keeps your photograph and puts it
  where you were typing. The original is kept untouched.
- **Your other pages.** Fixed pages, the header, the footer and the
  navigation can be edited from your list.
- **Templates** for a new entry — a poem, a lyric with verses, an entry
  around one photograph, a plain journal entry — and a cheat sheet under the
  writing box.
- **Throw an entry away**, or **change its web address**: the old address
  then forwards readers to the new one, so shared links keep working.
- **A look of its own**, light or dark to match your computer.
- **It updates itself**, and installs only a release I have signed.

### The key that did not exist yet

That last item is why 0.6.0 was never published. **0.6.0 was built before the
key that signs releases existed.** The list of keys it trusted was empty, so
a copy of 0.6.0 could never have checked an update, and so would never have
offered one. That is last week's Rolodex story exactly, one week later, in a
different project. This time it was caught before anyone downloaded it.

Two more. The Linux download **could not reach GitHub or Google at all** on
systems such as openSUSE — it said it could not connect — and could not open
your browser there either. finbreak had shipped the same fault before it.
And typing a category as "Poems" rather than "poems" **stopped
every preview and every publish**; it is now stored in the plain form.

One correction to something I wrote two weeks ago. I said Pressless can import
a whole WordPress archive. The import exists, but it runs only on my own
computer. One that anyone can run is planned, and the Pressless page on this
site now says so.

The checks that only a person can do, which I said were owed first, have
begun on Windows.

## Vestige: none of the engine's systems were running

**Vestige 0.1.75** went stable on the 29th, with downloads for Linux and
Windows, and a preview of 0.1.76 followed the same day. The project's
changelog does not yet sort this week's entries under either number, so I
will not claim which release holds which.

The find of the week: **no engine system had ever updated in the real app.**
Weather and wind, audio that follows the camera, reverb, music, footsteps,
on-screen notices — every one of them waited to be switched on by a notice
that nothing ever sends. They ran in the tests and nowhere else. They now run
from start-up, at a measured cost of 0.05 milliseconds a frame.

Last week I un-ticked the scripting system for the same kind of reason. The
Vestige page on this site has now dropped its claims of ray tracing and of
running scripts, which it does not have yet.

More of the same family:

- **The meadow had quietly lost its trees.** A safety check on file paths
  refused every model that was linked in from a folder outside the project:
  **9 tree species and 656 props, dropped without a word.**
- **SMAA was not SMAA.** That anti-aliasing setting used home-made lookup
  tables and home-made steps. One of the two tables was generated and then
  never read. It is the reference version now.
- **Undoing a slider drag walked it back one frame at a time**, because every
  frame of the drag was recorded as its own step.
- **A straight 60-metre camera path measured 281 metres**, because its first
  and last stretches swung tens of metres off the curve.
- Saved scenes were stamped with engine version "0.5.0" — **a version Vestige
  has never been.**

The editor can now also **update itself**, and shows every change since your
version before you agree. It says of itself that it works from the first
release built with it; earlier builds need one manual download.

And the demo video on this site got fixed at the source. The first one was
choppy: about 3.5 new pictures a second, from an engine drawing 52 to 62.
Vestige now renders its fly-through one frame at a time, and the re-cut video
has 30 new frames in every second of camera movement.

## MAME Curator: its first release since May

**MAME Curator 1.3.0** was released on the 28th. Last week it was quiet; this
week it was the sixth busiest project. The files attached are the Python
package, for people who install it that way.

1.3.0 fixes a run of things that looked fine and were not:

- **The Windows launcher stopped before starting the app, on every Windows
  machine.** Its check of your Python version always answered "too old".
- **Every game's genre was a version number.** The file that lists genres
  also lists the MAME version that added each game, under the same names, and
  the second list overwrote the first. The genre filter read "0.162".
- **The Copy button in the preview only closed the window.** The preview said
  "Review the diff and confirm to copy".
- **The copy counter stayed at zero for the whole copy.**
- **Emulation quality read "unknown" for every game**, which left the setting
  that drops barely-working games with nothing to go on.

Also in it: other websites can no longer change the app's settings through
your browser, the Help page has content instead of "No help topics
available", and the library loads in 5.7 seconds instead of about 22, by
reading one large file once rather than four times.

Waiting for the next release, and it is a lot: **download one file and run
it**, for Linux, Windows and macOS, with nothing to install; **update the app
from Settings**; and using the artwork another front-end has already
downloaded. One fix in that queue deserves a warning because the fault is in
1.3.0: restoring a settings snapshot could delete your picks, sessions and
notes.

## DOOM Ants 0.7.3

**DOOM Ants 0.7.3** was released on the 28th, for Windows and Linux. Three
weeks of work I had been listing as "waiting" is now in a download: the
optimiser switched on, the keypad keys, the invented par times, the saves
that record which build wrote them.

New this week, and also in it:

- **The Solid renderer is much faster.** It had been reading the level back
  out of graphics memory every frame to see what had moved, which is slow.
  It keeps an ordinary copy now. Standing still at the start of E1M1 on my
  machine, the frame rate roughly tripled. At the start of E1M3, where there
  are many glowing objects, a second fix of the same kind nearly tripled it.
- **Co-op games quit at the first level exit.** Three checks in the 1997
  source meant "is the game in French?" and, by the way they were written,
  **always answered yes**. Co-op asked for a French-only picture and quit
  when it was missing. Multiplayer chat ran every key you pressed through the
  French keyboard layout. It was found by asking the linker which code
  nothing could reach: the English keyboard table was on the list.
- A crowded map with more than about 4,000 things used to **leave some out of
  the ray-traced view without a word**. It says so now.
- The ray-traced view converted colours with an approximation that was up to
  59% off in the darkest ones.

One honest entry: a rewrite that was expected to speed up one step was
measured, found no faster, and reverted.

## UT Ants: a map that ate the machine

**UT Ants** still has nothing to download. The week went into the tools that
build a map, and into maps that broke them.

- **Building one map grew past 16 GB of memory and had to be stopped.** Its
  light probes now stay within reach of the play area, and the build fits.
- **Another map needed 1.9 GB of textures against a 1 GB budget**, and was
  refused. You can now ask for it to be fitted: invented detail is given up
  first, original detail only after. That map now opens at 476 MiB, having
  lost none of the original.
- **Textures whose sides are not a power of two were skipped** — 64 by 72,
  for one. They are stretched to fit now instead.
- **A staircase was being read as a wall** by the tool that works out where
  bots can walk.
- **Map notes that could not be read looked like empty notes**, and the next
  keystroke replaced them. They are never overwritten now.

Two checks that checked less than they claimed. A pair of tests threw away
the count of failures they were given, so a failing case would have passed
both unnoticed. And when the renderer's tests were first run under a stricter
validator, **50 of the 52 failed**, all on one ordering mistake.

Last week I said the haze had been cut to a quarter. Brightness has moved
twice since, so it was measured again against the original game on three
maps, and it doubles.

Speed, all with identical output: working out bot routes is about five times
faster, and building a map a second time takes about half as long if you ask
it to keep the textures it made.

## Ants Terminal: nothing released, and a release that nearly forgot a week

No **Ants Terminal** release this week. Everything below waits for 0.7.112.

Its release notes were put together this morning, and that turned up the
week's best find in this project: **the release would have gone out with the
whole of the past week missing from its notes.** The changelog held two open
sections, and the step that rolls one into the other does nothing when the
target already has entries. They were merged by hand, 232 entries before and
232 after. I have also decided to stop cutting previews: every release will
be a full one.

What you would notice in 0.7.112:

- **The Linux download (the AppImage) updates itself.** The menu bar says when a new version is
  out; one click downloads it, checks its signature and swaps it in.
- **A welcome window** on first launch, which explains the features and sets
  each one up with one click, showing the exact change first.
- **A long status message no longer makes the window wider.** In the test
  that reproduces it, the status bar demanded 3,258 pixels against a baseline
  of 160.
- **Turning on Session Logging sent every open tab into one shared log
  file.** Each tab gets its own now.

And one check that checked the wrong thing: the test run before every push
**tested whatever files were on disk, not the commits being pushed.**

## finbreak: a full audit, all waiting

No **finbreak** release either; all of this waits. A full audit on the 27th
produced a long list, and every finding is now fixed, already tracked,
refuted or on the roadmap.

The ones a person would have met:

- **Standard Bank PDF statements could import short with no warning.** A
  transaction described as "CLOSING BALANCE TRANSFER" ended the page early,
  and one mentioning a PO Box was taken for the bank's letterhead.
- **A stray quote mark in a CSV made one line swallow the lines after it**,
  and those transactions vanished silently.
- **Pressing Esc during an update download hid the window**, and finbreak
  then restarted into the new version with no warning.
- **A restore that was interrupted told you the vault was corrupt and
  suggested removing files.** It now shows the folder holding your previous
  data and asks you not to delete anything.
- **An ordinary month looked like a spending spike** when you had only a
  couple of months imported, because a month with no statements counted as a
  month of spending nothing.

On the updater, two that matter: someone able to post to the releases page,
without my signing key, could have offered **an older genuine finbreak as a
new version** and it would have installed; and a finbreak started from inside
another program's AppImage **would have replaced that program's file** on
"Update now".

A measured one: a 255 KB PDF whose page unpacks to 256 MB took an import to
about 560 MB of memory. Such files are refused now.

Last week's crash on the first keystroke was fixed in one download and not in
the other two kinds of package, which still carried the mismatched pair. They
are fixed as well.

And the README's badge still said "pre-alpha", after 23 releases.

## demoreel: smooth video of a 3D app

**demoreel** released **0.2.1, 0.2.2 and 0.3.0**, with no files attached — it
is still installed from source.

The big one came from Vestige's choppy video above. Recording a busy 3D app
gave a slideshow, and nothing said so. demoreel was photographing a copy of
the picture that was refreshed only a few times a second. It records the
original now. On Vestige's fly-through, **750 of 751 frames were new, against
156 of 588 before.**

Also new: `demoreel shot` saves one picture instead of a video, `demoreel
check` says whether this machine can record at all, a step that holds a key
down, tab completion, a manual page, and a countdown while recording. A
recording uses about half the memory it did.

The finds:

- **`stop` printed the video's path the moment it was asked**, before the
  video was finished or checked. A script reading the file straight away
  could get half a video.
- **A blank recording made with the 3D option was advised to try the 3D
  option.**
- **On openSUSE and Fedora, every recording failed**, because the video tool
  those systems ship cannot write the format demoreel uses. It now stops at
  once and names what to install.

One change passed every check on my machine and failed on GitHub, whose copy
of that video tool is older. The checks now finish by running themselves
again on GitHub's system.

## Contact List 1.2.0

**Contact List 1.2.0** was released on the 28th, for Linux, macOS and
Windows. Both fixes I described last week are in it: confirmation dialogs a
screen reader can read, and clearing a field now reaching Google.

New in it: contact cards exported as vCards now use the standard fields other
apps read for birthdays, addresses and organisations, and import reads them
back, including the text encoding many phone exports use.

The finds are mostly about Google sync:

- **A contact deleted on Google could linger here**, still linked to
  something that no longer existed.
- **A brief network outage sent you to reconnect your Google account.**
- **When Google said "too many requests", every contact after that point was
  skipped.**
- **Restart most likely just closed the app** in the Linux download: it
  relaunched itself from a temporary folder that disappears as the old copy
  closes.

And one piece of work not done, for a measured reason. A faster search index
was planned. At 10,000 contacts the existing search measured 7.5 to 10.3
milliseconds against a target of 200, so the plan was dropped.

## Games Hub 1.1.0: play without a mouse

**Games Hub 1.1.0** was released on the 27th, for Windows and Linux. It holds
what I described last week — Chess, Reversi, Draughts and Minesweeper from
the keyboard, and the gold light on whoever's turn it is.

Last week I also said the card games were still mouse-only. **They are not
any more.** Klondike, Spider, FreeCell, Pyramid, Hearts and Canasta all take
the keyboard now, which makes it every game that needed it. That part waits
for the next release.

The find: a trial run of the release failed on a check that "an idle window
answers promptly" — 195 milliseconds against a fixed bar of 60. The window
was fine. **The check was timing the machine it ran on, not the window.**

## Short notes

**Rolodex 1.6.0** was released on the 24th, and it corrects me. Last week I
wrote that the real signing key was in place. It was — in the app. The other
half, the private key the release build signs with, had not been given to
GitHub, so releases were still going out unsigned, and an unsigned release
makes no update offer at all. That was done on the 24th, and 1.6.0 published
with a signature for each of its three downloads. Proving an update installs
end to end takes two signed releases, so that waits for 1.7.0. Also waiting:
themes, accent colours and a Preferences window.

**Perch 1.2.0** was released on the 25th, with last week's fixes in it, and a
settings save now takes effect at once instead of after a restart. Waiting:
**switching browser tabs snapped a window you had moved back to its rule**,
and a rule naming a second monitor put the window off-screen by adding that
monitor's position twice. Perch's own tests had also been reaching into my
real desktop session; they are kept off it now.

**Slipcase 1.1.0** was released on the 29th, with no files attached. You can
now render the back of the box — before this, **a back cover you loaded was
accepted and then not used at all**. Searching for cover art was tested
against the real services for the first time, which found that a refused
login reached you as "Expecting value: line 1 column 1 (char 0)". Spines draw
about twice as fast: fonts were being loaded about thirty times per spine.

**LottoTracker** now reads every date as South African time whatever the
computer's clock is set to. Before, a draw could read as the day before or
after on a machine set to another zone. An abbreviated month in an archive
link no longer stops the whole results download.

**Local Web Server Manager** found one of my projects tripping another. A
line of help text in LottoTracker showing an example port was read as its
real port, which invented a clash, and **RetroDB's Start was refused over a
conflict that did not exist.** Also: opening the app twice now shows the
running copy, and pressing Start from the keyboard no longer throws focus
elsewhere in the window. Still nothing released.

**OneUp** kept removing confident wrong answers, all waiting. If the safety
snapshot before an update failed, OneUp **offered an older snapshot as this
update's restore point**, and rolling back to it would have undone more than
the update. Tidying old snapshots said there was nothing to tidy when it had
failed to look.

**RetroDB** fixed a long review list in its source and published nothing.
Deleting a user left their rows behind, saving settings could destroy
settings, and scripts on the Logs page had been dying as the page loaded.

**RetroArch** (my fork) had its best week: **four of its fixes were accepted
into official RetroArch on the 26th.** More have been sent since.

**Quiet this week:** nobody. Rusty PSN has no public repository yet, so there
is nothing to read.

## What changed on the site

New downloads picked up this week: **Album Builder 0.9.3**, **Contact List
1.2.0**, **DOOM Ants 0.7.3**, **Games Hub 1.1.0**, **MAME Curator 1.3.0**,
**Perch 1.2.0**, **Pressless 0.6.1**, **Rolodex 1.6.0**, **Snatch 1.1.1** and
**Vestige 0.1.75**.

**The home page looks different.** Each project's card now shows its own
logo instead of a screenshot, and the logo leads its page. Most project
pages gained screenshots.

**Many About pages were corrected**, each by the project's own session
checking the page against the code. The ones that took something away are
mentioned above: Pressless's import and Vestige's ray tracing and scripts.

**RetroArch's download button now goes to retroarch.com** and says so. The
fork ships no builds of its own, and the button used to lead to its source.
A fork's card also names whose project it is a fork of.

**Download buttons are counted**, only for visitors who accepted analytics,
and only the project and the system. The privacy page says so.

**RetroDB** published no release this week. Its buttons now link the plain
zip rather than the 600 MB standalone build.

**Demo videos.** Ants Terminal, demoreel and MAME Curator gained one,
Vestige's became the fly-through described above, and finbreak's tour was
re-recorded.

**Behind the scenes.** Each published project's page now describes itself to
search engines. GitHub builds the site with the same script I run before a
push, and a change to documentation alone no longer rebuilds it. The three
GitHub build actions were updated. My private stats page now counts download
clicks and each post's readers. And the reviewer of this weekly post must now
show what it checked, or the post is not published.
