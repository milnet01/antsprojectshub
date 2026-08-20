A full MAME set is about 43,000 machines. Roughly 26,000 of those are arcade games
once the BIOSes, circuit boards and non-arcade oddities are stripped out, and most
of the remainder are near-duplicates: the Japanese revision, the bootleg, the
prototype, the version with the copyright text in a different corner.

Nobody wants 26,000 arcade games. They want the good ones, once each.

MAME Curator does that sorting for you, then lets you argue with its choices.

## What it does

- **Reads your MAME set and its DAT file** — about 48 MB and 43,000 machines,
  parsed in around five seconds.
- **Drops what is not a game** — BIOSes, devices, computers, and the mahjong,
  casino and adult machines — using community reference data.
- **Picks the best version of each game** from its family of clones, by a fixed
  chain of rules: community ratings first, then parent over clone, then how well
  the driver is emulated, then region, then revision.
- **Lets you overrule it.** Click any game to see its siblings side by side with
  cover art and screenshots, and swap the pick with one click.
- **Saves a curation as a named session** — a year range plus preferred genres,
  publishers and developers — so `80s shooters` and `co-op only` are two clicks
  apart rather than a rebuild.
- **Copies the winners out**, along with any BIOS files they need, to a separate
  folder. Your source set is never touched, and replaced files go to a recycle
  bin rather than vanishing.
- **Writes a RetroArch playlist** on the way out, so the games show proper names
  and descriptions without you renaming a single file.

## Using it

Clone it and run `./run.sh` — `run.bat` on Windows. That sets up Python, installs
what it needs, runs a setup wizard the first time asking where your DAT, your ROMs
and your destination folder live, then opens the interface in your browser. Run
it again any time; it picks up where it left off.

There is a command-line route too, including a dry run that reports what would be
copied without copying anything.

You supply the MAME set and its matching DAT — those are not included, and are not
something this project distributes.

## Where it stands

Version 1 and stable. It runs entirely on your own machine: no telemetry, no
analytics, no cloud sync, and the ban on adding any is enforced by an automated
check rather than good intentions. You need Python 3.12 or newer and a browser;
everything else is handled for you. MIT licensed.
