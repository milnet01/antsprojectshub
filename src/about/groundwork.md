Groundwork sets up a fresh openSUSE install the way you want, in one sitting.

## What it does

It checks the computer first, then offers choices level by level:

- **Essentials:** system updates, media codecs, Flatpak and Flathub, and
  hardware drivers only where your hardware needs them.
- **System setup:** snapshots, firewall, firmware updates and laptop power.
- **Configuration:** computer name, remote login, and the clock for dual-boot.
- **Extras:** popular apps, gaming, developer tools, a backup tool and fonts.

Nothing changes until you press Apply, and it asks for your password once.
Each choice is an on/off switch. Colour themes, dark and high contrast among
them, follow the desktop's light or dark unless you choose one.

## Looking after the computer afterwards

Groundwork also keeps a computer running well once it is set up:

- **It stays responsive when memory runs out.** The most memory-hungry app is
  closed before the desktop freezes. A small recorder notes what was using
  memory, so the cause of a freeze can be found afterwards.
- **An emergency keyboard escape.** A frozen computer can be restarted safely
  from the keyboard instead of the power button.
- **It starts sooner.** The boot menu waits 3 seconds.
- **Smoother day to day.** Less eager swapping, a smoother setting for
  spinning hard drives, a 1 GB cap on the system log, and a calmer wake from
  hibernation.

It can also set up virtual machines, game controllers and GameMode, video
acceleration on AMD graphics, NumLock on at login,
[Ants Terminal](/p/ants-terminal.html) as the terminal, and
[OneUp](/p/oneup.html), a one-window update app. Media codecs come from Packman's full repository, so
videos and music play everywhere, in the browser too.

## Where it stands

It is still in beta. It comes as a single AppImage file that runs
without installing anything, on Tumbleweed and Leap 16. It speaks English and
fourteen other languages, each marked as a draft until a fluent speaker has
checked it.
