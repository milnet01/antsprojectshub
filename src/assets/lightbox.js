// Keyboard shortcuts and swiping for the pure-CSS :target screenshot lightbox, and the
// ‹ / › buttons of the thumbnail strip — the things CSS can't do. Progressive
// enhancement only: the lightbox is fully usable without this file (✕ button,
// click-outside backdrop, browser Back), and the strip still scrolls by its scrollbar.
// It just adds:
//   Escape      → close (returns to the gallery, same as the ✕)
//   ArrowLeft   → previous shot   ArrowRight → next shot
//   swipe right → previous shot   swipe left → next shot   (touch screens)
//   strip ‹ / › → scroll the thumbnails, shown only while they overflow
// It reads the destinations straight from the open panel's own ‹ / › links, so it
// stays correct for any gallery size, and stops at the first and last shot because
// those panels have no link onward.

// Each strip's buttons scroll it most of its own width, and dim at either end. The bar
// under it shows how much of the strip is in view and where.
document.querySelectorAll(".shots__row").forEach(function (row) {
  var strip = row.querySelector(".shots__strip");
  var prev = row.querySelector(".shots__arrow--prev");
  var next = row.querySelector(".shots__arrow--next");
  var bar = row.querySelector(".shots__bar");
  var thumb = row.querySelector(".shots__thumb");
  if (!strip || !prev || !next || !bar || !thumb) return;
  strip.classList.add("shots__strip--drawn");

  function update() {
    var max = strip.scrollWidth - strip.clientWidth;
    var overflows = max > 1;
    prev.hidden = next.hidden = bar.hidden = !overflows;
    prev.disabled = strip.scrollLeft <= 1;
    next.disabled = strip.scrollLeft >= max - 1;
    thumb.style.width = (strip.clientWidth / strip.scrollWidth) * 100 + "%";
    thumb.style.left = (strip.scrollLeft / strip.scrollWidth) * 100 + "%";
  }
  function scrollStrip(dir) {
    var still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    strip.scrollBy({ left: dir * strip.clientWidth * 0.8, behavior: still ? "auto" : "smooth" });
  }
  prev.addEventListener("click", function () { scrollStrip(-1); });
  next.addEventListener("click", function () { scrollStrip(1); });
  strip.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  // A thumbnail has no width until its image loads, so re-measure as each arrives.
  strip.querySelectorAll("img").forEach(function (img) {
    if (!img.complete) img.addEventListener("load", update);
  });
  update();
});
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
