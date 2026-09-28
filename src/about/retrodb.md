If you have collected retro games for any length of time, you have a folder of
thousands of files with names like `smb3.zip` and no idea what half of them are.
RetroDB turns that into a proper library — with cover art, descriptions, release
dates, ratings, and everything you have ever played tracked in one place.

It knows more than 140 platforms, from the Atari 2600 to the PS5.

## What it does

RetroDB runs as a small web application on your own machine: you start it, open
your browser, and point it at your ROM folders.

- **Fills in the details automatically.** It looks your games up across several
  metadata sources at once and merges what it finds — box art, screenshots,
  descriptions, genres, developers, release dates.
- **Launches your games.** Press Play on a game and it opens in the emulator you
  have set up for that system, RetroArch included.
- **Tracks achievements and trophies** from RetroAchievements, Steam, Xbox, and
  PlayStation — including local RPCS3 trophies.
- **Age ratings from around the world** (ESRB, PEGI, CERO, USK and more), mapped
  against each other so you can filter by whichever one you actually recognise.
- **Organises the collection** with tags, custom lists, a wishlist, and
  collector trophies you unlock by hitting milestones.
- **Brings in what you already own.** Import from CLZ, or from your Steam, Xbox
  and PlayStation libraries.
- **Fixes the files themselves.** An archive scanner, a CHD converter and
  verifier, a duplicate finder, a multi-disc organiser, and reports that flag
  ROMs whose names break the standard conventions.
- **Sharpens old artwork** with an optional AI upscaler for low-resolution
  covers and screenshots.
- **Shows you what you have** through a twelve-tab analytics dashboard with
  charts, leaderboards, and PNG or CSV export.
- **Estimates how long each game takes to finish**, so you can pick something
  that fits the evening you actually have.

There is also a Museum — an interactive encyclopedia of the consoles themselves —
and seven themes to look at it all through, including Cyberpunk, Matrix and a
vector starfield. The interface comes in English and several other languages.

## What you will need

RetroDB is free and needs Python 3.10 or newer. Extract it, run `python
install.py`, start it, and a setup wizard walks you through the rest at
`http://localhost:5000`.

**One thing to know up front:** the metadata scrapers, the achievement trackers
and the AI features each need their own account or API key, which you create on
that provider's site. RetroDB runs perfectly well without any of them — those
specific features simply stay switched off until you supply the credential. Most
keys are free. The AI features work with Google Gemini, OpenAI or Anthropic
Claude, which charge by usage, and you pay them directly.

More than one person can use the same install, with admin, editor and viewer
roles keeping them out of each other's way.

## Where it stands

Live and in daily use, on Linux, Windows and macOS, with a launcher for each. It
is built for a home network: other computers and phones in the house can open it
at your machine's address. To reach it from outside your home, there is a guide
for putting it behind a proper reverse proxy.

RetroDB does not distribute or host ROM files, and is not affiliated with any
console manufacturer or publisher. MIT licensed.
