Perch stops you dragging the same windows into the same places every single day.

It sits in your system tray and quietly remembers where each window lives — which
screen, which spot, what size, which virtual desktop — and puts it back there when
the window reopens. Open your editor and it lands on the left half of your second
monitor, the way it always does. Plug your laptop back into your desk and
everything shuffles home.

## What it does

- **Remembers every window** — position, size, monitor and virtual desktop — and
  restores it on reopen.
- **Snap presets** from the tray: centre, left or right half, the four quarters,
  and maximise on this screen. Each one can have a global hotkey.
- **Named layouts** — flip the whole screen between your "coding", "media" and
  "writing" arrangements in one click.
- **Rules** — *always open Firefox on monitor 2, maximised*, and it just happens.
- **Docked and laptop profiles**, so windows land differently at your desk than
  they do on the train.
- **An exclusions list**, so splash screens and small dialogs are left alone.
- **Export and import**, so your setup survives a reinstall or moves to a new
  machine.

## Using it

Perch ships as a single AppImage file. There is nothing to install, no
dependencies to chase and no Python to set up: download it, make it executable,
run it. It appears in your tray, and right-clicking the icon gets you everything —
snap presets, layouts and settings. A toggle in its settings starts it at login.

## Will it work on your desktop?

Perch talks to your display server through a plug-in backend, and two of them are
finished:

| Your desktop | Support |
|---|---|
| KDE Plasma (X11 or Wayland) | Full |
| Any X11 desktop — Xfce, MATE, Cinnamon, i3 | Full |
| GNOME on Wayland | Not yet |
| Sway, wlroots, Hyprland | Not yet |

The unfinished ones have their wiring in place and need someone to fill in a
single interface — no changes to Perch's core.

## Where it stands

Version 1.0 and stable. Linux only for now; a Windows edition with a native
backend is on the roadmap as a separate track. Free and open source under the
GPL-3.0.
