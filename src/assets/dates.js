// Show a release date the way the reader's own system writes dates.
//
// A static site cannot know the reader's locale at build time — the build runs on a CI
// runner in UTC, and the visitor is somewhere else entirely — so the page ships the date
// in ISO form (2026-08-19): unambiguous, sortable, and the same in every locale. That is
// the default, and it is complete on its own. This script only upgrades it: it asks the
// browser what the reader's system format is and rewrites the text to match. With no
// JavaScript nothing happens and the ISO date stands, which is why it is safe to be a
// separate file loaded with `defer` rather than anything the page depends on.
//
// Only <time data-localise datetime="YYYY-MM-DD"> is touched. The `datetime` attribute is
// left exactly as it was, so the machine-readable value never changes — only what a human
// reads. Anything that isn't a plain ISO date is skipped rather than guessed at.
(function () {
  "use strict";
  var fmt;
  try {
    // navigator.languages is the reader's own preference order, which on a desktop comes
    // from the system language settings — ask that rather than Intl's runtime default,
    // which follows the browser's UI build and can differ. dateStyle "medium" keeps the
    // reader's ordering and month naming while staying short enough for the line it sits
    // on. Empty array falls back to `undefined`, i.e. the runtime default.
    var locales = navigator.languages && navigator.languages.length
      ? navigator.languages
      : navigator.language || undefined;
    fmt = new Intl.DateTimeFormat(locales, { dateStyle: "medium", timeZone: "UTC" });
  } catch (e) {
    return; // No Intl, or no support for these options — keep the ISO date.
  }
  var nodes = document.querySelectorAll("time[data-localise][datetime]");
  for (var i = 0; i < nodes.length; i++) {
    var iso = nodes[i].getAttribute("datetime");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) continue;
    var d = new Date(iso + "T00:00:00Z");
    if (isNaN(d.getTime())) continue;
    nodes[i].textContent = fmt.format(d);
  }
})();
