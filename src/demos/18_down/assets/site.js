/* ============================================================================
   Cycling song player for the home page.
   Shows one of Charl's Spotify tracks at a time and auto-advances through them.
   Auto-advance pauses while the mouse is over the player (so a listener isn't
   interrupted), and Prev/Next + the dots let you move manually.

   To add / remove / reorder songs, just edit the SONGS list below — nothing
   else needs changing.
   ============================================================================ */

const SONGS = [
  { id: "2akIE71ko3pUdDq7NuaKra", title: "Drown - Calm" },
  { id: "13MPSAlmsMlx7St64SXW9i", title: "Disillusioned" },
  { id: "3vWkrS3HCdT44ExdVAo3ic", title: "This World" },
  { id: "0Z0kbSCRfR91bJ0d6LU4b1", title: "The Hills" },
  { id: "1VjasHScPGijbUX3Mo0c3H", title: "Jimmy" },
  { id: "70X1YtB1ca8tTkKxtbu2AT", title: "Heaven and Hell" },
  { id: "3XVQTTFPAw3h1uXy8do3BP", title: "Everything is Nothing" },
];

const ADVANCE_MS = 22000; // how long each song shows before moving on

document.addEventListener("DOMContentLoaded", () => {
  const frame  = document.getElementById("player-frame");
  const title  = document.getElementById("player-title");
  const count  = document.getElementById("player-count");
  const dotsEl = document.getElementById("player-dots");
  const player = document.getElementById("player");
  if (!frame || !SONGS.length) return;

  let i = 0, timer = null;

  // build the dots
  SONGS.forEach((s, n) => {
    const b = document.createElement("button");
    b.className = "player-dot";
    b.type = "button";
    b.setAttribute("aria-label", `Play ${s.title}`);
    b.addEventListener("click", () => { show(n); restart(); });
    dotsEl.appendChild(b);
  });

  function show(n) {
    i = (n + SONGS.length) % SONGS.length;
    const s = SONGS[i];
    frame.innerHTML =
      `<iframe src="https://open.spotify.com/embed/track/${s.id}?utm_source=generator&theme=0"` +
      ` loading="lazy" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"` +
      ` title="${s.title} on Spotify"></iframe>`;
    title.textContent = s.title;
    count.textContent = `${i + 1} / ${SONGS.length}`;
    [...dotsEl.children].forEach((d, n) => d.setAttribute("aria-current", n === i ? "true" : "false"));
  }

  const next = () => { show(i + 1); restart(); };
  const prev = () => { show(i - 1); restart(); };
  function start()   { timer = setInterval(() => show(i + 1), ADVANCE_MS); }
  function stop()    { clearInterval(timer); timer = null; }
  function restart() { stop(); start(); }

  document.getElementById("player-next")?.addEventListener("click", next);
  document.getElementById("player-prev")?.addEventListener("click", prev);
  // pause cycling while someone is hovering (listening)
  player?.addEventListener("mouseenter", stop);
  player?.addEventListener("mouseleave", start);

  show(0);
  start();
});
