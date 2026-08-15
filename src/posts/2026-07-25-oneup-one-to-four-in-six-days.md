---
title: OneUp went 1.0 to 1.4 in six days
date: 2026-07-25
summary: A first stable release turned into four more inside a week, because shipping it to people who were not me found things I could not. Plus DOOM's raster view roughly doubles its frame rate.
projects: oneup, doom-ants, vestige-engine, fin-break
---

OneUp reached 1.0.0 on Monday the 21st. By Sunday it was on 1.4.0. That is four
feature releases in six days, which either reads as momentum or as a project that
was not ready — and honestly it is a bit of both.

## What OneUp is, briefly

openSUSE needs four separate things updated: system packages, Flatpaks, firmware,
and the leftover packages nothing needs any more. Each has its own command, its
own quirks, and its own way of going wrong. Most people run one of the four and
assume they are up to date.

OneUp is one window with a toggle per job and a Run button. It never runs as root
— privileged work goes through your desktop's normal password prompt — and it can
roll back to a pre-update snapshot in one click.

## Why four releases

Because 1.0 was the first version other people ran, and other people's machines
are not mine. The week was mostly the gap between "works" and "works when
something goes wrong", which is where all the actual engineering lives.

The pattern repeated all week: a thing I had written a friendly message for turned
out to have four causes, and the friendly message was only right about one of them.
"Couldn't reach GitHub" was the clearest example — it was shown for every failed
update check, including the ones where GitHub had answered perfectly politely to
say the hourly check limit was used up. So people went off to diagnose an internet
connection that was fine, over a problem that fixes itself on the hour.

None of that is glamorous. All of it is the difference between an app you keep and
an app you uninstall the first time it lies to you.

## DOOM Ants 0.5.0

Shipped Wednesday the 22nd, and the headline is speed. The Solid view — the fast
raster renderer, the one that is meant to feel like the original — now overlaps
building a frame on the CPU with drawing the previous one on the GPU. That roughly
doubles its frame rate. It is the sort of change that is invisible when it works,
which is the best kind.

The Ultra ray-traced view got dirtier, on purpose. DOOM's textures are small and
repeat, and at high resolution with real lighting the repetition is glaring — you
see a wall as a grid of identical tiles rather than as a wall. There is now grime
and variation broken across the tiling, so surfaces read as surfaces.

Two old bugs went with it. Ultimate Doom was showing the episode 1 sky in all four
episodes. And an operator-precedence mistake in the "donut" sector effect —
genuinely ancient, inherited from the original source — could misbehave or crash
on hand-crafted donut sectors.

## Vestige: grass that is lit, and a pond that behaves

The GPU grass from last week became real grass: lit, shadowed, and moving with the
wind, then promoted to be *the* meadow grass with the old billboards retired.
Retiring the fallback is the part I keep having to make myself do — leaving both in
means neither gets properly finished.

The pond stopped rippling in still air, which had been quietly bothering me for
weeks. A mirror-flat pond in calm weather, ripples only when it is windy. 0.1.64
and 0.1.65 both went out.

## finbreak 0.1.17

Statement importing, mostly, and I will save the detail for next week because the
run of import fixes carried on and reads better as one story. The short version is
that every bank writes dates differently and about half of them are lying about
which is the day and which is the month.
