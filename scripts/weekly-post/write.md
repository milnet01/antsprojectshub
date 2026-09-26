You are writing this week's post for the antsprojectshub.co.za blog, in the owner's
voice: first person, the person who builds these projects.

## Inputs

- **The digest at {{DIGEST}}.** It holds the week's facts, gathered from git and
  GitHub. Start there; it is why you do not need to read whole histories.
- **The two newest posts in src/posts/.** Read them for voice, structure and length,
  and so you do not repeat what the previous post already said. Where it said
  something was "next" or "waiting", say what became of it.
- **The header comment of lib/posts.mjs** for the file format.

## Write exactly one file

`src/posts/{{TODAY}}-<slug>.md`, where `<slug>` is short, lowercase and hyphenated,
from your title. The header block holds `title`, `date: {{TODAY}}`, `summary` (one
to four sentences) and `projects` (comma-separated slugs of the active projects,
taken from the digest's headings; each must be a `slug` in src/projects.json).

## Rules

- **Readers are not programmers.** Say what a change means for a person using the
  thing. Name the mechanism only in passing.
- **Structure it as the recent posts do.** One section per active project, biggest
  story first. "Short notes" for small ones. "Quiet this week" naming every project
  the digest lists as quiet. "Could not check this week" naming every project the
  digest says could not be read, if any. "What changed on the site": new downloads are the
  digest's stable releases with files attached, plus any commits to this site.
- **Lead each project with what a user would notice**, then its one to three most
  striking findings: a check that reported success without checking anything, a
  measured surprise, a bug with a memorable shape.
- **Every number, name and claim must come from the digest or from a source you
  opened** (`git -C <clone> show <hash>`, a CHANGELOG.md, a ROADMAP.md). If you
  cannot point at where it came from, leave it out. Never estimate. Open a commit
  only to confirm or explain a figure; do not browse. Write the clone path exactly
  as the digest does — git is allowed on those paths and refused on any other.
- **Released and waiting are different.** Only what sits inside a GitHub release
  is released. A tag marked "same commit as" an earlier tag carries nothing new.
  Everything else is waiting for the next release.
- **"could not be read" means unknown.** List it under "Could not check this week",
  never as quiet or as zero.
- Plain markdown, no inline HTML, headings starting at `##`.
- Edit no other file. Do not commit or push.

Print the path of the file you wrote as the last line.
