Most people who want a website of their own end up renting one. You pay a
monthly fee, you write inside somebody else's box, and the box changes under
you — a new editor, a new price, an advert beside your words. The free way out
is to publish plain files to a hosting service like GitHub Pages, which costs
nothing and is fast and reliable. The catch is that it expects you to be
technical.

Pressless is that free route with the technical part taken away. It runs on
your own computer and opens in your normal browser. You write an entry, watch
it take shape as you type, and press one button to put it on your site.

## Your writing stays yours

Every entry is an ordinary text file in an ordinary folder on your own
machine. You can open one in Notepad. You can copy the folder to a memory
stick. If you delete Pressless tomorrow, nothing you wrote goes with it — the
files were never inside the app, and there is no export button because there is
nothing to export from.

There is no Pressless account to make and no Pressless password to lose.

## It is not a host

This matters more than it sounds. Pressless never talks to your visitors and
is not reachable from the internet — it is a program on your desk, not a
service. Your visitors are served by a hosting service that does that job
properly. Pressless just hands it the finished pages.

Today that service is GitHub Pages, because it is free, fast and does not go
away. Only the very last step knows which host it is talking to — everything
before it builds a plain folder of pages, which is what every host of this
kind wants — so others may well follow later.

## What it does today

- **Write with a handful of simple marks** — bold, a heading, a link, a
  quotation — instead of buttons and hidden formatting.
- **Show you the real page while you type**, rendered by the same code that
  builds the live site, so what you see is what gets published.
- **Save as you go.** Your words save themselves a moment after you stop
  typing. A change to an entry that is already live waits in a separate copy
  until you publish it.
- **Publish in one press.** If publishing fails, your files go back to how
  they were and you are told what to do next. Pressless refuses to replace
  your site with an empty one.
- **Explain every problem in plain words** — what happened, what it means for
  your site, and what to do about it.

## Still to come

- **Put back yesterday's version** when a change turns out wrong.
- **Add photographs** from the editor, resized for the web for you.
- **Edit your other pages**, such as an About page, in the same box.
- **Start a new entry from a template.**
- **Show how the site is being read** — how many people, and roughly where
  from.
- **Update itself.**

## Where it stands

**It is an early beta, for Linux and Windows.** On Linux, download the file and
run it. On Windows, download the zip, extract it, and double-click
`Start Pressless.bat`. There is nothing to install first — no Python, no
compiler, no command line.

Pressless keeps everything in a folder called `Pressless-data`, right beside
the program. So put the program where you want your writing to live before
you first start it.

The first time, it asks for your site's GitHub repository, your site's name and
address, and a publishing key from GitHub. It checks them with
GitHub before saving anything, and keeps the key where only your own computer
account can read it. So you need a GitHub account and a GitHub Pages site
before you begin.

If a console window (a plain text window) opens alongside the browser, leave
it open while you work: closing it stops Pressless.

Bringing an existing WordPress blog across works, but for now it is a
separate, technical step rather than a button in the app.
