---
title: The update that could never install, and Pressless's first download
date: 2026-09-22
summary: Rolodex has always checked the signature on an update before installing it — against a key that was deliberately blank, so "Update now" was a button that could only ever fail. Pressless published its first real download, and its first attempt failed in exactly the place last week's post said it would. UT Ants grew a sky, water and a gamepad. Sixteen projects moved; four were quiet.
projects: pressless, ut-ants, ants-terminal, rolodex, vestige-engine, doom-ants, perch, oneup, fin-break, contact-list, games-hub, demoreel, album-builder, local-web-server-manager, retroarch, retrodb
---

A day early again. This was the busiest week the log has covered: **sixteen
projects moved and four were quiet**, against five and sixteen last week.

A theme ran through it that I did not go looking for. Over and over, the thing
that was broken was not the work — it was the *wire* between the work and the
person using it. A settings panel whose sliders reached no code. A measuring
tool that never measured. A window manager that never learned where you put
your windows. And an update button that, by construction, could never succeed.

## Pressless has a download

**Pressless** — the thing that replaces WordPress with plain files on your own
computer — published **0.1.1 and 0.1.2** this week. Those are its first real
downloads: one for Windows, one for Linux.

What you can do with it now: set it up against your GitHub account, write in
an editor with the finished page shown beside it, and press one button to send
an entry to the live site. Double-clicking Pressless opens it in your browser.
Your words save themselves a moment after you stop typing.

Two details worth having. A new entry is dated when it is *first published*,
not when you wrote it. And if publishing fails, your files go back to how they
were and you are told what to do — Pressless refuses to replace your site with
an empty one.

### The prediction that came true

Last week I wrote that the Windows half and the automatic release build "have
never run anywhere", and that the first release would be their first run.

That is exactly what happened. **0.1.0 was tagged and never published.** Its
Windows job ran the test suite on Windows for the first time and the tests
failed — not the app, the tests. They had been written on Linux and carried
Linux assumptions: a folder with no drive letter, a file move that Windows
performs as a rename, a permission the app deliberately skips on Windows, and
two filenames differing only in capital letters, which Windows treats as the
same file.

No application code changed. The tests now hold on both systems, and every
push runs them on Windows as well as Linux — so a Windows break is caught when
it is pushed rather than at the next release.

### Undo

Also built, waiting for the next release: **undo the last publish, in one
step.** It puts your site back the way it was, and leaves your own files
agreeing with it. An entry that was not on the site before becomes a draft
again rather than being deleted. Where your copy differs from the older
version, your copy is kept as a draft beside the one put back, so nothing of
yours is lost. It reaches back exactly one publish, and pressing it again puts
you back where you started.

Where a first proper release stands: setup, the editor, publishing, importing
and undo are all built and two of them are downloadable. What is owed first is
a set of checks that only a person can do, which three finished pieces each
recorded as never run.

## UT Ants: sky, water, fog and a gamepad

Last week **UT Ants** was a flying camera through a lit map, and I listed what
was next: softer light edges, outdoor skies, and fog, light shafts and a
flashlight. All three arrived, and a good deal more.

- **The sky is the sky its author built.** In the 1999 game, a sky surface is a
  window onto a separate room built into the map. UT Ants now draws that room
  and shows it through every sky surface, so the sky turns with you and never
  slides. **1,037 of the reference install's 1,436 maps have one.**
- **Fog, light shafts and a flashlight.** From the Medium quality setting up,
  every map draws a light haze that shadowed lights scatter through, so walls
  cut visible beams through the air. F turns a flashlight on.
- **Soft shadows in corners and creases**, at every quality setting.
- **A launcher.** Type `ut-ants` at your install and you get a list of every
  map in it. Type to filter, press Enter, and it builds the map and flies it.
  Each map has a notes box that saves as you type.
- **A gamepad works** — PlayStation or Xbox. Left stick moves, right stick
  looks, triggers go up and down, and the Options or Menu button closes a map.

**Still nothing to play and nothing to download.** No gravity, no player, no
weapons, no monsters.

### The sea you could see through

On AS-Frigate the sea had vanished, and you could see the ship's hull through
it. A map's water is often the very same flat surface that separates the air
from the water, and the renderer was throwing every such surface away as an
invisible marker. Only the surfaces the original game also hides are dropped
now. The sea reads as cyan again, and nothing else in the frame moved.

### Torches that were bright pink blocks

AS-Frigate's torch flames drew as flat magenta. The cause: the program found
each texture **by its name alone**, and a fire texture in this game shares its
name with its own colour table — so it picked up the table and skipped the
flame entirely. **1,924 fire and 55 wave-texture references across the
install were being found wrongly.**

A fire texture stores no picture at all; the flame is generated. So UT Ants now
runs the original game's own fire simulation from its sparks and keeps a still
frame of it. Moving flames are still to come.

### Brightness, still being measured rather than judged

Last week's brightness work continued the same way — against photographs of
the original, not against my eye.

- The thin haze in the air had been tuned on one indoor map. On an outdoor map
  it filled the whole view. It is now **a quarter as strong** — the strongest
  setting that costs nothing against the original on all three reference maps.
- Light now meets texture the way the original combines the two, rather than
  in a straight line. **AS-Frigate's sky fell from 2.36 times the original's
  brightness to 1.29.**
- The final brightness squeeze had been subtracting a little from every colour.
  The original does no such thing, so every dimly lit surface came out darker
  here than it should. Removing that step matches the original more closely.

### Shadows, and eleven maps nobody could read

One shadow-map dot covered 64 units of the world, so a thin ledge fell between
the dots and the wall beneath it stayed lit. Medium and up now use a shadow
texture twice as wide, costing about 190 MB more video memory. Measured against
a reference eight times finer over 135 views of three maps, **the error fell by
about a third on each.**

And a small one with a big blast radius: a map with an accented letter in a
texture name — `Telaraña` — was copied out byte for byte, which made the whole
output file invalid and unreadable. **Eleven maps in a 1,441-map install did
this, and a strict reader failed on the file before reading anything, losing an
entire run over one map.** Names are re-encoded properly now.

One last thing, which pleases me more than it should: a new tool can read a map
file and work out, from the file alone, whether anything in that map can ever
open its exit. Of **1,332 maps with an exit, four can never open theirs** —
matching an independent survey that had been done the slow way.

## Ants Terminal: two releases, and a fix that cost more to number than to make

**Ants Terminal 0.7.110 and 0.7.111** both went stable today.

**0.7.110** is last week's preview, promoted unchanged — the freeze fixes and
the performance pass I described last week. **0.7.111 is a packaging fix and
nothing else.** Everything written this week waits in the next one.

Here is what happened in between, because it is a better story than the fix.

0.7.110 built everywhere except one Linux distribution, Mageia. A self-check
compares the way Ants lowercases an identifier against the way its database
does it, and it used **accented letters** as the example. Most distributions
lowercase only English letters there; Mageia's build of the database lowercases
accented ones too. So the two disagreed, the check failed, and the package build
stopped. Nothing was wrong with the program — the check was asserting something
about *which copy of a library the distribution happened to ship*.

The fix is one line: use only the characters an identifier can actually
contain. The cost was everything around it. The hotfix consumed the version
number 0.7.111, which pushed the release that was already in flight up to
0.7.112, which left the project's own records carrying **two sections with the
same version number** — and, in the half with no duplicate to give it away, the
packaging files describing this cycle's 48 items as the contents of a release
that holds one test fix. All of it hand-repaired, none of it caused by the fix.
There is now a way to ship a hotfix without shifting the numbers after it.

Of the work waiting in the next release, the one most people would notice:
**text from Claude Code turning dim and underlined at random.** A keyboard
instruction it sends was being read as a styling instruction, switching on
underline and dim for everything written afterwards. Also: saving a tab's
contents no longer happens on the drawing thread, so a big scrollback pauses
the window about half as long.

And a genuinely embarrassing pair. A new command for converting an old-style
roadmap shipped twice over in an unusable state: first it was **left out of the
list of commands the tool advertises**, so any program that checks that list
before asking refused to send it at all; then, once that was fixed, a rule
requiring every item to carry a plain-English summary ran during the conversion
— and old roadmaps by definition have none, so the command refused on exactly
the files it exists to convert.

## Rolodex: the update button that could only fail

**Rolodex 1.4.0 and 1.5.0** both released, with downloads for Linux, macOS and
Windows.

The headline is the one in the title. Rolodex has always checked the signature
on a downloaded update before installing it — which is right. But **the key it
checked against was a deliberate blank placeholder**, so no update could ever
pass that check. "Update now" was a button that could only fail, and it had been
that way since it was written. The real signing key is now in place.

Two more that only bit some people:

- **The Linux download only started on Ubuntu-like systems.** It was missing
  part of the graphical toolkit and relied on the system happening to supply
  it. On openSUSE it closed immediately with "Namespace Gtk not available". It
  now carries everything it needs, and its own self-test checks that it does.
- **The macOS build had been failing** because its self-test calls a command
  that macOS does not ship. The next release would have gone out with no Mac
  download at all.

New in those two releases: filter the list by category and search several words
at once in any order, so "gmail work" finds "Work Gmail". Rolodex reopens on
the entry you last had open. Restore from a backup when your vault will not
open — and the damaged file is never deleted, it is kept beside the original
with the date added. A warning when your computer's clock is off, because that
makes two-factor codes get rejected. And **each field type now carries an icon
as well as a colour** — a padlock for passwords, a clock for dates — because
colour alone does not survive greyscale, colourblindness or a screen reader.

## Vestige: a settings tab that changed nothing

**Vestige**, the 3D engine, spent the week on a backlog of things that looked
like they worked.

**The Controls tab was a set of widgets connected to nothing.** Mouse
sensitivity, invert-Y and the gamepad deadzones were saved, clamped and driven
by live sliders — and reached no code at all, because the part that read them
and the part that wrote them used two differently named fields that nothing
joined. Worse, **rebinding a movement key did nothing either**: the camera code
asked for the physical W, A, S and D keys directly at fourteen places, so every
rebind was ignored and a non-QWERTY keyboard got the wrong keys. And a rebind
you did make was discarded the instant you made it. All three are fixed, and
there is now an automatic check that the fourteen direct key reads have not come
back — it went from fourteen to zero.

**The Ruler tool did not measure.** The menu item switched the tool on and
reported its own state, and no click ever reached it. The read-out existed; only
the connection between the two was missing.

Two more of the quiet kind: **cutting a door or window into a wall could not be
undone** — and because the editor decides whether a scene has unsaved work by
looking at the undo history, a cut door also left the scene marked as saved, so
quitting threw it away without warning. And a **painted foliage mask was held
by the panel rather than the scene**, so it was silently discarded on every
save.

### A test that passed for the wrong reason

My favourite find of the week. Bright lights and dim ones glowed by exactly the
same amount — the glow effect had stopped responding to brightness altogether,
because of one line that squashed everything above a threshold to nearly the
same value.

**That defect had a test sitting over it the whole time, and the test passed.**
The reason is worth keeping: the test compared the processor's version of the
formula against the graphics card's version. But the processor version was
written as a deliberate mirror of the other one. So the test bound the two
copies to each other and said nothing whatever about whether the shared formula
was *right* — and it agreed with the broken version perfectly.

The new test asserts a property instead: glow must rise strictly across a
thousandfold range of brightness, and the gaps must widen rather than flatten. It was proved to
fail against the old formula before being kept.

Also found by reading the graphics code by hand, since nothing analyses it
automatically: **the ground was about three times brighter than every other
surface** (two halves of the lighting sum were on different scales, and a
comment directly above claimed they matched); and on weaker graphics cards,
**water tilted instead of rippling**, because the code read the wrong one of
three values and got a near-constant.

One honest demotion: the scripting system was marked done and has been
un-ticked. The classes exist and pass their tests, but nothing builds one when
the engine runs, so **no script can execute in the shipped engine.**

## DOOM Ants: shipping with the brakes on

No release yet, and everything below waits for one.

**The game was being built with the compiler's optimiser switched off** — the
setting you use for debugging — which looks inherited from the 1997 source code
rather than chosen. Switching it on measured **about 5% less processor time**,
and the classic renderer draws pixel-for-pixel the same frames, so nothing about
how it plays or looks has moved.

Turning it on was riskier than it sounds, and the related find is the good one.
This code deliberately reads the same memory as two different types, which the
optimiser is normally allowed to assume never happens. The setting that
disables that assumption was **arriving on Linux only as an accidental side
effect of an unrelated sound library, and the Windows build was getting none of
it.** Both are now set deliberately.

The rest, briefly:

- **Keypad and Home/End keys triggered unrelated actions.** Keys the game has
  no name for were being folded onto letters that do. Tapping the keypad's full
  stop on the automap **wiped your marks**; keypad 9 acted as "a", Caps Lock as
  "9", Home as "J". They now do nothing, as in the original release.
- **DOOM 1's animated between-levels map was static.** A check meant to skip the
  animation for DOOM II tested something that is always true, so the drawing
  gave up on its first line while the artwork was still loading.
- **Fog was failing to reach rooms it should light.** The search that works out
  how far outdoor air seeps through a level ran on a fixed-size list; once it
  filled, it recorded a shorter route to a room but never went back to tell that
  room's neighbours.
- A setting refused as too large on Linux was **silently accepted on Windows**,
  because the guard compared against a number twice as wide as the value it was
  checking. Two other settings accepted "infinity" and "not a number".
- A damaged add-on colour table could make the game read past the end of its own
  data, and a very long pause in a music track threw out the timing of every
  note after it.

## Perch never learned where you put your windows

**Perch** remembers where your windows go. On KDE Plasma it was not learning
anything at all: the small helper script it runs inside the desktop used a timer
call **that does not exist there**, so every single "window moved" and "window
resized" notification failed silently. Perch never found out. That is fixed, and
the helper's code is now checked by a linter on every push.

Alongside it: **the GNOME and Sway versions no longer claim abilities they do
not have.** On those desktops Perch cannot yet notice windows opening or
monitors changing. It now says so rather than claiming it can — behaviour is
unchanged, honesty is not.

Also: `perch --settings` opens the settings window even when your desktop hides
tray icons, which is GNOME's default. Starting Perch twice no longer leaves two
copies fighting over your windows and the saved-positions file. And Perch now
forgets apps you have not used in 90 days, so the saved file does not
accumulate.

## Short notes

**OneUp** (system updates) fixed a cluster of confident wrong answers. A request
to start an update that was **rejected as invalid used to be reported as a clean
finish** for an update that never ran. A full disk produced an endless stream of
warning boxes, several a second, because it warned and immediately retried. And
one odd character in an engine message — a superscript digit, say — could stop
the window following the rest of the run.

**finbreak** (finances) fixed a Linux download that **crashed on the very first
keystroke**: it carried its own copy of half a keyboard library while relying on
your system for the other half, and the mismatched pair could crash as soon as
you typed. Also: a saved PDF report could be named for one month and contain
another month's figures, if you had pinned a timezone different from your
computer's. And a transaction you copied stayed on the clipboard for good if
finbreak locked before the automatic clear was due.

**Contact List** made every destructive confirmation readable by a screen
reader. It used to announce only "Confirm, button" without reading the question
— and pressing "n" at a delete prompt navigated away and left the dialog
hanging. It is now a proper dialog. Separately, **clearing a field never reached
Google**: emptying an email, phone or note on a synced contact was dropped from
the upload, so Google kept its copy and the next sync put it back.

**Games Hub** — last week I said keyboard play was waiting on one decision I had
to make, about what the cursor should look like. I made it. **Chess, Reversi,
Draughts and Minesweeper can now be played without a mouse**, with a gold cursor
that thickens under the Large setting and comes back where you left it. Card
games are still mouse-only. A soft gold light also settles on whoever's turn it
is in five games, fading from one seat to the next — with an outline as well as
a glow, so it does not rely on seeing the colour.

**demoreel** (the tool that records videos of apps) released **0.2.0**, with no
files attached — it is installed from source, so there is no download to link.
Its best fix is in keeping with the week: **when its check for a blank recording
could not take its sample, it reported "not blank" and the run succeeded.** That
now fails with the reason. It also catches a recording that is blank halfway
through rather than only at the end, and asking for three seconds now gives you
about 3.2 rather than about 4.2.

**Album Builder** found that it read music tags **only in the format used by MP3
files, so nine of the twelve formats it supports showed no information at all**;
and files with no tags reported a duration of zero.

**Local Web Server Manager** spent the week closing small review findings. Worth
one line: a fix was written, then measured, then **backed out** — the reported
cause turned out not to be real, and the reasoning is now a comment so the next
person does not file it again.

**RetroArch** (my fork) and **RetroDB** both moved only in their documentation
and internal records. Nothing a player would see.

**Quiet this week:** MAME Curator, Snatch, Slipcase and LottoTracker — checked
against GitHub, not just my own copies. Rusty PSN has no public repository yet,
so there is nothing to read.

## What changed on the site

**Pressless moved to Beta and now shows downloads** for Windows and Linux.

New downloads picked up this week: **Ants Terminal 0.7.111**, **Pressless
0.1.2** and **Rolodex 1.5.0**.

Two changes to how this site looks after itself. **An About page can no longer
quietly go stale**: each one is now compared against the release history the
build has just fetched, so a page still saying "no download yet" for something
that has since shipped stops the build rather than going live. And the site now **has
machinery to publish this post by itself**, on a timer, every Wednesday: it
gathers the week's facts into one file, writes the post from that file, has a
second and independent session check every figure against its source, and
publishes only on a pass. This week's post is not that — it was gathered by
that machinery but written and published by hand, a day early.

**RetroDB's download is still 3.12.0, from June** — the project has moved on a
great deal since, but nothing newer has been published as a release.
