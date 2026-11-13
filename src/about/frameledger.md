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

For now, frameledger is built to find the slow spots in these three engines.
The plan is to make it a general tool later, for anyone to use with their own
engine.

## How it works

After a run, the engine writes a plain text file: every frame, and how long
each part of it took on the processor and on the graphics card. frameledger
reads that file and answers in plain sentences first, before any table. It
has these commands:

- **`report`** says where the frame time went: the costliest parts of the
  frame, whether the processor or the graphics card held it up, and which
  frames were worst. It also shows frame pacing: how much the frame time
  jumps from one frame to the next. So a game that holds its frame rate but
  still stutters shows it.
- **`compare`** says whether a new build got slower than an old one, measure
  by measure, memory included. Each change is judged against how much the
  runs vary by themselves, so random wobble is not reported as a slowdown. It
  refuses to compare runs made under different settings, such as a different
  resolution, unless you say why it should. You can compare only the measures
  you care about, and see each run's value side by side. It can also judge
  several named variants of a build against one base in a single command, and
  rank them by how much each saves.
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
  for it.
- **`floor`** says whether the run held a frame rate you set, such as 60
  frames per second, in every second of the run.
- **`check`** says whether a run file is written correctly.

A report warns you when its numbers should not be trusted: a debug build, a
software renderer, or a machine busy with other work. A comparison names any
run taken while the machine was busy, and gives no verdict rather than a wrong
one. A damaged run file, such as one with an impossible date, gets a plain
sentence saying what is wrong, not a crash.

Every command can also print Markdown, ready to paste into a pull request or a
note.

## What it does not do

It does not time anything inside an engine; each engine keeps its own timing.
It does not replace a profiler such as RenderDoc or Tracy: frameledger says
which part and which frames to look at, and a profiler says why. There are no
charts yet; plain text comes first.

## Where it stands

**The fifth release is out: saved baselines, and several variants compared at once.** It is a command-line tool: you type its
commands in a terminal window, and it answers in text. So there are no
screenshots. The download is one zip for Linux and Windows. It holds the tool,
which needs Python 3.10 or newer and nothing else, launchers so you can run it
by name from any folder, and an optional small C header. An engine can use the header to write run files without writing its
own code for it. The header says which release it came from.
