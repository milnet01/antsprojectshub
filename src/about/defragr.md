## What it is

DeFragR is a defragmenter for Linux drives, in a window.

A file is fragmented when it is stored in many separate pieces across
the drive. On a spinning drive, that makes the file slower to read.
DeFragR finds those files and puts each one back together in one piece.

## The problem

Linux already has a tool for this, called `e4defrag`. It works, but it
runs in a terminal and prints lines of text. It does not show you the
drive.

It also does not tell you which drives are worth defragging. Defragging
an SSD wears it out and gains nothing. Defragging a btrfs drive can use
up extra space.

## What it will do

- **List your drives.** Each one shows its size, its type, and whether
  it is an SSD or a spinning drive.
- **Let you choose.** Pick "view report" or "defrag now".
- **Report without touching anything.** The report shows how fragmented
  the drive is and which files are worst. It changes nothing.
- **Show the drive as a map.** During a defrag, the map's blocks change
  from scattered to whole as you watch.
- **Show progress.** A status bar names the file being worked on, and a
  percentage climbs to 100%.
- **Move files safely.** It uses only the Linux kernel's own checked
  move. Each file is checked before and after, and must match.
- **Stay out of your way.** Your PC stays usable while it runs. You can
  pause or cancel at any time without harm.
- **Be easy to read.** High contrast, and symbols as well as colours.
- **Say no when it should.** An SSD, a btrfs drive or a Windows drive
  gets a report only, with a plain reason why.

## What it will never do

- Defrag an SSD.
- Move file data in its own way. Only the kernel's checked move is used.
- Defrag Windows drives (NTFS or FAT).
- Pack every file to the front of the drive. Linux has no safe way to
  do that.

## Where it stands now

The first version gives a report and changes nothing. It is tagged on
GitHub but not released yet, and there is no download. To try it now,
you build it from its source code.

What works in it:

- **Your drives, listed.** Each one offers "View report" and "Defrag
  now". A choice a drive cannot take is greyed out, with the reason in
  plain words.
- **A report that touches nothing.** It shows how fragmented the drive
  is and lists every fragmented file, worst first.
- **Progress you can see.** A percentage bar shows how far a report has
  got.

Defragging itself comes in a later version, and so does an installable
package.
