---
title: The menus that were never drawn, and Slipcase on all three systems
date: 2026-10-07
summary: Vestige's in-game menus had never once appeared on screen — the graphics card was throwing them away as the hidden backs of objects. Slipcase published its first downloads, for Linux, Windows and Mac, on the same day. Pressless can now show you who reads your site, and Ants Terminal finally shipped the release last week's post was waiting for. Fifteen projects moved; five were quiet.
projects: pressless, slipcase, ants-terminal, vestige-engine, ut-ants, contact-list, local-web-server-manager, demoreel, doom-ants, oneup, fin-break, retroarch, perch, retrodb, rolodex
---

**Fifteen projects moved this week and five were quiet**, against twenty and
none last week. Four of them published releases with downloads attached:
eight releases in all.

The thread this week is checks that said yes without looking. A pre-push
check that skipped a step and let the push through anyway. A test that failed
on GitHub, and only there, because of the digits in a file name. And, the
other way round,
menus that every test was happy with and that no player had ever seen.

## Pressless: see who is reading

**Pressless** published three releases, **0.6.2, 0.7.0 and 0.7.1**, all with
downloads for Windows and Linux.

What you get:

- **A "Who is reading" card and page.** How many people read your site each
  day, which countries they are in (with flags), how they found you, and your
  most-read pages, over the last 7 days, 4 weeks or 12 months. If Google
  cannot be reached it shows the last numbers it had and says how old they
  are. 0.7.1 lets you switch to a different Google site without signing in
  again.
- **A theme picker** in the top bar: light, dark, two high-contrast themes,
  and themes inspired by games, films and TV. Every theme is tested for
  readable contrast.
- **A more modern look**, with plain fonts for Pressless's own headings.
- **A Settings link on every page.** After first setup, no page led back to
  Settings, so the Google sign-in could not be found at all.

Waiting for the next release, and it is most of a website builder: setup as a
short wizard that walks a newcomer through GitHub one screen at a time,
**signing in to GitHub with a short code** instead of making a key, a plain
starter site for someone starting from nothing, Google's visitor counting put
on your site with a Privacy page to match, a switch to turn the journal off,
and a "Suggest or report a problem" link on every screen.

### The instructions that could never work

The wizard was walked through by hand on Linux and Windows before it was
called done, and that walk found the week's best Pressless bug. **A key made
exactly as the instructions said could never switch your site on.** The
instructions left out one permission, Administration, without which GitHub
refuses. They include it now.

A later run, on a brand-new account, found a second one. There, GitHub had already
switched the site on by itself — and then answered Pressless's own request to
do it with an error, which stopped setup. That no longer stops it.

The older list of checks only a person can do, which I mentioned last week,
is still open.

## Slipcase: downloads for Linux, Windows and Mac

Last week **Slipcase** had released 1.1.0 with no files attached. On the 30th
it published **1.2.0, with a Linux download, and then 1.3.0, adding Windows
and two Mac downloads** — one for Apple silicon, one for Intel. The Linux and
Windows downloads are single files that run without installing anything.

Neither is signed yet. Windows shows its "Windows protected your PC" screen
the first time (choose More info, then Run anyway), and macOS asks you to
allow the first launch under Privacy & Security. The Mac builds were built
and checked on GitHub's Mac machines; **nobody has tried them by hand on a
real Mac.**

The find: in a packaged build, **rendering a batch of boxes opened another
copy of the app** for each helper process, because each helper began by
running the whole application again. Every packaged build must now pass a
self-check before it is attached to a release.

Waiting for the next release:

- **Clicking quickly through search results froze the window** for up to a
  second while an old preview finished downloading.
- A cover-art reply was first capped at 5 MB, sized from the saved test
  replies, which are trimmed to under 20 KB. A real search for "Crash
  Bandicoot" came back at 2,722,547 bytes, so the cap is 25 MB.
- A server sending a cover one byte at a time could hold the download open
  far past its 60-second limit, because the limit was only checked once a
  full block had arrived.

## Ants Terminal: last week's waiting list ships

Last week everything in **Ants Terminal** was waiting for 0.7.112. **0.7.112
came out on the 30th and 0.7.113 on the 1st**, both with the Linux download.

So these are now yours: **the Linux download updates itself**, a welcome
window on first launch that sets each feature up in one click, a long status
message no longer stretching the window, and Session Logging giving each tab
its own file.

0.7.113 adds:

- **The Roadmap window lines everything up in columns** and remembers what
  you had open in each project. Opening a big section is up to 30 times
  faster.
- **In the Flatpak, git and the search tools now work**, by running on your
  computer rather than inside the sandbox, which has none.
- **The status bar shows how full Claude Code's memory of the conversation
  is again.** It had been reading 0% and hiding.
- Security fixes, among them these three. Ants Terminal's private connection points moved out
  of the shared temporary folder, where another user on the same computer
  could claim their names first and switch them off. A signing key no longer
  appears on a command line other users can read. And keys, tokens and
  passwords shown in the terminal are hidden before Claude reads them.

The release step itself also changed: it now waits for GitHub's own build to
pass before it tags a release, because my machine has a newer toolkit than
GitHub's and a commit could pass here and fail there.

### The check that skipped and said yes

The find of the week here: Ants Terminal must still build on an older version
of its toolkit, and **GitHub's build for that version had been failing since
the 3rd.** The check I run before every push should have caught it. It did
not, because **its step for that version skipped itself whenever its cache
was cold — and still let the push through.** A cold cache now stops the push
in seconds instead.

Waiting for the next release: the AI Assistant shows its answer as it
arrives, the status bar says when another Claude Code session has left you
messages, and Ants Terminal ships a copy of demoreel.

## Vestige: the menus nobody had ever seen

No **Vestige** release this week. Vestige has also stopped publishing a test
version every Wednesday; a release now goes out when there is something worth
having.

The title is this project's. **The game's menus and on-screen display had
never been drawn.** The 2D pass was left with a 3D setting switched on, so the
graphics card treated every menu as the hidden back of an object and skipped
it. And once they appeared, **no mouse click reached any of them** — only
Enter and Space did anything. Both are fixed.

Once you could see the menus, they had more to confess. **They showed version
0.6.2, and made-up details**: a last session, a world time of 14:22:08, an
autosave time and "SLOT 03" — for a game with no save system. They show the
real version now, and nothing invented.

Two more of the same family:

- **Every light probe captured the main camera's picture**, so the whole
  Tabernacle scene got one flat colour of bounced light. The probes also
  ignored the sun's shadows, so the inside of the tent was lit as if it stood
  in full sun.
- Last week I wrote that no engine system had ever updated in the real app. One
  layer down: **nothing ever told the systems a scene had opened**, so 2D
  physics never gave anything a body. It does now.

New, and waiting: graphics settings for players, with Low to Ultra presets;
the interface in French, German, Spanish, Italian and Brazilian Portuguese,
written by Claude and listed for a native speaker to check; background sound
zones that fade with distance and time of day; scripted music and spoken
lines with captions; and a cloudy sky over the meadow. Surround and
360-degree sound files used to play as noise. They play properly now.

## UT Ants: under water

**UT Ants** still has nothing to download. The week went into making maps
look and move the way they did.

- **Under water** the view takes the water's own tint and fades with
  distance, light ripples across floors and walls, shafts of light fall
  through the water, and specks drift past you.
- **Water, lava and slime move again**, rivers and conveyor belts slide, and
  fires are moving flames that face you. **Conveyor belts had been moving
  almost twice as fast as the original**, and one map's water rippled about
  15 times too fast.
- **Hanging vines no longer draw as black sheets.**

The find: **a tower's light came and went as you turned the camera.** Each
small region of the view kept only the 64 lights nearest its centre, and on
one map up to 139 reach a single region. Which ones were dropped depended on
where you looked. It now keeps the lights that put the most light on that
region, at no
measured cost in speed.

And two speed measurements that went opposite ways. Indoors, frames now draw
about twice as fast with the same picture — on AS-Frigate, from about 25 to
about 13 milliseconds at 4K. But a change meant to speed up shadows was
measured making frames slower, about 67 to about 82 milliseconds, and was
dropped.

The first release was also trimmed to what it needs: 18 items moved to the
release after it.

## Contact List 1.2.2

**Contact List 1.2.2** was released on the 2nd, for Linux, macOS and Windows.

**1.2.1 was tagged and never published.** A tool the Linux build downloads
was rebuilt upstream on 28 September, its fingerprint no longer matched, and
the build stopped. The build now fetches one fixed version. 1.2.2 carries
everything that was meant for 1.2.1:

- **Contacts exported as vCards now have a separate first and last name.**
  The whole name went into the surname, so a phone filed "Amara Okafor" under
  A.
- **Screen readers name the custom-field boxes** on the contact form, where
  before there was only hint text, and a Remove button that said just
  "Remove".
- Importing a CSV with two columns both called "Email" now remembers your
  choice for each.

## Local Web Server Manager: its first release

**Local Web Server Manager 0.1.0** was released on the 1st, with the theme
"Looks finished". It has **no files attached**, so there is still nothing to
download.

Much of it is for people who read the screen as I do:

- **Messages from the menus moved from the bottom edge of the window to a
  banner above the list**, because at the bottom they sat outside a
  magnifier's view.
- **A screen reader hears the projects as a list.** And a project named
  something like "x, running, port 80" can no longer pass itself off as its
  own status: the row now reads its status first, then the name.
- **Every outline stands out at least 3:1** from what is behind it, in every
  theme, and the keyboard focus ring is thick on every control.

My favourite small one: a line like `parseInt(process.env.PORT, 10) || 3000`
was read as **port 10**. That 10 says "count in tens"; the port is 3000.

Waiting for the next release: each row says exactly what its server is doing,
in one of seven states, and Stop works on a server you started yourself in a
terminal, after listing every process it would stop.

## demoreel 0.3.1: finishing a recording

**demoreel 0.3.1** was released on the 30th, with no files attached — it is
installed from source. It can now finish what it records: trim the ends,
caption a stretch, join clips, make a title card, fade in and out, or build a
whole short film from a plain-text script.

The find was a check that passed here and failed on GitHub. It counted how
many times the video was encoded by looking for "264", the name of the video
format. **On GitHub, a text file's name happened to contain the digits 264**, so the check counted two encodes and failed. It now looks for the
encoder's whole name. And while building the film step, one picture made the
video tool **grow to 14 GB of memory**; it is now held to half the machine.

Waiting for the next release: draft translations in sixteen languages, and a
way to give the text demoreel types from a file, so it no longer sits on a
command line other users can read.

## DOOM Ants: all waiting

No **DOOM Ants** release; everything here waits.

- **The ray-traced view counted one glowing wall twice** when a lamp or torch
  was on screen. In the test that checks the sum, it averaged 100 where the
  true answer was 60, and 6,998 where it was 12. On screen, at the two spots
  measured, the change is small.
- **Minimising the window ended the game** in the 3D views. It now waits.
  That was found by reading the code and has not yet been tried on Windows.
- **Starting the game from a different folder opened the other game**,
  because the one you last played was remembered relative to wherever you
  started it.
- A test map with 4,000 trees on one spot went from 8 frames a second to 27,
  and a crafted map can no longer hold one frame long enough for the graphics
  driver to reset.

## Short notes

**OneUp** (system updates) published nothing, and a lot waits. The part that
does the updating has been rewritten in Python and needs Python 3.13 or newer
on your computer. Among the fixes: **removing leftover packages tried to
remove a package called "Name"**, which was the heading of the list; when the
package manager updated itself first, the rest of the update was never
installed; and hiding your computer's name in a diagnostics report, on a
computer called "oss", turned "repo-oss" into `repo-<host>`. A weekly
update you stopped used to report "Already up to date".

**finbreak** (finances) worked through the findings queued from last week's
audit; none of it is released yet. In Arabic or Persian, **amounts showed the whole number
in one set of digits and the cents in another**. A computer set to a time
zone that does not exist crashed it. And a backup holding one transaction
said "1 transactions."

**RetroArch** (my fork) had more of its fixes taken into official RetroArch:
four merged on the 1st, then the faster content scan, and two more after
it.

**Perch** now sizes the columns of its settings tables to their text instead
of cutting it off ("app:kons…"). Last week's waiting fixes are still waiting.

**RetroDB** and **Rolodex** moved only in their own records.

**Quiet this week:** MAME Curator, Album Builder, Snatch, Games Hub and
LottoTracker. Rusty PSN has no public repository yet, so there is nothing to
read.

## What changed on the site

New downloads picked up this week: **Ants Terminal 0.7.113**, **Contact List
1.2.2**, **Pressless 0.7.1** and **Slipcase 1.3.0**.

**Slipcase is now listed as Live**, with downloads for all three systems. The
checks I run before a push now stop on any project at 1.0.0 or later that is
not listed as Live.

**Demo videos** for Slipcase, RetroDB, Perch, Rolodex and Contact List.

**Local Web Server Manager's page** describes its first release. The pages
for Pressless, Ants Terminal, Slipcase, demoreel, RetroArch and Contact List
were brought up to date with what each shipped or had merged.

**A small honesty fix of my own.** When GitHub fails to answer for one
project's release history, the checks I run before a push have nothing to
compare that project against. They now say those checks were skipped, rather
than recording a pass.

Also: a download button can no longer point at the small update-description
file published beside a Linux download, instead of the download itself; the "fork of"
credit on a card is bigger and brighter; Pressless's gallery was trimmed
to seven pictures; the private stats page I keep for myself has its own tab
icon; and I wrote down why two speed-ups to the site's build need nothing
more.
