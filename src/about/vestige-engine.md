Vestige is a program for walking around 3D spaces on your computer. You move with
the keyboard and mouse or a game controller, in first person, the way you would in
a video game — except the spaces are ones you build yourself.

It started as a way to explore reconstructions of historical buildings. The first
targets were the Tabernacle and Solomon's Temple: structures described in detail in
text, which almost nobody has ever seen at full size. Reading measurements is not
the same as standing in a room. Vestige grew from that into a general-purpose engine
for building and inhabiting 3D scenes.

## What it does

It is one program with two halves, and the **Esc** key swaps between them.

- **The editor** is where you arrange a scene — place objects, light them, set up
  physics and sound, and undo it all when you change your mind.
- **Walkthrough mode** drops you inside it. W A S D and the mouse, Shift to run.
  Xbox and PlayStation controllers work too.

The rendering is the part most of the work has gone into. Realistic materials that
respond to light the way real surfaces do, shadows from the sun and the nearest
lamps, bounced light so a red wall tints the floor beside it, volumetric fog and
god rays through windows, and around a million individually simulated blades of
grass that cast their own shadows.

Underneath that: a full physics engine with cloth, skeletal animation for
characters, and characters that can find their own way around a scene. The 3D
audio is aware of the room. A sound is muffled by a real wall between you and it,
each space gets its own echo worked out from its shape, and footsteps and impacts
sound like the surface they hit.

There is also a visual scripting editor, for wiring behaviour together as a diagram
of connected nodes. Scripts built there do not run inside a scene yet.

## Getting a look at it

You do not need to build anything. Every release has ready-to-run downloads —
a `.zip` for Windows, an AppImage or a plain archive for Linux. Unpack it, run it,
press **Esc**, and you are walking.

Two things worth knowing before you do. **Windows will warn you the first time**;
the build is not code-signed, because a certificate costs money this project has
not spent. Click *More info* → *Run anyway*. And **your graphics driver needs to
support OpenGL 4.5** — if it refuses to start, updating the driver fixes almost
every case.

## Where it stands

It works, and it is genuinely early. The engine hits its target of 60 frames a
second on mid-range hardware. Quality presets and a render-scale setting let older
graphics cards keep up. The parts that make a scene look and sound right are built:
lighting, shadows, physics, audio, animation, weather, vegetation.

What is missing is most of the game-making layer. There is no networking and no
multiplayer. Scripts do not run yet. The in-game menus are laid out but not filled
in, though the editor has a full settings window. It is also not a Unity or Unreal
competitor and is not trying to be: no asset store, no scripting language, no
marketplace.

Accessibility is built in rather than bolted on: colour-blind modes, subtitles,
fully remappable controls, a reduce-motion setting and photosensitive safety limits.

**macOS is not supported and will not be.** Apple caps OpenGL at 4.1 and Vestige
needs 4.5. Vulkan is on the long-term roadmap, and would change that answer.

Vestige is MIT-licensed and will stay that way. It is developed openly with AI
assistance, which is disclosed rather than hidden.
