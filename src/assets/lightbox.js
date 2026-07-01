// Keyboard shortcuts for the pure-CSS :target screenshot lightbox — the one thing
// CSS can't do. Progressive enhancement only: the lightbox is fully usable without
// this file (✕ button, click-outside backdrop, browser Back). It just adds:
//   Escape      → close (returns to the gallery, same as the ✕)
//   ArrowLeft   → previous shot   ArrowRight → next shot
// It reads the destinations straight from the open panel's own ‹ / › links, so it
// stays correct for any gallery size (and does nothing when only one shot exists).
document.addEventListener("keydown", function (e) {
  if (e.altKey || e.ctrlKey || e.metaKey) return;
  var open = document.querySelector(".lightbox:target");
  if (!open) return;

  if (e.key === "Escape") {
    e.preventDefault();
    location.hash = "screenshots";
    return;
  }

  var sel =
    e.key === "ArrowLeft"
      ? ".lightbox__prev"
      : e.key === "ArrowRight"
      ? ".lightbox__next"
      : null;
  if (!sel) return;

  var link = open.querySelector(sel);
  if (link) {
    e.preventDefault();
    location.hash = link.getAttribute("href").slice(1);
  }
});
