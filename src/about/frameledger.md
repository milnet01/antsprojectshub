A game engine is the software underneath a game. It draws each picture on
the screen, many times a second. Each picture is called a frame. For a game to
feel smooth, each frame has to be drawn quickly: 60 frames per second leaves
about 16 thousandths of a second for each one. When frames take longer, the
game stutters.

frameledger was made for three game engines on this site, all by the same
developer:

- **[Vestige](/p/vestige-engine.html)** — a 3D engine built from scratch, for
  walking through spaces you build yourself.
- **[UT Ants](/p/ut-ants.html)** — a new engine that plays maps made for the
  1999 game Unreal Tournament, with modern lighting.
- **[DOOM Ants](/p/doom-ants.html)** — a modernised version of id Software's
  classic DOOM, moving toward ray-traced lighting.

Each of the three measures its speed a different way. Vestige logs an
average about once a second, so one slow frame vanishes into it. UT Ants
writes one set of figures per test. DOOM Ants prints lines to the screen.
Finding a slow spot means hunting by hand in each engine. Nobody can show with
one agreed number that a change made things faster.

frameledger gives all three one shared way to record a test run, called a
benchmark, and one tool that reads it. The goal behind it: every engine holds
at least 60 frames per second.

frameledger is built first to find the slow spots in these three engines.
It can also measure games it was never built into. It turns a capture from
PresentMon, a free and widely used frame-timing tool, into a run that every
frameledger command reads, so a game needs no changes to be measured. The plan
is still to make it a general tool later, for anyone to use with their own
engine.

## How it works

After a run, the engine writes a plain text file: every frame, and how long
each part of it took on the processor and on the graphics card. frameledger
reads that file and answers in plain sentences first, before any table. A
game that writes no such file can be measured with PresentMon instead, and
**`import presentmon`** turns its capture into one. It has these commands:

- **`report`** says where the frame time went: the costliest parts of the
  frame, whether the processor or the graphics card held it up, and which
  frames were worst. It also shows frame pacing: how much the frame time
  jumps from one frame to the next. So a game that holds its frame rate but
  still stutters shows it. It can also draw the run as a graph on a web page:
  frame time across the run, each part of the run as a patterned band, the
  worst frames as numbered markers, and a frame-rate line if you set one. The
  page is a single file that runs and fetches nothing, so it opens straight
  from disk. Its text follows the browser's own size, a switch makes text and
  lines larger, and the parts of the run are also listed as text for screen
  readers.
- **`compare`** says whether a new build got slower than an old one, measure
  by measure, memory included. Each change is judged against how much the
  runs vary by themselves, so random wobble is not reported as a slowdown. It
  refuses to compare runs made under different settings, such as a different
  resolution, unless you say why it should. You can compare only the measures
  you care about, and see each run's value side by side. It can also judge
  several named variants of a build against one base in a single command, and
  rank them by how much each saves. It can judge the slowest 1% of frames for
  a measure, such as the graphics card's time, not only the typical frame. When
  one test run stands apart from the rest, it names that run, so you can take
  it again instead of the whole set. It also warns when the two machines
  differed in power, processor speed or temperature.
- **`alternate`** runs the old and new builds in turn, several times each,
  then compares them. So a machine that drifts during the test does not look
  like a change. It takes named variants too. On Windows, stopping it stops
  the whole program it started.
- **A saved baseline** is a known-good set of runs you keep in a file. Both
  `compare` and `alternate` can check every new build against it, and warn
  you how old it is.
- **`compare --by-scene`** compares an old build with a new one map by map.
  It says which maps got slower, what got slower, and where in the map it
  changed most. Maps with too few runs to judge are listed rather than
  stopping the comparison.
- **`survey`** checks a pile of recorded runs against a frame rate you set.
  It flags every run that misses it, names that run's slowest frame and the
  work behind it, and ranks all the runs from worst to best.
- **`bisect`** works with git, the tool that keeps a project's history, to
  find the exact change that made a frame slower.
- **`budget`** says whether any part of the frame went over the time you set
  for it. A budget can also limit the whole frame's time on the processor or on
  the graphics card.
- **`floor`** says whether the run held a frame rate you set, such as 60
  frames per second, in every second of the run.
- **`check`** says whether a run file is written correctly. It can also
  compare a file with the one it should match, and warn about things that are
  allowed but unwise.
- **`kit`** writes a set of sample files. Anyone who writes the run file
  format from its description can use them to prove their writer is right.

Some graphics drivers add frames of their own between the ones the game draws,
which is called frame generation. frameledger marks those frames and leaves
them out of every verdict by default, so they cannot hide a slow game.

A report warns you when its numbers should not be trusted: a debug build, a
software renderer, a machine busy with other work, a laptop on battery, or
a machine that slowed itself down. A comparison names any
run taken while the machine was busy, and gives no verdict rather than a wrong
one. A damaged run file, such as one with an impossible date, gets a plain
sentence saying what is wrong, not a crash.

Every command can also print Markdown, ready to paste into a pull request or a
note.

## What it does not do

It does not time anything inside an engine; each engine keeps its own timing.
It does not replace a profiler such as RenderDoc or Tracy: frameledger says
which part and which frames to look at, and a profiler says why. Its graph
shows a run after it ends, not while the game plays.

## Where it stands

**The ninth release is ready for people outside this site.** frameledger is
now on PyPI, the main store for Python tools, so `pipx install frameledger`
gives you a `frameledger` command. A new user guide goes from installing it
to a first report, with worked examples in C and C++. And `report --html` no
longer overwrites a file that is not an earlier frameledger page, so a typo
cannot wipe out a recording.

The release before made promises a game engine can build on. A run file it
reads will be read the same way by every later release. Every command's
machine-readable (`--json`) output has a published schema, so a script written
against it keeps working. A support policy says what gets fixed and how
anything is retired.

It is a command-line tool: you type its commands in a terminal
window, and it answers in text or with that page. There are no screenshots
yet. It needs Python 3.10 or newer and nothing else. Install it with pipx, or
take the download: one zip for Linux, Windows and macOS. The zip holds the
tool, launchers so you can run it by name from any folder, and an optional
small C header. An engine can use the header to write run files without
writing its own code for it. The header says which release it came from.
