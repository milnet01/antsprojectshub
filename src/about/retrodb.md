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
  descriptions, genres, developers, release dates. Each source searches the
  right console. A game's region comes from its own file name, and its box,
  manual, title and date follow that region. A sequel, a mod or an add-on no
  longer passes for the game you own, and a bulk scrape needs the title to match,
  not only the console. A release date shows only as much as its source knows.
  Your local ES-DE data keeps its place in your chosen source order, which also
  decides between equal matches. A game's series comes from sources that name
  one, not from its title, and each company has one spelling, so clicking Sega
  finds every SEGA game. A title you type yourself
  stays; scraping never changes it back, and Full Re-scrape keeps a rating or
  controller you set unless a source really provides one. AI Fill adds sales
  figures, release
  dates for every region and each game's official name, one game at a time or a
  whole system at once. Age ratings, review scores and sales figures from the AI
  are marked as such, so a guess doesn't look official. Claude can also search the
  web for sales figures, and you
  can type a figure in yourself. The library and system pages update live while a
  bulk scrape runs.
- **Launches your games.** Press Play on a game's page, or the Play button on
  its box art in the library, and it opens in the emulator you have set up for
  that system, RetroArch included. RetroDB first checks that the file is a type
  that system uses. Home-computer games (C64, Amiga, DOS and more) get every key
  you type, and RetroArch games start with a working keyboard. PlayStation 3
  games stored as a folder play too, and each shows how well it runs in RPCS3,
  read from your own copy. No RetroArch yet? Press Get RetroArch under Settings >
  Emulators > Play in RetroDB. It downloads the official one, checks it and sets
  it up with its own settings and saves, apart from any RetroArch you already
  have. Games open in RetroArch's own window, and it fetches each system's core
  the first time you play. That works on Linux and Windows; on a Mac it is not
  tested yet. Pick each
  system's emulator from a list, and a game's page says which one Play will use.
  In RetroDB's RetroArch, the left stick can act as the D-pad.
- **Turns cheats on from a game's page**, for RetroDB's RetroArch, DuckStation
  and PCSX2. A cheat that is on pauses RetroAchievements hardcore mode. The
  Cheats section folds away when you don't need it.
- **Tracks achievements and trophies** from RetroAchievements, Steam, Xbox, and
  PlayStation — including local RPCS3 trophies. They share one Achievements
  page, with a tab for each. Sign in to RetroAchievements from Settings > Account,
  and achievements unlock as you play in RetroDB's RetroArch. That sign-in also
  reaches DuckStation and PCSX2 when you press Play. The password goes only to
  RetroAchievements and is not kept.
- **Age ratings from around the world**: nine rating systems, including ESRB,
  PEGI, CERO, USK and China's. They are mapped against each other, so you can
  filter by whichever one you actually recognise.
- **Organises the collection** with tags, custom lists, a wishlist, and
  collector trophies you unlock by hitting milestones. Own a game from several
  regions? Link the versions and the library shows one card, which plays your
  preferred region. Filter the library by several genres, series or publishers
  at once, sort it by name, release date, score or recently added, and press
  Unscraped to see the games still waiting for their details. Genres,
  perspectives and game modes use one set of names, so filters find every game.
- **Brings in what you already own.** Import from CLZ, or from your Steam, Xbox
  and PlayStation libraries.
- **Fixes the files themselves.** An archive scanner, a CHD converter and
  verifier, a duplicate finder, a multi-disc organiser, and reports that flag
  ROMs whose names break the standard conventions, all on one ROM Tools page.
  There, the AI can also suggest each game's full official name in its own
  region: a Japanese Mega Man becomes Rockman. You see old and new side by side
  and accept only the ones you want. Fix Regions from File Names, Fix Box and
  Manual Regions, Clear RAWG Pictures from Box Art, Tidy Release Dates, and Tidy
  Genres, Perspectives and Modes repair older scrapes.
  Screenshot Review lists doubtful ZX Spectrum, Commodore 64 and Game Boy
  screenshots and removes only what you choose.
- **Sharpens old artwork** with an optional AI upscaler for low-resolution
  covers and screenshots.
- **Shows you what you have** through a twelve-tab analytics dashboard with
  charts, leaderboards, and PNG or CSV export. A Quick Fixes panel on the home
  page counts games missing box art and broken ROM paths, and finds duplicate
  ROMs.
- **Estimates how long each game takes to finish**, so you can pick something
  that fits the evening you actually have.

There is also a Museum — an interactive encyclopedia of the consoles themselves —
and you can read a game's manual right on its page, turning pages like a book.
The left and right arrow keys step between games on a game's page.
Import a [Slipcase](/p/slipcase.html) 3D box onto a game from its Edit window,
and you can turn it in your hands to see the spine and back.
Seven themes let you look at it all, including Cyberpunk, Matrix and a
vector starfield. A search box on every page finds any game or console as you
type; press / to jump to it. Every page fits the window it is in, from a phone
to a wide monitor. On a phone or tablet, a bar along the bottom reaches the
Dashboard, Library, Systems and Achievements in one tap, and the library's
filters open from one Filters button. The interface comes in 21 languages, and screen readers announce the progress of
long jobs aloud. Every pop-up handles Escape, keyboard focus and screen readers
the same way.

## What you will need

RetroDB is free. The download buttons give you a version with Python built in,
so there is nothing else to install. Unzip it and double-click the start file:
`start.bat` on Windows, `start.command` on a Mac, `start.sh` on Linux. On Linux,
`install-launcher.sh` also adds it to your app menu.

If you already have Python 3.10 or newer, the smaller downloads under the
buttons are the other version: extract it and run `python install.py`. You can
then start it from a pinned icon, with no terminal.

Either way, RetroDB opens in your browser, and a setup wizard walks you through
the rest, showing which step you are on and which steps you can skip. Every path
box has a Browse button. A new library starts with a Scan Library button, not an
empty page.

**One thing to know up front:** the metadata scrapers, the achievement trackers
and the AI features each need their own account or API key, which you create on
that provider's site. RetroDB runs perfectly well without any of them — those
specific features simply stay switched off until you supply the credential. Most
keys are free. The AI features work with Google Gemini, OpenAI or Anthropic
Claude, which charge by usage, and you pay them directly.

More than one person can use the same install, with admin, editor and viewer
roles keeping them out of each other's way.

## Where it stands

Live and in daily use, on Linux, Windows and macOS, with a launcher for each.
RetroDB updates itself: an admin sees a new version on the dashboard and in
Settings, and one button downloads it, checks it is genuine, backs up the
database and installs it. If the new version will not start, RetroDB goes back
to the old one by itself. Your games, settings and images are left alone. It
is built for a home network: other computers and phones in the house can open it
at your machine's address. To reach it from outside your home, there is a guide
for putting it behind a proper reverse proxy.

We do not condone piracy. RetroDB does not distribute or host ROM files. Only
use games you own, copied from your own discs and cartridges; the law on making
such copies differs from country to country, so check yours. Game names, cover
art, screenshots and videos belong to their owners. RetroDB is not affiliated
with or endorsed by any console maker, game publisher, or the game databases and
services it works with. RetroDB shows this notice too, in its About dialog and
its Library settings. It also credits RAWG, one of its sources, with a link in
the sidebar. MIT licensed.
