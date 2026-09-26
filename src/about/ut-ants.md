Unreal Tournament came out in 1999 and people are still playing it. They are
still *making* things for it, too — one Monster Hunt server on my own machine
carries 515 community-made maps, most of them by people who have never met
each other. The maps are alive. The engine underneath them is not.

UT Ants is a new engine that takes those maps and plays them properly on a
modern machine. Same levels, same weapons, same feel — shadows that move, fog
you can see light cutting through, and surfaces that look like something rather
than a flat picture stuck to a wall.

## The three things that are wrong today

**The look cannot be fixed from inside.** UT99 paints its shadows into the walls
when a map is built and never changes them. There is no way to add moving light
to that, and there never will be: the code was never released, and the game was
delisted in 2023. The ceiling is permanently 1999.

**The computer players cannot play Monster Hunt.** Those maps are built around
switches that open doors and plates somebody has to stand on while the rest of
the team goes through. UT99's bots understand none of it — they walk into the
closed door and stop. So a Monster Hunt server with a couple of humans on it
stalls, and somebody has to shepherd the bots through every puzzle by hand.

**The library is trapped.** All those maps only run on an engine nobody can
change, for a game nobody can legally buy any more. Every year it gets harder,
not easier.

## What it will do

- **Read the maps you already have** and rebuild each one as a modernised
  version of itself — real lighting, real materials, fog and light shafts —
  while you still recognise it the moment it loads.
- **Feel identical to play.** Running, dodging, hammer-jumping and
  shock-combos have to land exactly where your hands already expect. If that
  changes, the project has failed, and it is written down that way.
- **Teach the bots to solve the puzzles** — find the switch, press it, go
  through, and leave one of them standing on the plate.
- **Hand you a map you have never seen** when you join a server, so you are
  playing within a minute instead of hunting for a download.
- **Let anyone make things for it** — a map, a monster, a player character —
  and have other players see them without installing anything by hand.
- **Play a full round on a controller**, and show you the level map with
  where you and your team have been.

## What it deliberately does not do

It ships none of Epic's content. You bring your own copy of Unreal Tournament
and the game reads it from your own disk; it refuses to start without one.
Nothing of Epic's is committed, published or sent over the network, and that
line is checked automatically on every change.

It also will not talk to UT99's own servers, will not have a single-player
campaign, and will not have Capture the Flag or Assault before version 1.0.
Deathmatch, Team Deathmatch and Monster Hunt are the three modes it is being
built for.

## Where it stands

**Very early. There is nothing to play and nothing to download.** The project
started in September 2026.

What exists is the reading and the drawing. It reads a real map end to end —
its walls, textures, sounds, lights and everything placed in it — and rebuilds
the old textures as modern materials. Point the first program at your Unreal
Tournament folder and it lists the maps in it. Pick one and it is rebuilt and
opened, and you can fly a camera through it — lit, shadowed, with fog and light
shafts — on a keyboard and mouse or a gamepad. There is no player, no gravity,
no weapons and no monsters yet. Windows and Linux are both built and tested on
every single change — not one first and the other later — and the tests pass
on a machine that has never had Unreal Tournament installed.

The whole thing is measured against twelve things you could observe by playing
it, written down before any code was. The last of them is the honest one: the
live Monster Hunt server runs on this instead of UT99, and nobody wants to
switch back. That is what version 1.0 means here.

If you want to watch it being built, the repository is public and linked at the
top of this page.

The logo's Unreal Tournament emblem is © Epic Games, used without affiliation or
endorsement. The ant and the lettering are this project's own.
