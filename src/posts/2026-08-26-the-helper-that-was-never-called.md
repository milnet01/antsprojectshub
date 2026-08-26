---
title: The helper that was never called, and a release that shipped the wrong build
date: 2026-08-26
summary: Snatch's first release shipped a helper that unlocks most of YouTube's picture qualities, and never once used it — 4 entries where there should have been 37. DOOM Ants 0.7.1 published a binary built before the fix it was cut for. Games Hub 0.4.0 went out, and then all fourteen games learned to be readable.
projects: snatch, doom-ants, games-hub, fin-break, oneup, ants-terminal, local-web-server-manager, lotto-tracker, vestige-engine, album-builder, pressless
---

## The helper that was never called

Snatch — the video downloader — had its first public release an hour after
last week's post went up. **1.0.0**, and then **1.0.1** the next morning,
because most YouTube videos would not play at all: the copy of yt-dlp inside
it was five months old and YouTube had moved on. One video in five played
before that; five in five after.

Then the interesting one.

YouTube makes a downloader solve a small puzzle before it will hand over the
picture qualities. Snatch ships a little program to solve that puzzle — one of
the things 1.0.0 was pleased with, because the alternative was telling you to
go and install Node.js first. Snatch had been naming that program in a way
yt-dlp could not read. So it was never used. Not on any release, not on any
platform, not once.

What you saw was a video that appeared to have sound-only versions and nothing
else, or one that refused outright with "Requested format is not available".
On the video that was reported: 4 entries before, 37 after, 25 of them picture
qualities.

A separate cause did the same thing to different videos. Saved cookies made
YouTube hand back sound-only versions only; Snatch now tries again without
them, keeps whichever answer actually has picture in it, and says so in the
status line. On that video, 4 entries became 53.

Snatch can also update its own downloader now. When YouTube changes something,
yt-dlp has to change with it, and until now that meant waiting for a whole new
Snatch on three platforms. It offers to fetch a newer one at startup, keeps
the copy it shipped with, throws away a download that arrives broken, and has
a "Revert to bundled" button if a new one misbehaves. Nothing downloads
without you saying yes — and unlike the old route, nothing asks for your
password or touches anything outside Snatch's own folder.

Smaller, but it had been annoying me: every text box in the app now has a
right-click menu with Cut, Copy and Paste. And the picture library Snatch uses
to show video thumbnails had 12 published security advisories against the
version in 1.0.0 and 1.0.1. All 12 are fixed in the version bundled now.

## A release that shipped the wrong build

Last week I wrote that **DOOM Ants 0.7.1** had gone out. It had. It was the
wrong file.

The release tool decided a file was "already built" by looking for something
with the right name — and the name carries only the version number. So a test
build made earlier in the day counted, and that is what got uploaded: both
files, Windows and Linux, made before the fix the release was cut for. The
tag was right, the notes were right, the tests passed. Nothing anywhere looks
at the file that actually goes out.

It was live for about ninety seconds before I spotted it and replaced both
files by hand, so I doubt anybody got the wrong one — but that is luck, not a
process. I went back afterwards and checked every earlier release one at a
time, by opening the shipped binary and looking for something only that
version's code contains. All of them are clean; 0.7.1 is the only one this
happened to. Each build is now stamped with the commit it came from and only
reused for that exact commit, and after publishing, the tool downloads what it
just uploaded and compares it byte for byte with what it built.

Two more holes in the same tool closed with it. A release cut with an empty
changelog section used to publish with a completely blank description — it now
stops and names the section. And the version number used to move in the
changelog and the README on only one of the tool's two routes, so a
hand-written changelog left the README still advertising the previous version.
Everything moves together now, and it refuses to tag while anything lags.

The other DOOM Ants story this week is about a fix that worked and broke
something anyway. A plain wall was glowing when it should not have been. The
fix stopped it — and quietly took most of the glow off the things that are
*supposed* to glow, because the brightness dial had been set against the old
arithmetic and nobody re-set it. Nothing caught it, because the check
confirmed the wall had stopped glowing and never asked whether the lamps still
did. What caught it was me looking at the screen and saying I could not see
the bloom. It is measured and re-set now: the light strip in the test spot
reads 6.54 against 7.03 before any of this started, and the plain wall stays
at zero.

## Fourteen out of fourteen

Last week Games Hub had a legibility switch — the one that makes a game's
board and its words bigger — and two of its fourteen games answered it. I said
there would be no release until more of them did.

**0.4.0** went out that evening with those two, and then the other twelve
followed over the week. Chess, Reversi, Draughts, Minesweeper, Solitaire,
Spider, FreeCell, Pyramid, Hearts, Snake, 2048 and Pinball all answer it now.
Nine of them previously drew no words at all on the board itself — not the
score, not whose turn it was, not "game over" — and said it only in the strip
along the bottom. They say it on the board now. Chess grew its coordinates,
Minesweeper its neighbour counts, 2048 its tile numbers, Pinball its score,
and Hearts names the suit that was led. **0.4.0** is still the download; the
other twelve are written and waiting for the next one.

Canasta had a heavy week of its own. The version the family actually plays now
has its own rules: the round ends when you throw your last card away rather
than by laying your hand down, a completed canasta squares up and lies across
the team's red threes so the stack can be counted by its edges, the card that
freezes the pack lies as a T, and reaching the target score is how you win —
so a hand that carries both sides past it is a draw, and the table says so
instead of naming a winner. Classic Canasta is untouched by all of it.

The Expert computer got harder to cheat, too. Throwing away a card that
several people have already discarded is usually safe. A crafty player exploits
that by feeding the same rank into the pile one card at a time so it *looks*
safe. The pack now remembers who threw each card, and Expert counts how many
different players let a rank go rather than how many cards are sitting there.
Old saved games still load; they just do not carry who threw what.

And the test suite can now take a picture of the app without opening a window,
which is how a layout gets checked without a person looking at it.

## A way back into your own vault

**finbreak 0.1.22** went out last Wednesday with a tidy fix — on a
credit-card statement running over several pages, "Continued on next page" was
being tacked onto the end of the transaction above each page break. Amounts
were never affected; the descriptions were messy.

The bigger one is not released yet. Forgetting your master password has always
meant losing everything in your vault, which is correct and also terrifying.
finbreak now shows you a recovery code once, when the vault is created: keep
it somewhere safe and it can unlock the vault and let you choose a new
password. You can decline it, or replace or remove it later. finbreak keeps no
copy — losing both the code and the password is still unrecoverable, because
anything else would mean someone else could get in too. Existing vaults are
upgraded the next time you unlock them, with a copy taken first and only
removed once the upgrade has been checked.

Importing a spreadsheet also got less tedious: finbreak now reads the file's
own column headings and fills in the mapping for you — Date, Description,
Amount, and the usual variations like Transaction Date, Narrative, Withdrawal
and Deposit. Everything it guesses stays visible and changeable before you
import.

## A new project: Pressless

Pressless is on the site this week, marked as coming soon.

Most people who want a website of their own end up renting one: a monthly fee,
somebody else's editor, and the box changes under you. The free route is to
publish plain files to a service like GitHub Pages, which costs nothing and is
fast — and expects you to be technical. Pressless is that free route with the
technical part taken away. It runs on your own computer, opens in your normal
browser, and publishes with one button. Every entry stays an ordinary text
file in an ordinary folder, readable with Pressless deleted or never
installed.

It is very early — there is nothing to download. What exists is the styling
language everything else will render through, and it was proved against a real
twelve-year archive: 556 entries come out byte-for-byte identical to what
produces that site today, so nothing moving across loses a line of a poem.

## Short notes

**OneUp** — no release, but a lot of work behind one. The window has been
reworked so there is one obvious thing to press: two buttons in the title bar
instead of four, "Run selected updates" first, Stop taking the place of Check
while a run is going, and clicking anywhere on a task's row turning it on or
off rather than only the small switch at the end. Eight colour themes to pick
from. Sixteen controls that showed nothing at all when you tabbed to them now
show where you are, in every theme. And if you pressed "Show download size"
before starting an update, OneUp asked for your password twice — sometimes with
both boxes on screen at once — because it was running the whole updater twice
over. Once now.

**Ants Terminal 0.7.106** is out, with the usual pile of work under the
floorboards. The one I liked: a new check reads which work was finished since
the last release and lists anything that never made it into the release notes.
The first run found 19 things that had shipped without being written down, one
of them closed on the very day of the release it was missing from. The check
that already existed only looked the other way round — that everything claimed
had really shipped — so this half was invisible.

**Local Web Server Manager** — each project can now open in its own browser,
picked from the ones already installed, so one project can be Firefox and
another Chrome. You can hide a project you never use and bring it back from
the View menu. The window reopens at the size you left it, the title bar says
which version is running, Enter in the filter box jumps to the first match,
and your whole project list and settings can be exported to a file and
imported on another machine. Underneath, a run of safety work: a settings file
that cannot be read is no longer saved over, a launcher that points outside
its own project is refused, and stopping a project holds its slot for the
whole stop rather than letting something else grab it midway. Still no
download.

**LottoTracker** — the thing it was actually for, finally. Two draws before a
ticket runs out, the tray tells you once, naming the game and the date of the
last draw so you know what to go and buy. It reads the calendar and never the
results, so it is right with the machine offline and the archive missing.
Checked against every ticket that has already finished, the projected final
draw matched the real one 257 times out of 260 and was a day out in the other
three. The bound that mattered most was the one that looks like decoration: a
ticket with no draws left is never warned about, and without that rule the
first run against the real data fired 559 notices. The page now also shows the
numbers you chose beside the numbers that were drawn, with the PowerBall or
bonus ball marked apart rather than reading as a sixth number.

**Vestige 0.1.70** is out — it carries last week's light-shaft fix and a
long backlog of engine work that had never been written into a dated section.
Since then the light shafts got the performance check they never had, and it
promptly caught something: on a GTX 1050 at Medium, the effect takes 1716
microseconds against a budget of 1750, and goes over on two runs out of six.
The budget was derived from what a 60-frames-a-second frame can afford rather
than fitted to a machine, which is the only reason a measurement could fail
it. Recorded rather than papered over.

**Album Builder** now accepts `.aac`, `.aiff`, `.aif`, `.oga` and `.wma`
alongside what it already read, and the documented command for running it has
been corrected — it never worked as written.

## What changed on the site

Quite a lot, and most of it is about reading things here rather than
elsewhere.

Every project now has a hand-written About section instead of its GitHub
README. A README opens with badges and build flags, buries what the thing
actually does, and changed the shape of the page whenever the repository was
edited. And every project with releases now has its **whole changelog on this
site** — every version, newest first, with a link you can point at a single
release. "What's new" goes there now instead of sending you to GitHub. Where a
release was cut with no notes at all — 24 of 180 here, including all 11 of
OneUp's — the notes come from the project's own changelog file instead of the
page reading "shipped without written notes" over and over.

Every download button now starts a file. Five of the thirty-one used to land
you on a GitHub page and leave you to work out what to click; those five are
projects with no packaged build yet, and they now hand you the source archive
directly, which is what their instructions tell you to use anyway.

And the site has analytics now, which needs saying plainly. Nothing loads
until you press Accept on the bar at the bottom — no script, no cookie, no
request to Google at all. Declining is remembered and never asked again, and
the choice is kept in your browser's own storage rather than in a cookie,
because a cookie recording that you refused cookies is its own punchline.
There is a `/privacy/` page that says what happens in English, and the build
refuses to publish if the code and that page stop agreeing.

New downloads this week: Snatch 1.0.1 (Windows, Linux and macOS), Games Hub
0.4.0, finbreak 0.1.22, Vestige 0.1.70 and Ants Terminal 0.7.106. Pressless
joins the list, marked coming soon.
