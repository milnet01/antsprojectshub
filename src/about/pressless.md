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
Pressless asks before sending anonymous usage reports, which never include
your writing or your site's address.
What it does with your information, including what it reads from Google and
GitHub, is in [Pressless's privacy policy](/p/pressless/privacy.html).

## It is not a host

This matters more than it sounds. Pressless never talks to your visitors and
is not reachable from the internet — it is a program on your desk, not a
service. Your visitors are served by a hosting service that does that job
properly. Pressless just hands it the finished pages.

Today that service is GitHub Pages, because it is free, fast and does not go
away. Only the very last step knows which host it is talking to — everything
before it builds a plain folder of pages, which is what every host of this
kind wants — so others may well follow later.

## Shape your whole site

Pressless now lets you shape your whole site, not just your journal. You edit a
page by typing straight onto it, as it will look, and add ready-made sections:
headings, paragraphs, pictures, columns, buttons, video, music and downloads.
Drag a section into place with the mouse, or move it between columns.

A video, music or download section takes a file you upload: a song, a video,
a PDF, a ZIP or a text file, up to 50 MiB each. A Files screen lists every
uploaded file and the pages that use it.

Add, rename and remove pages, and the menu keeps up by itself. A renamed page's
old address still works. Change the header, footer and menu in the same editor,
without code.

Pages can also hold ready-made interactive pieces: a picture slideshow,
questions that fold open, a picture that enlarges, a countdown.

## Your site's own look

A Look screen sets your site's colours, fonts, text size, page width and
layout, with a live preview as you change them. Colours are set for light and
dark, and a text colour that is hard to read is warned about. Anyone who knows
CSS can add their own, to one page or to every page.

New sites made from the Sunrise, Meadow or Harbour starter looks turn dark for
visitors whose computer is set to dark. You can also choose your site's icon,
shown in a browser's tab, and the picture shown beside a link to your site
when someone shares it.

## More than one site

One copy of Pressless can look after several websites. A Sites screen lists
them, starts a new one and opens another. Each site keeps its own writing,
settings and publishing key.

A whole site saves to one file, which opens again as a site on this computer
or another. The file never holds your publishing key. A step-by-step guide
moves Pressless to a new computer. Every day, Pressless backs up each site by
itself and keeps the last seven backups, beside the program or in a folder you
choose.

## Bring in a site you already have

Setup lists the sites already in your GitHub account. Tick one to bring it in,
instead of typing its name. A site whose build script publishes it to a branch
such as gh-pages can switch to Pressless too, and its address stays.

A folder of web pages comes in as it is: choose the folder itself on Import's
folder step. A ZIP file of it still works.

A site with its own stylesheets can use the Look screen. Keep them and add your
own CSS on top, or switch to a Pressless design.

## Bring your WordPress site in

When you set up a new, empty site, Pressless offers to bring a WordPress site
in: its posts, pages, menu, comments, photographs and files. It shows you how
to make WordPress's export file, then copies each photograph and file from your
old site while it is still online. Anything you had not published arrives as a
draft. At the end, a report lists anything that did not come across.

Lists, links and italics come across too, and one broken comment or missing
photograph does not stop the import.

## Let an AI app help

An AI app on your computer can write and edit your site through Pressless.
Claude Desktop and Claude Code are the two it gives steps for. You ask the app
in your own words, and it makes the change in Pressless.

It is off until you switch it on. Click AI helper, under the list of your
writing, then Switch on. One button connects Claude Desktop, and the screen
gives the steps for Claude Code.

Nothing is published, undone or put in the bin until you click "Yes, do it" in
Pressless. The app cannot reach your keys, your settings or any page's code.

## What it does today

- **Edit a journal entry as it looks.** Click a paragraph on the page and
  type. Bold, italic, links, colour, photographs and quotations sit in a
  panel beside it.
- **Or type simple marks instead.** Show me the marks switches to a writing
  box. A cheat sheet sits under it, with a page to print.
- **Show you the real page while you type**, rendered by the same code that
  builds the live site, so what you see is what gets published.
- **Dim the preview in a dark look**, so a bright site does not glare at
  night, with a tick box to see its true colours.
- **Save as you go.** Your words save themselves a moment after you stop
  typing. A change to an entry that is already live waits in a separate copy
  until you publish it.
- **Publish in one press.** If publishing fails, your files go back to how
  they were and you are told what to do next. A new site that is refused a publish says what to do next. Pressless refuses to replace
  your site with an empty one. Before anything goes live, it shows which
  pages will change, with Publish now or Not yet. A large site publishes
  using far less memory than before.
- **Undo the last publish** in one step, when a change turns out wrong.
- **Open your site in one click.** View your site sits in the top bar, and
  appears again after you publish and at the end of setup.
- **Add photographs** from the editor, including AVIF ones. Pressless keeps your original
  untouched and puts the picture where you were typing. For JPEG XL
  photographs, click Add JPEG XL support once: Pressless downloads the JPEG XL
  project's own decoder (about 5 MB) and checks it every time. Visitors get a
  WebP copy, which every browser shows.
- **Remember your choices between visits**, such as the last page you
  opened. They stay on your computer.
- **Show a page's code in colour**, in colours that stay readable in every
  theme.
- **Start a new entry from a template.**
- **Change a published entry's address** without breaking links people have
  shared: the old address sends readers on to the new one.
- **Throw an entry away**, after being asked first; Undo brings it back.
- **Show a number that keeps itself up to date**, such as the years since a
  date, worked out each time you publish.
- **See who is reading.** Connect Pressless to your Google Analytics once,
  and a "Who is reading" card appears at the top of your writing. Open it
  for the last 7 days, 4 weeks or 12 months: how many people read your
  site, each day's readers, which countries they are in, how they found
  you, and which pages they read most. If Google cannot be reached, it
  shows the last numbers it had and says how old they are.
  If you look after more than one site in Google Analytics, you can switch
  which one Pressless shows from Settings, without signing in to Google
  again.
  Turning visitor numbers off deletes the Google key and the saved figures
  from your computer, even when Google cannot be reached. A Privacy link on
  the visitor-numbers page and in Settings opens Pressless's privacy policy.
- **Update itself.** It looks for a new version when it starts and installs
  only a release signed by its maintainer.
- **Choose how Pressless looks** from a picker in its top bar: light,
  dark, two high-contrast looks, and playful looks inspired by games,
  films and TV. Your choice is remembered. A text-size setting makes
  Pressless's own screens up to twice as large.
- **Say which version you have**, on an About page that also says
  Pressless is independent of GitHub, Google and WordPress.
- **Open a manual from inside Pressless.** Help, in the bar at the top of every
  screen, shows how to do each task, with pictures and short captioned videos.
  A search box narrows the tasks as you type. It needs no internet.
- **Explain every problem in plain words** — what happened, what it means for
  your site, and what to do about it.

## Still to come

- **Offer to add Pressless to the Start Menu and the desktop** the first time
  it opens.

## Where it stands

**It is an early beta, for Linux and Windows.** On Linux, download the file and
run it. On Windows, download the zip, extract it, and double-click
`Start Pressless.bat`. There is nothing to install first — no Python, no
compiler, no command line.

Pressless keeps everything in a folder called `Pressless-data`, right beside
the program. So put the program where you want your writing to live before
you first start it.

Pressless can now start someone with no website at all. Setup walks you
through GitHub step by step and signs you in with a short code, with no keys
to copy. You pick one of three starter looks, and your site is live. A
short finish-setting-up list then ticks itself off as you go. A second site
reuses your GitHub sign-in. On Windows, setup no longer starts over after a step when a virus scanner holds its progress file for a moment. To use your own web address, a wizard shows only
the settings that address needs.

If a console window (a plain text window) opens alongside the browser, leave
it open while you work: closing it stops Pressless.

Google has approved Pressless, so setting up visitor numbers no longer warns
that Google is still checking the app. And after you agree to replace an old
site on GitHub, Pressless no longer shows the warning asking you to do it again.
