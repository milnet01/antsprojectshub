PS3 and PS4 games shipped on disc, then got patched — sometimes heavily. Those
patches still live on Sony's own update servers, and a console fetches them
automatically. If you are running games somewhere other than the console, nothing
does that for you.

Rusty PSN asks Sony's update service directly. Give it a game's serial number and
it lists every update ever published for it, with sizes, then downloads the ones
you pick.

It comes as both a window with buttons and a command-line tool, so it fits whether
you want to click through a list or script the whole thing.

## Whose work it is

Rusty PSN is [RainbowCookie32's tool](https://github.com/RainbowCookie32/rusty-psn).
Looking up a game's updates on Sony's servers, downloading them and checking them
is their work. Their MIT licence and copyright notice are kept, unchanged. This
copy adds:

- **Batch downloads.** Import a list of games and fetch their updates in one go.
- **Console firmware downloads.**
- **RPCS3 support.** It scans an RPCS3 library to find which games have updates,
  and installs them there.
- **A folder layout option** that files by title, with the serial as a subfolder
  underneath. The original layout, serial first, is still the default.
- **Extra safety checks** on where downloaded files may go.
- **A fix for the command-line version pinning a CPU core** while it waited for a
  download, which it did by asking "are you done yet?" as fast as it possibly
  could.

PS Vita support is written but still being tested. Underneath, the code has moved
to a current edition of Rust.

## Where it stands

**No release yet.** The changes are public on GitHub, but there is nothing to
download. It builds and runs on Linux. Windows and Mac builds are set up, as they
were in the original, but have not been tried since these changes. A first release
needs those two builds confirmed, and a final hand check of the window app.

Written in Rust.
