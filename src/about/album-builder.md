If you record music, you end up with a folder of takes. Dozens of them, named
things like `take_04_final_REAL.wav`, some of which are keepers and most of which
are not. Turning that into an album means deciding what makes the cut, deciding
what order it goes in, and then doing a lot of tedious file work.

Album Builder is the app for the deciding part, and it does the file work for you
afterwards.

## What it does

Point it at your recordings folder (File → Choose Music Folder, which you can change
any time) and it lists everything it finds. From there:

- **Say yes or no to each track** with a single toggle down the side of the list.
- **Drag the keepers into order** in a pane beside it, and listen back as you go.
- **See what you have already used.** Every track carries a badge showing which
  other approved albums it appears on, so you notice before you put the same
  recording on two records.
- **Watch the lyrics scroll in time with the music** during playback. This is
  optional and does real work behind the scenes — it listens to the recording and
  works out which word lands when, rather than expecting you to time anything by
  hand.

When you approve an album, it writes out everything you need: a playlist, a
folder of numbered shortcuts to the tracks in order, and a report as both PDF and
web page. The report comes in two flavours: the full one for you, and a
stripped-back artist-facing version fit to send to someone else. On Windows you
get the playlist and the reports, but not the numbered folder.

Your work is remembered between sessions, and the library refreshes itself when
you add new recordings to the folder. Deleting an album is not final either: File →
Restore Deleted Album brings it back.

## Just listening

A second tab turns it into a music player, with its own searchable library of
every song in your folder. Play any song, line songs up in an Up Next queue,
shuffle or repeat, and save playlists. Volume levelling keeps loud and quiet
recordings at an even level. On Linux, you can play, pause and skip from your
desktop's media controls, media keys or lock screen.

It reads MP3, FLAC, Ogg, Opus, WAV, AAC, M4A, AIFF and WMA files. Five colour
themes are built in, and it speaks eight languages: English, Afrikaans, Arabic,
Hebrew, Spanish, French, German and Portuguese. In Arabic and Hebrew the whole
window mirrors right to left.

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

In beta. Curation, ordering, usage tracking, lyric syncing, the export pipeline,
the player with its own library, and eight languages are all in. Next up: adding
music by dropping files onto the window, which copies them in and leaves the
originals untouched. Built with Python and Qt, and MIT licensed.
