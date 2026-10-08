Everyone's contacts live somewhere they do not control — a phone account, a mail
provider, whatever synced them last. Contact List keeps them on your own computer,
in one database file with your photos beside it, and syncs with Google only if and when you ask it to.

It runs as a small local web page. Start it and it sits in your system tray;
click the icon and choose *Open Contact List* when you want it. It does not
ambush you with a browser tab.

## What it does

**People and companies**, each with an email and a phone number (any extras
from imports or Google are kept as well), free-form notes, and a photo — uploaded, pulled in by Google sync,
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

**Import and export.** Import from CSV, with a column-matching screen that
remembers your choices, and export the main fields as CSV. Import and export
vCard, with custom fields surviving the round trip. Its vCard files follow the
standard format, so names, phone numbers, emails, birthdays, addresses and
company names land where other address books expect them.

**Google Contacts sync**, optional and two-way: pull your contacts in, push local
edits and new ones back, newest edit wins on a conflict. Deletions are never
pushed, so a sync can't quietly empty anything.

You can set the timezone, date format, theme, layout, list-or-card view, phone
region, page size and sort order, and it remembers all of it.

Its buttons and fields carry labels a screen reader can read aloud.

## Getting it

One self-contained file per system — an AppImage for Linux, an `.exe` for
Windows, a `.dmg` for Apple Silicon Macs. No Python, nothing else to install.
Windows and macOS will both query an unsigned app the first time; the download
buttons above and the usual *More info → Run anyway* / right-click → *Open* get
you past it.

Your contacts, photos and settings live under `~/.config/contact-list/`.

If the tray icon fails to start, the app opens your browser instead, so you're
never left with no way to reach it. This is not yet tested on GNOME. GNOME has
no tray unless you add the AppIndicator and KStatusNotifierItem Support
extension. On GNOME, add that extension, or open http://localhost:5002 yourself.

## Where it stands

Live and stable, on Linux, Windows and macOS. It binds to your own machine only,
uses parameterised database queries, CSRF protection, autoescaped templates and a
strict content-security policy — the boring measures that stop a local web app
being a liability. Flask and SQLite underneath, with no accounts, no cloud and no
JavaScript framework.
