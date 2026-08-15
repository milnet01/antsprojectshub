/* ============================================================================
   Photo gallery lightbox for the Images page.
   Click any thumbnail to open the full, un-cropped photo in an overlay.
   Arrow keys / on-screen arrows move between photos; Esc or a click on the
   backdrop closes it. Everything works from local files (no network needed).
   ============================================================================ */

document.addEventListener("DOMContentLoaded", () => {
  const shots = [...document.querySelectorAll(".gallery button.shot")];
  const box   = document.getElementById("lightbox");
  if (!shots.length || !box) return;

  const imgEl   = box.querySelector("img");
  const countEl = box.querySelector(".lb-count");
  // Full-size source + caption come from each thumbnail's data-* attributes.
  const items = shots.map((b) => ({ src: b.dataset.full, alt: b.dataset.caption || "" }));
  let i = 0;

  function render() {
    imgEl.src = items[i].src;
    imgEl.alt = items[i].alt;
    countEl.textContent = `${i + 1} / ${items.length}`;
  }
  function open(n) { i = n; render(); box.classList.add("open"); document.body.style.overflow = "hidden"; }
  function close() { box.classList.remove("open"); document.body.style.overflow = ""; imgEl.src = ""; }
  const go = (d) => { i = (i + d + items.length) % items.length; render(); };

  shots.forEach((b, n) => b.addEventListener("click", () => open(n)));
  box.querySelector(".lb-close").addEventListener("click", close);
  box.querySelector(".lb-nav.prev").addEventListener("click", (e) => { e.stopPropagation(); go(-1); });
  box.querySelector(".lb-nav.next").addEventListener("click", (e) => { e.stopPropagation(); go(1); });
  // click on the dark backdrop (but not on the photo itself) closes
  box.addEventListener("click", (e) => { if (e.target === box) close(); });
  document.addEventListener("keydown", (e) => {
    if (!box.classList.contains("open")) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowLeft") go(-1);
    else if (e.key === "ArrowRight") go(1);
  });
});
