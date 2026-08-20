# About copy

One file per project, named for its `slug` in `src/projects.json` — so
`src/about/oneup.md` is the About section on `/p/oneup.html`. Every project needs
one, including the ones marked `soon`: the build fails with the missing slug named
rather than quietly shipping a page with a hole in it.

`README.md` in this folder is this note, not a project — no project may use the
slug `readme`.

## Why this exists rather than the README

The site used to render each project's GitHub README here. It read badly. A README
is written for someone who has already decided to clone the repo, so it opens with
build badges, compiler flags and a licence, and buries what the thing actually does
under three headings of setup. It also changed shape without warning whenever the
repo was edited — the page could be reworded by a commit that had nothing to do
with the site.

So the copy lives here, written once, for a visitor who has just arrived and is
deciding whether this is worth their afternoon.

## What goes in one

Answer, in this order, and stop when you have:

1. **What is it, in a sentence a non-programmer finishes.** Not the category
   ("a Qt6 desktop utility") — the job ("it tells you which of your web servers
   are actually running").
2. **The problem it solves.** The annoying thing that existed before it.
3. **What it does.** The handful of things that matter, concretely. Not a feature
   dump — if a list runs past about eight items, it has stopped being read.
4. **What it is like to use.** How you start it, what you see, what it asks of you.
5. **Where it stands.** What works, what does not yet, and anything that will bite
   on first run (a driver requirement, an unsigned-binary warning, a platform it
   does not support).

Leave out: build instructions, dependency lists, contribution guidelines, licence
text. Those belong in the repo, and the page already links there.

## House style

- Short sentences. Plain words. Assume no programming knowledge and define a term
  inline the first time it is unavoidable.
- Concrete over abstract — name the button, the file, the number.
- Say what it does *not* do. It costs a line and it saves a disappointed download.
- Do not repeat the tagline; the page prints it directly above.
- Start headings at `##`. They render one level down, under the page's
  "About <name>" heading.

## Format

Plain GitHub-flavoured markdown. No header block — unlike a blog post, there is no
date or title to carry, and the page supplies both.

Links may point anywhere; internal ones (`/p/perch.html`) stay internal and
external ones open in a new tab. Images are allowed but rarely the right call —
screenshots belong in the `screenshots` array in `projects.json`, where they get
the gallery and the lightbox.

Roughly 1,500–3,500 characters is the range that reads well. Past about 4,000 the
page tucks the remainder behind a "Read the rest" reveal, which is a safety net
rather than a target.
