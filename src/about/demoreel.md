Some places want a video of an app actually running. Flathub's submission
checklist is the case that prompted this, and it will not be the last.

The obvious way to make one is to record your screen. That turns out to be the
wrong answer, for two reasons found the hard way.

**It films your desktop.** Whatever else is open — and whatever is private — goes
into a file destined for a public pull request.

**It films your accessibility tools.** This machine runs a screen magnifier. It is
painted onto the screen output, so every screen or region recording catches the
lens sliding around. Turning it off is not a fix: it is what makes the screen
readable in the first place, so without it the app cannot be operated for the
recording at all.

demoreel runs the app on a **private virtual display** — no desktop, no magnifier,
nothing else on it — and records that. Nothing of your session is in frame, because
your session is not there.

## What it does

One command. Give it an app, get back a video file.

It starts a virtual display at the size you ask for, launches your app on it, waits
for the window and sizes it to fill the frame, optionally runs a short scripted
list of clicks and keystrokes so the video shows the app being *used* rather than
sitting still, records for the duration, then shuts everything down and leaves one
file behind.

It prints the path of the finished video and nothing else, so you can capture it
into a variable without the app's own chatter stirred in.

## The refusals

**It will not hand back a blank recording.** If nothing was ever drawn on the
display, that is an error, not a video file. This matters more than it sounds:
`Xvfb`, the default virtual display, is a software X server with no graphics
acceleration, so an OpenGL or Vulkan app cannot render on it at all and comes out
solid black. Silently returning that file is how you find out three days later, on
somebody else's pull request.

**An app that needs the graphics card gets `--gpu`**, which swaps in a real display
server on a headless kiosk compositor that can reach the card. Same window sizing,
same scripted actions, same single file out — and the same privacy property, since
that compositor is started fresh for the run with nothing of your session on it.

**It waits for the app to draw** before it starts recording, if you ask it to. A
GPU app can sit on a black screen for several seconds while it builds its
acceleration structures, and without this every caller records long and trims the
head off afterwards — which is post-production, the thing this tool deliberately
leaves to somebody else.

## Honest about its limits

demoreel can tell that *something* was recorded. It cannot tell that the app
quietly fell back to its low-detail assets — that recording is not blank, does not
error, and passes every check it has. So it can keep the app's own output to a file
for you, which is what to do when the app prints a line proving it loaded the real
thing.

## Where it stands

Live and in use, on Linux. It is a command-line tool with no window of its own,
and it says plainly when something it needs is not installed rather than failing
obscurely.
