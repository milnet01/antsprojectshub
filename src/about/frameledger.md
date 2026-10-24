Three game engines here — [Vestige](/p/vestige-engine.html),
[UT Ants](/p/ut-ants.html) and [DOOM Ants](/p/doom-ants.html) — each measure
their frame times a different way. Vestige logs an average about once a
second, so one slow frame vanishes into it. UT Ants writes one set of figures
per run. DOOM Ants prints lines to the terminal. A slow spot has to be hunted
by hand in each engine, and nobody can show with one agreed number that a
change made things faster.

frameledger gives all three one shared way to record a benchmark run, and one
tool that reads it. The goal behind it: every engine holds at least 60 frames
per second.

## How it works

After a run, the engine writes a plain text file: every frame, and how long
each part of it took on the processor and on the graphics card. frameledger
reads that file and answers in plain sentences first, before any table:

- **Which part of the frame costs the most.**
- **What the frame was waiting on** — the processor or the graphics card.
- **Which frames were worst**, by place and frame number, so you can go to
  that spot in the game and see it.
- **Whether the run held 60 frames per second**, every second, and whether
  any single frame ran too long.

## What it is for

- **Telling whether a change helped.** Compare runs from two builds, and it
  says faster, slower or no real difference — judged against how much the
  runs vary by themselves.
- **Refusing an unfair comparison.** It will not compare runs at different
  resolutions or build types. It warns about a run it should not trust, such
  as a debug build or one with too few frames.
- **Checking many maps at once.** One command ranks a run per map by its
  slowest frames, and names the costliest part of each one that is too slow.

## What it does not do

It does not time anything inside an engine; each engine keeps its own timing.
It does not replace a profiler such as RenderDoc or Tracy: frameledger says
which part and which frames to look at, and a profiler says why. There are no
charts yet; plain text comes first.

## Where it stands

**In development, with nothing to download yet.** It is a command-line tool,
so there are no screenshots. The file format is agreed by all three engines.
The first piece of the tool, which checks that a run file is valid, is being
built now.

It is written in Python and needs nothing installed beyond Python itself. It
runs on Linux and Windows. An optional small C header lets an engine write the
file without writing its own code for it.
