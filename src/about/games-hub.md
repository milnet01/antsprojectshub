Fourteen games in one window, sized to sit beside whatever you are actually doing.
Every game shrinks to about half a 1080p screen, so it fits next to a browser or
an editor rather than covering them. It is built for the five minutes between
things, not for an evening.

## What is in it

**Board games against the computer**, at three strengths each: Chess — with
castling, en passant, promotion and every draw rule properly enforced — Draughts
with compulsory captures and multi-jumps, and Reversi.

**Card games**: Hearts, four-handed against three computer players to 100; and
partnership Canasta, two against two, with melds, wild cards, red threes and a
freezing discard pile — classic rules plus a house set you can edit.

**Patience**, four ways: Klondike (draw one or draw three), Spider in one, two
or four suits, FreeCell, and Pyramid.

**Puzzles and arcade**: Minesweeper at three field sizes, generated Sudoku with
pencil marks, Snake, 2048, and a pinball table with three balls and two flippers.

## The bits that matter in practice

**It remembers where you left off.** Close the window mid-game and ten of the
fourteen come back exactly as they were — Chess brings back the board *and* the
move history, so Undo still works; Canasta brings back the whole table, every
hand, the melds, the pile, the stock, the scores and the rules in force. There is
no save button. It simply happens. Finish a game and nothing is kept, so you never
return to a board you have already won.

**The window remembers itself too**, separately per game, so one you like large
opens large and the menu comes back where you put it. So do your settings —
Minesweeper reopens on the difficulty you last played, Canasta on the rules you
last used.

**Best scores are kept** for every game: games won, fastest clears, fewest moves,
highest totals.

**Minesweeper and Sudoku can be paused**, which stops the clock and covers the
board, so being interrupted costs you nothing.

**There is a Large mode** in the toolbar for bigger, higher-contrast play. It is
being fitted to the games one at a time — Canasta and Sudoku have it, the other
twelve ignore it for now.

## Getting it

One file, nothing to install. On Linux it is an AppImage: allow it to run, then
double-click. On Windows, unzip it and run `gameshub.exe`. Each download carries
its own copy of everything it needs, including the graphics toolkit, so it runs on
a machine that has never had it.

**Windows will warn you the first time** — "Windows protected your PC" — because
the build is not signed. Click *More info* → *Run anyway*.

**The Linux build needs a reasonably recent system**: Ubuntu 24.04, Fedora 40,
Debian 13, Tumbleweed or newer. Older ones will refuse to start it, and building
from source is the way round that.

## Where it stands

In beta and thoroughly playable. Pick a game from the grid; `Esc` goes back. Each
game puts its own controls on the toolbar beside it, and one switch mutes the lot.
