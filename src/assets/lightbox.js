// Keyboard shortcuts and swiping for the pure-CSS :target screenshot lightbox — the
// things CSS can't do. Progressive enhancement only: the lightbox is fully usable without
// this file (✕ button, click-outside backdrop, browser Back). It just adds:
//   Escape      → close (returns to the gallery, same as the ✕)
//   ArrowLeft   → previous shot   ArrowRight → next shot
//   swipe right → previous shot   swipe left → next shot   (touch screens)
// It reads the destinations straight from the open panel's own ‹ / › links, so it
// stays correct for any gallery size, and stops at the first and last shot because
// those panels have no link onward.
function lightboxGo(open, sel) {
  var link = open.querySelector(sel);
  if (!link) return false;
  location.hash = link.getAttribute("href").slice(1);
  return true;
}

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
  if (sel && lightboxGo(open, sel)) e.preventDefault();
});

// A swipe counts when the finger travels at least 50px sideways and further sideways
// than up or down, so scrolling a tall screenshot never turns the page.
var swipeX = null;
var swipeY = null;
document.addEventListener(
  "touchstart",
  function (e) {
    if (e.touches.length !== 1 || !document.querySelector(".lightbox:target")) {
      swipeX = null;
      return;
    }
    swipeX = e.touches[0].clientX;
    swipeY = e.touches[0].clientY;
  },
  { passive: true }
);
document.addEventListener(
  "touchend",
  function (e) {
    var open = document.querySelector(".lightbox:target");
    if (swipeX === null || !open) return;
    var dx = e.changedTouches[0].clientX - swipeX;
    var dy = e.changedTouches[0].clientY - swipeY;
    swipeX = null;
    if (Math.abs(dx) < 50 || Math.abs(dx) <= Math.abs(dy)) return;
    lightboxGo(open, dx > 0 ? ".lightbox__prev" : ".lightbox__next");
  },
  { passive: true }
);
