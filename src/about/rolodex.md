Rolodex is a safe place to keep your passwords, keys and private notes — on your
own computer, in a single encrypted file, opened with one master password.

There is no cloud, no account to sign up for, and no tracking. Your data never
leaves your machine.

## What it does

- **Everything is encrypted.** The whole vault is scrambled and can only be opened
  with your master password. For the technically curious: AES via Fernet, with the
  key derived from your password using PBKDF2-HMAC-SHA256 at 600,000 rounds and a
  random per-vault salt.
- **Live two-factor codes.** Store an authenticator secret and Rolodex shows the
  rotating six-digit code right on the card, with a countdown ring and one-click
  copy. No separate phone app needed.
- **Secrets stay hidden.** Passwords and keys are masked behind dots and reveal
  only when you ask, and Rolodex works out which fields are sensitive on its own.
- **Safer copying.** Copy a password with one click, and it is wiped from the
  clipboard a few seconds later rather than sitting there for other apps to read.
- **Auto-locks when you step away.** After a stretch of inactivity — or instantly
  with `Ctrl+L` — it re-locks and forgets your master password until you unlock.
- **A built-in generator** for strong random passwords, with control over length
  and which characters to include.
- **Organised into categories** you can collapse, with drag-and-drop between them,
  and search-as-you-type across names, fields and notes.
- **Import, backup, restore and export**, including a plain-text export if you
  ever want to take your data elsewhere. You can change the master password
  whenever you like.

Different kinds of field — logins, keys, web addresses, dates — each carry their
own colour accent, so a card reads at a glance.

## Getting it

A single file per system, with everything bundled inside: Linux, Windows and
Apple Silicon macOS. Nothing else to install. Neither the Windows nor the macOS
build is signed yet, so each will query it the first time — *More info → Run
anyway* on Windows, right-click → *Open* on a Mac.

Your vault is saved in your personal data folder, not next to the download, so
moving or replacing the app never touches it.

## Before you start

The first launch asks you to create your master password. **There is no way to
recover it.** It is never saved anywhere — it is the only key to your data, and
if you lose it the data is gone for good.

So make a backup you can restore from, and keep the master password somewhere
safe. That is the trade for nobody else being able to read your vault, including
me.

## Where it stands

Live and stable, on Linux, Windows and macOS. Built with GTK4 and libadwaita.
