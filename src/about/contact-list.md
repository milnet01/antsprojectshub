Everyone's contacts live somewhere they do not control — a phone account, a mail
provider, whatever synced them last. Contact List keeps them on your own computer,
in a single file, and syncs with Google only if and when you ask it to.

It runs as a small local web page. Start it and it sits in your system tray;
click the icon and choose *Open Contact List* when you want it. It does not
ambush you with a browser tab.

## What it does

**People and companies**, each with as many emails and phone numbers as they
actually have, free-form notes, and a photo — uploaded, pulled in by Google sync,
or a coloured initial if there is neither.

**Custom fields.** Add a birthday, an address, a locker number, anything, to any
contact, without setting anything up first.

**Tags** like `family`, `work` or `gym`, filterable in any combination, and
favourites that pin the people you actually contact to the top.

**Search that reaches everything** — names, emails, phones, notes and the values
in your custom fields.

**Duplicate detection and merging**, field by field, so combining two records of
the same person loses nothing from either.

**Upcoming birthdays** on their own page, with the age each person is turning.

**Import and export** as CSV — with a column-matching screen that remembers your
choices — and as vCard, with custom fields surviving the round trip.

**Google Contacts sync**, optional and two-way: pull your contacts in, push local
edits and new ones back, newest edit wins on a conflict. Deletions are never
pushed, so a sync can't quietly empty anything.

You can set the timezone, date format, theme, layout, list-or-card view, phone
region, page size and sort order, and it remembers all of it.

## Getting it

One self-contained file per system — an AppImage for Linux, an `.exe` for
Windows, a `.dmg` for Apple Silicon Macs. No Python, nothing else to install.
Windows and macOS will both query an unsigned app the first time; the download
buttons above and the usual *More info → Run anyway* / right-click → *Open* get
you past it.

Your contacts, photos and settings live under `~/.config/contact-list/`.

If your desktop has no system tray at all — GNOME, unless you have added an
extension for it — the app opens your browser at startup instead, rather than
leaving you no way to reach it.

## Where it stands

Live and stable, on Linux, Windows and macOS. It binds to your own machine only,
uses parameterised database queries, CSRF protection, autoescaped templates and a
strict content-security policy — the boring measures that stop a local web app
being a liability. Flask and SQLite underneath, with no accounts, no cloud and no
JavaScript framework.
