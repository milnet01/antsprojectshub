Keeping openSUSE up to date means running several different commands, and the
graphical tools do not cover them all. OneUp puts the five that matter behind
toggles in one window, and runs each one the way openSUSE's own documentation says
to.

The point is not the window. It is knowing which command is correct.

## Why it exists

Discover handles packages and Flatpaks, but on Tumbleweed it regularly chokes on
Packman codec vendor changes — the update stalls and you end up in a terminal
anyway. It also never touches firmware and never cleans up orphaned packages.

And the correct system-update command on Tumbleweed is `zypper dup
--allow-vendor-change`. A great many people run plain `zypper up` instead, and
slowly break their system doing it.

## What it does

Five tasks, each a toggle you can switch off:

| Task | What it runs |
|---|---|
| System packages | `zypper dup --allow-vendor-change` on Tumbleweed, `zypper update` on Leap, after refreshing the repositories |
| Flatpak apps | `flatpak update` for both user and system scope, then prunes unused runtimes |
| Firmware | `fwupdmgr refresh` and `update` |
| Leftover packages | Autoremoves unneeded dependencies, and *reports* — never removes — hand-installed orphans |
| Package cache | `zypper clean --all`, to get the disk space back |

On top of that: a read-only check that tells you how many updates are waiting per
task, a weekly background check that notifies you, an optional tray icon that
turns amber when there is something to do, and a one-click rollback to the
snapshot it takes before every run.

## The careful bits

**It never runs as root.** The window is a thin front end; the privileged work
happens in a script that authenticates once through your desktop's standard
password prompt.

**An update is never cut off half-way.** Stop asks the current step to finish
first, because a half-applied package transaction is how you end up with broken
programs. Closing the window does not abort a run either — it carries on and
finishes properly, and you are warned before you close so it is not a surprise.

**A failed step never claims success.** Reboot advice appears only when something
was actually installed, or when the system explicitly says a reboot is needed.

**One broken software source does not fail the whole update.** It is set aside,
everything else updates, and it is retried next time.

**A slow mirror never looks like a crash.** One server was found handing out an
update index at under 1 KB a second, during which `zypper` says nothing at all and
the app appeared frozen for minutes. OneUp now shows which source it is fetching,
how far through the list it is, the size, the speed and how long it has been
waiting — and gives up on any one source after two minutes, offering to leave it
out rather than sitting there for hours.

## Accessibility

Built to be usable if you cannot see the screen well, or at all. Every control has
a spoken name, the task switches report their on/off state, and progress is spoken
as it happens — *"Updating system packages, step 1 of 3"* — along with each step's
outcome and the final summary.

The log is deliberately **not** read aloud, because a run prints hundreds of
lines. It is a named, focusable text area you can read at your own pace instead.

## Where it stands

Live and stable, on openSUSE Tumbleweed and Leap. It follows your desktop's
light/dark setting. The engine underneath is a plain shell script that works on
its own in a terminal — the window just drives it.
