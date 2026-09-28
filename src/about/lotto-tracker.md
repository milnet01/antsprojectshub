Buy a lottery ticket and your bank sends you a confirmation SMS. The ticket
covers a set number of draws, and when it runs out nothing tells you — you are
simply no longer in the draw. Checking results by hand means finding the SMS,
finding the draw, and comparing six numbers by eye.

LottoTracker reads those SMSes and gives you one view of every ticket you have
bought. It tells you when a ticket is about to run out, so you can buy the next
one, and checks every entry against the real draw results.

## First, whether it is for you

**It is specific to South Africa, and currently to Standard Bank.** Two separate
assumptions are built in.

The lottery is the South African National Lottery — Lotto, Lotto Plus 1, Lotto 5
Max, PowerBall, PowerBall XTRA and Daily Lotto — with results from the operator's
own public feed. And the SMS wording is Standard Bank's, in both the version used
before the June 2026 operator handover and the version used after it.

If you bank elsewhere, everything except the message parser works unchanged, and
teaching it your bank's wording is the only work.

## What it does

- **Warns you before a ticket runs out.** The tray icon warns once, two draws
  before the end, naming the game and the last draw date.
- Pulls the lottery messages off an Android phone, by USB cable or over Wi-Fi, and
  reads out the ticket reference, the numbers, the game, the start date, how many
  draws you bought and what you paid.
- Fetches the draw results, including for draws from before the 2026 handover.
- Works out every draw you actually paid to enter, scores each line, expands
  Multiplay entries properly, and prices each win.
- **A page on your own computer**, opened from the tray icon, showing what you
  spent against what you won for a year, the year so far, a month or the month so
  far.
- **Checks the bank's own payout messages** against its own figures, and shows the
  two side by side.
- Flags anything still claimable, and when each prize expires.

**One ticket is usually several entries.** A "plus" game cannot be bought on its
own — the lottery requires the base game, and runs a separate draw with its own
prizes for each level. So a Lotto Plus 2 ticket (Lotto 5 Max since June 2026) is three entries with three
chances, not one, and all three get checked. Which levels you paid for is worked
out from the price, because the game name in the SMS only ever names the highest
one — and since June 2026 it does not name it at all.

**A ticket nobody can check is not a ticket that lost.** Entries that predate the
available results data, or that sit in a pool no source publishes, are reported as
uncheckable and kept out of the totals rather than counted as losses. That works
per entry, so a ticket checkable in one draw and not another is still scored on
the one that can be.

## Your messages stay yours

Worth being explicit about, because the code is public.

The USB route filters **on the phone**: only messages matching a short lottery
keyword filter ever cross to the computer, and nothing else is read. That is a
keyword filter rather than a sender filter, so a personal message mentioning the
lottery could come across too — glance at the dump before sharing it anywhere.

The message dump and the results cache are excluded from version control, and
there is a checker that verifies this by comparing every tracked file against the
dump itself, rather than against a guessed pattern — so it catches a real message
pasted into a document as an "example", not just a stray file.

Nothing is uploaded anywhere. The only outbound requests are to public lottery
results pages.

## Where it stands

In beta, on Linux, with no account, no API key and nothing paid. There is no download yet —
you run it from a copy of the source, which needs Python 3.9 or newer and a
couple of standard tools from your distribution to talk to the phone; the
repository's Setup section lists them. A packaged Linux version is planned. The
tray icon needs one extra library — and it is the only thing that does, so
everything works without it.
