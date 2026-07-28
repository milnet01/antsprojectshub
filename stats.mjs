// Ants Projects Hub — private stats dashboard.
//
// LOCAL ONLY. Writes to .stats/ (git-ignored) and is never referenced by build.mjs or the
// deploy workflow, so nothing here can reach antsprojectshub.co.za. That is the whole
// privacy model: a static site on public GitHub Pages has no way to keep a page secret,
// so this one simply never gets published.
//
//   npm run stats          fetch, render, print the path
//   npm run stats -- --open   ... and open it in the browser
//
// Authentication is automatic if you're logged in with the GitHub CLI (`gh auth login`) —
// no personal token needed. GITHUB_TOKEN wins if set. Unauthenticated GitHub allows only
// 60 calls/hour, under what a full run needs, and the traffic figures are owner-only, so
// an anonymous run still works but skips traffic.

import { readFile, writeFile, mkdir, readdir, copyFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { spawn } from "node:child_process";
import { esc } from "./lib/templates.mjs";
import {
  ghRequest,
  assetPlatform,
  pickAsset,
  pickLatestRelease,
  hasToken,
  tokenSource,
} from "./lib/github.mjs";

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT = join(ROOT, ".stats");
const HISTORY = join(OUT, "history.json");
const PAGE = join(OUT, "dashboard.html");

const OS_KEYS = ["win", "mac", "linux"];
const OS_LABEL = { win: "Windows", mac: "macOS", linux: "Linux" };
const DAY = 86400000;

// Release files that legitimately aren't OS downloads: signatures, checksums, auto-updater
// metadata, Python wheels, and plain source archives (a tarball with no OS hint in its
// name). They land outside the win/mac/linux buckets by design, so flagging them as "a
// missing download button" would nag about files the site is right to exclude. Anything
// unmatched and NOT in here is genuinely unexplained and worth surfacing.
const COMPANION_PAT =
  /\.(sig|asc|pem|sha\d+|zsync|blockmap|torrent|ya?ml|json|whl|txt|md)$|checksums?|cosign|sbom|intoto|\.att\b/i;
const SOURCE_PAT = /\.(tar\.(gz|xz|bz2)|tgz|zip)$/i;
const isExpectedNonDownload = (name) => COMPANION_PAT.test(name) || SOURCE_PAT.test(name);

const AUTH_LABEL = {
  env: "authenticated (GITHUB_TOKEN)",
  gh: "authenticated (gh CLI login)",
  none: "not authenticated — limited",
};

const num = (n) => (n ?? 0).toLocaleString("en-GB");
const isPublished = (p) => Boolean(p.repo) && p.status !== "soon";
const daysSince = (iso, now) => (iso ? Math.floor((now - Date.parse(iso)) / DAY) : null);
const dayKey = (ts) => new Date(ts).toISOString().slice(0, 10);

// ------------------------------------------------------------------ collection

// Everything we need about one project, in as few API calls as possible. Traffic is
// skipped without a token: it would 403 anyway, and skipping keeps an unauthenticated run
// inside the 60/hour ceiling so the rest of the dashboard still fills in.
async function collectProject(p) {
  const base = { slug: p.slug, name: p.name, repo: p.repo, project: p };
  const [repoRes, relRes, prRes] = await Promise.all([
    ghRequest(`/repos/${p.repo}`),
    ghRequest(`/repos/${p.repo}/releases?per_page=100`),
    ghRequest(`/repos/${p.repo}/pulls?state=open&per_page=100`),
  ]);

  // Did the numbers actually arrive? A rate-limited or failed fetch must never be treated
  // as "zero downloads" — it would understate the page and, worse, write a bogus zero into
  // the permanent history, poisoning every future delta.
  base.ok = relRes.ok;
  base.rateLimited = [repoRes, relRes].some((r) => r.status === 403 && r.remaining === 0);

  const repo = repoRes.data || {};
  const releases = (Array.isArray(relRes.data) ? relRes.data : []).filter((r) => !r.draft);
  const latest = pickLatestRelease(releases);
  const openPrs = Array.isArray(prRes.data) ? prRes.data.length : 0;

  // All-time downloads per OS across every non-draft release. `other` catches assets whose
  // filename matches no OS pattern — invisible to the site's download buttons, so a real
  // number there usually means a release asset is named in a way the matcher misses.
  const downloads = { win: 0, mac: 0, linux: 0, other: 0 };
  const perRelease = [];
  const unexplained = new Map(); // filename → downloads, for assets we can't account for
  for (const r of releases) {
    const row = { tag: r.tag_name, at: r.published_at, prerelease: r.prerelease, total: 0 };
    for (const a of Array.isArray(r.assets) ? r.assets : []) {
      const n = a.download_count || 0;
      const pl = assetPlatform(a.name);
      downloads[pl || "other"] += n;
      if (!pl && !isExpectedNonDownload(a.name)) {
        unexplained.set(a.name, (unexplained.get(a.name) || 0) + n);
      }
      row.total += n;
    }
    perRelease.push(row);
  }
  const total = OS_KEYS.reduce((s, k) => s + downloads[k], 0) + downloads.other;

  // Does every platform the project claims actually ship a file? A claimed OS with no
  // matching asset is a download button silently falling back to the repo page.
  const missingAssets = (p.platforms || [])
    .filter((pl) => OS_KEYS.includes(pl))
    .filter((pl) => !latest || !pickAsset(latest.assets || [], pl));

  const traffic = hasToken ? await collectTraffic(p.repo) : null;

  return {
    ...base,
    downloads,
    total,
    perRelease,
    unexplained: [...unexplained].sort((a, b) => b[1] - a[1]).slice(0, 3),
    missingAssets,
    traffic,
    stars: repo.stargazers_count ?? 0,
    forks: repo.forks_count ?? 0,
    watchers: repo.subscribers_count ?? 0,
    // GitHub's open_issues_count counts pull requests as issues; subtract them back out.
    issues: Math.max(0, (repo.open_issues_count ?? 0) - openPrs),
    prs: openPrs,
    pushedAt: repo.pushed_at || null,
    archived: Boolean(repo.archived),
    latestTag: latest?.tag_name || null,
    latestAt: latest?.published_at || null,
    releaseCount: releases.length,
  };
}

async function collectTraffic(repo) {
  const [views, clones, referrers, paths] = await Promise.all([
    ghRequest(`/repos/${repo}/traffic/views`),
    ghRequest(`/repos/${repo}/traffic/clones`),
    ghRequest(`/repos/${repo}/traffic/popular/referrers`),
    ghRequest(`/repos/${repo}/traffic/popular/paths`),
  ]);
  // 403 = the token lacks push access to this repo. Report it rather than showing zeros,
  // which would read as "nobody visited".
  if (!views.ok && views.status === 403) return { denied: true };
  return {
    views: views.data?.count ?? 0,
    uniques: views.data?.uniques ?? 0,
    clones: clones.data?.count ?? 0,
    cloneUniques: clones.data?.uniques ?? 0,
    daily: views.data?.views || [],
    dailyClones: clones.data?.clones || [],
    referrers: (referrers.data || []).slice(0, 5),
    paths: (paths.data || []).slice(0, 5),
  };
}

// --------------------------------------------------------------------- history

async function loadHistory() {
  try {
    const h = JSON.parse(await readFile(HISTORY, "utf8"));
    return { version: 1, snapshots: [], traffic: {}, ...h };
  } catch {
    return { version: 1, snapshots: [], traffic: {} };
  }
}

// Download totals are cumulative counters, so one dated snapshot per run is enough to
// derive any delta later. Traffic is different: GitHub serves per-day buckets and drops
// them after 14 days, so we merge the buckets by date instead — run at least fortnightly
// and the record is unbroken, however long ago you started.
function updateHistory(history, rows, now) {
  const snapshot = { at: new Date(now).toISOString(), projects: {} };
  for (const r of rows) {
    // Only projects whose fetch succeeded. Recording a failed one would bake a false zero
    // into the history, and every later run would read the recovery as a huge spike.
    if (!r.ok) continue;
    snapshot.projects[r.slug] = {
      ...r.downloads,
      total: r.total,
      stars: r.stars,
      forks: r.forks,
      issues: r.issues,
      prs: r.prs,
    };
    if (!r.traffic || r.traffic.denied) continue;
    const bucket = (history.traffic[r.slug] ||= {});
    for (const d of r.traffic.daily) {
      bucket[dayKey(d.timestamp)] = {
        ...bucket[dayKey(d.timestamp)],
        views: d.count,
        uniques: d.uniques,
      };
    }
    for (const d of r.traffic.dailyClones) {
      bucket[dayKey(d.timestamp)] = {
        ...bucket[dayKey(d.timestamp)],
        clones: d.count,
        cloneUniques: d.uniques,
      };
    }
  }
  // A run that fetched nothing records nothing — an empty snapshot is noise in the trend.
  if (!Object.keys(snapshot.projects).length) return null;
  history.snapshots.push(snapshot);
  // Roughly a year of daily runs; keeps the file small without ever losing recent detail.
  if (history.snapshots.length > 400) history.snapshots = history.snapshots.slice(-400);
  return snapshot;
}

// The snapshot to compare against: the most recent one at least a day old, so running
// twice in an afternoon doesn't flatten every delta to zero. When nothing is that old yet,
// fall back to the *oldest* we have — the widest window available beats a minutes-old one.
// Called before this run's snapshot is appended, so every entry here is a prior run.
function baselineSnapshot(history, now) {
  const prior = history.snapshots;
  if (!prior.length) return null;
  return prior.filter((s) => now - Date.parse(s.at) >= DAY).pop() || prior[0];
}

// ---------------------------------------------------------------- content health

// Checks that need no network — they read projects.json and the screenshots folder.
async function contentHealth(projects) {
  const shotsDir = join(ROOT, "src/assets/img/shots");
  let files = [];
  try {
    files = (await readdir(shotsDir)).filter((f) => !f.endsWith(".md"));
  } catch {
    /* folder missing — reported as zero orphans, not a crash */
  }
  // projects.json stores each `src` relative to assets/img/ (e.g. "shots/oneup-dark.png"),
  // while readdir gives bare filenames — re-add the folder so the two actually compare.
  const used = new Set(projects.flatMap((p) => (p.screenshots || []).map((s) => s.src)));
  const isUsed = (f) => used.has(`shots/${f}`);
  return {
    byStatus: tally(projects, (p) => p.status),
    byCategory: tally(projects, (p) => p.category),
    noRepo: projects.filter((p) => !p.repo).map((p) => p.name),
    noShots: projects.filter((p) => isPublished(p) && !(p.screenshots || []).length).map((p) => p.name),
    missingAlt: projects.flatMap((p) =>
      (p.screenshots || []).filter((s) => !s.alt?.trim()).map((s) => `${p.name} → ${s.src}`)
    ),
    orphanShots: files.filter((f) => !isUsed(f)),
  };
}

function tally(items, keyOf) {
  const out = {};
  for (const it of items) out[keyOf(it) || "—"] = (out[keyOf(it) || "—"] || 0) + 1;
  return out;
}

// ----------------------------------------------------------------- presentation

// Change since the baseline snapshot. Never colour-only: the arrow is a character and the
// number carries its own sign, so it reads correctly in greyscale and to a screen reader.
function delta(now, before) {
  if (before == null || now === before) return `<span class="d d--flat">±0</span>`;
  const diff = now - before;
  const cls = diff > 0 ? "d--up" : "d--down";
  const arrow = diff > 0 ? "▲" : "▼";
  return `<span class="d ${cls}">${arrow} ${diff > 0 ? "+" : "−"}${num(Math.abs(diff))}</span>`;
}

function sparkline(values) {
  if (values.length < 2) return "";
  const w = 64;
  const h = 18;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / span) * (h - 2) - 1;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true"><polyline points="${pts}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>`;
}

function downloadsTable(rows, history, base) {
  const series = (slug) =>
    history.snapshots.map((s) => s.projects[slug]?.total).filter((v) => v != null);

  const body = rows
    .map((r) => {
      // Unfetched project: dashes, never zeros — the reader must be able to tell "nobody
      // downloaded it" from "we couldn't ask".
      if (!r.ok) {
        return `<tr class="row--missing">
          <th scope="row" data-sort="${esc(r.name)}">${esc(r.name)}<span class="repo">${esc(
          r.repo
        )}</span></th>
          <td class="n dim" colspan="6">no data this run</td>
        </tr>`;
      }
      const b = base?.projects[r.slug];
      const cells = OS_KEYS.map(
        (k) =>
          `<td class="n" data-sort="${r.downloads[k]}">${num(r.downloads[k])}<br>${delta(
            r.downloads[k],
            b?.[k]
          )}</td>`
      ).join("");
      // Amber only when something is genuinely unexplained — signatures and source
      // archives land here too and are perfectly normal.
      const other = `<td class="n ${r.unexplained.length ? "warn" : "dim"}" data-sort="${
        r.downloads.other
      }">${num(r.downloads.other)}</td>`;
      return `<tr>
        <th scope="row" data-sort="${esc(r.name)}">${esc(r.name)}<span class="repo">${esc(
        r.repo
      )}</span></th>
        ${cells}${other}
        <td class="n strong" data-sort="${r.total}">${num(r.total)}<br>${delta(
        r.total,
        b?.total
      )}</td>
        <td class="sparkcell">${sparkline(series(r.slug))}</td>
      </tr>`;
    })
    .join("");

  const ok = rows.filter((r) => r.ok);
  const totals = OS_KEYS.map(
    (k) => `<td class="n">${num(ok.reduce((s, r) => s + r.downloads[k], 0))}</td>`
  ).join("");
  const grand = ok.reduce((s, r) => s + r.total, 0);

  return `<table class="tbl sortable">
    <caption>All-time downloads, by operating system. “Other” counts release files that
      aren't an OS download — signatures, checksums, updater metadata, source archives.
      That's normal; it only turns amber when something there is unexplained.</caption>
    <thead><tr><th scope="col">Project</th>${OS_KEYS.map(
      (k) => `<th scope="col" class="n">${OS_LABEL[k]}</th>`
    ).join("")}<th scope="col" class="n">Other</th>
    <th scope="col" class="n" aria-sort="descending">Total</th>
    <th scope="col" class="n" data-nosort>Trend</th></tr></thead>
    <tbody>${body}</tbody>
    <tfoot><tr><th scope="row">All projects</th>${totals}
      <td class="n">${num(ok.reduce((s, r) => s + r.downloads.other, 0))}</td>
      <td class="n strong">${num(grand)}</td><td></td></tr></tfoot>
  </table>`;
}

function trafficSection(rows) {
  if (!hasToken) {
    return `<p class="note">Visitor figures need a GitHub token — see the README section
      printed by <code>npm run stats</code>. Everything else on this page works without one.</p>`;
  }
  const live = rows.filter((r) => r.traffic && !r.traffic.denied);
  if (!live.length) {
    return `<p class="note">Your token can't read traffic for any of these repos. It needs
      the <strong>repo</strong> scope (classic) or <strong>Administration: read</strong>
      (fine-grained), and you must own or have push access to the repo.</p>`;
  }
  const body = live
    .sort((a, b) => b.traffic.views - a.traffic.views)
    .map(
      (r) => `<tr>
        <th scope="row" data-sort="${esc(r.name)}">${esc(r.name)}</th>
        <td class="n" data-sort="${r.traffic.views}">${num(r.traffic.views)}</td>
        <td class="n" data-sort="${r.traffic.uniques}">${num(r.traffic.uniques)}</td>
        <td class="n" data-sort="${r.traffic.clones}">${num(r.traffic.clones)}</td>
        <td class="n" data-sort="${r.traffic.cloneUniques}">${num(r.traffic.cloneUniques)}</td>
        <td class="ref">${
          r.traffic.referrers.length
            ? r.traffic.referrers
                .map((f) => `${esc(f.referrer)} <span class="dim">${num(f.count)}</span>`)
                .join("<br>")
            : "<span class='dim'>—</span>"
        }</td>
      </tr>`
    )
    .join("");
  return `<table class="tbl sortable">
    <caption>Last 14 days, from GitHub. Only you can see these numbers — GitHub deletes
      them after 14 days, but this dashboard keeps its own dated copy in
      <code>.stats/history.json</code>.</caption>
    <thead><tr><th scope="col">Project</th>
      <th scope="col" class="n" aria-sort="descending">Views</th>
      <th scope="col" class="n">Visitors</th><th scope="col" class="n">Clones</th>
      <th scope="col" class="n">Cloners</th>
      <th scope="col" data-nosort>Top referrers</th></tr></thead>
    <tbody>${body}</tbody></table>`;
}

function activityTable(rows, now) {
  const body = rows
    .map((r) => {
      const commitAge = daysSince(r.pushedAt, now);
      const relAge = daysSince(r.latestAt, now);
      const stale = commitAge != null && commitAge >= 90;
      // Unknown ages sort as -1 so "never released" groups together rather than pretending
      // to be brand new (0 days).
      return `<tr>
        <th scope="row" data-sort="${esc(r.name)}">${esc(r.name)}${
        r.archived ? ' <span class="flag">archived</span>' : ""
      }</th>
        <td class="n" data-sort="${r.stars}">${num(r.stars)}</td>
        <td class="n" data-sort="${r.forks}">${num(r.forks)}</td>
        <td class="n" data-sort="${r.watchers}">${num(r.watchers)}</td>
        <td class="n" data-sort="${r.issues}">${num(r.issues)}</td>
        <td class="n" data-sort="${r.prs}">${num(r.prs)}</td>
        <td class="n" data-sort="${esc(r.latestTag || "")}">${
        r.latestTag ? esc(r.latestTag) : '<span class="dim">none</span>'
      }</td>
        <td class="n" data-sort="${relAge ?? -1}">${
        relAge == null ? '<span class="dim">—</span>' : `${relAge}d`
      }</td>
        <td class="n${stale ? " warn" : ""}" data-sort="${commitAge ?? -1}">${
        commitAge == null ? '<span class="dim">—</span>' : `${commitAge}d${stale ? " ⚠" : ""}`
      }</td>
      </tr>`;
    })
    .join("");
  return `<table class="tbl sortable">
    <caption>Audience and activity. A ⚠ marks 90+ days without a commit.</caption>
    <thead><tr><th scope="col">Project</th><th scope="col" class="n">Stars</th>
      <th scope="col" class="n">Forks</th><th scope="col" class="n">Watching</th>
      <th scope="col" class="n">Issues</th><th scope="col" class="n">PRs</th>
      <th scope="col" class="n">Latest</th><th scope="col" class="n">Rel. age</th>
      <th scope="col" class="n">Last commit</th></tr></thead>
    <tbody>${body}</tbody></table>`;
}

function issuesSection(rows, health) {
  const items = [];
  for (const r of rows.filter((x) => x.missingAssets.length)) {
    items.push(
      `<strong>${esc(r.name)}</strong> claims ${r.missingAssets
        .map((p) => OS_LABEL[p])
        .join(", ")} but its latest release has no matching file — those download buttons
       fall back to the repo page.`
    );
  }
  for (const r of rows.filter((x) => x.unexplained.length)) {
    items.push(
      `<strong>${esc(r.name)}</strong> ships release files that are neither an OS download
       nor a signature/checksum/source archive, so nobody can get them from the site:
       ${r.unexplained.map(([n, c]) => `${esc(n)} (${num(c)})`).join(", ")}.`
    );
  }
  if (health.missingAlt.length) {
    items.push(
      `<strong>Missing alt text</strong> on ${health.missingAlt.length} screenshot(s):
       ${health.missingAlt.map(esc).join("; ")}.`
    );
  }
  if (health.noShots.length) {
    items.push(`<strong>No screenshots:</strong> ${health.noShots.map(esc).join(", ")}.`);
  }
  if (health.orphanShots.length) {
    items.push(
      `<strong>Unused image files</strong> in <code>src/assets/img/shots/</code>:
       ${health.orphanShots.map(esc).join(", ")}.`
    );
  }
  if (!items.length) return `<p class="note ok">Nothing needs attention. ✓</p>`;
  return `<ul class="issues">${items.map((i) => `<li>${i}</li>`).join("")}</ul>`;
}

function tallyList(obj) {
  return Object.entries(obj)
    .map(([k, v]) => `<span class="chip">${esc(k)} <strong>${v}</strong></span>`)
    .join("");
}

function page({ rows, history, base, health, projects, now, elapsed }) {
  const ok = rows.filter((r) => r.ok);
  const grand = ok.reduce((s, r) => s + r.total, 0);
  const stars = ok.reduce((s, r) => s + r.stars, 0);
  const views = ok.reduce((s, r) => s + (r.traffic?.views || 0), 0);
  // Say "earlier today" rather than rounding a 40-minute-old baseline up to "1 day ago".
  const baseGap = base ? now - Date.parse(base.at) : null;
  const baseAge =
    baseGap == null ? null : baseGap < DAY ? "earlier today" : `${Math.round(baseGap / DAY)} day(s) ago`;
  const tiles = [
    ["Total downloads", num(grand), base ? delta(grand, sumOf(base, "total")) : ""],
    ["Stars", num(stars), base ? delta(stars, sumOf(base, "stars")) : ""],
    ["Repo views (14d)", hasToken ? num(views) : "—", ""],
    ["Projects", String(projects.length), `${health.byStatus.live || 0} live`],
  ]
    .map(
      ([label, value, sub]) =>
        `<div class="tile"><span class="tile__label">${label}</span>
         <span class="tile__value">${value}</span><span class="tile__sub">${sub}</span></div>`
    )
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Ants Projects Hub — private stats</title>
<link rel="stylesheet" href="site.css">
<link rel="stylesheet" href="dashboard.css">
<script src="dashboard.js" defer></script>
</head>
<body class="admin">
<main class="wrap">
  <header class="head">
    <h1>Private stats</h1>
    <p class="sub">Last updated
      <span id="updated" data-at="${new Date(now).toISOString()}">${new Date(now).toLocaleString(
    "en-GB"
  )}</span> · took ${elapsed}s ·
      ${AUTH_LABEL[tokenSource]} ·
      ${history.snapshots.length} snapshot(s) recorded${
        baseAge ? ` · change shown vs ${baseAge}` : " · change appears from the second run"
      }</p>
    <p class="sub">Click a column heading to sort by it; click it again to reverse.</p>
    <p class="refresh-row"><button type="button" id="refresh" class="btn-refresh" hidden>
      Refresh now</button><span id="refresh-msg" class="refresh-msg" role="status"></span></p>
  </header>

  ${gapBanner(history, now)}
  ${incompleteBanner(rows)}

  <section aria-labelledby="h-sum"><h2 id="h-sum" class="sr-only">Summary</h2>
    <div class="tiles">${tiles}</div></section>

  <section aria-labelledby="h-att"><h2 id="h-att">Needs attention</h2>
    ${issuesSection(ok, health)}</section>

  <section aria-labelledby="h-dl"><h2 id="h-dl">Downloads per OS</h2>
    ${downloadsTable(rows, history, base)}</section>

  <section aria-labelledby="h-tr"><h2 id="h-tr">Repo traffic</h2>
    ${trafficSection(ok)}</section>

  <section aria-labelledby="h-act"><h2 id="h-act">Audience &amp; activity</h2>
    ${activityTable(ok, now)}</section>

  <section aria-labelledby="h-rel"><h2 id="h-rel">Recent releases</h2>
    ${releasesTable(ok)}</section>

  <section aria-labelledby="h-cnt"><h2 id="h-cnt">Site content</h2>
    <p class="chips">${tallyList(health.byStatus)}</p>
    <p class="chips">${tallyList(health.byCategory)}</p>
    ${
      health.noRepo.length
        ? `<p class="note">Unpublished (no repo yet): ${health.noRepo.map(esc).join(", ")}.</p>`
        : ""
    }
  </section>

  <footer class="foot">Local file — never published. Regenerate with
    <code>npm run stats</code>.</footer>
</main>
</body>
</html>
`;
}

// GitHub serves only the last 14 days of traffic, so a gap longer than that loses those
// days for good — the machine was off, or nobody ran it. Say so plainly rather than let a
// hole appear silently in the history.
function gapBanner(history, now) {
  const prior = history.snapshots.slice(0, -1);
  if (!prior.length) return "";
  const gapDays = Math.floor((now - Date.parse(prior[prior.length - 1].at)) / DAY);
  if (gapDays <= 14) return "";
  return `<p class="note banner"><strong>${gapDays} days since the last run.</strong>
    Download totals are unaffected — they're cumulative. But GitHub only keeps 14 days of
    visitor data, so roughly ${gapDays - 14} day(s) of views and clones are gone for good.
    Running at least once a fortnight avoids this.</p>`;
}

// A partial run must say so on the page itself. Totals below exclude these projects, so
// without this banner the figures would silently read low and the reader would never know.
function incompleteBanner(rows) {
  const failed = rows.filter((r) => !r.ok);
  if (!failed.length) return "";
  const limited = failed.some((r) => r.rateLimited);
  const why = limited
    ? hasToken
      ? "GitHub's hourly request limit was reached."
      : "GitHub's 60-requests-per-hour limit for unauthenticated use was reached — set a GITHUB_TOKEN to raise it to 5,000."
    : "GitHub didn't answer for these repos.";
  return `<p class="note banner"><strong>Incomplete run.</strong> ${why}
    Missing: ${failed.map((r) => esc(r.name)).join(", ")}. Their figures are shown as
    “no data” and were <em>not</em> saved to history, so your trends stay accurate.</p>`;
}

function sumOf(snapshot, key) {
  return Object.values(snapshot.projects).reduce((s, p) => s + (p[key] || 0), 0);
}

function releasesTable(rows) {
  const body = rows
    .filter((r) => r.perRelease.length)
    .map((r) => {
      const recent = r.perRelease
        .slice(0, 5)
        .map(
          (x) =>
            `<li>${esc(x.tag)}${x.prerelease ? ' <span class="flag">pre</span>' : ""}
             <span class="dim">${x.at ? x.at.slice(0, 10) : "—"}</span>
             <strong>${num(x.total)}</strong></li>`
        )
        .join("");
      return `<tr><th scope="row" data-sort="${esc(r.name)}">${esc(r.name)}<span class="repo">${num(
        r.releaseCount
      )} releases</span></th><td><ul class="rels">${recent}</ul></td></tr>`;
    })
    .join("");
  if (!body) return `<p class="note">No releases published yet.</p>`;
  // Sortable by project only — the second column is a per-project list, not a value.
  return `<table class="tbl tbl--rel sortable"><caption>Downloads by version — the five most
    recent releases of each project.</caption><thead><tr><th scope="col">Project</th>
    <th scope="col" data-nosort>Version · date · downloads</th></tr></thead>
    <tbody>${body}</tbody></table>`;
}

// ---------------------------------------------------------------------- the JS

// Click-to-sort, as progressive enhancement: every table already ships sorted by its most
// useful column, so the page is complete without this running. Sort keys come from
// data-sort attributes written at generation time — parsing them back out of the rendered
// text would break on thousands separators ("1,146"), units ("84d") and the delta line
// under each number ("14 ▲ +5").
const JS = `(function () {
  // Numeric when the key parses as a number, otherwise a case-insensitive text compare.
  function key(cell) {
    var raw = cell && cell.dataset ? cell.dataset.sort : undefined;
    if (raw === undefined) return { n: null, s: "" };
    var n = raw === "" ? NaN : Number(raw);
    return isNaN(n) ? { n: null, s: raw.toLowerCase() } : { n: n, s: "" };
  }

  function sort(table, index, dir) {
    var body = table.tBodies[0];
    var rows = Array.prototype.slice.call(body.rows);
    // A row without that column ("no data this run" spans the rest) always sinks, whichever
    // direction is active — it has no value to rank.
    var has = function (r) { return r.cells.length > index; };
    rows.sort(function (a, b) {
      if (has(a) !== has(b)) return has(a) ? -1 : 1;
      if (!has(a)) return 0;
      var x = key(a.cells[index]), y = key(b.cells[index]);
      var c = x.n !== null && y.n !== null ? x.n - y.n : x.s.localeCompare(y.s);
      return c * dir;
    });
    rows.forEach(function (r) { body.appendChild(r); });
  }

  // "Last updated" as a live relative age, recomputed while the page sits open. A dashboard
  // left on a second monitor for two days must not keep implying its numbers are current;
  // past 36 hours it turns amber, which in practice means the background service has died.
  var updated = document.getElementById("updated");
  if (updated && updated.dataset.at) {
    var at = new Date(updated.dataset.at).getTime();
    var absolute = updated.textContent;
    var plural = function (n, unit) { return n + " " + unit + (n === 1 ? "" : "s") + " ago"; };
    var tick = function () {
      var mins = Math.floor((Date.now() - at) / 60000);
      var rel =
        mins < 1 ? "just now"
        : mins < 60 ? plural(mins, "minute")
        : mins < 1440 ? plural(Math.floor(mins / 60), "hour")
        : plural(Math.floor(mins / 1440), "day");
      updated.textContent = absolute + " — " + rel;
      updated.className = mins > 36 * 60 ? "stale" : "";
    };
    tick();
    setInterval(tick, 30000);
  }

  // Refresh button. Only works when serve.mjs is serving the page — a page opened straight
  // from disk has nothing to ask, so it stays hidden there rather than offering a control
  // that would silently do nothing.
  var refresh = document.getElementById("refresh");
  var msg = document.getElementById("refresh-msg");
  if (refresh && location.protocol !== "file:") {
    refresh.hidden = false;
    refresh.addEventListener("click", function () {
      refresh.disabled = true;
      msg.textContent = "Fetching from GitHub — about 12 seconds…";
      fetch("refresh", { method: "POST" })
        .then(function (r) {
          if (!r.ok) throw new Error("server said " + r.status);
          return r.json();
        })
        .then(function () { location.reload(); })
        .catch(function (e) {
          refresh.disabled = false;
          msg.textContent = "Refresh failed — " + e.message;
        });
    });
  }

  Array.prototype.forEach.call(document.querySelectorAll("table.sortable"), function (table) {
    var heads = Array.prototype.slice.call(table.tHead.rows[0].cells);
    heads.forEach(function (th, i) {
      if (th.hasAttribute("data-nosort")) return;
      // Wrap the label in a real <button> so it is keyboard-reachable and announced as a
      // control; aria-sort then tells a screen reader the current direction.
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "sort-btn";
      btn.textContent = th.textContent.trim();
      th.textContent = "";
      th.appendChild(btn);
      btn.addEventListener("click", function () {
        var asc = th.getAttribute("aria-sort") !== "ascending";
        heads.forEach(function (h) { h.removeAttribute("aria-sort"); });
        th.setAttribute("aria-sort", asc ? "ascending" : "descending");
        sort(table, i, asc ? 1 : -1);
      });
    });
  });
})();
`;

// --------------------------------------------------------------------- the CSS

const CSS = `/* Private dashboard — layers on the site's tokens (already WCAG AA on --bg). */
body.admin { background: var(--bg); color: var(--text); font-family: var(--font); }
.wrap { max-width: 1180px; margin: 0 auto; padding: 28px 20px 60px; }
.head h1 { margin: 0 0 4px; font-size: 1.6rem; }
.sub { color: var(--text-muted); margin: 0 0 6px; font-size: .85rem; }
.refresh-row { display: flex; align-items: center; gap: 12px; margin: 14px 0 26px; }
.btn-refresh { font: inherit; font-size: .85rem; color: var(--bg); background: var(--teal);
  border: 0; border-radius: 999px; padding: 7px 16px; cursor: pointer; font-weight: 600; }
.btn-refresh:hover { filter: brightness(1.1); }
.btn-refresh:focus-visible { outline: 2px solid var(--text); outline-offset: 2px; }
.btn-refresh[disabled] { opacity: .55; cursor: progress; }
.refresh-msg { color: var(--text-muted); font-size: .82rem; }
#updated { color: var(--text); font-weight: 600; }
/* Amber plus the word "ago" carries the meaning — never colour alone. */
#updated.stale { color: var(--amber); }
h2 { font-size: 1.05rem; margin: 34px 0 12px; color: var(--teal); }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }

.tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: var(--gap); }
.tile { background: var(--surface); border: 1px solid var(--surface-border);
  border-radius: var(--radius); padding: 14px 16px; display: flex; flex-direction: column; gap: 2px; }
.tile__label { font-size: .75rem; color: var(--text-dim); text-transform: uppercase; letter-spacing: .06em; }
.tile__value { font-size: 1.7rem; font-weight: 700; line-height: 1.1; }
.tile__sub { font-size: .8rem; color: var(--text-muted); min-height: 1.2em; }

.tbl { width: 100%; border-collapse: collapse; font-size: .88rem;
  background: var(--surface); border: 1px solid var(--surface-border); border-radius: var(--radius); }
.tbl caption { caption-side: top; text-align: left; color: var(--text-muted);
  font-size: .8rem; padding: 0 0 8px; }
.tbl th, .tbl td { padding: 9px 12px; border-bottom: 1px solid var(--surface-border); text-align: left; }
.tbl thead th { color: var(--text-dim); font-size: .74rem; text-transform: uppercase;
  letter-spacing: .05em; font-weight: 600; }
/* The sort control fills the header cell so the whole header is the click target. */
.tbl thead th:has(.sort-btn) { padding: 0; }
.sort-btn { font: inherit; color: inherit; letter-spacing: inherit; text-transform: inherit;
  background: none; border: 0; padding: 9px 12px; width: 100%; text-align: inherit;
  cursor: pointer; }
.sort-btn:hover { color: var(--text); }
.sort-btn:focus-visible { outline: 2px solid var(--teal); outline-offset: -2px; }
/* Direction is a character, not a colour — readable in greyscale and to a screen reader
   (the th also carries aria-sort). */
th[aria-sort] .sort-btn { color: var(--teal); }
th[aria-sort="ascending"] .sort-btn::after { content: " ▲"; }
th[aria-sort="descending"] .sort-btn::after { content: " ▼"; }
.tbl tbody th { font-weight: 600; }
.tbl tfoot th, .tbl tfoot td { border-bottom: 0; font-weight: 700; }
.tbl tbody tr:hover { background: rgba(255,255,255,.03); }
.n { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
.strong { font-weight: 700; }
.dim { color: var(--text-dim); }
.warn { color: var(--amber); }
.repo { display: block; font-weight: 400; font-size: .74rem; color: var(--text-dim); }

.d { font-size: .74rem; white-space: nowrap; }
.d--up { color: var(--teal); }
.d--down { color: var(--rose); }
.d--flat { color: var(--text-dim); }
.spark { color: var(--violet); display: block; }
.sparkcell { width: 72px; }

.issues { margin: 0; padding-left: 20px; display: grid; gap: 8px; }
.issues li { color: var(--text-muted); font-size: .88rem; line-height: 1.5; }
.issues strong { color: var(--text); }
.note { background: var(--surface); border: 1px solid var(--surface-border);
  border-radius: var(--radius); padding: 12px 14px; color: var(--text-muted); font-size: .88rem; margin: 0; }
.note.ok { color: var(--teal); }
.banner { border-color: var(--amber); color: var(--text); margin-bottom: 18px; }
.banner strong { color: var(--amber); }
.row--missing th { opacity: .75; }
.flag { font-size: .68rem; color: var(--amber); border: 1px solid var(--amber);
  border-radius: 6px; padding: 0 5px; vertical-align: middle; }
.chips { display: flex; flex-wrap: wrap; gap: 8px; margin: 0 0 10px; }
.chip { background: var(--surface); border: 1px solid var(--surface-border);
  border-radius: 999px; padding: 4px 11px; font-size: .8rem; color: var(--text-muted); }
.chip strong { color: var(--text); }
.rels { list-style: none; margin: 0; padding: 0; display: grid; gap: 3px; font-size: .84rem; }
.ref { font-size: .8rem; color: var(--text-muted); }
.foot { margin-top: 40px; color: var(--text-dim); font-size: .8rem; }
code { background: rgba(255,255,255,.07); padding: 1px 5px; border-radius: 5px; font-size: .85em; }
@media (max-width: 720px) { .tbl { font-size: .8rem; } .tbl th, .tbl td { padding: 7px 8px; } }
`;

// ------------------------------------------------------------------------ main

// Fetch everything, update history, write the page. Exported so serve.mjs can call it on a
// schedule and on demand without shelling out to a second Node process.
export async function generate() {
  const started = Date.now();
  const { projects } = JSON.parse(await readFile(join(ROOT, "src/projects.json"), "utf8"));
  const published = projects.filter(isPublished);

  if (!hasToken) {
    console.warn(
      "! Not authenticated — traffic stats skipped and GitHub allows only 60 calls/hour.\n" +
        "  Easiest fix: run `gh auth login` (this picks the CLI's login up automatically).\n" +
        "  Or set a token: export GITHUB_TOKEN=<token with public_repo scope>"
    );
  }

  // One project's failure must never abort the run — same discipline as the site build.
  const rows = [];
  for (const p of published) {
    try {
      rows.push(await collectProject(p));
    } catch (err) {
      console.warn(`! ${p.slug}: stats fetch failed (${err.message}) — skipped`);
    }
  }
  rows.sort((a, b) => b.total - a.total);

  const now = Date.now();
  const history = await loadHistory();
  const base = baselineSnapshot(history, now);
  updateHistory(history, rows, now);
  const health = await contentHealth(projects);

  await mkdir(OUT, { recursive: true });
  await writeFile(HISTORY, JSON.stringify(history, null, 2));
  // Copy the site stylesheet in rather than linking ../src/assets/style.css: a relative
  // path out of .stats/ resolves when the file is opened from disk but 404s when serve.mjs
  // serves the folder, which silently drops every colour and font to browser defaults.
  // Copying keeps .stats/ self-contained and identical either way.
  await copyFile(join(ROOT, "src/assets/style.css"), join(OUT, "site.css"));
  await writeFile(join(OUT, "dashboard.css"), CSS);
  await writeFile(join(OUT, "dashboard.js"), JS);
  const elapsed = ((Date.now() - started) / 1000).toFixed(1);
  await writeFile(PAGE, page({ rows, history, base, health, projects, now, elapsed }));

  const failed = rows.filter((r) => !r.ok);
  console.log(
    `Stats for ${rows.length - failed.length}/${published.length} projects → ${PAGE}\n` +
      `${history.snapshots.length} snapshot(s) on file${base ? "" : " — change appears on the next run"}`
  );
  if (failed.length) {
    console.warn(
      `! No data for: ${failed.map((r) => r.slug).join(", ")}` +
        (failed.some((r) => r.rateLimited) ? " (GitHub rate limit)" : "") +
        " — excluded from the page totals and not written to history."
    );
  }

  return { page: PAGE, ok: rows.length - failed.length, total: published.length, failed };
}

// CLI entry — skipped when serve.mjs imports this module.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  generate()
    .then(({ page: p }) => {
      if (process.argv.includes("--open")) {
        spawn("xdg-open", [p], { detached: true, stdio: "ignore" }).unref();
      }
    })
    .catch((err) => {
      console.error("Stats failed:", err);
      process.exit(1);
    });
}
