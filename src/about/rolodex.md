Rolodex is a safe place to keep your passwords, keys and private notes — on your
own computer, in a single encrypted file, opened with one master password.

There is no cloud, no account to sign up for, and no tracking. Your data never
leaves your machine. The only time Rolodex goes online is to check for a new
version, and only if you switch that on.

## What it does

- **Everything is encrypted.** The whole vault is scrambled and can only be opened
  with your master password. Turning that password into the key takes 256 MB of
  memory per guess, which makes guessing it on graphics cards far costlier. For
  the technically curious: AES via Fernet, with an Argon2id key and a random
  per-vault salt.
- **Live two-factor codes.** Store an authenticator secret and Rolodex shows the
  rotating code on the card, with a countdown ring and one-click copy. It warns
  you if your computer's clock looks wrong, since that would make the codes wrong
  too.
- **A password health check.** It lists your passwords from weakest to strongest
  and marks any you have used for more than one account. Common passwords such as
  "Qwerty123!" are rated Weak, even with digits or symbols added on the end.
- **Secrets stay hidden.** Passwords, keys and two-factor secrets are masked behind
  dots and shown only when you ask. Rolodex works out which fields are sensitive
  on its own, and you can change its mind. A wallet's seed phrase is always
  hidden.
- **Safer copying.** Copy a password with one click, and it is wiped from the
  clipboard shortly after, unless you have copied something else since. Closing
  or locking the app clears it too.
- **Auto-locks when you step away.** After a stretch of inactivity — or instantly
  with `Ctrl+L` — it re-locks, clears the screen and forgets your master password
  until you unlock.
- **A built-in generator** for strong random passwords, with control over length
  and which characters to include.
- **Themes and accent colours.** Preferences (`Ctrl+,`) offers Automatic, which
  follows your desktop's light or dark setting, plus Dark, Light and High
  contrast. It has seven accent colours, or it can use your desktop's own.
- **Organised into categories** you can collapse, or show one at a time. Drag
  entries between them, and reorder fields and categories by mouse or keyboard.
  Select several entries at once to move or delete them together.
- **Search as you type** across names, fields and notes. Type several words and it
  finds entries that contain all of them, in any order.
- **Import, backup, restore and export.** It imports the CSV files that
  Bitwarden, KeePassXC, Chrome, Edge, Brave, Firefox and 1Password export. For any
  other CSV file, you say which column is which. It exports as CSV too, if you
  ever want to take your data elsewhere. If your vault ever will not open, you can
  restore from a backup straight from the unlock screen. You can change the master
  password whenever you like.
- **Keyboard shortcuts** for the everyday actions, and it reopens on the entry you
  last had open.

Different kinds of field — logins, keys, web addresses, dates — each carry their
own colour and icon, so a card reads at a glance. The colours stay distinct for
colourblind readers in every theme, and text meets the 4.5:1 contrast guideline
for readability. Screen readers announce its controls by name, and read a hidden
value as "Hidden value". In a narrow window, below about 560 pixels wide, the list
and the entry become two pages.

## Getting it

A single file per system, with everything bundled inside: Linux, Windows and
Apple Silicon macOS. Nothing else to install. Neither the Windows nor the macOS
build is signed yet, so each will query it the first time — *More info → Run
anyway* on Windows, right-click → *Open* on a Mac.

On Linux and macOS, Rolodex can update itself. It only installs an update that
carries the project's own signature, and refuses anything else. On Windows,
download the new version by hand for now.

Your vault is saved in your personal data folder, not next to the download, so
moving or replacing the app never touches it.

## Before you start

The first launch asks you to create your master password, at least 12
characters long. **There is no way to recover it.** It is never saved anywhere —
it is the only key to your data, and if you lose it the data is gone for good.

So make a backup you can restore from, and keep the master password somewhere
safe. That is the trade for nobody else being able to read your vault, including
me.

Already using Rolodex? Your vault converts to the stronger scramble the first
time you unlock it with the new version, and older versions can no longer open
it after that. Keep a backup from before you update if you might go back.

## Where it stands

Live and stable, on Linux, Windows and Apple Silicon Macs. Built with GTK4 and
libadwaita.
