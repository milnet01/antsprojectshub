# Demo videos

Drop a project's demo video here, then point at it from `src/projects.json` under
that project's `video` object:

```json
"video": {
  "src": "finbreak-tour.mp4",
  "poster": "finbreak-tour-poster.jpg",
  "caption": "A silent 34-second tour of finbreak, in dark theme. It opens on the Home dashboard…"
}
```

- `src` and `poster` are both relative to **this** directory (`src/assets/video/`).
- `caption` is **required** and is not decoration. The videos are silent screencasts,
  so under WCAG 1.2.1 the caption *is* the accessible alternative — it must describe
  what the video shows, in order, well enough that someone who never plays it knows
  what happened. The site owner is partially sighted; write it properly.
- When one video can't show everything, `video` may be an array of these objects instead,
  each with a `title` ("Trailer: colours and themes") that heads it on the page. They play
  in the order listed, so put the newest first.
- It renders as a **Demo** section at the very top of the project page, above the
  screenshots, with a "Demo" entry in the jump nav.

## Making the file

Native `<video controls>` — no player library, no JavaScript, and it never autoplays.
So the file has to be small and self-explanatory:

- **H.264 in MP4**, which every browser plays without a fallback encode.
- **Silent.** Drop the audio track entirely (`-an`); the caption carries the meaning.
  A YouTube trailer, such as `pressless-trailer`, keeps its music. The music carries
  no meaning, so the caption still describes everything on screen. Scale a trailer
  to 1280×720 and encode it with `-crf 26` and AAC at 96k.
- **Short and lean** — a ~30 s tour at ~1600×1000 fits in well under a megabyte, and
  the visitor pays for none of it until they press play (`preload="none"`).
- **Metadata up front** so playback can start before the download finishes:
  `ffmpeg -i in.mp4 -c copy -movflags +faststart out.mp4`.
- **Poster** = a frame of the video itself. Prefer the first frame, so nothing shifts
  when playback starts: `ffmpeg -i out.mp4 -frames:v 1 -q:v 3 poster.jpg`. Where the
  first frame shows nothing (an empty terminal before a command is typed), take one
  that shows what the video is about instead — add `-ss <seconds>` before `-i`. A still that says nothing costs more than the jump on play.
  Use JPEG, not a quantised PNG —
  these UIs are dark, and palette quantisation bands the near-black backgrounds
  badly (measured on `finbreak-tour`; the plain PNG is clean but 2× the size).
