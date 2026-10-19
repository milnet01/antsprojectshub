// Put the download for the visitor's own system first, and say so.
//
// The page ships every download button in the build's fixed order (Windows, macOS, Linux),
// with the first one highlighted. That is complete on its own: with no JavaScript, or on a
// system this script does not recognise, nothing changes. This script only upgrades it —
// it reads which desktop system the browser is running on, moves that system's buttons to
// the front, highlights them instead, and adds a visible "Your system" line under each, so
// the hint is words and never colour alone.
//
// Buttons are found by the data-dl-platform the build writes for analytics (win / mac /
// linux). Only buttons directly inside .actions move; the alternative-download links
// under them carry the same attribute and stay where they are. A Linux release split into
// .deb and .rpm has two Linux buttons, and both move, keeping their order.
(function () {
  "use strict";
  var ua = navigator.userAgent || "";
  // Phones and tablets cannot run these downloads, so they get the page as built. An iPad
  // asking for the desktop site reports itself as a Mac; its touch screen gives it away.
  if (/Android|iPhone|iPad|iPod/i.test(ua)) return;
  if (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) return;
  var os = /Windows/.test(ua) ? "win"
    : /Macintosh|Mac OS X/.test(ua) ? "mac"
    : /Linux|X11/.test(ua) && !/CrOS/.test(ua) ? "linux"
    : "";
  if (!os) return;

  var actions = document.querySelector(".actions");
  if (!actions) return;
  var mine = [];
  for (var i = 0; i < actions.children.length; i++) {
    var item = actions.children[i];
    var a = item.querySelector("a[data-dl-platform]");
    if (a && a.getAttribute("data-dl-platform") === os) mine.push(item);
  }
  if (!mine.length) return;

  var primary = actions.querySelectorAll(".btn--primary");
  for (var j = 0; j < primary.length; j++) primary[j].classList.remove("btn--primary");
  // Last to first, each to the very front, so a pair keeps its order even where its first
  // button was already first.
  for (var k = mine.length - 1; k >= 0; k--) {
    var btn = mine[k].querySelector("a");
    btn.classList.add("btn--primary");
    var label = document.createElement("span");
    label.className = "dl__mine";
    label.textContent = "Your system";
    btn.insertAdjacentElement("afterend", label);
    actions.insertBefore(mine[k], actions.firstChild);
  }
})();
