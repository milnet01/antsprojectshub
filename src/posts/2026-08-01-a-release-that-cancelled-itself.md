---
title: A release that had been cancelling itself for three weeks
date: 2026-08-01
summary: Vestige's weekly release train was killing its own build every single run, and the only symptom was a version that never appeared. Plus the terminal's heaviest week yet, and finbreak's import gets honest.
projects: vestige-engine, ants-terminal, fin-break, lotto-tracker, album-builder
---

My favourite kind of bug this week: one where everything reports success and the
thing still does not happen.

## Vestige had been cancelling its own releases

Every Friday, Vestige's release workflow does two jobs. It promotes the release
candidate that has been baking all week into a full release, and it cuts a fresh
candidate from the main branch. Both halves call the same build workflow.

That workflow grouped its runs by a value that was identical for both calls — and
it had "cancel any earlier run in this group" switched on. So the second half
killed the first. Every single time.

The symptom was almost nothing. The planning step always succeeded, so the version
tags were created correctly and everything downstream looked healthy. Only the run
list showed the word `cancelled`, and nobody reads the run list when the tags are
right. Version 0.1.64 had been sitting unpublished since 22 July with a half-uploaded
set of files, because its build was killed partway through the upload.

Three weekly runs went that way — 22 July, 29 July, 31 July — before I noticed.
The fix is one line: key the group on the version being built, so the two halves
stop colliding. I re-ran the promotion for 0.1.65 to confirm it, and both platform
builds completed and the release published.

The lesson I keep relearning is that a green tick is a claim about one step, not
about the outcome.

Elsewhere in the engine: the meadow pond got silty rather than crystal clear, which
sounds like a downgrade and is not — clear water in a shallow meadow pond looks
wrong, and murky green reads as real. The cartoon lily pads were replaced with
actual lotus plants, tree detail now scales with the graphics quality setting, and
the scene stopped being drawn twice for water you cannot see.

## Ants Terminal's heaviest week

214 commits, and 0.7.101 out on the 29th. Almost all of it went into one thing:
moving the roadmap out of a markdown file and into a real database.

That sounds like an internal detail, and it is, but the reason matters. Ants
Terminal is a terminal with tooling for AI-assisted coding sessions built into it,
and a big part of that tooling reads and writes each project's roadmap. Doing that
by parsing and rewriting a markdown file works right up until two things edit it at
once, or until a line of prose that happens to quote code-fence syntax convinces
the parser that the rest of the file is a code block. Which is exactly what
happened, and it silently swallowed about a quarter of one project's roadmap.

So there is now a store underneath, the markdown file is rendered from it, and the
tooling reads the store. The file stays because I want to be able to read it in a
text editor and see it in a diff.

## finbreak, 0.1.18 and 0.1.19

Two releases, both about importing bank statements, and all of it in the same
direction: stop guessing, and when something cannot be read, say what and why.

The one I like best is the smallest. On the import screen you can type your own
date pattern. If you typed one with no year in it — `%d/%m` rather than `%d/%m/%Y`
— finbreak accepted it happily and dated every transaction in the year 1900. No
warning. Your entire statement, filed under the Boer War. It now stops and tells
you the year is missing.

There was also a warning that fired on any statement dated in May, claiming the day
and month might be swapped when they were being read perfectly. May is the one month
whose short name and long name are the same word, which was enough to confuse the
check. It now only warns when the two readings would actually give different dates.

## LottoTracker starts

48 commits into something new. South Africa's national lottery, and specifically
the fact that a small win can sit unnoticed in your inbox until it expires. It reads
the ticket confirmations the bank sends by SMS, remembers every ticket, checks them
against the real draw results, and flags what is still claimable and for how long.
Everything on your own machine. No account, no API key.

Album Builder also put out 0.7.0 on the 28th.
