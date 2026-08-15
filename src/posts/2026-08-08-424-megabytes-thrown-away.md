---
title: 424 MB thrown away, and a new project goes public
date: 2026-08-08
summary: OneUp was deleting everything it had successfully downloaded whenever an update failed. Also, Local Web Server Manager exists now, and MAME Curator finally reads its own settings.
projects: oneup, local-web-server-manager, fin-break, mame-curator, contact-list, demoreel
---

## The one that annoyed me most

OneUp 1.4.1 and 1.4.2 both went out on Thursday, and between them they fixed
something I should have caught months ago.

When an update failed, OneUp still ran the cache-cleaning step afterwards. That step
deletes the downloaded packages, because normally the update has installed them and
they are just taking up disk. But if the update *failed*, those packages are exactly
what you want to keep — the retry needs them, and re-downloading is the slow part.

I measured it on a real failed run: 424 MB discarded, then fetched again over the
same connection that had just fallen over. The cache is now kept when the update
failed and still cleared when it succeeded.

Two more from the same pair. openSUSE spreads packages across mirrors, and for a
brand-new update it will sometimes hand you a file from a server too slow to finish
sending it. One package that will not arrive used to throw away the whole update —
82 downloaded, nothing installed. It now notices that specific failure and quietly
refetches from openSUSE's content delivery network, which always has them. And if
that fails too, it names the package that would not come down, rather than telling
you to check an internet connection that is demonstrably fine.

Also: rebooting during an update no longer hangs on a black screen. A reboot asked
for mid-update was waiting on a process the desktop had no permission to stop, long
after the screen was gone — so a hard power-off was the only way out, at the worst
possible moment for one. OneUp now holds a shutdown lock for the length of a run, so
the desktop tells you an update is in progress and lets you decide.

## Local Web Server Manager

This one is new and public as of Monday. 106 commits this week.

The problem is small and specific. I keep about a dozen web projects in one folder.
Each starts a different way — one has a `run.sh`, one wants `npm run dev`, one is a
Python thing — on a different port, and nothing anywhere tells me which of them are
currently running. So I end up with three servers I forgot about and a port conflict
I spend ten minutes diagnosing.

It scans the projects folder, works out how each one starts and which port it wants,
and gives you a window with a row per project: a status light, Start/Stop/Restart, its
live output, and a button to open it in the browser. It runs each project's own start
script and never edits your projects.

Two details I care about. The buttons respond the instant you click them — a project
shows "starting" straight away rather than waiting up to a second for the next status
poll — and the first time you start a project it shows you the full path and the exact
command it is about to run, and asks. It asks again if that script changes. Running a
script you found on disk without showing anyone what is in it is not a thing I want
this app to do.

It is early. The design is settled and it does genuinely run servers now, but I would
not call it finished.

## finbreak 0.1.20

More import work. The one worth telling: when no rows in a statement could be
imported, finbreak told you to go back and check the column mapping — but there was
no way back. There is now a Back button. And for the statement types that never show
you a mapping screen at all, because they describe their own layout, it stopped giving
that advice entirely and points at the per-row reasons underneath instead, which is
where the explanation actually is.

Also, typing in the date-format box was making finbreak re-read the entire statement
file for every character. Nine full reads to type one format string. On a normal
monthly statement you would never notice; on a 50,000-row one it was about three
quarters of a second of frozen window per keystroke. It reads the file once now.

## Short notes

**MAME Curator** — the Server settings you can already edit in the app are now
actually read when it starts. Until this week it saved them, told you a restart was
needed, and then ignored them, which is a special kind of insulting. The browser also
opens when the app is genuinely ready rather than two seconds after launch and hoping;
on a first run, where it spends a while reading a ~48 MB game list, that guess usually
lost and you got an "Unable to connect" page.

**Contact List** — the system tray icon now appears when running from source, not just
in the released builds. Starting the app no longer throws a browser tab at you either;
the tray icon is the way in.

**demoreel** — published. It records a short video of a desktop app running on a
private virtual display, so nothing else you have open ends up in a file destined for a
public pull request. I wrote it because I wanted demo videos on this site and did not
want to film my own desktop to get them. The finbreak tour on its project page was made
with it.
