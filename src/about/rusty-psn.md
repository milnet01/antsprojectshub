PS3 and PS4 games shipped on disc, then got patched — sometimes heavily. Those
patches still live on Sony's own update servers, and a console fetches them
automatically. If you are running games somewhere other than the console, nothing
does that for you.

Rusty PSN asks Sony's update service directly. Give it a game's serial number and
it lists every update ever published for it, then downloads the ones you pick.

It comes as both a window with buttons and a command-line tool, so it fits whether
you want to click through a list or script the whole thing.

## What this fork is

The original is [RainbowCookie32's rusty-psn](https://github.com/RainbowCookie32/rusty-psn),
and it works well. This is my copy, with the changes I wanted on top.

The two that matter:

- **A sane folder layout.** The original saves everything as
  `<serial> - <title>/`, which sorts a collection by serial number — an order
  nothing in the world is arranged in. This filed it by title, with the serial as
  a subfolder underneath.
- **A fix for the command-line version pinning a CPU core** while it waited for a
  download, which it did by asking "are you done yet?" as fast as it possibly
  could.

Beyond that: bringing the Rust codebase up to a current edition, tidying
duplicated parsing code, fixing a settings path that reset to the wrong place, and
putting a linter in the build.

## Where it stands

**Not published yet.** The work is real but it is not packaged for download,
which is what stands between here and a release.

Written in Rust. All the original credit belongs to RainbowCookie32 — this fork
exists because the tool was good enough to be worth adjusting rather than
replacing.
