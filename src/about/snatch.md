Snatch saves videos from the web to your computer. Paste a link, pick a quality,
click Download. It handles YouTube and around a thousand other sites.

Underneath it is [yt-dlp](https://github.com/yt-dlp/yt-dlp), which is the best
tool in the world for this job and also a command-line program, which means most
people never touch it. Snatch does the typing so you do not have to.

## What is in it

**Download** — paste a link or drag one onto the window, choose your quality, and
go. Queue up as many as you like and watch a progress bar for each.

**Search** — search YouTube without opening a browser, and preview a result to
check it is the right video before committing to the download.

**Media Info** — point it at a video already on your computer and it tells you
what is inside: length, quality, format.

**History** — everything you have downloaded, each with a button to open the file
or the folder it landed in.

Along with that: seven colour themes, automatic skipping of sponsor segments in
YouTube videos, subtitle downloads, a speed limit so it does not swallow your
whole connection, audio-only extraction for music and podcasts, and cookie import
from Firefox or Chrome so it can reach age-restricted or members-only videos you
already have access to.

## Getting it

One file per platform, and everything is inside it. You do not need Python,
yt-dlp, ffmpeg or anything else — Windows gets an `.exe` you double-click, macOS a
`.dmg` you drag to Applications, Linux an AppImage.

Both Windows and macOS will complain the first time. Windows shows "Windows
protected your PC" — click *More info* → *Run anyway*. macOS says the developer
cannot be verified — right-click the app and choose *Open*, then *Open* again.
Neither is a virus warning; both mean the same thing, which is that signing an
app costs a yearly fee this project has not paid.

Your downloads go wherever you point them. Snatch keeps its own settings and
history alongside the app on Windows, and in the usual per-user folder on macOS
and Linux. Nothing is uploaded anywhere.

## If something breaks

**"No video formats found"** almost always means the site changed. Click *Check
version* in the app — a newer yt-dlp usually fixes it that same day.

**A download stopped partway** — check the disk is not full and try again; it
resumes from where it stopped.

## Where it stands

Live and stable, on Windows, macOS and Linux. Snatch bundles yt-dlp and ffmpeg,
each under its own licence.
