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

There is no account to make and no password to lose.

## It is not a host

This matters more than it sounds. Pressless never talks to your visitors and
is not reachable from the internet — it is a program on your desk, not a
service. Your visitors are served by a hosting service that does that job
properly. Pressless just hands it the finished pages.

Today that service is GitHub Pages, because it is free, fast and does not go
away. Only the very last step knows which host it is talking to — everything
before it builds a plain folder of pages, which is what every host of this
kind wants — so others may well follow later.

## What it is planned to do

- **Write with a handful of simple marks** — bold, a heading, a link, a
  picture — instead of buttons and hidden formatting.
- **Show you the real page while you type**, rendered by the same code that
  builds the live site, so what you see is what gets published.
- **Publish in one press**, sending only the pages that actually changed.
- **Put back yesterday's version** when a change turns out wrong.
- **Bring an existing blog across** from a WordPress export — years of posts,
  including the awkward ones with no title and the poems whose line breaks are
  the point.
- **Resize your photographs for you**, so a phone picture does not take a
  minute to load.
- **Tell you how the site is being read** — how many people, and roughly where
  from.

## Where it stands

**There is nothing to use yet, and nothing to download.** One piece is
finished: the small styling language that turns what you type into a page,
which is shared by the editor and by the site builder so the two can never
disagree about how your writing looks. Everything around it — the editor
itself, the publishing, the import — is designed and queued, not written.

It is aimed at Linux and Windows, and will arrive as a single file you run,
with no Python, no compiler and no command line to install first. That is the
whole point of it, so it is being tested that way from the start: on a Windows
machine with nothing developer-ish on it at all.

If you want to watch it being built, the repository is public and linked at the
top of this page.
