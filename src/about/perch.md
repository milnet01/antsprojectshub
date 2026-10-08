Perch stops you dragging the same windows into the same places every single day.

It sits in your system tray and quietly remembers where each window lives — which
screen, which spot, what size, which virtual desktop — and puts it back there when
the window reopens. Open your editor and it lands on the left half of your second
monitor, the way it always does. Plug your laptop into your desk and Perch
switches to your desk setup.

## What it does

- **Remembers every window** — position, size, monitor and virtual desktop — and
  restores it on reopen.
- **Snap presets** from the tray: left or right half, the four quarters, centre,
  and maximise on this screen. Add your own, and give any preset a global hotkey.
- **Named layouts** — flip the whole screen between your "coding", "media" and
  "writing" arrangements in one click.
- **Rules** — *always open Firefox on monitor 2, maximised*, and it just happens.
  A rule puts the window on the monitor it names, in the right spot, and the
  window stays put when its title changes. Pixel positions in a rule count from
  that monitor's own edge, so a rule written for a second monitor in an
  earlier release may need its numbers adjusted.
- **Docked and laptop profiles**, so windows land differently at your desk than
  they do on the train.
- **An exclusions list** — name a splash screen or a small dialog, and Perch
  leaves it alone.
- **Pause Perch** from the tray, and nothing moves on its own until you turn it
  back on.
- **Tidies up after itself** — apps you haven't opened in 90 days are forgotten.
- **Export and import**, so your setup survives a reinstall or moves to a new
  machine.

## Using it

Perch ships as a single AppImage file. There is nothing to install, no
dependencies to chase and no Python to set up: download it, make it executable,
run it. On openSUSE Tumbleweed and Fedora you can install it from a package
repository instead, and it updates with the rest of your system.

The first time it runs, a short setup guide explains that there is nothing you
have to configure. Then it sits in your tray. Right-click the icon for snap
presets, layouts and settings. If your desktop hides tray icons, run
`perch --settings` to open the settings window. A toggle in the settings starts
Perch at login, and you can pick a light or dark look.

## Will it work on your desktop?

Perch talks to your display server through a plug-in backend, and two of them are
finished:

| Your desktop | Support |
|---|---|
| KDE Plasma (X11 or Wayland) | Full |
| Any X11 desktop — Xfce, MATE, Cinnamon, i3 | Full |
| GNOME on Wayland | Not yet |
| Sway, wlroots, Hyprland | Not yet |

The unfinished ones already have a basic backend. Each needs someone to finish
it, and none needs changes to Perch's core.

## Where it stands

Stable, and still being improved. Linux only for now; a Windows edition is on
the roadmap as a separate track. Flathub and AUR packages are planned. Free and
open source under the GPL-3.0.
