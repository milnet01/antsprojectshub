---
title: A button that cleared everything, and a week of checks that were not checking
date: 2026-09-04
summary: RetroDB's "Clear scraped data" promised to clear a dozen games and cleared thousands — four releases in three days went out behind it. DOOM Ants had 251 findings read out of it, and found that both of the instruments meant to catch such things had been reporting success without measuring anything. Seven projects turned up the same shape in one week. Plus Games Hub 0.5.0, Snatch 1.1.0, and a new project: UT Ants.
projects: retrodb, doom-ants, vestige-engine, games-hub, snatch, ut-ants, slipcase, perch, rolodex, fin-break, oneup, lotto-tracker, pressless, local-web-server-manager, ants-terminal
---

A week late — this should have gone up on Wednesday.

## A button that cleared everything

**RetroDB** had four releases in three days, and the reason is the first
item in the second one.

There is a button called "Clear scraped data". It does what it sounds like:
throws away the descriptions, cover art and details that were fetched
automatically, so you can fetch them again. Before you press it, a box tells
you how many games it is about to affect.

That box counted the games that had actually been scraped. The button then
cleared **every game regardless**. So it could promise a dozen and clear
thousands — and if you had images turned on, it also deleted cover art you
had uploaded by hand and reset titles you had typed yourself, on games that
had never been scraped at all.

It now does exactly what the box says.

That was one of nine ways the library could lose data in **3.23.4**. Bulk
edit's "Append" switch was replacing instead of adding. The packaged build
could empty every image reference in your library in one click. The image
resizer was re-enlarging its own thumbnails, so every run inflated the media
folder and the AI upscaler ran on roughly three times the number of files it
was meant to. Creating a playlist moved your original archive files without
asking.

The other three releases:

**3.23.3** was about who is allowed to do what. Deactivating a family
member's account hid them from every screen but let them keep working for up
to a week if they were already signed in, and read-only accounts could
overwrite playtimes across the whole library. The limit on failed sign-in
attempts was shared across everyone on the network, so anyone with an
account could clear it and keep guessing an admin password.

**3.23.5** fixed the download. The Standalone build could not start at all —
it carried the launcher meant for people installing from source, which looks
for files a packaged build does not contain and stops on the first line.

**3.23.6** was age ratings, and this one spread. The app looked for a rating
code *anywhere* in the text it was given rather than reading the code at the
start, so "T - Teen", "M - Mature 17+" and "AO - Adults Only 18+" were all
stored wrongly — a Mature game could be filed as suitable for everyone — and
that wrong value was then copied into the other eight rating systems.

RetroDB is on **3.23.6**.

## Nine ways into DOOM

**DOOM Ants** had its whole source read this fortnight — 99,000 lines, in
twenty-one passes — and 251 things came back. Nine were serious, and all
nine were the same shape: a downloaded level, saved game, recorded demo or
network message reaching a list or a memory address with nothing checking it
was inside. All nine are fixed.

In plain terms: DOOM is from 1993, people still make levels for it, and you
download those levels from strangers. The original code trusted them
completely. Five fixed-size lists were appended to without ever checking
they were full — and one of those needed no hostile file at all, because
real, popular level packs exceed the limit on their own.

The worst was a door. Press use on a wall that has a door action but no
second side, and the engine produced a bad address that it then wrote
through on every frame while the door moved. Eight places in the code were
making the same mistake: treating the loader's deliberate "there is nothing
here" marker as a position in a list.

Saving a game got the same treatment. It writes into a fixed half-megabyte
space with nothing stopping it running past the end, and the check meant to
catch that ran *after* every byte had already been written. On a large
custom level, that is ordinary play rather than an attack.

Then there is the one that had been happening on every single startup since
forever. Setting up the sprites counted the names in a table by scanning for
an end marker the table does not have. It read past the end, every launch,
and nobody could see it: it only ever gave the right answer because the next
thing in memory happened to read as zero. That is a property of how the
program was assembled, not of the table. The count is 138 before and after.

## Seven green lights that were measuring nothing

Here is the thing that made this week odd. That DOOM review also looked at
DOOM Ants' own instruments — and both of them had been reporting success
without measuring anything.

The first is the test that must pass before any ray-tracing change ships.
Both of its scores start at zero, stay at zero when there is nothing to
measure, and **zero counted as a pass**. So a run that tested nothing at all
reported success twice, and said so with a clean exit either way. The second
is the check that runs before every push. If it could not run one of its
jobs — no game file to test against, no Windows compiler installed — it
skipped it silently, printed "both jobs green", and let the push through.

Both now say when they measured nothing.

And then the same shape turned up in six more projects in the same week.

**Vestige** — the engine — found that its entire GPU particle system had
never started up. A shader had named one of its parameters `input`, which is
a reserved word in that language, and it is the first shader the system
loads. So the system reported failure into a log line, nothing crashed, no
test ever reached the path, and no GPU particle had ever been emitted. Three
further bugs were hiding underneath it, one of which had survived a previous
review because the sanity check passed while the answer was wrong: six of
eight slots held the wrong particle, and the output was still a valid
shuffle of the right ones.

Vestige also found a code analyser that had been reporting "clean" because
it never ran. The build precompiles some headers with one compiler; a second
compiler cannot read those, and the error it gives carries no filename — so
the tool that reads the results never matched it. A run that analysed
nothing looked identical to a clean one.

**Snatch** discovered that its only test asserted nothing, on any platform.
The branch it was checking never executed at any of its four call sites, and
the one assertion that did run compared a folder against the folder the
script had just been loaded from, so it could not fail. The project's
roadmap claimed the opposite — "a genuine gate".

**Ants Terminal** found its own code-quality tool had been invoked with no
configuration, which makes it select an empty set of checks: it reads every
file, reports nothing, and exits successfully. Indistinguishable in a log
from a clean tree.

**OneUp** found a colour-contrast gate that had been reading none of the
lines it was supposed to check, because of a stray one-line block above the
part it scanned.

**LottoTracker** found that its privacy check ignored whether the underlying
tool had run at all, so a failure left it scanning nothing and printing "0
tracked files, 0 leaks" — and the stronger backstop check reads that same
line, so one failure took out both guards.

**Rolodex** found a whole feature that shipped inert. Three separate
documents promised "a fresh install makes no request, ever", and the
automatic update check they described had no caller at all — the preference
that was meant to control it gated a branch nothing could reach.

Seven projects, one week, the same failure: a thing that says *pass* when
what it means is *I did not look*. None of these was found by the check
itself. Every one was found by someone going to see what it actually did.

## Games Hub 0.5.0 — and Back stops eating your game

**Games Hub 0.5.0** went out on Sunday, and it is a big one.

**The board games stopped freezing.** Chess, Reversi and Draughts were
thinking on the same thread that draws the window, so at the hardest level
the whole thing locked solid — no repaint, no resize — for 420 milliseconds
at a stretch. It is now 8 milliseconds, which is what the window gives when
it is doing nothing at all. Undo works mid-think now too, instead of doing
nothing.

**And the chess engine got 3.2 times faster at the same strength.** Across
five positions at Hard: 2354.6 milliseconds down to 733.0, worst case 1150.7
down to 334.5 — and it still picks exactly the same move in every position.

**Resuming a saved game and pressing Back deleted it.** Klondike, Spider,
FreeCell, Pyramid, Reversi and Draughts all read a just-restored game as
untouched and cleared the stored one. The regression test written to stop
that happening again found a *seventh* game on its first run, before any fix
existed — 2048, which had the same fault for a subtler reason: its guard
also asks whether the score is zero, and in 2048 the score only moves on a
merge, so sliding a few times without merging is an ordinary early position
that answers "nothing here" to both halves.

**A crash no longer loses the game you are in.** Progress only reached the
disk on the way out, so a crash, a kill or a power cut lost it — and two
copies of the app open at once settled it by whichever *exited* last rather
than whichever *moved* last. It banks every second now.

Also: a damaged best score used to read back as zero, and in Minesweeper
times and Spider move counts zero is a score nobody can beat, so every later
result was refused forever. A tied game of Hearts announced "You win!" and
wrote it into your best scores. Draughts now asks which capture chain you
meant when two jump routes end on the same square. And the app finally tells
you when it cannot save your settings, rather than losing every saved game
silently.

On accessibility: the fourteen game tiles were fourteen unnamed buttons to a
screen reader and now carry names. The Support dialog was shrinking its own
text to about 2pt — worst with large play switched *on*, which is the
setting meant to make things bigger — and Reversi's move dots ignored that
switch and actually came out smaller with it on.

There is another 62 changelog entries sitting on top of 0.5.0, waiting for
the next release.

## Snatch 1.1.0

**Snatch 1.1.0** went out on Wednesday.

**The window stopped freezing while talking to the video player.** Dragging
the volume slider, pressing play or just having a video open made Snatch
wait on the player — up to half a second each time — and the position
readout was asking twice every half-second. A volume drag now sends once
when you let go.

**Searching twice no longer wedges the app.** Worse than the stuck
"Searching..." label: two searches ran at once and the results could fall
out of step with the rows on screen, so Play or Download acted on a
different video from the one you had highlighted.

**On Windows, the play, pause, volume and seek buttons could never have
worked.** Snatch talks to its player over a channel Windows does not
provide, so those controls looked completely normal and silently swallowed
every click. They are greyed out with a note now; Stop and Fullscreen still
work.

Smaller ones: a corrupt settings file no longer stops the app opening, a
playlist containing deleted or region-blocked videos no longer breaks the
results list, and the format list stopped offering thumbnail contact sheets
as though they were video — 6 entries out of 53 on a typical video, and
downloading one reported success. The built-in player was also reachable by
other users on a shared machine, under a guessable name, and it accepts any
command sent to it; it is private now and removed when playback stops.

Snatch has 35 automated tests where it had none, and every one of the five
helper programs it bundles is now pinned by fingerprint rather than by
address, so the build stops if one changes underneath it.

## A new project: UT Ants

Unreal Tournament came out in 1999 and people are still playing it — and
still making maps for it. One Monster Hunt server on this machine carries
515 community-made maps, in an install of 612, most of them by people who
have never met each other. The maps are alive. The engine is not.

**UT Ants** is a new engine that reads the maps you already have and rebuilds
each one as a modernised version of itself: shadows that move, real
materials, fog with light cutting through it — while running, dodging and
shock-combos land exactly where your hands already expect.

Three things are wrong today, and each is why this exists. The look cannot
be fixed from inside: UT99 paints its shadows into the walls when a map is
built, the code was never released, and the game was delisted in 2023, so
the ceiling is permanently 1999. The computer players cannot play Monster
Hunt, because those maps are built around switches and plates and the bots
simply walk into the closed door and stop. And the whole library is trapped
on an engine nobody can change, for a game nobody can legally buy.

It ships none of Epic's content — you bring your own copy of the game, and
it refuses to start without one.

**It is very early. There is nothing to play and nothing to download.** What
exists is the foundation underneath everything else, and the tests pass on a
machine that has never had Unreal Tournament installed. Windows and Linux
are both built and tested on every single change rather than one first and
the other later.

The whole thing is measured against twelve things you could observe by
playing it, written down before any code was. The last one is the honest
one: the live Monster Hunt server runs on this instead of UT99, and nobody
wants to switch back. That is what version 1.0 means here.

## Slipcase, out in the open

**Slipcase** has been listed here as "coming soon" with nothing behind it.
That changed this week — it has a public repository now, and the site says
so.

It turns a flat game cover into a picture of the box it came in: front,
spine, top edge and a soft shadow, at the real millimetre measurements of
fifteen case types from NES cartridge boxes through to Switch cases. It can
find the artwork for you, invent a spine when your cover does not have one,
do a whole folder at once, and spin the box as an animation.

Nine days took it from nothing to a working application with a test suite
that went from 18 tests to 56. Along the way: saving settings could truncate
your stored logins, a failed search reported "No results found" so a wrong
password looked exactly like a game that is not in the database, and the
animation dialog asked for 120 frames and wrote 238, because the bounce
replays the sweep in reverse and nothing said so.

The best thing in it is a review of its own rulebook, run because one
section had been rewritten without one. That section turned out to be
correct. **Thirty-one other claims were not** — the test suite was said to
finish in under five seconds when it takes about twenty, and the status-bar
colour rule described two themes when seven ship.

**There is still no download.** It runs from a copy of the source, which is
why it is listed as work in progress rather than released.

## Short notes

**perch 1.1.0** shipped on Friday, and it is the easiest install it has ever
had: a single AppImage — download, make it runnable, run it — plus proper
openSUSE and Fedora packages you can install with one copy-pasted command.
There is a first-run wizard whose opening page tells you that you do not need
to configure anything. Tray "Pause restore" became "Pause Perch", a full
panic switch. Flatpak autostart had never once worked, because it was reading
the wrong half of the desktop's reply, and nothing was logged. Since the
release, an audit closed 22 more items, including one I liked:
`PERCH_LOG_TITLES` has been removed from the documentation because **it never
existed in code**. Five documents described it as a privacy setting and
nothing has ever read it. A control a security document names and nothing
reads is worse than no control at all.

**Rolodex 1.3.1** went out on Thursday with one fix: an interrupted save now
leaves your previous vault intact instead of truncating the only copy of your
credentials. Waiting for the next release: saving got about a thousand times
faster — the deliberately slow password calculation was being redone every
time anything changed at all, so a save went from about 81 milliseconds to
under a tenth of one — plus opt-in signed updates, a 12-character minimum for
new master passwords, and two-factor seeds that no longer sit in plain view
beside the code generated from them.

**finbreak** has Debian and Ubuntu packages that build and publish for the
first time. The time zone you pin in Settings now decides what "today" means
rather than only how dates are printed, so pinning Johannesburg and then
travelling no longer moves a whole month of totals. Money is rendered exactly
rather than through arithmetic that drifts, so the digits on screen match the
ones in your vault. And a corrupted settings file is now reported as a
corrupted settings file rather than as a wrong password — which counted
against the lock-out limit and offered to erase everything, on a vault whose
data was completely intact. The release tooling caught something genuinely
alarming too: a transient network failure could make the publishing script
pick up *the previous release's* build, which was then signed with the real
key and published, so installed copies would have auto-updated to a validly
signed older program.

**OneUp** — changing the colour theme could start a system update. With the
tray icon switched on, picking a theme in Settings called the tray menu's
"Update now" action instead of redrawing the icon. Separately, OneUp asks the
system to hold off shutdown while it installs, and that hold was skipped
whenever you checked the download size first — which is what the Update
button does, so the path most people take was the unprotected one. Firmware,
leftover-package and Flatpak checks were also reporting "up to date" when the
underlying tool had failed to answer at all, which is the one answer an
update checker must never give.

**LottoTracker** now checks your tickets back to the earliest one you have
rather than only to 2025, and the effect is large: entries it could not check
fell from 974 to 11, and the share of your lifetime spending it can compare
went from 38.5% to 98.7%. Against the bank's own record, the unexplained
difference fell from R4,989.50 to R338.40, and the figure that must never
move — wins claimed but never paid — stayed at zero. There is a new section
showing spend against winnings by month and by year, filed against the date
of the *draw* rather than the purchase, so "did August pay for itself?" is a
fair question.

**Pressless** had the busiest week of anything here, and the most interesting
finding is one that is not fixed. Publishing sends one upload per changed
file, and GitHub allows about 500 such requests an hour — so a first publish
of a real twelve-year archive, at around 862 files, runs out of budget after
roughly eight minutes. Retrying does not help, because the part-finished
upload belongs to no saved version, so the next attempt starts from the
beginning. **The first publish never completes.** It came out of a plain
question about whether paying or signing in would lift the limit. It would
not. Also fixed: a shortcut left in your site folder was being followed and
its target published to a public site.

**Local Web Server Manager** — 77 commits and still no release. A new "Follow
system" theme picks light or dark from your desktop and switches to
high-contrast automatically if your desktop already asks for one. Two
projects set to the same port now get a refusal naming the project holding
it, rather than both launching and the second failing later with an unrelated
message. Best find: a folder name containing a line break could draw a
*second, fake* "This will execute:" heading above the real one, naming a
different program — and the first fix was found incomplete by a later review,
because the escaping handled the two obvious line breaks and not the three
unusual ones the window also breaks on.

**Ants Terminal 0.7.107** is out. Typing in the scrollback search box used to
re-scan the entire 50,000-line history on every keystroke, so typing a word
could lock the window for seconds; it waits for a pause now. A plugin that
ran out of memory could take the whole terminal down, which its own
documentation promises cannot happen. And there is now a permanent download
link that always fetches the current version, so no page ever needs updating
for a release again.

**Quiet this week:** Album Builder, MAME Curator, Contact List, demoreel, the
RetroArch fork and Rusty PSN.

## What changed on the site

One fix, and it was the same shape as everything else this week.

Ants Terminal's changelog page here was empty, and said so in a hundred
different ways. Its changelog file is 1.29 MB, and GitHub's interface
refuses to hand over a file above 1 MB — it answers *successfully*, with
nothing in it, which the build could not tell apart from a project that
keeps no changelog at all. So the fallback that fills in notes for a release
published with an empty description had nothing to fall back to, for all 100
releases. Oversized files are now fetched a different way, with no cap. **165
of the 174 versions on that page now carry their real notes**; the nine that
do not are release candidates, which genuinely have none.

Alongside it: a release note whose entire content is a link back to the
repository's own changelog is no longer rendered as notes. On 50 of Ants
Terminal's 106 releases that pointer was the whole body, so the page read as
a wall of links back to GitHub — the one thing it exists to remove.

New this week: **UT Ants** joins the list, marked coming soon, and
**Slipcase** moves from coming soon to work in progress with its repository
now public.

New downloads: Snatch 1.1.0 (Windows, Linux and macOS), Games Hub 0.5.0,
perch 1.1.0 (now as an AppImage and as openSUSE and Fedora packages),
Rolodex 1.3.1, RetroDB 3.23.6 and Ants Terminal 0.7.107.
