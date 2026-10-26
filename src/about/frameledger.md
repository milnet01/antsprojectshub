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
has three commands:

- **`report`** says where the frame time went: the costliest parts of the
  frame, whether the processor or the graphics card held it up, and which
  frames were worst.
- **`floor`** says whether the run held a frame rate you set, such as 60
  frames per second, in every second of the run.
- **`check`** says whether a run file is written correctly.

A report warns you when its numbers should not be trusted: a debug build, a
software renderer, or a machine busy with other work.

## Planned

- **Telling whether a change helped.** Compare runs from two builds, and it
  says faster, slower or no real difference — judged against how much the
  runs vary by themselves.
- **Refusing an unfair comparison.** It will not compare runs at different
  resolutions or build types.
- **Checking many maps at once.** One command ranks a run per map by its
  slowest frames, and names the costliest part of each one that is too slow.

## What it does not do

It does not time anything inside an engine; each engine keeps its own timing.
It does not replace a profiler such as RenderDoc or Tracy: frameledger says
which part and which frames to look at, and a profiler says why. There are no
charts yet; plain text comes first. It reads one run at a time.

## Where it stands

**The first release is out.** It is a command-line tool: you type its
commands in a terminal window, and it answers in text. So there are no
screenshots. The download is one zip for Linux and Windows. It holds the tool,
which needs Python 3.10 or newer and nothing else, and an optional small C
header. An engine can use the header to write run files without writing its
own code for it.
