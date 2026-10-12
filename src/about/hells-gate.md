## What Hell's Gate is

Hell's Gate is a port of the Xbox 360 game Dante's Inferno to PC. It does not emulate the console. It translates the game's original program into ordinary C++ code ahead of time, using the ReXGlue SDK, and builds that into a program that runs natively on Windows (Direct3D 12) and Linux (Vulkan).

The project is by florinp93. Our page covers our fork of it and the work we have sent back.

## What we added

We added build support for openSUSE Tumbleweed:

- an install script that pulls in every package the build needs on openSUSE
- a Linux version of the project's setup script
- two fixes to the build tooling that stopped it compiling on openSUSE

The author merged this into the main project, so it is part of Hell's Gate itself. Anyone building on openSUSE gets it from the main project.

We have since got the game running on openSUSE with further fixes. Those are not published yet.

## How to get it

There is no download. You build it from source by following the main project's README, which has steps for Windows, Ubuntu and openSUSE.

You need your own copy of the game. The build reads the game's program from your own Xbox 360 disc. The project also supports the game's second title update, if you have it.

## The game is not included

Hell's Gate contains no game files. Neither the project nor this page provides the game, its program or its assets.
