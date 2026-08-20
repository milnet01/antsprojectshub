If you record music, you end up with a folder of takes. Dozens of them, named
things like `take_04_final_REAL.wav`, some of which are keepers and most of which
are not. Turning that into an album means deciding what makes the cut, deciding
what order it goes in, and then doing a lot of tedious file work.

Album Builder is the app for the deciding part, and it does the file work for you
afterwards.

## What it does

Point it at your recordings folder and it lists everything it finds. From there:

- **Say yes or no to each track** with a single toggle down the side of the list.
- **Drag the keepers into order** in a pane beside it, and listen back as you go.
- **See what you have already used.** Every track carries a badge showing which
  other approved albums it appears on, so you notice before you put the same
  recording on two records.
- **Watch the lyrics scroll in time with the music** during playback. This is
  optional and does real work behind the scenes — it listens to the recording and
  works out which word lands when, rather than expecting you to time anything by
  hand.

When you approve an album, it writes out everything you need: an M3U playlist, a
folder of properly numbered tracks, and a report as both PDF and web page. The
report comes in two flavours — the full one for you, and a stripped-back
artist-facing version fit to send to someone else.

Your work is remembered between sessions, and the library refreshes itself when
you add new recordings to the folder.

## Getting it

On Linux it is a single AppImage — download, make it executable, run. On Windows
it is a zip: unpack it and double-click `AlbumBuilder.exe`. Both bundle everything
they need, including the PDF machinery. There is no Python to install.

Two things worth knowing. **Windows will show a SmartScreen warning** the first
time, because the build is not signed; click *More info* → *Run anyway*. And the
**lyric-syncing feature is not in either download** — the speech-recognition
libraries behind it run to hundreds of megabytes, so it stays an optional extra
you add when installing from source. Everything else works out of the box.

Linux distributions from roughly 2022 onward are supported. Older ones will refuse
to start with a message about `GLIBC_2.35`.

## Where it stands

In beta and feature-complete through its fifth planned phase: curation, ordering,
usage tracking, lyric syncing and the full export pipeline are all in. Built with
Python and Qt, and MIT licensed.
