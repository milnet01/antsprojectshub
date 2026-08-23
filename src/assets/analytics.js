// Google Analytics 4, behind an explicit opt-in. Progressive enhancement, and the
// only page of ours that talks to a third party.
//
// Nothing here runs until the visitor says yes:
//   no choice yet  → show the consent bar, load nothing
//   "Accept"       → remember it, then load gtag.js and start counting
//   "Decline"      → remember it, load nothing, never ask again
// The choice lives in localStorage (not a cookie — a cookie set to record that you
// refused cookies is the joke that writes itself), so a visitor who has never
// accepted has no Google cookie on their machine at all.
//
// The measurement ID is NOT hard-coded: it rides on this file's own <script> tag as
// data-ga-id, written by lib/templates.mjs from src/projects.json. The site's CSP
// forbids inline <script>, so Google's copy-paste snippet cannot be used as given —
// this file does the same job from a self-hosted file, which 'script-src self' allows.
(function () {
  "use strict";

  var KEY = "aph-analytics-consent"; // "granted" | "denied"
  var self = document.querySelector("script[data-ga-id]");
  var ID = self && self.getAttribute("data-ga-id");
  if (!ID) return;

  // localStorage throws in Safari's private mode rather than returning null, and a
  // dead analytics script must never take the page down with it.
  function remembered() {
    try {
      return localStorage.getItem(KEY);
    } catch (e) {
      return null;
    }
  }
  function remember(value) {
    try {
      localStorage.setItem(KEY, value);
    } catch (e) {
      /* private mode — the choice holds for this page load only */
    }
  }

  var loaded = false;
  function loadGA() {
    if (loaded) return;
    loaded = true;
    window.dataLayer = window.dataLayer || [];
    function gtag() {
      window.dataLayer.push(arguments);
    }
    window.gtag = gtag;
    gtag("js", new Date());
    // Measurement only. Google Signals and ad personalisation are the parts that follow
    // people between sites, and this is a project showcase, not a shop. Both show up in
    // the outgoing hit as npa=1, which is how to check they are still off.
    // No anonymize_ip here on purpose: that is a Universal Analytics setting, GA4 drops
    // IPs by default, and passing it anyway just rides along as a junk custom parameter
    // (ep.anonymize_ip) on every event.
    gtag("config", ID, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    });
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(ID);
    document.head.appendChild(s);
  }

  // ---- The consent bar -----------------------------------------------------
  // Built here rather than emitted by the build: without JavaScript nothing can be
  // tracked, so a static banner would be a question with no consequence. It is
  // inserted right after the skip link so a keyboard or screen-reader user meets it
  // near the top of the page instead of hunting for it at the end.
  var bar = null;

  function close(choice) {
    remember(choice);
    if (bar) {
      bar.remove();
      bar = null;
      document.body.classList.remove("has-consent");
    }
    if (choice === "granted") loadGA();
  }

  function button(label, cls, choice) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "btn " + cls;
    b.textContent = label;
    b.addEventListener("click", function () {
      close(choice);
    });
    return b;
  }

  function showBar(focus) {
    if (bar) return;
    bar = document.createElement("section");
    bar.className = "consent";
    bar.setAttribute("role", "region");
    bar.setAttribute("aria-label", "Cookie choices");
    bar.tabIndex = -1;

    var text = document.createElement("p");
    text.className = "consent__text";
    text.append(
      "This site can use Google Analytics to count visits and see which projects " +
        "people look at. It sets a cookie. Nothing is measured unless you say yes — "
    );
    var more = document.createElement("a");
    more.href = "/privacy/";
    more.textContent = "what gets collected";
    text.append(more, ".");

    var row = document.createElement("div");
    row.className = "consent__row";
    row.append(
      button("Accept", "btn--primary", "granted"),
      button("Decline", "btn--ghost", "denied")
    );

    bar.append(text, row);

    var skip = document.querySelector(".skip-link");
    if (skip && skip.parentNode) skip.after(bar);
    else document.body.prepend(bar);

    // The bar is fixed to the viewport, so without this the last few lines of the page
    // — the footer, and the "Cookie settings" link itself — sit underneath it and
    // cannot be scrolled to. The class adds matching bottom padding for as long as the
    // bar is up.
    document.body.classList.add("has-consent");

    // Only steal focus when the visitor asked for the bar back. On first load it
    // appears unbidden, and yanking the cursor out of the page is hostile.
    if (focus) bar.focus();
  }

  // ---- Footer link to change your mind -------------------------------------
  // Added from here so it never shows up as a dead control on a JS-less page.
  function addFooterLink() {
    var foot = document.querySelector(".site-foot .wrap");
    if (!foot) return;
    var b = document.createElement("button");
    b.type = "button";
    b.className = "linkish";
    b.textContent = "Cookie settings";
    b.addEventListener("click", function () {
      showBar(true);
    });
    foot.append(document.createTextNode(" · "), b);
  }

  var choice = remembered();
  if (choice === "granted") loadGA();
  else if (choice !== "denied") showBar(false);
  addFooterLink();
})();
