A terminal is the window where you type commands to your computer. Ants Terminal is
a fast, good-looking one for Linux, written from scratch — but the reason it exists
is what it does when you are working alongside [Claude Code](https://claude.ai/claude-code),
Anthropic's AI coding assistant.

## The problem it solves

Claude Code charges by the token — roughly, a small chunk of text it reads or
writes. Every time it needs to look something up, it runs a command and reads all
of the output. Checking what changed in your code, searching your files, reading a
long to-do list: each one is a wall of text you pay for.

Ants Terminal answers a lot of those questions itself and hands Claude a short,
tidy summary instead. It ships 93 built-in tools that replace the expensive
long-hand commands — *where is this function defined*, *what changed on this
branch*, *what did the last test run say* — and a counter in the bottom bar keeps
a running total of what they have saved you this session.

You do not have to learn any of it. Claude picks the right tool on its own once
the terminal is connected.

## Working alongside Claude

- **See what it is doing.** The bottom bar shows Claude's status — thinking,
  editing, searching — and how full its memory is getting.
- **See what it changed before you keep it.** A Review Changes button opens a
  file-by-file view of every edit.
- **Browse and resume past sessions** without leaving the terminal.
- **Set permissions visually**, rather than hand-editing a settings file.
- **Paste a screenshot** and the file lands in the prompt ready to send.

All of this happens on your own machine. Nothing is sent anywhere.

## It is also just a good terminal

With Claude out of the picture entirely: full colour and Unicode, full-screen
programs like `vim` and `htop`, programming-font ligatures, inline images,
clickable links and file paths, a command palette, searchable history, a
pop-out editor for long commands, a snippets library, 11 colour themes with
automatic dark/light switching, and small Lua plugins that run sandboxed and
cannot freeze the window.

It needs nothing but Qt6, which most Linux desktops already have, so it starts
quickly and stays light.

## Getting it

On openSUSE, Fedora or Mageia, add the repository once and install it like any
other program — you then get updates automatically. On anything else, the
AppImage is a single file: download it, make it executable, run it. Both routes
are on the download buttons above.

Your settings live in `~/.config/ants-terminal/`, readable only by you. The
terminal makes no network connections at all unless you switch on the optional
AI chat.

## Where it stands

In beta and used daily — it is the terminal this website was built in. Linux
only; there is no Windows or macOS build and none planned. MIT licensed.
