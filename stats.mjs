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
// Set GITHUB_TOKEN first. Unauthenticated GitHub allows 60 calls/hour, which is under what
// a full run needs, and the traffic figures (views/clones/referrers) are owner-only — they
// return 403 without a token. Without one the run still works, minus traffic.

import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { spawn } from "node:child_process";
import { esc } from "./lib/templates.mjs";
import {
  ghRequest,
  assetPlatform,
  pickAsset,
  pickLatestRelease,
  hasToken,
} from "./lib/github.mjs";

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT = join(ROOT, ".stats");
const HISTORY = join(OUT, "history.json");
const PAGE = join(OUT, "dashboard.html");

const OS_KEYS = ["win", "mac", "linux"];
const OS_LABEL = { win: "Windows", mac: "macOS", linux: "Linux" };
const DAY = 86400000;

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
  for (const r of releases) {
    const row = { tag: r.tag_name, at: r.published_at, prerelease: r.prerelease, total: 0 };
    for (const a of Array.isArray(r.assets) ? r.assets : []) {
      const n = a.download_count || 0;
      downloads[assetPlatform(a.name) || "other"] += n;
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
// twice in a row doesn't reset every delta to zero. Falls back to the oldest we have.
function baselineSnapshot(history, now) {
  const prior = history.snapshots.slice(0, -1);
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
          <th scope="row">${esc(r.name)}<span class="repo">${esc(r.repo)}</span></th>
          <td class="n dim" colspan="6">no data this run</td>
        </tr>`;
      }
      const b = base?.projects[r.slug];
      const cells = OS_KEYS.map(
        (k) => `<td class="n">${num(r.downloads[k])}<br>${delta(r.downloads[k], b?.[k])}</td>`
      ).join("");
      const other = r.downloads.other
        ? `<td class="n warn">${num(r.downloads.other)}</td>`
        : `<td class="n dim">0</td>`;
      return `<tr>
        <th scope="row">${esc(r.name)}<span class="repo">${esc(r.repo)}</span></th>
        ${cells}${other}
        <td class="n strong">${num(r.total)}<br>${delta(r.total, b?.total)}</td>
        <td class="sparkcell">${sparkline(series(r.slug))}</td>
      </tr>`;
    })
    .join("");

  const ok = rows.filter((r) => r.ok);
  const totals = OS_KEYS.map(
    (k) => `<td class="n">${num(ok.reduce((s, r) => s + r.downloads[k], 0))}</td>`
  ).join("");
  const grand = ok.reduce((s, r) => s + r.total, 0);

  return `<table class="tbl">
    <caption>All-time downloads, by operating system. “Unmatched” are release files that
      fit no OS pattern — the site can't offer them as a download button.</caption>
    <thead><tr><th scope="col">Project</th>${OS_KEYS.map(
      (k) => `<th scope="col" class="n">${OS_LABEL[k]}</th>`
    ).join("")}<th scope="col" class="n">Unmatched</th><th scope="col" class="n">Total</th>
    <th scope="col" class="n">Trend</th></tr></thead>
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
        <th scope="row">${esc(r.name)}</th>
        <td class="n">${num(r.traffic.views)}</td>
        <td class="n">${num(r.traffic.uniques)}</td>
        <td class="n">${num(r.traffic.clones)}</td>
        <td class="n">${num(r.traffic.cloneUniques)}</td>
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
  return `<table class="tbl">
    <caption>Last 14 days, from GitHub. Only you can see these numbers — GitHub deletes
      them after 14 days, but this dashboard keeps its own dated copy in
      <code>.stats/history.json</code>.</caption>
    <thead><tr><th scope="col">Project</th><th scope="col" class="n">Views</th>
      <th scope="col" class="n">Visitors</th><th scope="col" class="n">Clones</th>
      <th scope="col" class="n">Cloners</th><th scope="col">Top referrers</th></tr></thead>
    <tbody>${body}</tbody></table>`;
}

function activityTable(rows, now) {
  const body = rows
    .map((r) => {
      const commitAge = daysSince(r.pushedAt, now);
      const relAge = daysSince(r.latestAt, now);
      const stale = commitAge != null && commitAge >= 90;
      return `<tr>
        <th scope="row">${esc(r.name)}${r.archived ? ' <span class="flag">archived</span>' : ""}</th>
        <td class="n">${num(r.stars)}</td>
        <td class="n">${num(r.forks)}</td>
        <td class="n">${num(r.watchers)}</td>
        <td class="n">${num(r.issues)}</td>
        <td class="n">${num(r.prs)}</td>
        <td class="n">${r.latestTag ? esc(r.latestTag) : '<span class="dim">none</span>'}</td>
        <td class="n">${relAge == null ? '<span class="dim">—</span>' : `${relAge}d`}</td>
        <td class="n${stale ? " warn" : ""}">${
          commitAge == null ? '<span class="dim">—</span>' : `${commitAge}d${stale ? " ⚠" : ""}`
        }</td>
      </tr>`;
    })
    .join("");
  return `<table class="tbl">
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
  for (const r of rows.filter((x) => x.downloads.other > 0)) {
    items.push(
      `<strong>${esc(r.name)}</strong> has ${num(r.downloads.other)} downloads of files the
       OS matcher doesn't recognise — check the release asset filenames.`
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
  const baseAge = base ? Math.max(1, Math.round((now - Date.parse(base.at)) / DAY)) : null;
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
<link rel="stylesheet" href="../src/assets/style.css">
<link rel="stylesheet" href="dashboard.css">
</head>
<body class="admin">
<main class="wrap">
  <header class="head">
    <h1>Private stats</h1>
    <p class="sub">Generated ${new Date(now).toLocaleString("en-GB")} · ${elapsed}s ·
      ${hasToken ? "authenticated" : "unauthenticated (limited)"} ·
      ${history.snapshots.length} snapshot(s) recorded${
        baseAge ? ` · change shown vs ${baseAge} day(s) ago` : " · deltas appear from the second run"
      }</p>
  </header>

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
      return `<tr><th scope="row">${esc(r.name)}<span class="repo">${num(
        r.releaseCount
      )} releases</span></th><td><ul class="rels">${recent}</ul></td></tr>`;
    })
    .join("");
  if (!body) return `<p class="note">No releases published yet.</p>`;
  return `<table class="tbl tbl--rel"><caption>Downloads by version — the five most recent
    releases of each project.</caption><thead><tr><th scope="col">Project</th>
    <th scope="col">Version · date · downloads</th></tr></thead><tbody>${body}</tbody></table>`;
}

// --------------------------------------------------------------------- the CSS

const CSS = `/* Private dashboard — layers on the site's tokens (already WCAG AA on --bg). */
body.admin { background: var(--bg); color: var(--text); font-family: var(--font); }
.wrap { max-width: 1180px; margin: 0 auto; padding: 28px 20px 60px; }
.head h1 { margin: 0 0 4px; font-size: 1.6rem; }
.sub { color: var(--text-muted); margin: 0 0 26px; font-size: .85rem; }
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

async function main() {
  const started = Date.now();
  const { projects } = JSON.parse(await readFile(join(ROOT, "src/projects.json"), "utf8"));
  const published = projects.filter(isPublished);

  if (!hasToken) {
    console.warn(
      "! No GITHUB_TOKEN — traffic stats skipped and GitHub allows only 60 calls/hour.\n" +
        "  Create one at https://github.com/settings/tokens (classic, scope: repo), then:\n" +
        "    export GITHUB_TOKEN=ghp_xxx && npm run stats"
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
  await writeFile(join(OUT, "dashboard.css"), CSS);
  const elapsed = ((Date.now() - started) / 1000).toFixed(1);
  await writeFile(PAGE, page({ rows, history, base, health, projects, now, elapsed }));

  const failed = rows.filter((r) => !r.ok);
  console.log(
    `Stats for ${rows.length - failed.length}/${published.length} projects → ${PAGE}\n` +
      `${history.snapshots.length} snapshot(s) on file${base ? "" : " — deltas appear on the next run"}`
  );
  if (failed.length) {
    console.warn(
      `! No data for: ${failed.map((r) => r.slug).join(", ")}` +
        (failed.some((r) => r.rateLimited) ? " (GitHub rate limit)" : "") +
        " — excluded from the page totals and not written to history."
    );
  }

  if (process.argv.includes("--open")) {
    spawn("xdg-open", [PAGE], { detached: true, stdio: "ignore" }).unref();
  }
}

main().catch((err) => {
  console.error("Stats failed:", err);
  process.exit(1);
});
