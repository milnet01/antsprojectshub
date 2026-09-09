---
title: The problem that turned out not to exist, and Games Hub reaches 1.0
date: 2026-09-09
summary: Last week I told you Pressless could never finish its first publish. I measured it this week and it was not true — so here is the correction, and what the measurement cost to get. Games Hub shipped 1.0.0, its first. Contact List found that its Google sync had never worked in a single downloadable copy, with 428 tests passing over the top of it. And UT Ants went from reading nothing to reading real Unreal Tournament maps end to end.
projects: pressless, games-hub, contact-list, ut-ants, ants-terminal, doom-ants, fin-break, demoreel, local-web-server-manager, lotto-tracker
---

On time this week.

## A correction

Last week I wrote that **Pressless** could not finish its first publish. The
reasoning went: publishing sends one upload per changed file, GitHub allows
about 500 such requests an hour, and a real twelve-year archive is around 862
files — so the upload runs out of budget after about eight minutes, and
retrying starts from the beginning.

That was wrong, and I am glad it was tested rather than fixed.

The test was the dull kind: make a throwaway repository and upload files to it
until something breaks. **550 files went up inside one hour, one after
another, and every single one was accepted** — at a sustained 136 a minute.
That is past both of the limits Google can find you in GitHub's own
documentation, 80 a minute and 500 an hour, with nothing complaining at any
point. File uploads are simply not counted against the budget I thought they
were counted against. They fall under a much larger one that 862 requests sits
comfortably inside.

Two honest caveats. The run reached 550, not 862 — past 500 the published
limit is disproved, and the rest follows from that rather than from having
watched it finish. And a longer second run was refused by this machine's own
rules about hammering someone else's service, which is fair enough.

The more useful half is what the test said about **the fix I was going to
write**. The plan was to send the whole site as one big request instead of one
per file. Measured the same day: hand GitHub the text of a photograph that way
and it stores the text, literally, rather than the picture — and raw image
bytes cannot go in that kind of request at all. So the fix would have quietly
broken every photograph on the site while looking like an improvement. A
problem that did not exist, about to be solved by a fix that did not work.

What the week actually gave Pressless is smaller and real: **the first publish
now takes about seven minutes instead of about fourteen.** It had been pausing
a full second between every file out of caution about a limit that turns out
not to apply; it now pauses half a second, which is comfortably under the rate
measured as acceptable. The three requests that *finish* a publish keep the
full second, because those are the ones the limits are plausibly about and
nobody has measured them.

Also fixed: a stray file in your site folder — a `.git` directory, an editor's
backup, a shortcut — now stops the publish and says which file it was, instead
of being uploaded to your live website. And five different reasons a publish
can refuse now say which one they were, where before they all produced the
same sentence.

Pressless still has nothing to download. Of the four things standing between
it and a first release, three have not been started.

## Games Hub 1.0.0

**Games Hub** shipped **0.6.0** on Sunday and **1.0.0** on Tuesday. It is the
first of these projects to reach a 1.0, and the 62-entry backlog I mentioned
last week is gone — 0.6.0 carried 71 changes on its own.

What 1.0.0 is actually about is a slightly odd thing to celebrate, and it is
the same shape as everything else in this post. **The build had been asking
the compiler not to mention any problems.** Compilers will tell you about
suspicious code for free if you let them; this one had never been asked. Being
asked, it immediately found three real faults and — this is the part that
matters — no noise at all. Then a second compiler found six pieces of dead
code, one of which was **a second copy of Pyramid's redeal limit**, sitting
next to the one the rules actually use. Two numbers, one rule.

The Windows compiler had a related problem: it was allowed to object but its
objections did not stop anything. It had 28 complaints saved up. The reason
nobody noticed is worth writing down — the script used to test on Windows
locally was configured to switch that setting *off*, while the automatic
build switched it *on*. Two people looking at the same project and
disagreeing about whether it was strict.

**Downloads are now checkable.** Every published file carries a signed record
of which repository, which commit and which build produced it, and you can
verify it yourself. Releases before 1.0.0 fail that check, because the record
did not exist yet.

Two more from 0.6.0 I liked. **A self-test that only tested positions somebody
had thought of**: four Canasta bugs in one week were all legal moves the game
wrongly refused, all involving wild cards, and every one of them sailed
through the test suite. It now builds hundreds of random positions and holds
the game to two rules out of the actual rulebook — and rather than declaring
victory when it found nothing, a fault was deliberately introduced to prove
the check bites. And **the screenshot comparison had been measuring the
shuffle**: without a fixed deal, comparing before-and-after pictures compared
two different games.

A from-scratch rebuild also went from about a minute and a half to about two
seconds.

Next up, and named as the priority: playing every game without a mouse.

## 428 tests, and a feature that had never once worked

**Contact List** was listed as quiet last week. It was not quiet this week.

One day of going through it properly found that **Google Sync had never
worked in a single downloadable copy of the app.** Open the sync page in any
packaged build and you got an error page. The piece of Google's code it needs
was never included in the package.

All 428 tests passed. Every automatic check passed. They pass because they run
the app from the source folder on a machine that already has that Google code
sitting around — so the missing piece is only missing for you. Nothing found
it except someone downloading the actual app and clicking the actual button.

The Windows build had the same shape of hole twice over. Windows does not ship
the world's list of time zones, and the substitute was never bundled — so the
time zone list in Settings was **empty**, saving a time zone always failed,
and every date in the app fell back to a raw machine timestamp. Two documented
features, dead on a documented platform, silently.

And two of the gates meant to catch things like this were reporting success
without running. The check that runs before every push was throwing away the
answer to "what changed?", getting an empty list, concluding there was nothing
to push, and skipping the whole thing — on any ordinary push. The other
printed **CI PASSED** after its own setup step had failed.

The rest of that day: your typed search terms were being written to a log file
on disk, because the search text travels in the web address and the log
recorded whole addresses. Notes with more than one line lost everything after
the first line when re-imported. Phone numbers and emails with custom labels
from a Google or Apple export were dropped without a word. Contacts the
importer refused were counted as neither imported nor skipped, so a file where
most records failed still reported plain success. Disconnecting from Google
deleted the local key and left your permission live on the Google account. And
the duplicates page counted ticked boxes rather than contacts, so "delete 5
selected" could be followed by a deletion of 3.

Twenty fixes, none of them released — Contact List is still on 1.1.0 from
July, and there are now two months of work sitting behind that.

## UT Ants can read your maps

**UT Ants** was announced last week with nothing behind it. Five days later it
reads a real Unreal Tournament 99 map from end to end without any part of the
original game: the walls and their textures, the sounds, everything placed in
the level, which switch opens which door, and where a player can walk.

It can also work out what a custom object *is* by tracing its family tree
across files, and it can carve a level into rooms and answer "which room is
this point in". There is a small command-line tool that will tell you what a
map depends on and what is in it. About 220 automated checks, passing on a
machine that has never had Unreal Tournament installed.

The best find is one no test could have caught. Deep in the map format is a
tree that answers "which room am I in", and each branch has a front and a back
side. **The code was reading those two the wrong way round.** Swap two
neighbouring things of the same size and the file still reads perfectly; and
because the test files were written by the same code that read them, a test
agreed with itself whichever way round it was. It was found by checking the
answers against what the real game's own files say. Before the fix, **0 of
11,451 answers on one map were right. After, 11,406.** Across a whole
installed library, nearly 22 million disagreements became about 30,000.

Those remaining 30,000 — 0.27% — are still unexplained, and four theories
about them have been tested and eliminated. The target was relaxed from "no
disagreements" to "under 1%", with the reason written down: reading it
backwards scores zero, not almost-perfect, so a 1% ceiling still catches that
kind of mistake three hundred times over.

Two other numbers. A tool that reads all 837 packages of a real Monster Hunt
library takes **67 seconds cold and 14 warm**, against 48 seconds to boot the
old server for *one* map. And 587 maps were reported as depending on a package
called "Base" that does not exist — the code was following a reference one step
short. Following it all the way, unmet dependencies across 740 maps went from
732 to zero.

Also measured: the flags in a map that say which surfaces are solid are not
reliable. Of 202 surfaces flagged solid, **42 actually were** in the running
game. On one map it was six out of six wrong.

**Still nothing to download and nothing to play.** No renderer yet — that is
next after the material work now starting.

## Ants Terminal 0.7.108

**Ants Terminal** shipped **0.7.107** on Friday and **0.7.108** today, and
0.7.108 is a large one.

The headline is a measurement of its own review process. **A full read-through
of the codebase had been silently skipping a third of it** — 189 files and
59,257 lines belonged to no section of the plan at all, including the single
biggest file in the project. There is now a check that fails the build if any
file belongs to no section, or to two.

Its code analyser was in the same state as everything else in this post: run
with no configuration, it selects no checks at all, reads every file, reports
nothing, and exits successfully. Indistinguishable from a clean project. And
one code checker, when it refused to run, printed its own help text — which
the audit then read as **92 findings**, with contents like `--help  Display
available options`. A tool that examined nothing looked exactly like a tool
that found problems.

Two more instruments got the same treatment. A new check lists work closed
since the last release that no release note mentions: **the first run found 19
items**, one of them closed the same day as the release it was missing from.
Another flags release notes that are word-for-word copies of the internal
to-do item — **14 of 56 were**, and all 14 were rewritten.

For actual users: **typing in the scrollback search no longer freezes the
window.** Every keystroke re-scanned the entire history — 50,000 lines by
default — so typing a word could lock things up for seconds; it now waits for
you to pause. A plugin that ran out of memory used to take the whole terminal
down, which its own documentation promises cannot happen. Session logs and
session recordings were being created readable by every account on the
machine, and those files can contain anything the terminal printed, keys
included.

The speed numbers are large. Looking up where things are defined across the
whole documentation set: **41.8 seconds down to 3.4**, with identical answers.
Two hundred lookups together: 15.6 seconds down to 0.35. And it had been
re-reading its own settings file **about eight times a second**.

There is a 0.7.109 written and waiting, out as a preview only.

## DOOM Ants 0.7.2

**DOOM Ants** shipped **0.7.2** on Monday — 43 changes, all in one day of
work, and mostly the same bounds-checking effort I described last week.

The pick of them: **saving reported that it had written past the end of its
space after it had already written past the end of its space.** The guard ran
once every byte was out. On a large custom level that is ordinary play, not an
attack. Saves that will not fit are now refused by name, before anything is
overwritten. Separately, saving used to destroy the previous save while
writing the new one, so an interruption lost both; the new one is now written
alongside and swapped in once it is safely on disk.

Two lovely ones. **A table of switch graphics had lost its end marker, which
left every switch in the game silently doing nothing.** And the game had been
reading past the end of its sprite-name table on every single launch since
forever — nothing ever went wrong, because the value sitting just past the end
happened to be the marker it was looking for.

There is also a fix to level loading: working out which walls belong to which
room used to re-scan every wall in the map once per room, and now walks it
once, producing identical results on all 68 original maps.

Waiting for the next release: the check meant to catch a damaged or
mismatched network message **had been switched off since 1997** — present in
the code, passing everything. Turning it on means network play only works
between copies of this version or newer. Saves now record which build wrote
them and are refused if it does not match, which makes older saves unreadable
— they were previously being *misread*, which is worse.

## finbreak 0.1.23

**finbreak** shipped **0.1.23** on Sunday, and the headline is a **recovery
code**: a second way into your vault, shown once when you create it, which can
unlock the vault and set a new master password. You can decline it, replace
it, or remove it later. finbreak keeps no copy — lose it and it is gone, which
is the whole point. Existing vaults upgrade themselves on the next unlock, and
a copy of the old vault is taken first and only deleted once the upgrade has
been checked.

That upgrade is also where the week's most alarming bug lived, and it was
caught before release rather than after. The step that checks the new copy is
good had **three possible situations and only two answers**: it said "no" both
when the copy was bad and when it could not tell. On "no" it deleted the copy
— the known-good one — while a comment beside it asserted that nothing had
been touched. It now distinguishes the two, and "I could not tell" keeps
everything.

Also in: **the time zone you pin now decides what "today" means**, not just
how dates are printed. I described this last week as fixed; what was fixed
then was the display, and this is the rest of it — this month's spending, the
alerts and the forecast were all still coming from the machine clock, so
pinning Johannesburg and then travelling still moved a whole month of totals
on the 1st. And after a crash, two copies of finbreak could open the same
encrypted vault and both write to it; only one can claim it now.

On accessibility: the master password box, the recovery code box, the new
password and confirmation boxes and the custom date-format box were all
announced to a screen reader as having no name at all. Four screens were also
ignoring your chosen date format entirely.

## demoreel 0.1.1 — first release

**demoreel** is the tool that records a video of an app running on a private
display, so nothing of your real desktop is in shot. It got its first ever
release on Tuesday.

Two findings, and both are about the tool's own premise. **The private display
had no password on it.** Measured before the fix existed: another program
running as you could read that display and grab a picture of whatever was on
it — on a tool that exists specifically so your desktop is not in frame. It is
now locked with a credential.

And **the code checker had never read a single file of the program.** It ran,
it printed "All checks passed!", and asked directly which files it had looked
at, it named one: its own configuration file. The program is a file called
`demoreel` with no `.py` on the end, and the checker only looks at files
ending `.py`. The only code in the project was invisible to the only tool
checking it, for the project's entire life.

Also: `demoreel stop` could kill an unrelated program, because a recording
killed abruptly leaves its notes behind and the system reuses process numbers.
Reproduced by having it kill something innocent. And waiting for an app to
finish drawing was taking most of a processor core away from the app it was
waiting for — it now backs off as the wait lengthens, and answers a
fast-drawing app sooner than before.

Two speed ideas were measured and then *not* done, which I like as much as the
ones that were: one made a six-minute encode 7% slower, and the other produced
a marginally worse picture.

## Short notes

**Local Web Server Manager** — still no release, and the count I gave last
week was wrong: it is not 77 commits, it is 367 since the project's history
starts. Everything it does is still unreleased. This week: the text-size
setting **silently did nothing** on this kind of desktop, while the menu
happily ticked your choice and saved it. Stop, Restart and Open are
deliberately switched off for servers the app did not start, but nothing said
so and — because applying a theme wiped out the desktop's own dimming — a
switched-off button looked identical to a live one, so clicking Open just did
nothing. Window placement was guessing from a setting that is routinely
missing, guessing wrong, moving the window, having the move discarded, and
reporting success. The colour tool that picks accessible shades printed its
closest failure in exactly the format of a success and ended with "0
shortfalls" — and its output is meant to be pasted straight into the code. The
release pre-flight read an unanswerable question as an all-clear and said
READY. And every translatable word in the app was invisible to the translation
tool: asked to extract them, it found **zero**.

**LottoTracker** is **dark by default**, with thirteen themes and the balls
coloured by game — red Lotto, blue PowerBall, green Daily Lotto. The white
page was reported as blinding. Dark now lives in the stylesheet rather than
being applied afterwards, so there is no white flash on the way in. Every
theme was checked against a contrast floor rather than trusted, and **two
failed on the first run** and were corrected. LottoTracker still has no
release and no version number at all; what a 1.0 means for it was settled this
week, and it means all five of its goals plus packaging.

**Quiet this week:** Vestige, RetroDB, MAME Curator, perch, RetroArch, Album
Builder, Snatch, Slipcase, Rolodex, OneUp and Rusty PSN — most of them
because they had a very loud week last week.

## What changed on the site

**The version line now tells you when that release was cut**, not just what it
was called — and the date is shown in **your** date format, not mine. A build
running on a machine in another country cannot know how you write dates, so
the page ships `2026-09-09`, which is unambiguous and sorts properly, and a
small script rewrites it into whatever your own system uses once the page is
open. If that script never runs, the date is still there and still correct.

**Games Hub is now listed as Live** rather than Beta, on the strength of
1.0.0. **DOOM Ants moves from Early WIP to Beta** — its own README has said
"playable" for a while, and it ships builds you can download and run, so the
old label was underselling it.

New downloads picked up this week: Games Hub 1.0.0, Ants Terminal 0.7.108,
DOOM Ants 0.7.2, finbreak 0.1.23 and demoreel 0.1.1.

One thing I checked and could not fix from here: **RetroDB's download on this
site is still 3.12.0, from June.** The app is on 3.23.6 — everything I have
written about it for weeks — but those versions were never published as
releases, so there is nothing for this site to link to. That is a RetroDB job,
not a site one, and it is now on the list.
