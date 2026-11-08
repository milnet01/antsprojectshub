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
import { homedir } from "node:os";
import { spawn } from "node:child_process";
import { esc, ORIGIN } from "./lib/templates.mjs";
import { collectAnalytics, collectDownloadClicks, collectPostViews, gaError } from "./lib/ga.mjs";
import { loadPosts } from "./lib/posts.mjs";
import { openStore, closeStore, loadHistory, saveRun, readTrends, backup } from "./lib/store.mjs";
import {
  ghRequest,
  assetPlatform,
  pickAsset,
  pickLatestRelease,
  isCompanionFile,
  hasToken,
  tokenSource,
  resolveAuth,
} from "./lib/github.mjs";

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT = join(ROOT, ".stats");
// The pre-database history file: imported once by lib/store.mjs, then never written again.
const HISTORY = join(OUT, "history.json");
const PAGE = join(OUT, "dashboard.html");
// Written by scripts/weekly-post.sh at the end of every real run; read, never written, here.
const WEEKLY = join(OUT, "weekly-post.json");
// Written by Ants Terminal's roadmap backup jobs (tools/roadmap-backup-lib.sh there), one
// key=value file per job; read, never written, here. "export" commits the roadmaps into the
// claude-config repo (~/.claude) and pushes it; "snapshot" copies the store to a local disk.
const BACKUP_DIR = join(process.env.XDG_STATE_HOME || join(homedir(), ".local", "state"), "ants-terminal");
const BACKUP_JOBS = [
  { job: "export", label: "Roadmap backup to claude-config", unit: "ants-roadmap-export" },
  { job: "snapshot", label: "Roadmap store snapshot", unit: "ants-roadmap-backup" },
];

const OS_KEYS = ["win", "mac", "linux"];
const OS_LABEL = { win: "Windows", mac: "macOS", linux: "Linux" };
const DAY = 86400000;
// Both backup jobs run daily, a day late at worst when the PC was off; past this, a job
// that last succeeded has stopped running.
const BACKUP_STALE = 2 * DAY;

// The sticky nav, whose links become tabs, and the accent each section wears. [key, heading
// id, nav label] — the key ties a nav link to its section so CSS can give both the same
// --accent (see the CSS block), and dashboard.js can show that section as the link's tab.
// Order is the page order.
const NAV = [
  ["ov", "h-ov", "Overview"],
  ["proj", "h-proj", "Projects"],
  ["att", "h-att", "Notifications"],
  ["dl", "h-dl", "Downloads"],
  ["ga", "h-ga", "Visitors"],
  ["tr", "h-tr", "Repo traffic"],
  ["act", "h-act", "Audience"],
  ["rel", "h-rel", "Releases"],
  ["trend", "h-trend", "Trends"],
];

// Release files that legitimately aren't OS downloads, so listing them as "a missing
// download button" would nag about files the site is right to exclude. Two groups: the
// companion files the matcher itself skips (signatures, checksums, SBOMs — shared with
// build.mjs via lib/github.mjs so the two can't disagree), plus plain source archives. A
// source archive is only ever seen here after failing OS matching, i.e. it has no OS hint
// in its name — a `*-Windows.zip` is a real download and never reaches this test.
const SOURCE_PAT = /\.(tar\.(gz|xz|bz2)|tgz|zip)$/i;
const isExpectedNonDownload = (name) => isCompanionFile(name) || SOURCE_PAT.test(name);

const AUTH_LABEL = {
  env: "authenticated (GITHUB_TOKEN)",
  gh: "authenticated (gh CLI login)",
  none: "not authenticated — limited",
};

const num = (n) => (n ?? 0).toLocaleString("en-GB");
// A two-letter country code as its flag emoji (regional indicator letters). Decorative —
// the country's name follows it — so hidden from screen readers. GA's "(not set)" and
// anything else that is not a code gets no flag.
const flag = (code) =>
  /^[A-Z]{2}$/.test(code || "")
    ? `<span class="country-flag" aria-hidden="true">${String.fromCodePoint(
        ...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)
      )}</span>`
    : "";
const isPublished = (p) => Boolean(p.repo) && p.status !== "soon";
const daysSince = (iso, now) => (iso ? Math.floor((now - Date.parse(iso)) / DAY) : null);
const dayKey = (ts) => new Date(ts).toISOString().slice(0, 10);

// ------------------------------------------------------------------ collection

// This site's own repo, shaped like a projects.json entry so collectProject can read it.
const SITE_REPO = { slug: "site", name: "This website", repo: "milnet01/antsprojectshub" };

// Every repo the account owns that projects.json does not name — this site's own, private
// ones, test repos — so their issues and pull requests reach Notifications too. Asked of
// GitHub each run, so a new repo is covered without editing anything. Private repos need a
// token with `repo` scope; the gh CLI's login has it, a `public_repo` token sees none of
// them. Archived repos are skipped: they take no new issues or pull requests. If the list
// cannot be read, the site's own repo is still checked.
async function unlistedRepos(projects) {
  const listed = new Set(projects.filter((p) => p.repo).map((p) => p.repo.toLowerCase()));
  const repos = [];
  for (let page = 1; ; page++) {
    const res = await ghRequest(`/user/repos?affiliation=owner&per_page=100&page=${page}`);
    if (!res.ok || !Array.isArray(res.data)) {
      console.warn(`! Could not list your other repos (HTTP ${res.status}) — checking only this site's`);
      return [SITE_REPO];
    }
    repos.push(...res.data);
    if (res.data.length < 100) break;
  }
  return repos
    .filter((r) => !r.archived && !listed.has(r.full_name.toLowerCase()))
    .map((r) =>
      r.full_name.toLowerCase() === SITE_REPO.repo
        ? SITE_REPO
        : { slug: `repo-${r.name.toLowerCase()}`, name: r.name, repo: r.full_name }
    );
}

// Everything we need about one project, in as few API calls as possible. Traffic is
// skipped without a token: it would 403 anyway, and skipping keeps an unauthenticated run
// inside the 60/hour ceiling so the rest of the dashboard still fills in.
async function collectProject(p) {
  const base = { slug: p.slug, name: p.name, repo: p.repo, project: p };
  // A fork's own pull requests are the ones sent to the project it came from, so ask that
  // repo for the open ones this account wrote. Search, not the pulls list: a big upstream
  // has more open pull requests than one page holds.
  const owner = p.repo.split("/")[0];
  const [repoRes, relRes, openRes, upRes] = await Promise.all([
    ghRequest(`/repos/${p.repo}`),
    ghRequest(`/repos/${p.repo}/releases?per_page=100`),
    // GitHub's issues list holds pull requests too; they are split apart below.
    ghRequest(`/repos/${p.repo}/issues?state=open&per_page=100`),
    p.upstream
      ? ghRequest(`/search/issues?q=is:pr+is:open+author:${owner}+repo:${p.upstream}&per_page=100`)
      : null,
  ]);

  // Did the numbers actually arrive? A rate-limited or failed fetch must never be treated
  // as "zero downloads" — it would understate the page and, worse, write a bogus zero into
  // the permanent history, poisoning every future delta.
  base.ok = relRes.ok;
  base.rateLimited = [repoRes, relRes].some((r) => r.status === 403 && r.remaining === 0);

  const repo = repoRes.data || {};
  const releases = (Array.isArray(relRes.data) ? relRes.data : []).filter((r) => !r.draft);
  const latest = pickLatestRelease(releases);
  const pr = (x) => ({ n: x.number, title: x.title, url: x.html_url });
  const open = Array.isArray(openRes.data) ? openRes.data : [];
  const prList = open.filter((x) => x.pull_request).map(pr);
  const issueList = open.filter((x) => !x.pull_request).map(pr);
  const openPrs = prList.length;
  // null when the search failed, so a failure is never read as "none open".
  const upstreamPrs = !upRes
    ? []
    : upRes.ok
      ? (upRes.data.items || []).map(pr)
      : null;

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
  // Total means "people downloaded my software", so it counts the three OS columns only.
  // `other` is signatures, checksums, updater metadata and source archives — genuinely
  // fetched, but not the app — and including it inflated every headline figure and trend.
  const total = OS_KEYS.reduce((s, k) => s + downloads[k], 0);

  // Does every platform the project claims actually ship a file? A claimed OS with no
  // matching asset is a download button silently falling back to the source code.
  const missingAssets = (p.platforms || [])
    .filter((pl) => OS_KEYS.includes(pl))
    .filter((pl) => !latest || !pickAsset(latest.assets || [], pl, p.assetMatch));
  // Of those, the ones an EARLIER release did ship. That is a regression — a release cut
  // without its build — and it is the only kind that is broken. A project that has never
  // shipped a file for an OS is source-only by design until it does, and its button says
  // "Download source", which is true.
  const lostAssets = missingAssets.filter((pl) =>
    releases.some((r) => r !== latest && pickAsset(r.assets || [], pl, p.assetMatch))
  );

  const traffic = hasToken ? await collectTraffic(p.repo) : null;

  return {
    ...base,
    downloads,
    total,
    perRelease,
    unexplained: [...unexplained].sort((a, b) => b[1] - a[1]).slice(0, 3),
    missingAssets,
    lostAssets,
    releasesUrl: latest?.html_url || `https://github.com/${p.repo}/releases`,
    traffic,
    stars: repo.stargazers_count ?? 0,
    forks: repo.forks_count ?? 0,
    watchers: repo.subscribers_count ?? 0,
    // GitHub's open_issues_count counts pull requests as issues; subtract them back out.
    issues: Math.max(0, (repo.open_issues_count ?? 0) - openPrs),
    prs: openPrs,
    prList,
    issueList,
    upstreamPrs,
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

// openSUSE installs. zypper fetches packages from download.opensuse.org, whose MirrorCache
// counts every package file it hands out, by package name. A first install and each later
// update count once each, so the figure is downloads, not people. It keeps only the last
// 30 days, so each run's figures are stored (lib/store.mjs) to keep the longer record.
// A name counts every Build Service project that ships it, so a figure is shown only when
// every place the name lives is under OBS_HOME, and a name living nowhere there is not ours.
const OBS = "https://download.opensuse.org";
const OBS_HOME = "/repositories/home:/milnet";

async function obsJson(path) {
  const res = await fetch(OBS + path, { signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function obsExists(path) {
  const res = await fetch(OBS + path, { method: "HEAD", signal: AbortSignal.timeout(20000) });
  return res.ok;
}

// One project's openSUSE figures, or null when it has no package on the Build Service. The
// package is named after the slug or the repo (fin-break ships as finbreak). A failed call
// returns { error }, shown as "no data", never as zero.
async function collectObs(p) {
  const names = [...new Set([p.slug, p.repo.split("/")[1].toLowerCase()])];
  try {
    for (const name of names) {
      const locs = (await obsJson(`/rest/search/package_locations?package=${encodeURIComponent(name)}`)).data || [];
      if (!locs.length) {
        // On the Build Service but not counted yet: MirrorCache had not indexed groundwork
        // five days after its first build (2026-10-19).
        if (await obsExists(`${OBS_HOME}:/${name}/`)) return { slug: p.slug, name: p.name, pkg: name, uncounted: true };
        continue;
      }
      const ours = locs.filter((l) => l.path.startsWith(OBS_HOME)).length;
      if (!ours) continue; // someone else's package of the same name (retroarch)
      if (ours < locs.length) {
        return { slug: p.slug, name: p.name, pkg: name, shared: true };
      }
      const { id } = await obsJson(`/rest/package/${encodeURIComponent(name)}`);
      const [s] = (await obsJson(`/rest/package/${id}/stat_download`)).data || [];
      if (!s) throw new Error("no figures returned");
      return {
        slug: p.slug,
        name: p.name,
        pkg: name,
        d1: Number(s.cnt_1d),
        d7: Number(s.cnt_7d),
        d30: Number(s.cnt_30d),
      };
    }
    return null;
  } catch (err) {
    console.warn(`! ${p.slug}: openSUSE download count failed (${err.message})`);
    return { slug: p.slug, name: p.name, error: true };
  }
}

// --------------------------------------------------------------------- history

// The history lives in .stats/stats.db, behind lib/store.mjs: generate() saves each run there
// and reads the whole record back in the shape the renderers below expect. Download totals are
// cumulative counters, so one dated snapshot per run derives any delta; traffic is GitHub's
// per-day buckets, merged by date, because GitHub drops them after 14 days.

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
    namesByStatus: projects.reduce((o, p) => ((o[p.status || "—"] ||= []).push(p.name), o), {}),
    byCategory: tally(projects, (p) => p.category),
    noRepo: projects.filter((p) => !p.repo).map((p) => p.name),
    noShots: projects.filter((p) => isPublished(p) && !(p.screenshots || []).length).map((p) => p.name),
    missingAlt: projects.flatMap((p) =>
      (p.screenshots || []).filter((s) => !s.alt?.trim()).map((s) => `${p.name} → ${s.src}`)
    ),
    orphanShots: files.filter((f) => !isUsed(f)),
    weekly: await readWeekly(),
    backups: await readBackups(),
  };
}

// The weekly post's last run. null means no run has been recorded yet, which is not a
// failure; an unreadable file is reported as unreadable rather than as "no run".
async function readWeekly() {
  let text;
  try {
    text = await readFile(WEEKLY, "utf8");
  } catch {
    return null;
  }
  try {
    const run = JSON.parse(text);
    return run && run.at && run.outcome ? run : { unreadable: true };
  } catch {
    return { unreadable: true };
  }
}

// Each roadmap backup job's record: { job, label, unit, attempt, success, error }. A missing
// file means the job has never run on this machine (missing: true); a file without an
// attempt line is unreadable. Neither is treated as a failure of the job itself.
async function readBackups() {
  return Promise.all(
    BACKUP_JOBS.map(async (b) => {
      const path = join(BACKUP_DIR, `roadmap-backup-${b.job}.state`);
      let text;
      try {
        text = await readFile(path, "utf8");
      } catch {
        return { ...b, path, missing: true };
      }
      const rec = {};
      for (const line of text.split("\n")) {
        const i = line.indexOf("=");
        if (i > 0) rec[line.slice(0, i)] = line.slice(i + 1);
      }
      if (!rec.attempt) return { ...b, path, unreadable: true };
      return { ...b, path, attempt: rec.attempt, success: rec.success || "", error: rec.error || "" };
    })
  );
}

function agoText(iso, now) {
  const when = new Date(iso);
  const days = Math.floor((now - when) / DAY);
  const ago = days === 0 ? "today" : days === 1 ? "yesterday" : `${days} days ago`;
  return `${ago} (<time datetime="${esc(iso)}">${esc(when.toLocaleString("en-GB"))}</time>)`;
}

function backupLines(backups, now) {
  return backups
    .map((b) => {
      if (b.missing) {
        return `<p class="note">${esc(b.label)}: no record yet at <code>${esc(b.path)}</code>.
          The first run of <code>${esc(b.unit)}.timer</code> writes one.</p>`;
      }
      if (b.unreadable) {
        return `<p class="note">${esc(b.label)}: the record at <code>${esc(b.path)}</code>
          could not be read.</p>`;
      }
      const last = b.success ? `last success ${agoText(b.success, now)}` : "no success yet";
      const result = b.error
        ? `<strong>⚠ failed</strong> — ${esc(b.error)}`
        : `<strong>ok</strong>`;
      return `<p class="note">${esc(b.label)}, ${last}; last run ${agoText(b.attempt, now)}:
        ${result}</p>`;
    })
    .join("");
}

const WEEKLY_LABEL = { published: "published", skipped: "skipped", stopped: "⚠ stopped" };

function weeklyLine(run, now) {
  if (!run) {
    return `<p class="note">Weekly post: no run recorded yet. The first Wednesday run writes one.</p>`;
  }
  if (run.unreadable) {
    return `<p class="note">Weekly post: the run record in <code>.stats/weekly-post.json</code>
      could not be read.</p>`;
  }
  const when = new Date(run.at);
  const days = Math.floor((now - when) / DAY);
  const ago = days === 0 ? "today" : days === 1 ? "yesterday" : `${days} days ago`;
  const mode = run.mode && run.mode !== "publish" ? ` (${esc(run.mode)})` : "";
  return `<p class="note">Weekly post, last run ${esc(ago)}
    (<time datetime="${esc(run.at)}">${esc(when.toLocaleString("en-GB"))}</time>)${mode}:
    <strong>${esc(WEEKLY_LABEL[run.outcome] || run.outcome)}</strong> — ${esc(run.detail || "")}</p>`;
}

function tally(items, keyOf) {
  const out = {};
  for (const it of items) out[keyOf(it) || "—"] = (out[keyOf(it) || "—"] || 0) + 1;
  return out;
}

// ----------------------------------------------------------------- presentation

// Change since the baseline snapshot. Never colour-only: the arrow is a character and the
// number carries its own sign, so it reads correctly in greyscale and to a screen reader.
// A figure that hasn't moved gets nothing at all — a "±0" under every unchanged number is a
// symbol for "nothing happened", which is noise, not data, and it buries the real movements.
function delta(now, before) {
  if (before == null || now === before) return "";
  const diff = now - before;
  const cls = diff > 0 ? "d--up" : "d--down";
  const arrow = diff > 0 ? "▲" : "▼";
  return `<span class="d ${cls}">${arrow} ${diff > 0 ? "+" : "−"}${num(Math.abs(diff))}</span>`;
}

// Same, on its own line under a figure in a table cell. The line break belongs to the delta:
// emitting it unconditionally would leave an empty second line under every unchanged number,
// which is the row height the blank delta exists to reclaim.
function deltaLine(now, before) {
  const d = delta(now, before);
  return d ? `<br>${d}` : "";
}

function sparkline(values) {
  if (values.length < 2) return "";
  const w = 64;
  const h = 18;
  const min = Math.min(...values);
  const max = Math.max(...values);
  // A series that never moved draws a dead-flat line, which looks like a measurement when it
  // is really an absence. Leave the cell empty, same rule as the blank delta and OS cells.
  if (min === max) return "";
  const span = max - min;
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / span) * (h - 2) - 1;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  // Stretchable: the downloads table widens it to fill its Trend cell (CSS), and the stroke
  // keeps its weight however far the drawing is stretched. Elsewhere it draws at w × h.
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" preserveAspectRatio="none" aria-hidden="true"><polyline points="${pts}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>`;
}

// A labelled line chart of one daily series, for the Trends tab. `points` is
// [{ day: "YYYY-MM-DD", value }], one per day in order; a null value is a day with no figure,
// drawn as a gap and never as a zero, because a false zero reads as a collapse. A value with
// no neighbour on either side is a dot. The y-axis starts at 0 so a slope is never
// exaggerated. Every plotted value is also in the table under it, which is the text
// alternative: the SVG is labelled by the visible caption.
export function lineChart({ id, title, points, note = "" }) {
  const known = points.filter((p) => p.value != null);
  const capId = `${id}-cap`;
  if (!known.length) {
    return `<figure class="chart"><figcaption id="${capId}"><strong>${esc(title)}</strong> — nothing recorded yet.
      ${note ? `<span class="chart__note">${note}</span>` : ""}</figcaption></figure>`;
  }
  const W = 960;
  const H = 260;
  const pad = { l: 64, r: 20, t: 14, b: 34 };
  const plotW = W - pad.l - pad.r;
  const plotH = H - pad.t - pad.b;
  // An even top, so the middle gridline is a whole number and its label is exact.
  const top = Math.max(2, Math.ceil(Math.max(...known.map((p) => p.value))));
  const max = top % 2 ? top + 1 : top;
  const x = (i) => pad.l + (points.length > 1 ? (i / (points.length - 1)) * plotW : plotW / 2);
  const y = (v) => pad.t + plotH - (v / max) * plotH;
  const base = pad.t + plotH;

  const marks = [];
  let run = [];
  const flush = () => {
    if (run.length === 1) {
      marks.push(`<circle cx="${x(run[0]).toFixed(1)}" cy="${y(points[run[0]].value).toFixed(1)}" r="3.5"/>`);
    } else if (run.length > 1) {
      const pts = run.map((i) => `${x(i).toFixed(1)},${y(points[i].value).toFixed(1)}`).join(" ");
      marks.push(`<polygon points="${x(run[0]).toFixed(1)},${base} ${pts} ${x(run[run.length - 1]).toFixed(1)},${base}"/>`);
      marks.push(`<polyline points="${pts}"/>`);
    }
    run = [];
  };
  points.forEach((p, i) => (p.value == null ? flush() : run.push(i)));
  flush();

  const grid = [0, max / 2, max]
    .map((v) => {
      const gy = y(v).toFixed(1);
      return `<line x1="${pad.l}" x2="${W - pad.r}" y1="${gy}" y2="${gy}"/>
        <text x="${pad.l - 8}" y="${gy}" text-anchor="end" dominant-baseline="middle">${num(v)}</text>`;
    })
    .join("");
  const ticks = [...new Set([0, Math.floor((points.length - 1) / 2), points.length - 1])]
    .map((i, n, all) => {
      const anchor = all.length > 1 && n === 0 ? "start" : n === all.length - 1 && all.length > 1 ? "end" : "middle";
      return `<text x="${x(i).toFixed(1)}" y="${H - 10}" text-anchor="${anchor}">${dayYear(points[i].day)}</text>`;
    })
    .join("");

  const last = known[known.length - 1];
  return `<figure class="chart">
  <figcaption id="${capId}"><strong>${esc(title)}</strong> — ${num(last.value)} on ${dayYear(last.day)};
    ${dayYear(points[0].day)} to ${dayYear(points[points.length - 1].day)}.
    ${note ? `<span class="chart__note">${note}</span>` : ""}</figcaption>
  <svg class="chart__svg" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="${capId}" data-baseline="${base.toFixed(1)}"
    data-geo="${pad.l},${plotW},${pad.t},${plotH},${max}" data-points="${esc(JSON.stringify(points.map((p) => [p.day, p.value])))}">
    <g class="chart__grid">${grid}</g><g class="chart__axis">${ticks}</g>
    <g class="chart__line">${marks.join("")}</g>
  </svg>
  <details><summary>Show the numbers</summary>
    <table class="tbl"><thead><tr><th scope="col">Day</th><th scope="col" class="n">${esc(title)}</th></tr></thead>
    <tbody>${known
      .map((p) => `<tr><td>${dayYear(p.day)}</td><td class="n">${num(p.value)}</td></tr>`)
      .join("")}</tbody></table>
  </details>
</figure>`;
}

// Every calendar day from `from` up to but not including `until`, both YYYY-MM-DD.
function dayRange(from, until) {
  const out = [];
  for (let t = Date.parse(`${from}T00:00:00Z`); dayKey(t) < until; t += DAY) out.push(dayKey(t));
  return out;
}

// Downloads per day, from the all-time counters: each project's rise since its previous reading,
// filed under the day of the later reading. A project's first reading adds nothing, or its whole
// history would land on the day it was added. A fall (an asset deleted) adds nothing either. The
// first day is left out because it only holds the rest of that day. A day with no reading at
// all is a gap, and its downloads land on the next reading, because the counter keeps them.
export function dailyDownloads(snapshots, todayUtc) {
  if (!snapshots.length) return [];
  const last = {};
  const rise = {};
  for (const snap of snapshots) {
    const day = dayKey(snap.at);
    rise[day] ||= 0;
    for (const [slug, p] of Object.entries(snap.projects)) {
      const total = osTotal(p);
      if (slug in last && total > last[slug]) rise[day] += total - last[slug];
      last[slug] = total;
    }
  }
  return dayRange(dayKey(snapshots[0].at), todayUtc)
    .slice(1)
    .map((day) => ({ day, value: rise[day] ?? null }));
}

// The last seven days of a daily series against the seven before. A gap is left out of the sum
// and counted, so a short week can say so instead of reading as a quiet one. Null when the
// latest seven days hold no figure at all.
export function compareWeeks(points = []) {
  const sum = (list) => {
    const known = list.filter((p) => p.value != null);
    return { total: known.reduce((t, p) => t + p.value, 0), days: known.length };
  };
  const now = sum(points.slice(-7));
  if (!now.days) return null;
  return { now, before: sum(points.slice(-14, -7)) };
}

// The eight daily series the Trends tab draws. Each stops at yesterday: today is still
// counting, and a part-day reads as a fall. GitHub and openSUSE days are UTC (dayKey); GA days
// are in the GA property's zone, which is this machine's (Africa/Johannesburg), so "today"
// for them is the local date.
function trendSeries(history, trends, now) {
  const todayUtc = dayKey(now);
  const todayLocal = new Date(now).toLocaleDateString("en-CA");
  const series = {};

  // All-time downloads: each project's newest count on or before the day, so a project whose
  // fetch failed that day still counts at its last known figure rather than as a drop.
  const snaps = history.snapshots;
  if (snaps.length) {
    const latest = {};
    let i = 0;
    series.downloads = dayRange(dayKey(snaps[0].at), todayUtc).map((day) => {
      for (; i < snaps.length && dayKey(snaps[i].at) <= day; i++) Object.assign(latest, snaps[i].projects);
      return { day, value: Object.values(latest).reduce((s, p) => s + osTotal(p), 0) };
    });
    series.dlDaily = dailyDownloads(snaps, todayUtc);
  }

  // Repo views and clones: summed over repos; a day no repo reported is a gap.
  const byDay = {};
  for (const bucket of Object.values(history.traffic)) {
    for (const [day, d] of Object.entries(bucket)) {
      const t = (byDay[day] ||= {});
      if (d.views != null) t.views = (t.views || 0) + d.views;
      if (d.clones != null) t.clones = (t.clones || 0) + d.clones;
    }
  }
  const trafficDays = Object.keys(byDay).sort();
  if (trafficDays.length) {
    const range = dayRange(trafficDays[0], todayUtc);
    series.views = range.map((day) => ({ day, value: byDay[day]?.views ?? null }));
    series.clones = range.map((day) => ({ day, value: byDay[day]?.clones ?? null }));
  }

  // openSUSE: each package's last figure of the day, summed. A day missing a package that has
  // earlier figures is a gap, since the sum would otherwise fall by that package's share.
  if (trends.obs.length) {
    const days = {};
    const seen = new Set();
    for (const o of trends.obs) (days[dayKey(o.at)] ||= {})[o.pkg] = o.d1;
    series.obs = dayRange(dayKey(trends.obs[0].at), todayUtc).map((day) => {
      const got = days[day];
      if (!got) return { day, value: null };
      const complete = [...seen].every((pkg) => pkg in got);
      Object.keys(got).forEach((pkg) => seen.add(pkg));
      return { day, value: complete ? Object.values(got).reduce((s, v) => s + v, 0) : null };
    });
  }

  // GA: a day GA was asked about and returned no row for is a zero; a day never asked about
  // is a gap (lib/store.mjs, replaceWindow). A series starts at its first non-zero day: GA
  // also answers for days before tracking began (the blog read reaches back to the oldest
  // post), and those are unknown, not zero.
  const gaSeries = (rows, read, pick) => {
    const first = rows.find((r) => pick(r) > 0);
    if (!first) return undefined;
    const value = Object.fromEntries(rows.map((r) => [r.day, pick(r)]));
    return dayRange(first.day, todayLocal).map((day) => ({
      day,
      value: value[day] ?? (read.has(day) ? 0 : null),
    }));
  };
  series.visitors = gaSeries(trends.ga.daily, trends.ga.read.daily, (r) => r.active_users);
  series.posts = gaSeries(trends.ga.posts, trends.ga.read.posts, (r) => r.value);
  series.clicks = gaSeries(trends.ga.clicks, trends.ga.read.clicks, (r) => r.value);
  return series;
}

const DAILY_NOTE =
  "The rise in each project's counter between readings. Downloads from a day with no reading land on the next one. GitHub does not say who downloads, so a rise may be an automated sweep.";

function trendsSection(history, trends, now) {
  const s = trendSeries(history, trends, now);
  const floor = "Only visitors who accepted analytics are counted, so this is a floor, not a total.";
  const charts = [
    ["downloads", "GitHub downloads, all projects", "The all-time total, from each project's latest count that day."],
    ["views", "Repo views per day", "Summed over every repository."],
    ["clones", "Repo clones per day", "Summed over every repository."],
    ["obs", "openSUSE downloads per day", "The last-day figure from each day's last check. openSUSE does not say exactly which 24 hours that figure covers."],
    ["visitors", "Site visitors per day", floor],
    ["posts", "Blog views per day", floor],
    ["clicks", "Download clicks per day", floor],
    ["dlDaily", "GitHub downloads per day", DAILY_NOTE],
  ];
  return `<div class="charts">${charts
    .map(([key, title, note]) => lineChart({ id: `trend-${key}`, title, points: s[key] || [], note }))
    .join("")}</div>`;
}

// Wide tables keep their column widths and let this wrapper scroll instead of crushing on a
// narrow screen. It is focusable and labelled because a plain overflow container can be
// scrolled only by dragging — no keyboard, and nothing announced.
// Side-by-side blocks. The page is read only on a wide monitor, so tables that are each
// narrower than the column share a row instead of stacking.
const cols = (...blocks) =>
  `<div class="cols">${blocks.map((b) => `<div class="col">${b}</div>`).join("")}</div>`;
// A value's width beside the largest in its list, for a bar drawn in CSS.
const share = (value, max) => `${max > 0 ? Math.max(0, (value / max) * 100).toFixed(1) : 0}%`;
const scrollTable = (label, html) =>
  `<div class="tbl-scroll" tabindex="0" role="region" aria-label="${esc(label)}, scrollable">${html}</div>`;

function downloadsTable(rows, history, base) {
  const series = (slug) =>
    history.snapshots
      .map((s) => (s.projects[slug] ? osTotal(s.projects[slug]) : null))
      .filter((v) => v != null);

  const topTotal = Math.max(0, ...rows.filter((r) => r.ok).map((r) => r.total));
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
      // An OS the project doesn't ship for gets a blank cell, not a zero: "there is no Mac
      // build" and "the Mac build went undownloaded" are different facts, and a column of
      // zeros told them apart for nobody. A stray download against an unclaimed OS is still
      // shown — that mismatch is worth seeing, not hiding behind the blank.
      const claimed = r.project?.platforms || [];
      const cells = OS_KEYS.map((k) => {
        const n = r.downloads[k];
        if (!n && !claimed.includes(k)) {
          // Sorts below every real figure; the blank reads as "not offered" aloud.
          return `<td class="n os os--${k}" data-sort="-1"><span class="sr-only">not offered for ${OS_LABEL[k]}</span></td>`;
        }
        return `<td class="n os os--${k}" data-sort="${n}">${num(n)}${deltaLine(
          n,
          b?.[k]
        )}</td>`;
      }).join("");
      // Amber only when something is genuinely unexplained — signatures and source
      // archives land here too and are perfectly normal.
      const other = `<td class="n ${r.unexplained.length ? "warn" : "dim"}" data-sort="${
        r.downloads.other
      }">${num(r.downloads.other)}${deltaLine(r.downloads.other, b?.other)}</td>`;
      return `<tr>
        <th scope="row" data-sort="${esc(r.name)}">${esc(r.name)}<span class="repo">${esc(
        r.repo
      )}</span></th>
        ${cells}
        <td class="n strong databar" style="--w:${share(r.total, topTotal)}" data-sort="${r.total}">${num(r.total)}${deltaLine(
        r.total,
        b ? osTotal(b) : null
      )}</td>
        <td class="sparkcell">${sparkline(series(r.slug))}</td>
        ${other}
      </tr>`;
    })
    .join("");

  const ok = rows.filter((r) => r.ok);
  const totals = OS_KEYS.map(
    (k) =>
      `<td class="n os os--${k}">${num(ok.reduce((s, r) => s + r.downloads[k], 0))}</td>`
  ).join("");
  const grand = ok.reduce((s, r) => s + r.total, 0);

  return scrollTable(
    "Downloads per OS",
    `<table class="tbl sortable tbl--dl" data-table="downloads">
    <caption>All-time downloads, by operating system. A blank cell means the project isn't
      offered for that OS; a zero means it is, and nobody has downloaded it. Total and Trend
      count the three OS columns only. “Other” is release files that aren't the app —
      signatures, checksums, updater metadata, source archives — so it sits last, outside
      the total. That's normal; it only turns amber when something there is unexplained.</caption>
    <colgroup><col class="c-name">${'<col class="c-num">'.repeat(OS_KEYS.length + 1)}<col
      class="c-trend"><col></colgroup>
    <thead><tr><th scope="col">Project</th>${OS_KEYS.map(
      (k) => `<th scope="col" class="n os os--${k}">${OS_LABEL[k]}</th>`
    ).join("")}<th scope="col" class="n" aria-sort="descending">Total</th>
    <th scope="col" class="n" data-nosort>Trend</th>
    <th scope="col" class="n">Other</th></tr></thead>
    <tbody>${body}</tbody>
    <tfoot><tr><th scope="row">All projects</th>${totals}
      <td class="n strong">${num(grand)}</td><td></td>
      <td class="n">${num(ok.reduce((s, r) => s + r.downloads.other, 0))}</td></tr></tfoot>
  </table>`
  );
}

// ------------------------------------------------------------ recent downloads

const WINDOWS = [7, 30];

// The newest reading we hold for one project. Every window is measured between two readings
// rather than against the clock, so a project whose fetch failed today still reports the
// record it has instead of dropping to "no data".
const lastSeen = (history, slug) =>
  history.snapshots.filter((s) => s.projects[slug]).pop();

// One project's downloads over the last `days`. Download counts are cumulative counters, so
// the figure is simply the difference between the two ends of the window — which means a gap
// in the middle costs nothing at all. (The traffic archive above is the opposite: it sums
// per-day buckets, so a day nobody ran the dashboard is a day lost for good. Same file, two
// kinds of number, and only one of them heals.)
//
// The near end is the newest reading, never `now`: anchoring on the clock would measure the
// window short for any project that couldn't be fetched this run, and report the shortfall as
// a quiet week. The far end is the reading NEAREST the cut-off rather than the first one past
// it — snapshots land a few hours apart, and nearest is the smallest error available.
function windowDownloads(history, slug, days) {
  const seen = history.snapshots.filter((s) => s.projects[slug]);
  if (seen.length < 2) return null;
  const latest = seen[seen.length - 1];
  const cut = Date.parse(latest.at) - days * DAY;
  const anchor = seen.reduce((best, s) =>
    Math.abs(Date.parse(s.at) - cut) < Math.abs(Date.parse(best.at) - cut) ? s : best
  );
  const covered = (Date.parse(latest.at) - Date.parse(anchor.at)) / DAY;
  // Less than half a day between the ends says nothing about a week — the window would be
  // measured against this morning and report zero for a busy fortnight. Say nothing instead.
  if (covered < 0.5) return null;
  return {
    count: osTotal(latest.projects[slug]) - osTotal(anchor.projects[slug]),
    // Signatures, checksums and source archives over the same window; null on a reading too
    // old to hold them.
    other:
      latest.projects[slug].other != null && anchor.projects[slug].other != null
        ? latest.projects[slug].other - anchor.projects[slug].other
        : null,
    covered,
    at: Date.parse(latest.at),
  };
}

// How far back the record goes at all. A 30-day column against a 27-day record is a 27-day
// column for everybody, and that is one fact about the file — not seventeen facts about
// seventeen projects. Stating it per row buried the projects that really are short.
function recordSpan(history) {
  const all = history.snapshots;
  return all.length < 2 ? 0 : (Date.parse(all[all.length - 1].at) - Date.parse(all[0].at)) / DAY;
}

// Short means shorter than the record could have managed — not shorter than the window. The
// first is this project missing days everyone else has; the second is the archive being young,
// which the note above the table already says once.
// Readings land about a day apart, so the reading nearest a cut-off can sit most of a day from
// it for every project at once, and that alone is not a short record.
const isShort = (w, reach) => !w || w.covered < reach - 1;

// Site-wide downloads over a window, counting only the projects whose record covers the whole
// of it. Mixing a full fortnight with someone's first three days produces a number that is
// smaller than the truth and looks exactly like a quiet week.
function windowTotal(rows, history, days) {
  const reach = Math.min(days, recordSpan(history));
  const ws = rows
    .map((r) => windowDownloads(history, r.slug, days))
    .filter((w) => !isShort(w, reach));
  return ws.length
    ? { count: ws.reduce((s, w) => s + w.count, 0), of: ws.length, all: rows.length }
    : null;
}

// All-time answers "has anyone ever wanted this"; these two windows answer "does anyone want
// it now", which is the question a flat cumulative counter cannot be made to answer.
function recentDownloads(rows, history, now) {
  const span = recordSpan(history);
  const data = rows
    .map((r) => ({ r, latest: lastSeen(history, r.slug), wins: WINDOWS.map((d) => windowDownloads(history, r.slug, d)) }))
    .sort((a, b) => (b.wins[0]?.count || 0) - (a.wins[0]?.count || 0) ||
      osTotal(b.latest?.projects[b.r.slug]) - osTotal(a.latest?.projects[a.r.slug]));

  if (!data.some((d) => d.latest)) {
    return `<p class="note">Nothing recorded yet. Each run writes a dated reading of every
      download counter, and a window needs two of them — so these figures start filling in from
      your second run.</p>`;
  }

  const topWeek = Math.max(0, ...data.map((d) => d.wins[0]?.count || 0));
  const cell = (w, days) => {
    if (!w) return `<td class="n" data-sort="-1"><span class="dim">no data</span></td>`;
    // Labelled with what this project's own record reaches. Without it a project watched for
    // three days reads as a dead one: the number really is small, and the reason really isn't
    // a lack of interest.
    const note = isShort(w, Math.min(days, span))
      ? `<br><span class="dim">${Math.round(w.covered)} d only</span>`
      : "";
    // A counter can fall — an asset deleted or re-uploaded takes its downloads with it. Say so
    // rather than printing a negative download count and leaving the reader to guess.
    const fell = w.count < 0 ? `<br><span class="dim">an asset was removed</span>` : "";
    const shown = w.count < 0 ? `−${num(-w.count)}` : num(w.count);
    const bar = days === WINDOWS[0] && w.count > 0 ? ` databar" style="--w:${share(w.count, topWeek)}` : "";
    return `<td class="n${bar}" data-sort="${w.count}">${shown}${note}${fell}</td>`;
  };

  const body = data
    .map(({ r, latest, wins }) => {
      const total = latest ? osTotal(latest.projects[r.slug]) : null;
      const stale = latest && now - Date.parse(latest.at) >= DAY;
      const first = history.snapshots.find((s) => s.projects[r.slug]);
      return `<tr${latest ? "" : ' class="row--missing"'}>
        <th scope="row" data-sort="${esc(r.name)}">${esc(r.name)}${
        stale ? `<br><span class="dim">as of ${dayLabel(dayKey(Date.parse(latest.at)))}</span>` : ""
      }</th>
        ${wins.map((w, i) => cell(w, WINDOWS[i])).join("")}
        <td class="n strong" data-sort="${total ?? -1}">${
        total == null ? `<span class="dim">no data</span>` : num(total)
      }</td>
        <td class="n" data-sort="${first ? Date.parse(first.at) : -1}">${
        first ? dayLabel(dayKey(Date.parse(first.at))) : `<span class="dim">—</span>`
      }</td>
      </tr>`;
    })
    .join("");

  const foot = WINDOWS.map((days) => {
    const t = windowTotal(rows, history, days);
    if (!t) return `<td class="n"><span class="dim">no data</span></td>`;
    const part = t.of < t.all ? `<br><span class="dim">${t.of} of ${t.all} projects</span>` : "";
    return `<td class="n strong">${num(t.count)}${part}</td>`;
  }).join("");
  const grand = data.reduce((s, d) => s + (d.latest ? osTotal(d.latest.projects[d.r.slug]) : 0), 0);

  // Named once, above the table, so the columns underneath can be read as they are labelled.
  const thin = WINDOWS.filter((d) => d > span + 0.5);
  const lead = thin.length
    ? `<p class="note">The record is <strong>${Math.round(span)} days</strong> old, so the
        ${thin.map((d) => `${d}-day`).join(" and ")} column${thin.length > 1 ? "s are" : " is"}
        really ${Math.round(span)} days for every project watched throughout — a floor, not a
        total. It fills out on its own as the runs accumulate.</p>`
    : "";

  return (
    lead +
    scrollTable(
      "Recent downloads",
    `<table class="tbl sortable" data-table="downloads-recent">
    <caption>Downloads counted between two dated readings of the counter, so a day the
      dashboard didn’t run costs nothing — unlike the repo-traffic archive further down, this
      figure survives a gap. A project watched for less time than the rest carries what its own
      record covers, and is left out of the totals row rather than folded in short: that
      smaller number is a shorter window, not a quieter one. All time counts every download
      since the project’s first release, including long before this dashboard existed.</caption>
    <thead><tr><th scope="col">Project</th>
      ${WINDOWS.map(
        (d, i) =>
          `<th scope="col" class="n"${i === 0 ? ' aria-sort="descending"' : ""}>Last ${d} days</th>`
      ).join("")}
      <th scope="col" class="n">All time</th>
      <th scope="col" class="n">Record starts</th></tr></thead>
    <tbody>${body}</tbody>
    <tfoot><tr><th scope="row">All projects</th>${foot}
      <td class="n strong">${num(grand)}</td><td></td></tr></tfoot>
  </table>`
    )
  );
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
  return scrollTable(
    "Repo traffic",
    `<table class="tbl sortable" data-table="traffic">
    <caption>Straight from GitHub, and only you can see it. GitHub deletes these after 14
      days — the archive below is this dashboard's own dated copy, which doesn't
      expire.</caption>
    <thead><tr><th scope="col">Project</th>
      <th scope="col" class="n" aria-sort="descending">Views</th>
      <th scope="col" class="n">Visitors</th><th scope="col" class="n">Clones</th>
      <th scope="col" class="n">Cloners</th>
      <th scope="col" data-nosort>Top referrers</th></tr></thead>
    <tbody>${body}</tbody></table>`
  );
}

// ------------------------------------------------------------- archived traffic

const ARCHIVE_WINDOW = 14;

// Sum one project's archived buckets across a date window, counting only the days actually
// recorded. A missing day is a gap — the dashboard wasn't run, or GitHub didn't answer — and
// folding it in as a zero would understate the window and read the next run's recovery as a
// spike. Same discipline the download snapshots keep.
function windowSum(bucket, from, to) {
  const out = { views: 0, uniques: 0, clones: 0, cloneUniques: 0, days: 0 };
  for (let t = from; t <= to; t += DAY) {
    const d = bucket[dayKey(t)];
    if (!d) continue;
    out.days += 1;
    out.views += d.views || 0;
    out.uniques += d.uniques || 0;
    out.clones += d.clones || 0;
    out.cloneUniques += d.cloneUniques || 0;
  }
  return out;
}

// The half GitHub can't serve. Every run has merged GitHub's per-day buckets into the stored
// history since the first run, and GitHub keeps only 14 days — so past a fortnight
// this archive is the only copy that exists. Until now nothing on the page read it back.
function archiveTraffic(rows, history, now) {
  // Every row, not just this run's successes — the one table on the page that can outlive a
  // bad run. A repo whose traffic call was denied or rate-limited today still has its
  // recorded past, and surviving that is the whole reason for keeping an archive.
  const kept = rows
    .map((r) => ({ r, bucket: history.traffic?.[r.slug] }))
    .filter(({ bucket }) => bucket && Object.keys(bucket).length);

  if (!kept.length) {
    return `<p class="note">Nothing archived yet. Every run merges in the day buckets GitHub
      is currently serving, so the record starts at your first authenticated run and passes
      GitHub's own 14-day window a fortnight later.</p>`;
  }

  const allDays = new Set();
  for (const { bucket } of kept) for (const d of Object.keys(bucket)) allDays.add(d);
  const span = [...allDays].sort();

  // The window ends at the newest day ARCHIVED, never at today. GitHub's daily buckets run a
  // day or two behind the clock, so anchoring on now leaves the recent window permanently
  // short and the fairness test below refuses every comparison on the page — a real trend
  // suppressed by an artefact of when GitHub closes a bucket. The note names the end date so
  // nobody reads this as "up to this minute".
  const end = Date.parse(`${span[span.length - 1]}T00:00:00Z`);
  const curFrom = end - (ARCHIVE_WINDOW - 1) * DAY;
  const prevTo = curFrom - DAY;
  const prevFrom = prevTo - (ARCHIVE_WINDOW - 1) * DAY;

  // Measured against GitHub's live window rather than the archive's, because the question is
  // what GitHub can still serve TODAY — which is what makes the rest worth keeping.
  const beyond = span.filter((d) => d < dayKey(now - (ARCHIVE_WINDOW - 1) * DAY)).length;

  const body = kept
    .map((k) => ({
      ...k,
      cur: windowSum(k.bucket, curFrom, end),
      prev: windowSum(k.bucket, prevFrom, prevTo),
    }))
    .sort((a, b) => b.cur.views - a.cur.views)
    .map(({ r, bucket, cur, prev }) => {
      const own = Object.keys(bucket).sort();
      // Two windows covering a different number of days can't be set against each other: the
      // shorter one reads as a quiet fortnight, so the change would report a trend that is
      // really a hole in the record. Say nothing rather than something untrue.
      const fair = cur.days > 0 && cur.days === prev.days;
      const cell = (key) =>
        cur.days === 0
          ? `<td class="n" data-sort="-1"><span class="dim">no data</span></td>`
          : `<td class="n" data-sort="${cur[key]}">${num(cur[key])}${
              fair ? deltaLine(cur[key], prev[key]) : ""
            }</td>`;
      return `<tr>
        <th scope="row" data-sort="${esc(r.name)}">${esc(r.name)}</th>
        ${["views", "uniques", "clones", "cloneUniques"].map(cell).join("")}
        <td class="n">${sparkline(own.map((d) => bucket[d].views || 0))}</td>
        <td class="n" data-sort="${own.length}">${own.length} d<br>
          <span class="dim">since ${dayLabel(own[0])}${fair ? "" : " \u00b7 no comparison"}</span></td>
      </tr>`;
    })
    .join("");

  return `<p class="note"><strong>${span.length} days archived</strong>,
    ${dayLabel(span[0])} to ${dayLabel(span[span.length - 1])}.${
    beyond
      ? ` GitHub still serves the most recent ${ARCHIVE_WINDOW}; the other ${beyond} exist
          nowhere but this machine.`
      : ` Once it passes ${ARCHIVE_WINDOW} days it starts holding traffic GitHub has already
          deleted.`
  }</p>
  ${scrollTable(
    "Archived repo traffic",
    `<table class="tbl sortable" data-table="traffic-archive">
    <caption>The ${ARCHIVE_WINDOW} days to ${dayLabel(span[span.length - 1])}, from your own
      archive, set against the ${ARCHIVE_WINDOW} before them. A change is shown only where both windows recorded the
      same number of days — otherwise the older one is short of data, not short of visitors,
      and the row says so. Trend is every day held for that project, gaps closed up.</caption>
    <thead><tr><th scope="col">Project</th>
      <th scope="col" class="n" aria-sort="descending">Views</th>
      <th scope="col" class="n">Visitors</th><th scope="col" class="n">Clones</th>
      <th scope="col" class="n">Cloners</th>
      <th scope="col" data-nosort>Trend</th>
      <th scope="col" class="n">Archived</th></tr></thead>
    <tbody>${body}</tbody></table>`
  )}`;
}

function activityTable(rows, now) {
  // Ships pre-sorted by stars, highest first — the column this table is actually read for,
  // and the order it keeps when the script never runs. A reader's own choice is remembered
  // client-side and replaces this on load; see the sort block in JS.
  const body = [...rows]
    .sort((a, b) => b.stars - a.stars)
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
  return scrollTable(
    "Audience and activity",
    `<table class="tbl sortable" data-table="activity">
    <caption>Audience and activity. A ⚠ marks 90+ days without a commit.</caption>
    <thead><tr><th scope="col">Project</th>
      <th scope="col" class="n" aria-sort="descending">Stars</th>
      <th scope="col" class="n">Forks</th><th scope="col" class="n">Watching</th>
      <th scope="col" class="n">Issues</th><th scope="col" class="n">PRs</th>
      <th scope="col" class="n">Latest</th><th scope="col" class="n">Rel. age</th>
      <th scope="col" class="n">Last commit</th></tr></thead>
    <tbody>${body}</tbody></table>`
  );
}

// ------------------------------------------------------- site visitors (Google Analytics)

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
// GA hands dates back as "20260823".
const gaDay = (d) => `${Number(d.slice(6, 8))} ${MONTHS[Number(d.slice(4, 6)) - 1]}`;
// The same, for an archive key. GA hands back YYYYMMDD and dayKey() writes YYYY-MM-DD; two
// formats reach the page, so they share one month table rather than growing a second.
const dayLabel = (key) => `${Number(key.slice(8, 10))} ${MONTHS[Number(key.slice(5, 7)) - 1]}`;
// The same with its year, for the Trends charts, whose history runs across years.
const dayYear = (key) => `${dayLabel(key)} ${key.slice(0, 4)}`;

// Seconds as something a human reads. Zero is a dash, not "0s": on a page nobody has
// engaged with yet, "0s" reads as a measured result rather than an absence.
function duration(seconds) {
  const n = Math.round(seconds || 0);
  if (!n) return '<span class="dim">—</span>';
  if (n < 60) return `${n}s`;
  return `${Math.floor(n / 60)}m ${String(n % 60).padStart(2, "0")}s`;
}

// Each weekly post's readership: views in its first seven days (the week it was the newest
// post) and in total. GA keys the page by path, and a post's path is /blog/<slug>/. A post
// published before GA recorded anything has an unknown first week, never a zero one; a post
// younger than a week says how many days its figure covers.
function blogTable(posts, pv, now) {
  if (!posts.length) return `<p class="note">No blog posts yet.</p>`;
  if (!pv || pv.error) {
    return `<p class="note">Blog readership could not be read${
      pv?.error ? `: ${esc(pv.error)}` : ""
    }. Treat it as unknown, never as zero.</p>`;
  }
  const gaKey = (iso) => iso.replaceAll("-", "");
  const byPath = new Map();
  for (const r of pv.rows) {
    const path = r.pagePath.replace(/index\.html$/, "").replace(/\/?$/, "/");
    if (!byPath.has(path)) byPath.set(path, []);
    byPath.get(path).push(r);
  }
  const rows = posts.map((p) => {
    const views = byPath.get(p.url) || [];
    const start = p.date.getTime();
    const end = gaKey(new Date(start + 6 * DAY).toISOString().slice(0, 10));
    const total = views.reduce((t, r) => t + r.screenPageViews, 0);
    const beforeTracking = !pv.firstDay || gaKey(p.dateISO) < pv.firstDay;
    const week = views
      .filter((r) => r.date >= gaKey(p.dateISO) && r.date <= end)
      .reduce((t, r) => t + r.screenPageViews, 0);
    const age = Math.floor((now - start) / DAY) + 1;
    return { p, total, week, beforeTracking, age };
  });
  return scrollTable(
    "Blog posts",
    `<table class="tbl sortable" data-table="ga-posts">
    <caption>Views per weekly post. "First week" is its first seven days, while it was the
      newest post. A floor, like every figure here.</caption>
    <thead><tr><th scope="col">Post</th>
      <th scope="col" aria-sort="descending">Published</th>
      <th scope="col" class="n">First week</th>
      <th scope="col" class="n">All time</th></tr></thead>
    <tbody>${rows
      .map(
        ({ p, total, week, beforeTracking, age }) => `<tr>
        <th scope="row" data-sort="${esc(p.title)}"><a href="${esc(
          ORIGIN + p.url
        )}" target="_blank" rel="noopener">${esc(p.title)}</a></th>
        <td data-sort="${esc(p.dateISO)}">${esc(p.dateISO)}</td>
        <td class="n" data-sort="${beforeTracking ? -1 : week}">${
          beforeTracking
            ? '<span class="dim">before tracking</span>'
            : `${num(week)}${age < 7 ? ` <span class="dim">(${age} d so far)</span>` : ""}`
        }</td>
        <td class="n" data-sort="${total}">${num(total)}</td>
      </tr>`
      )
      .join("")}</tbody></table>`
  );
}

// Download-button presses on the site, per project page. Counting began with APHW-0010 on
// 2026-09-25, so an empty table is expected at first and says so rather than listing zeros.
// Only visitors who accepted analytics are counted — the same floor as every figure here.
function clicksTable(clicks, projects) {
  if (!clicks || clicks.error) {
    return `<p class="note">Download clicks could not be read${
      clicks?.error ? `: ${esc(clicks.error)}` : ""
    }. Treat them as unknown, never as zero.</p>`;
  }
  const bySlug = new Map(projects.map((p) => [p.slug, p.name]));
  // GA returns one row per page per day; a page's clicks are the sum of its days.
  const perPage = {};
  for (const r of clicks.rows) perPage[r.pagePath] = (perPage[r.pagePath] || 0) + r.eventCount;
  const rows = Object.entries(perPage)
    .map(([path, n]) => {
      const slug = /^\/p\/([^/]+?)(?:\.html)?$/.exec(path)?.[1];
      return { label: bySlug.get(slug) || path, n };
    })
    .sort((a, b) => b.n - a.n);
  if (!rows.length) {
    return `<p class="note">No Download clicks in the last ${clicks.days} days. Counting
      began on 25 Sep 2026, and only visitors who accepted analytics are counted.</p>`;
  }
  return scrollTable(
    "Download clicks",
    `<table class="tbl sortable" data-table="ga-clicks">
    <caption>Download-button presses on each project page, last ${clicks.days} days. A floor:
      only visitors who accepted analytics are counted.</caption>
    <thead><tr><th scope="col">Project</th>
      <th scope="col" class="n" aria-sort="descending">Clicks</th></tr></thead>
    <tbody>${rows
      .map(
        (r) => `<tr><th scope="row" data-sort="${esc(r.label)}">${esc(r.label)}</th>
        <td class="n" data-sort="${r.n}">${num(r.n)}</td></tr>`
      )
      .join("")}</tbody></table>`
  );
}

const gaEmpty = (label) =>
  `<p class="note">No ${label} recorded yet in this window.</p>`;

function analyticsSection(ga, propertyId, blog) {
  if (!propertyId) {
    return `<p class="note">No Google Analytics property is configured. Add
      <code>analytics.propertyId</code> to <code>src/projects.json</code> to show visitor
      figures here.</p>`;
  }
  // A failed read is never drawn as zero — the same rule the GitHub side follows. A dead
  // credential and a dead site would otherwise look identical, and one of them is urgent.
  if (!ga) {
    return `<p class="note banner"><strong>Google Analytics could not be read, so no
      visitor figures are shown.</strong> ${esc(gaError || "unknown error")}<br>
      This is a read failure, not a measurement — treat it as "unknown", never as zero.
      The service account key is expected at
      <code>~/.config/gcloud/aph-ga-reader.json</code> (override with
      <code>GOOGLE_APPLICATION_CREDENTIALS</code>), and it needs <strong>Viewer</strong> on
      the property in Analytics → Admin → Property access management.</p>`;
  }

  const t = ga.totals || {};
  const tiles = [
    ["Visitors", num(t.totalUsers), `last ${ga.days} days`],
    ["Sessions", num(t.sessions), t.engagementRate ? `${Math.round(t.engagementRate * 100)}% engaged` : ""],
    ["Page views", num(t.screenPageViews), ""],
    ["Avg session", duration(t.averageSessionDuration), ""],
  ]
    .map(
      ([label, value, sub]) =>
        `<div class="tile"><span class="tile__label">${label}</span>
         <span class="tile__value">${value}</span><span class="tile__sub">${sub}</span></div>`
    )
    .join("");

  // The trend only means anything with more than one day on file, and sparkline() already
  // returns nothing for a flat or single-point series.
  const spark = sparkline(ga.daily.map((d) => d.screenPageViews));
  const trend = spark
    ? `<p class="ga-trend"><span class="dim">${gaDay(ga.daily[0].date)}</span>
       ${spark}
       <span class="dim">${gaDay(ga.daily[ga.daily.length - 1].date)}</span>
       <span class="ga-trend__label">daily page views</span></p>`
    : "";

  const pages = ga.pages.length
    ? scrollTable(
        "Top pages",
        `<table class="tbl sortable" data-table="ga-pages">
        <caption>Most-visited pages, last ${ga.days} days. Average time is engaged time per
          view — GA counts only the time the tab was actually in front of someone.</caption>
        <thead><tr><th scope="col">Page</th>
          <th scope="col" class="n" aria-sort="descending">Views</th>
          <th scope="col" class="n">Visitors</th>
          <th scope="col" class="n">Avg time</th></tr></thead>
        <tbody>${ga.pages
          .map(
            (r) => `<tr>
            <th scope="row" data-sort="${esc(r.pagePath)}"><a href="${esc(
              ORIGIN + r.pagePath
            )}" target="_blank" rel="noopener">${esc(r.pagePath)}</a></th>
            <td class="n" data-sort="${r.screenPageViews}">${num(r.screenPageViews)}</td>
            <td class="n" data-sort="${r.activeUsers}">${num(r.activeUsers)}</td>
            <td class="n" data-sort="${
              r.screenPageViews ? r.userEngagementDuration / r.screenPageViews : 0
            }">${duration(
              r.screenPageViews ? r.userEngagementDuration / r.screenPageViews : 0
            )}</td>
          </tr>`
          )
          .join("")}</tbody></table>`
      )
    : gaEmpty("page views");

  const sources = ga.sources.length
    ? scrollTable(
        "Where visitors came from",
        `<table class="tbl sortable" data-table="ga-sources">
        <caption>How people arrived. "Direct" and "(not set)" mean the browser sent no
          referrer — a typed address, a bookmark, or a link from an app.</caption>
        <thead><tr><th scope="col">Channel</th><th scope="col">Source</th>
          <th scope="col" class="n" aria-sort="descending">Sessions</th>
          <th scope="col" class="n">Visitors</th></tr></thead>
        <tbody>${ga.sources
          .map(
            (r) => `<tr>
            <th scope="row" data-sort="${esc(r.sessionDefaultChannelGroup)}">${esc(
              r.sessionDefaultChannelGroup || "Unassigned"
            )}</th>
            <td data-sort="${esc(r.sessionSource)}">${esc(r.sessionSource || "—")}</td>
            <td class="n" data-sort="${r.sessions}">${num(r.sessions)}</td>
            <td class="n" data-sort="${r.activeUsers}">${num(r.activeUsers)}</td>
          </tr>`
          )
          .join("")}</tbody></table>`
      )
    : gaEmpty("referrers");

  const countries = ga.countries.length
    ? scrollTable(
        "Countries",
        `<table class="tbl sortable" data-table="ga-countries">
        <caption>Approximate, from the network the visit came in on. GA derives it and
          discards the address — see /privacy/.</caption>
        <thead><tr><th scope="col">Country</th>
          <th scope="col" class="n" aria-sort="descending">Visitors</th>
          <th scope="col" class="n">Sessions</th></tr></thead>
        <tbody>${ga.countries
          .map(
            (r) => `<tr>
            <th scope="row" data-sort="${esc(r.country || "zzz")}">${
              r.country ? flag(r.countryId) + esc(r.country) : '<span class="dim">Not yet resolved</span>'
            }</th>
            <td class="n" data-sort="${r.activeUsers}">${num(r.activeUsers)}</td>
            <td class="n" data-sort="${r.sessions}">${num(r.sessions)}</td>
          </tr>`
          )
          .join("")}</tbody></table>`
      )
    : gaEmpty("locations");

  return `<p class="note"><strong>These numbers are a floor, not a total.</strong>
      Tracking is opt-in, so anyone who declines the cookie bar, ignores it, or blocks
      scripts is never counted. A quiet week is not proof of a quiet site. GA also takes
      up to 48 hours to finish processing, so the most recent day can still rise.</p>
    <div class="tiles">${tiles}</div>
    ${trend}
    ${cols(
      `<h3>Top pages</h3>${pages}`,
      `<h3>Where visitors came from</h3>${sources}
       <h3>Countries</h3>${countries}
       <h3>Download clicks</h3>${clicksTable(blog.clicks, blog.projects)}
       <h3>Blog posts</h3>${blogTable(blog.posts, blog.views, blog.now)}`
    )}`;
}

// Ranked by what it costs you, worst first, and split in two: a download button that doesn't
// work and a project without screenshots are not the same kind of problem, and one flat list
// gave them the same weight. The heading and the wording carry the split — the ⚠ and the amber
// only reinforce something already legible in greyscale.
//
// Each item names the fix, not just the fault, and carries a key per problem it reports so the
// page can say how long each has been open (history.attention, below). `html` is a function of
// that age label because the label is only known once history has been read.
function attentionItems(rows, health) {
  const items = [];
  // `n` is how many things this line is really about, not how many lines there are: "no
  // screenshots" is one bullet covering thirteen projects, and a group heading reading "(1)"
  // said thirteen projects' worth of work was one thing to do.
  const add = (now, rank, n, keys, html) => items.push({ now, rank, n, keys, html });
  const link = (url, text) => `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(text)}</a>`;
  const osList = (pls) => pls.map((p) => OS_LABEL[p]).join(", ");

  // Worst thing on the page: a release went out without a build an earlier release had, so a
  // button that used to start the app now hands the visitor source code. Every one of these is
  // losing a download today.
  for (const r of rows.filter((x) => x.lostAssets.length)) {
    const tag = r.latestTag || "the latest release";
    add(
      true,
      1,
      r.lostAssets.length,
      r.lostAssets.map((pl) => `dl-lost:${r.slug}:${pl}`),
      (since) =>
        `<strong>${esc(r.name)}</strong>: ${esc(tag)} has no ${osList(r.lostAssets)} file, though
         an earlier release had one — so that button now hands visitors
         ${r.project.homepage ? "the project's homepage" : "the source code"} instead of the app.
         Fix: attach the ${osList(r.lostAssets)} build to ${link(r.releasesUrl, tag)}. ${since}`
    );
  }
  // A live page failing the visitors least able to work around it. The build doesn't stop for
  // this: it substitutes "<project> screenshot", which describes nothing, so the image is
  // announced and still says nothing about what it shows.
  if (health.missingAlt.length) {
    add(
      true,
      2,
      health.missingAlt.length,
      health.missingAlt.map((s) => `alt:${s}`),
      (since) =>
        `<strong>Missing alt text</strong> on ${health.missingAlt.length} screenshot(s) — the
         page ships a generic description instead, which tells a screen-reader visitor nothing:
         ${health.missingAlt.map(esc).join("; ")}. Fix: give each an <code>alt</code> in
         <code>src/projects.json</code> saying what it shows. ${since}`
    );
  }
  // Reachable only from GitHub. Costing you something, but nobody arrived expecting them.
  for (const r of rows.filter((x) => x.unexplained.length)) {
    add(
      true,
      3,
      r.unexplained.length,
      r.unexplained.map(([n]) => `extra:${r.slug}:${n}`),
      (since) =>
        `<strong>${esc(r.name)}</strong> ships release files that are neither an OS download
         nor a signature/checksum/source archive, so nobody can get them from the site:
         ${r.unexplained.map(([n, c]) => `${esc(n)} (${num(c)})`).join(", ")}. Fix: put the OS in
         the file name, or teach <code>ASSET_PAT</code> / <code>isCompanionFile</code> in
         <code>lib/github.mjs</code> what it is. ${since}`
    );
  }
  // The weekly post did not go out. Nothing is lost that the next run won't cover, so it
  // ranks below everything costing downloads — but a stop repeats every week until someone
  // reads why. Eight days without any run means the timer itself has stopped firing.
  const run = health.weekly;
  if (run && !run.unreadable) {
    if (run.outcome === "stopped") {
      add(true, 4, 1, ["weekly:stopped"], (since) =>
        `<strong>The weekly post stopped</strong>: ${esc(run.detail || "no reason recorded")}.
         Fix: clear that, then run <code>scripts/weekly-post.sh</code>. ${since}`);
    } else if (Date.now() - new Date(run.at) > 8 * DAY) {
      add(true, 4, 1, ["weekly:stale"], (since) =>
        `<strong>The weekly post has not run for over a week</strong> — check
         <code>systemctl --user status ants-weekly-post.timer</code>. ${since}`);
    }
  }
  // A roadmap backup job failed or has stopped running. Nothing visible to visitors, but the
  // roadmaps are every project's plans, and a backup that quietly stopped is found only when
  // it is needed. Same rank as the weekly post: it costs no downloads.
  for (const b of health.backups.filter((x) => !x.missing && !x.unreadable)) {
    if (b.error) {
      add(true, 4, 1, [`backup:${b.job}:failed`], (since) =>
        `<strong>${esc(b.label)} failed</strong>: ${esc(b.error.replace(/\.$/, ""))}. Last success:
         ${b.success ? esc(new Date(b.success).toLocaleString("en-GB")) : "never"}. Fix: clear
         that, then run <code>systemctl --user start ${esc(b.unit)}.service</code>. ${since}`);
    } else if (Date.now() - new Date(b.success) > BACKUP_STALE) {
      add(true, 4, 1, [`backup:${b.job}:stale`], (since) =>
        `<strong>${esc(b.label)} has not run for over two days</strong> — check
         <code>systemctl --user status ${esc(b.unit)}.timer</code>. ${since}`);
    }
  }
  // Nothing is broken below this line — a thinner page, and some tidying.
  //
  // A claimed OS no release has EVER shipped a file for. The button says "Download source",
  // which is true, and for a project with no packaged build yet that is the documented way to
  // run it — incomplete, not broken. A `homepage` answers it outright (an upstream download
  // page, Flathub), so a project with one is not listed.
  for (const r of rows) {
    const never = r.missingAssets.filter((pl) => !r.lostAssets.includes(pl));
    if (!never.length || r.project.homepage) continue;
    add(
      false,
      3,
      never.length,
      never.map((pl) => `dl-never:${r.slug}:${pl}`),
      (since) =>
        `<strong>${esc(r.name)}</strong> has never shipped a ${osList(never)} file, so its button
         offers the source code. Fix: attach a build to a release
         (${link(r.releasesUrl, r.latestTag || "releases")}), set <code>homepage</code> in
         <code>src/projects.json</code> to where the real download lives, or drop
         ${osList(never)} from its <code>platforms</code>. ${since}`
    );
  }
  // Visitor figures that could not be read. The Visitors tab says why and what to check;
  // this line is here so nobody has to open that tab to learn the figures are missing.
  if (health.gaDown) {
    add(
      true,
      9,
      1,
      ["ga:read"],
      (since) =>
        `<strong>Google Analytics could not be read</strong>, so the Visitors tab shows no
         figures: ${esc(gaError || "unknown error")}. Fix: the Visitors tab says what to check.
         ${since}`
    );
  }
  if (health.noShots.length) {
    add(
      false,
      4,
      health.noShots.length,
      health.noShots.map((name) => `shots:${name}`),
      (since, ageOf) =>
        `<strong>No screenshots</strong> on ${health.noShots.length} project(s):
         ${health.noShots.map((name) => `${esc(name)} ${ageOf(`shots:${name}`)}`).join(", ")}.
         Fix: ask each project's session for 2–4 stills —
         <code>src/assets/img/shots/README.md</code> has the rules.`
    );
  }
  if (health.orphanShots.length) {
    add(
      false,
      5,
      health.orphanShots.length,
      health.orphanShots.map((f) => `orphan:${f}`),
      (since) =>
        `<strong>Unused image files</strong> (${health.orphanShots.length}) in
         <code>src/assets/img/shots/</code>:
         ${health.orphanShots.map(esc).join(", ")}. Fix: list each in a project's
         <code>screenshots</code>, or delete it. ${since}`
    );
  }
  // Open issues and pull requests are not faults, so they get a group of their own (`now: null`): ones
  // others have sent to the project wait on you, and a fork's own sent to the original wait
  // on its maintainer.
  const prLinks = (list) => list.map((x) => link(x.url, `#${x.n} ${x.title}`)).join("; ");
  const all = [...rows, ...(health.unreleased || [])];
  for (const r of all.filter((x) => x.issueList.length)) {
    add(null, 0, r.issueList.length, [`issue:${r.slug}`], (since) =>
      `<strong>${esc(r.name)}</strong> has ${r.issueList.length} open issue(s) logged:
       ${prLinks(r.issueList)}. ${since}`);
  }
  for (const r of all.filter((x) => x.prList.length)) {
    add(null, 1, r.prList.length, [`pr:${r.slug}`], (since) =>
      `<strong>${esc(r.name)}</strong> has ${r.prList.length} open pull request(s) waiting for
       you: ${prLinks(r.prList)}. ${since}`);
  }
  for (const r of all.filter((x) => x.upstreamPrs?.length)) {
    add(null, 2, r.upstreamPrs.length, [`pr-up:${r.slug}`], (since) =>
      `<strong>${esc(r.name)}</strong>: ${r.upstreamPrs.length} of your pull request(s) to
       ${esc(r.project.upstream)} are open, waiting for its maintainer:
       ${prLinks(r.upstreamPrs)}. ${since}`);
  }
  return items;
}

// When each open problem was first reported, key → ISO time. A problem that goes away is
// dropped, so one that comes back starts again as new. A project whose fetch failed this run
// reported nothing either way, so its download and release-file keys are carried over rather
// than dropped: a failed fetch must not read as a fix, the same discipline the download
// snapshots keep.
function updateAttention(history, items, rows, now) {
  const prev = history.attention || {};
  const fetched = new Set(rows.filter((r) => r.ok).map((r) => r.slug));
  const searchFailed = new Set(rows.filter((r) => r.ok && r.upstreamPrs === null).map((r) => r.slug));
  const next = {};
  for (const key of items.flatMap((i) => i.keys)) next[key] = prev[key] || new Date(now).toISOString();
  for (const [key, at] of Object.entries(prev)) {
    const [kind, slug] = key.split(":");
    if (["dl-lost", "dl-never", "extra", "issue", "pr", "pr-up"].includes(kind) && !fetched.has(slug)) next[key] ??= at;
    if (kind === "pr-up" && searchFailed.has(slug)) next[key] ??= at;
  }
  history.attention = next;
}

function issuesSection(rows, health, seen = {}, now = Date.now()) {
  const items = attentionItems(rows, health);

  const ageOf = (key) => {
    const d = daysSince(seen[key], now);
    if (d === null) return "";
    const when = d === 0 ? "today" : d === 1 ? "yesterday" : `${d} days ago`;
    return `<span class="age">(first noticed ${when})</span>`;
  };
  // An item covering several problems reports its oldest: that is how long it has been open.
  const since = (keys) => {
    const dated = keys.filter((k) => seen[k]).sort((a, b) => Date.parse(seen[a]) - Date.parse(seen[b]));
    return dated.length ? ageOf(dated[0]) : "";
  };

  // An empty group is left out rather than shown as a heading with nothing under it: "Broken
  // now (0)" is a thing to read and dismiss, and the good news is that it isn't there.
  const group = (isNow, label) => {
    const list = items.filter((i) => i.now === isNow).sort((a, b) => a.rank - b.rank);
    if (!list.length) return "";
    const n = list.reduce((t, i) => t + i.n, 0);
    return `<h3 class="issues-h${isNow ? " issues-h--now" : ""}">${label}
      <span class="count">(${n})</span></h3>
      <ul class="issues">${list.map((i) => `<li>${i.html(since(i.keys), ageOf)}</li>`).join("")}</ul>`;
  };

  return (
    (items.some((i) => i.now !== null) ? "" : `<p class="note ok">Nothing needs fixing. ✓</p>`) +
    group(true, "⚠ Broken now") +
    group(false, "Incomplete") +
    group(null, "Open issues and pull requests") +
    siteContent(health, now)
  );
}

// What used to be its own Content tab: every project by status, by name, so "3 wip" says
// which three. Statuses in the order a project moves through them; anything else after.
const STATUS_ORDER = ["live", "beta", "wip", "soon"];

function siteContent(health, now) {
  const statuses = Object.keys(health.namesByStatus).sort(
    (a, b) => (STATUS_ORDER.indexOf(a) + 1 || 99) - (STATUS_ORDER.indexOf(b) + 1 || 99)
  );
  const rows = statuses
    .map((st) => {
      const names = health.namesByStatus[st];
      return `<li><strong>${esc(st)}</strong> (${names.length}): ${names.map(esc).join(", ")}</li>`;
    })
    .join("");
  return `<h3>Site content</h3>
    <ul class="issues">${rows}</ul>
    <p class="chips">${tallyList(health.byCategory)}</p>
    ${
      health.noRepo.length
        ? `<p class="note">Unpublished (no repo yet): ${health.noRepo.map(esc).join(", ")}.</p>`
        : ""
    }
    ${weeklyLine(health.weekly, now)}
    ${backupLines(health.backups, now)}`;
}

function tallyList(obj) {
  return Object.entries(obj)
    .map(([k, v]) => `<span class="chip">${esc(k)} <strong>${v}</strong></span>`)
    .join("");
}

function page({ rows, history, trends, base, health, projects, now, elapsed, ga, propertyId, posts, postViews, clicks, obs }) {
  const ok = rows.filter((r) => r.ok);
  const grand = ok.reduce((s, r) => s + r.total, 0);
  const stars = ok.reduce((s, r) => s + r.stars, 0);
  const views = ok.reduce((s, r) => s + (r.traffic?.views || 0), 0);
  // Say "earlier today" rather than rounding a 40-minute-old baseline up to "1 day ago".
  const baseGap = base ? now - Date.parse(base.at) : null;
  const baseAge =
    baseGap == null ? null : baseGap < DAY ? "earlier today" : ago(Math.round(baseGap / DAY));
  // Only projects whose record covers the whole week; the tile says so when that isn't all
  // of them, because a total quietly missing a project reads as a quiet week.
  const week = windowTotal(rows, history, 7);
  // The same repos and lists Notifications reads, so a tile and that tab never disagree.
  const repos = [...ok, ...(health.unreleased || [])];
  const count = (key) => repos.reduce((s, r) => s + (r[key]?.length || 0), 0);
  const upstream = count("upstreamPrs");
  const series = trendSeries(history, trends, now);
  const spark = (key) =>
    sparkline((series[key] || []).slice(-30).map((p) => p.value).filter((v) => v != null));
  // Each tile opens the tab that explains it; without the script it is a jump to that heading.
  const tiles = [
    ["Total downloads", num(grand), base ? delta(grand, sumOf(base, osTotal)) : "", "dl", spark("downloads")],
    [
      "Downloads (7d)",
      week ? num(week.count) : "—",
      week ? (week.of < week.all ? `${week.of} of ${week.all} projects on record` : "") : "needs two runs",
      "dl",
      spark("dlDaily"),
    ],
    ["Stars", num(stars), base ? delta(stars, sumOf(base, "stars")) : "", "act"],
    ["Repo views (14d)", hasToken ? num(views) : "—", "", "tr", spark("views")],
    ["Projects", String(projects.length), `${health.byStatus.live || 0} live`, "proj"],
    ["Open issues", num(count("issueList")), "", "att"],
    ["Open PRs", num(count("prList")), upstream ? `+${upstream} of yours upstream` : "", "att"],
  ]
    .map(
      ([label, value, sub, tab, line = ""]) =>
        `<a class="tile tile--link" href="#h-${tab}" data-tab="${tab}"><span class="tile__label">${label}</span>
         <span class="tile__value">${value}</span><span class="tile__sub">${sub}</span>${line}</a>`
    )
    .join("");
  const waiting = attentionItems(ok, health).reduce((t, i) => t + i.n, 0);

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Ants Projects Hub — private stats</title>
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="site.css">
<link rel="stylesheet" href="dashboard.css">
<script src="dashboard.js" defer></script>
</head>
<body class="admin" id="top">
<nav class="topnav" aria-label="Sections">
  <a class="topnav__brand" href="#top"><img src="favicon.svg" alt="" width="32" height="32">Private stats</a>
  <ul class="topnav__list">${NAV.map(
    ([sec, id, label]) =>
      `<li><a href="#${id}" data-sec="${sec}">${label}${
        sec === "att" && waiting ? ` <span class="badge"><span class="sr-only">, </span>${waiting}<span class="sr-only"> items</span></span>` : ""
      }</a></li>`
  ).join("")}</ul>
  <div class="tools" id="tools" hidden>
    <label class="find"><span class="sr-only">Find a project on this tab</span>
      <input type="search" id="find" placeholder="Find a project  ( / )" autocomplete="off"></label>
    <span id="find-msg" class="find-msg" role="status"></span>
    <span class="sizer" role="group" aria-label="Text size">
      <button type="button" id="size-down" class="btn-tool" aria-label="Smaller text">A−</button>
      <button type="button" id="size-up" class="btn-tool" aria-label="Larger text">A+</button>
    </span>
    <button type="button" id="help-open" class="btn-tool" aria-label="Keyboard shortcuts">?</button>
  </div>
  <button type="button" id="refresh" class="btn-refresh" data-took="${elapsed}" hidden>Refresh now</button>
  <span id="refresh-msg" class="refresh-msg" role="status"></span>
</nav>
<main class="wrap">
  <header class="head">
    <h1 class="sr-only">Private stats</h1>
    <p class="sub">Last updated
      <span id="updated" data-at="${new Date(now).toISOString()}">${new Date(now).toLocaleString(
    "en-GB"
  )}</span> · took ${elapsed}s ·
      ${AUTH_LABEL[tokenSource]} ·
      ${history.snapshots.length} snapshot(s) recorded${
        baseAge ? ` · change shown vs ${baseAge}` : " · change appears from the second run"
      }</p>
  </header>

  ${gapBanner(history, now)}
  ${incompleteBanner(rows)}

  <section aria-labelledby="h-sum"><h2 id="h-sum" class="sr-only">Summary</h2>
    <div class="tiles">${tiles}</div></section>

  <section class="sec" data-sec="ov" aria-labelledby="h-ov"><h2 id="h-ov">Overview</h2>
    ${overviewSection({ rows, ok, history, base, baseAge, health, now, ga, obs, series })}</section>

  <section class="sec" data-sec="proj" aria-labelledby="h-proj"><h2 id="h-proj">Projects</h2>
    ${projectsSection(rows, history, obs, now)}</section>

  <section class="sec" data-sec="att" aria-labelledby="h-att"><h2 id="h-att">Notifications</h2>
    ${issuesSection(ok, health, history.attention, now)}</section>

  <section class="sec" data-sec="dl" aria-labelledby="h-dl"><h2 id="h-dl">Downloads</h2>
    ${cols(
      `<h3>All time, by operating system</h3>${downloadsTable(rows, history, base)}`,
      `<h3>The last 7 and 30 days</h3>${recentDownloads(rows, history, now)}
       <h3>openSUSE installs and updates</h3>${obsTable(obs)}`
    )}</section>

  <section class="sec" data-sec="ga" aria-labelledby="h-ga"><h2 id="h-ga">Site visitors</h2>
    ${analyticsSection(ga, propertyId, { posts, views: postViews, now, clicks, projects })}</section>

  <section class="sec" data-sec="tr" aria-labelledby="h-tr"><h2 id="h-tr">Repo traffic</h2>
    ${cols(
      `<h3>Last 14 days, live from GitHub</h3>${trafficSection(ok)}`,
      `<h3>The longer record, from your archive</h3>${archiveTraffic(rows, history, now)}`
    )}</section>

  <div class="cols cols--tail">
  <section class="sec" data-sec="act" aria-labelledby="h-act"><h2 id="h-act">Audience &amp; activity</h2>
    ${activityTable(ok, now)}</section>

  <section class="sec" data-sec="rel" aria-labelledby="h-rel"><h2 id="h-rel">Recent releases</h2>
    ${releasesTable(ok)}</section>
  </div>

  <section class="sec" data-sec="trend" aria-labelledby="h-trend"><h2 id="h-trend">Trends</h2>
    <p class="note">Each figure day by day, from the history this dashboard keeps. Today is left
      out until it is over; a gap is a day with no figure, never a zero.</p>
    ${trendsSection(history, trends, now)}</section>

  <footer class="foot">Local file — never published. Regenerate with
    <code>npm run stats</code>.</footer>
</main>
<dialog id="help" class="help" aria-labelledby="help-h">
  <h2 id="help-h">Keyboard shortcuts</h2>
  <dl class="keys">
    <dt><kbd>1</kbd> to <kbd>9</kbd></dt><dd>Open that tab, counting from the left</dd>
    <dt><kbd>/</kbd></dt><dd>Find a project; <kbd>Esc</kbd> clears it</dd>
    <dt><kbd>+</kbd> <kbd>-</kbd></dt><dd>Larger or smaller text</dd>
    <dt><kbd>r</kbd></dt><dd>Refresh the figures</dd>
    <dt><kbd>?</kbd></dt><dd>This list</dd>
  </dl>
  <p class="sub">Click a column heading to sort by it, and again to reverse. Hover over a chart to
    read a day's figure. Each table's caption has a link that saves it for a spreadsheet.</p>
  <form method="dialog"><button class="btn-refresh">Close</button></form>
</dialog>
</body>
</html>
`;
}

// ------------------------------------------------------------- overview and projects

const ago = (days) => (days === 0 ? "today" : days === 1 ? "yesterday" : `${num(days)} days ago`);
const maxBy = (list, pick) => list.reduce((best, x) => (best === null || pick(x) > pick(best) ? x : best), null);
const panel = (title, body, cls = "") => `<article class="panel ${cls}"><h3>${title}</h3>${body}</article>`;
const tabLink = (tab, text) => `<a class="more" href="#h-${tab}" data-tab="${tab}">${text} →</a>`;

// One bar per operating system, in proportion. The words under it carry every figure, so the
// colours only help the eye.
function osShare(downloads) {
  const total = OS_KEYS.reduce((t, k) => t + downloads[k], 0);
  if (!total) return "";
  const percent = (k) => `${Math.round((downloads[k] / total) * 100)}%`;
  return `<div class="share" aria-hidden="true">${OS_KEYS.filter((k) => downloads[k])
    .map((k) => `<span class="os--${k}" style="width:${share(downloads[k], total)}"></span>`)
    .join("")}</div>
    <ul class="share__key">${OS_KEYS.filter((k) => downloads[k])
      .map((k) => `<li class="os--${k}"><strong>${OS_LABEL[k]}</strong> ${num(downloads[k])} <span class="dim">(${percent(k)})</span></li>`)
      .join("")}</ul>`;
}

// A week against the week before, for every daily series there is. Change shows only when both
// weeks are whole: a percentage over a short week is a false fall.
function weekTable(series) {
  const floor = '<span class="dim"> *</span>';
  const lines = [
    ["GitHub downloads", "dlDaily", ""],
    ["Repo views", "views", ""],
    ["Repo clones", "clones", ""],
    ["openSUSE downloads", "obs", ""],
    ["Site visitors, each day added up", "visitors", floor],
    ["Blog views", "posts", floor],
    ["Download clicks", "clicks", floor],
  ];
  const week = (w) =>
    `${num(w.total)}${w.days < 7 ? `<br><span class="dim">${w.days} of 7 days</span>` : ""}`;
  const body = lines
    .map(([label, key, mark]) => {
      const c = compareWeeks(series[key]);
      if (!c) {
        return `<tr><th scope="row">${label}${mark}</th><td class="n dim" colspan="3">no figures this week</td></tr>`;
      }
      const whole = c.now.days === 7 && c.before.days === 7 && c.before.total > 0;
      const change = whole ? Math.round(((c.now.total - c.before.total) / c.before.total) * 100) : null;
      const shown =
        change === null || change === 0
          ? '<span class="dim">—</span>'
          : `<span class="d ${change > 0 ? "d--up" : "d--down"}">${change > 0 ? "▲ +" : "▼ −"}${num(Math.abs(change))}%</span>`;
      return `<tr><th scope="row">${label}${mark}</th><td class="n strong">${week(c.now)}</td>
        <td class="n">${c.before.days ? week(c.before) : '<span class="dim">no figures</span>'}</td><td class="n">${shown}</td></tr>`;
    })
    .join("");
  return `<table class="tbl tbl--plain"><thead><tr><th scope="col">Figure</th><th scope="col" class="n">Last 7 days</th>
    <th scope="col" class="n">Week before</th><th scope="col" class="n">Change</th></tr></thead><tbody>${body}</tbody></table>
    <p class="fine">Whole days only, ending yesterday. * Only visitors who accepted analytics are counted, so these are floors.</p>`;
}

function overviewSection({ rows, ok, history, base, baseAge, health, now, ga, obs, series }) {
  // --- what needs doing
  const items = attentionItems(ok, health);
  const countOf = (state) => items.filter((i) => i.now === state).reduce((t, i) => t + i.n, 0);
  const broken = items.filter((i) => i.now === true).sort((a, b) => a.rank - b.rank);
  const attention = panel(
    "Needs your attention",
    `${
      broken.length
        ? `<p class="issues-h issues-h--now">⚠ Broken now</p><ul class="issues">${broken
            .map((i) => `<li>${i.html("", () => "")}</li>`)
            .join("")}</ul>`
        : '<p class="good">✓ Nothing is broken.</p>'
    }
    <p class="counts"><strong>${num(countOf(false))}</strong> incomplete · <strong>${num(countOf(null))}</strong> waiting on a pull request or issue</p>
    ${tabLink("att", "All notifications")}`
  );

  // --- the week's downloads, biggest first
  const span = recordSpan(history);
  const weekly = rows
    .map((r) => ({ r, w: windowDownloads(history, r.slug, 7) }))
    .filter(({ w }) => w && w.count > 0)
    .sort((a, b) => b.w.count - a.w.count);
  const topWeek = weekly[0]?.w.count || 0;
  // Signature and checksum files rising with the app's is the sign that separated a sweep from
  // real interest in October 2026: people fetch the app, robots fetch everything.
  const swept = ({ w }) => w.other != null && w.other >= 5 && w.other >= w.count / 2;
  const rank = weekly.length
    ? `<ul class="bars filterable">${weekly
        .slice(0, 10)
        .map(
          (x) => `<li><span class="bars__name">${esc(x.r.name)}</span>
          <span class="bars__track" aria-hidden="true"><span style="width:${share(x.w.count, topWeek)}"></span></span>
          <span class="bars__value">${num(x.w.count)}${isShort(x.w, Math.min(7, span)) ? ` <span class="dim">(${Math.round(x.w.covered)} d)</span>` : ""}</span>
          ${swept(x) ? `<span class="bars__note">+${num(x.w.other)} other files too</span>` : ""}</li>`
        )
        .join("")}</ul>
      ${
        weekly.some(swept)
          ? `<p class="fine">Other files are signatures, checksums and source archives. When they rise with the app's own files, it is often an automated sweep, not people. GitHub does not say who downloads.</p>`
          : ""
      }`
    : '<p class="fine">No downloads on record in the last 7 days.</p>';

  // --- operating systems, across everything fetched this run
  const allOs = Object.fromEntries(OS_KEYS.map((k) => [k, ok.reduce((t, r) => t + r.downloads[k], 0)]));
  const counted = obs.filter((o) => o.d30 != null);
  const obs30 = counted.reduce((t, o) => t + o.d30, 0);

  // --- what moved since the comparison reading
  const moved = ok
    .map((r) => ({ r, was: base?.projects[r.slug] }))
    .filter(({ r, was }) => was && r.total !== osTotal(was))
    .sort((a, b) => b.r.total - osTotal(b.was) - (a.r.total - osTotal(a.was)));
  const change = !base
    ? '<p class="fine">Change appears from the second run.</p>'
    : moved.length
      ? `<ul class="plain filterable">${moved
          .slice(0, 8)
          .map(({ r, was }) => `<li>${esc(r.name)} ${delta(r.total, osTotal(was))}</li>`)
          .join("")}</ul>
        ${moved.length > 8 ? `<p class="fine">and ${moved.length - 8} more.</p>` : ""}
        <p class="fine">Compared with the reading from ${esc(baseAge)}.</p>`
      : `<p class="fine">No project's downloads have changed since ${esc(baseAge)}.</p>`;

  // --- the newest releases, across every project
  const releases = ok
    .flatMap((r) => r.perRelease.filter((x) => x.at).map((x) => ({ ...x, name: r.name })))
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
    .slice(0, 8);
  const releaseList = releases.length
    ? `<ul class="plain filterable">${releases
        .map(
          (x) => `<li><strong>${esc(x.name)}</strong> ${esc(x.tag)}${x.prerelease ? ' <span class="flag">pre</span>' : ""}
          <span class="dim">${ago(daysSince(x.at, now))} · ${num(x.total)} download${x.total === 1 ? "" : "s"}</span></li>`
        )
        .join("")}</ul>`
    : '<p class="fine">No releases published yet.</p>';

  // --- plain facts; a fact with no figure behind it is left out
  const released = ok.filter((r) => r.latestAt);
  const committed = ok.filter((r) => r.pushedAt);
  const quiet = rows.filter((r) => {
    const w = windowDownloads(history, r.slug, 30);
    return w && w.count === 0 && !isShort(w, Math.min(30, span));
  });
  const top = maxBy(ok, (r) => r.total);
  const oldRelease = maxBy(released, (r) => daysSince(r.latestAt, now));
  const oldCommit = maxBy(committed, (r) => daysSince(r.pushedAt, now));
  const topPage = ga?.pages.find((p) => p.pagePath !== "/");
  const topCountry = ga?.countries.find((c) => c.country);
  const topSource = ga?.sources[0];
  const busyDay = ga?.daily.length ? maxBy(ga.daily, (d) => d.screenPageViews) : null;
  const first = history.snapshots[0];
  const facts = [
    top && ["Most downloaded ever", `${esc(top.name)}, ${num(top.total)}`],
    weekly[0] && ["Busiest this week", `${esc(weekly[0].r.name)}, ${num(weekly[0].w.count)}`],
    oldRelease && ["Longest since a release", `${esc(oldRelease.name)}, ${ago(daysSince(oldRelease.latestAt, now))}`],
    oldCommit && ["Longest since a commit", `${esc(oldCommit.name)}, ${ago(daysSince(oldCommit.pushedAt, now))}`],
    quiet.length && [
      "No downloads in 30 days",
      `${quiet.length}: ${quiet.slice(0, 4).map((r) => esc(r.name)).join(", ")}${quiet.length > 4 ? ` and ${quiet.length - 4} more` : ""}`,
    ],
    topPage && ["Most-read page", `${esc(topPage.pagePath)}, ${num(topPage.screenPageViews)} views`],
    topSource && ["Most visits came from", `${esc(topSource.sessionSource || "unknown")}, ${num(topSource.sessions)} sessions`],
    topCountry && ["Most visitors in", `${esc(topCountry.country)}, ${num(topCountry.activeUsers)}`],
    busyDay && ["Busiest day on the site", `${gaDay(busyDay.date)}, ${num(busyDay.screenPageViews)} page views`],
    first && ["History kept since", `${dayYear(dayKey(Date.parse(first.at)))}, ${num(history.snapshots.length)} readings`],
  ].filter(Boolean);
  const factList = `<dl class="facts">${facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}</dl>`;

  const recent = (key) => (series[key] || []).slice(-60);
  return `<div class="grid3">
      ${attention}
      ${panel("This week against last", weekTable(series))}
      ${panel("At a glance", factList)}
      ${panel("Most downloaded this week", rank + tabLink("dl", "All downloads"))}
      <div class="stack">
        ${panel(
          "Downloads by system, all time",
          osShare(allOs) +
            (counted.length ? `<p class="fine">Plus ${num(obs30)} openSUSE package downloads in the last 30 days, counted separately.</p>` : "")
        )}
        ${panel("Since the last comparison", change)}
      </div>
      ${panel("Latest releases", releaseList + tabLink("rel", "All releases"))}
    </div>
    <div class="charts charts--ov">
      ${lineChart({ id: "ov-dl", title: "GitHub downloads per day, last 60 days", points: recent("dlDaily"), note: DAILY_NOTE })}
      ${lineChart({ id: "ov-vis", title: "Site visitors per day, last 60 days", points: recent("visitors"), note: "Only visitors who accepted analytics are counted, so this is a floor, not a total." })}
    </div>`;
}

// One card per published project, holding what is otherwise spread over five tabs. A project
// whose fetch failed says so, and shows no figures rather than zeros.
function projectsSection(rows, history, obs, now) {
  const obsOf = Object.fromEntries(obs.map((o) => [o.slug, o]));
  const age = (iso) => (iso ? ago(daysSince(iso, now)) : '<span class="dim">never</span>');
  const cards = rows
    .map((r) => {
      const site = `${ORIGIN}/p/${encodeURIComponent(r.slug)}.html`;
      const siteLink = `<a href="${esc(site)}" target="_blank" rel="noopener">${esc(r.name)}</a>`;
      const repo = `https://github.com/${r.repo}`;
      if (!r.ok) {
        return `<article class="pcard pcard--missing" data-name="${esc(r.name.toLowerCase())}" data-total="-1" data-week="-1" data-stars="-1" data-rel="0" data-commit="0">
          <h3>${siteLink}</h3><p class="dim">No data this run.</p></article>`;
      }
      const [w7, w30] = WINDOWS.map((d) => windowDownloads(history, r.slug, d));
      const trend = history.snapshots.map((s) => (s.projects[r.slug] ? osTotal(s.projects[r.slug]) : null)).filter((v) => v != null);
      const windowed = (w) => (w ? (w.count < 0 ? `−${num(-w.count)}` : num(w.count)) : '<span class="dim">no data</span>');
      const o = obsOf[r.slug];
      return `<article class="pcard" data-name="${esc(r.name.toLowerCase())}" data-total="${r.total}" data-week="${w7?.count ?? -1}"
        data-stars="${r.stars}" data-rel="${r.latestAt ? Date.parse(r.latestAt) : 0}" data-commit="${r.pushedAt ? Date.parse(r.pushedAt) : 0}">
        <header class="pcard__head"><h3>${siteLink}</h3>
          <span class="chip">${esc(r.project?.status || "")}</span>${r.archived ? '<span class="flag">archived</span>' : ""}
          <span class="pcard__ver">${r.latestTag ? esc(r.latestTag) : '<span class="dim">no release</span>'}</span></header>
        <div class="pcard__nums">
          <div><strong>${num(r.total)}</strong><span>all time</span></div>
          <div><strong>${windowed(w7)}</strong><span>7 days</span></div>
          <div><strong>${windowed(w30)}</strong><span>30 days</span></div>
        </div>
        ${sparkline(trend)}
        ${osShare(r.downloads)}
        <dl class="facts facts--tight">
          <div><dt>Released</dt><dd>${age(r.latestAt)}</dd></div>
          <div><dt>Last commit</dt><dd>${age(r.pushedAt)}</dd></div>
          <div><dt>Repo views, 14 days</dt><dd>${r.traffic ? num(r.traffic.views) : '<span class="dim">no data</span>'}</dd></div>
          ${o?.d30 != null ? `<div><dt>openSUSE, 30 days</dt><dd>${num(o.d30)}</dd></div>` : ""}
          <div><dt>Stars · forks</dt><dd>${num(r.stars)} · ${num(r.forks)}</dd></div>
          <div><dt>Issues · pull requests</dt><dd>${num(r.issueList.length)} · ${num(r.prList.length)}</dd></div>
        </dl>
        <p class="pcard__links">
          <a href="${esc(repo)}" target="_blank" rel="noopener">Repo</a>
          <a href="${esc(r.releasesUrl)}" target="_blank" rel="noopener">Latest release</a>
          <a href="${esc(`${ORIGIN}/p/${encodeURIComponent(r.slug)}/changelog.html`)}" target="_blank" rel="noopener">Changelog</a>
        </p></article>`;
    })
    .join("");
  return `<p class="pcards__tools" id="pcards-tools" hidden><label>Order by
      <select id="pcards-sort">
        <option value="total">Most downloads</option>
        <option value="week">Most downloads this week</option>
        <option value="stars">Most stars</option>
        <option value="rel">Newest release</option>
        <option value="commit">Newest commit</option>
        <option value="name">Name</option>
      </select></label></p>
    <div class="pcards" id="pcards">${cards}</div>`;
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

// A snapshot's real download total: the three OS columns, summed. Always derived, never
// read from the snapshot's own `total` — snapshots written before Other left the total
// still have it baked in, and comparing against one would show a large false drop.
function osTotal(p) {
  return OS_KEYS.reduce((s, k) => s + (p?.[k] || 0), 0);
}

// `pick` is a field name, or a function for a figure that has to be derived (osTotal).
function sumOf(snapshot, pick) {
  const get = typeof pick === "function" ? pick : (p) => p[pick] || 0;
  return Object.values(snapshot.projects).reduce((s, p) => s + get(p), 0);
}

function obsTable(obs) {
  if (!obs.length) return `<p class="note">No project has a package on the openSUSE Build Service.</p>`;
  const counted = obs.filter((o) => o.d30 != null).sort((a, b) => b.d30 - a.d30);
  const rest = obs.filter((o) => o.d30 == null);
  const why = (o) =>
    o.error
      ? "no data: openSUSE did not answer"
      : o.shared
      ? `not shown: another project also ships a package called ${esc(o.pkg)}`
      : "not counted by openSUSE yet";
  const body =
    counted
      .map(
        (o) => `<tr><th scope="row" data-sort="${esc(o.name)}">${esc(o.name)}</th>
        <td class="n" data-sort="${o.d1}">${num(o.d1)}</td>
        <td class="n" data-sort="${o.d7}">${num(o.d7)}</td>
        <td class="n strong" data-sort="${o.d30}">${num(o.d30)}</td></tr>`
      )
      .join("") +
    rest
      .map(
        (o) => `<tr class="row--missing"><th scope="row" data-sort="${esc(o.name)}">${esc(
          o.name
        )}<br><span class="dim">${why(o)}</span></th>
        ${[1, 7, 30].map(() => `<td class="n" data-sort="-1"><span class="dim">—</span></td>`).join("")}</tr>`
      )
      .join("");
  const sum = (k) => counted.reduce((s, o) => s + o[k], 0);
  return scrollTable(
    "openSUSE downloads",
    `<table class="tbl sortable" data-table="obs">
    <caption>Packages zypper fetched from the openSUSE Build Service, as openSUSE's download
      server counts them. A first install and every later update count once each, so these are
      downloads, not people. openSUSE keeps only the last 30 days, and does not say whether it
      leaves out robots.</caption>
    <thead><tr><th scope="col">Project</th><th scope="col" class="n">Last 24 hours</th>
      <th scope="col" class="n">Last 7 days</th>
      <th scope="col" class="n" aria-sort="descending">Last 30 days</th></tr></thead>
    <tbody>${body}</tbody>
    <tfoot><tr><th scope="row">All projects</th><td class="n strong">${num(sum("d1"))}</td>
      <td class="n strong">${num(sum("d7"))}</td><td class="n strong">${num(sum("d30"))}</td></tr></tfoot>
  </table>`
  );
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
  return scrollTable(
    "Recent releases",
    `<table class="tbl tbl--rel sortable" data-table="releases"><caption>Downloads by version — the five most
    recent releases of each project.</caption><thead><tr><th scope="col">Project</th>
    <th scope="col" data-nosort>Version · date · downloads</th></tr></thead>
    <tbody>${body}</tbody></table>`
  );
}

// ---------------------------------------------------------------------- the JS

// Click-to-sort, as progressive enhancement: every table already ships sorted by its most
// useful column, so the page is complete without this running. Sort keys come from
// data-sort attributes written at generation time — parsing them back out of the rendered
// text would break on thousands separators ("1,146"), units ("84d") and the delta line
// under each number ("14 ▲ +5").
// The tab icon: the site's ant (src/assets/img/favicon.svg) with a violet glow and a
// bar-chart badge, so the private page is told apart from the public site at a glance.
// The badge differs in shape as well as colour, so it does not rely on hue alone.
const ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="Private stats">
  <defs>
    <linearGradient id="ant" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#5eead4"/>
      <stop offset="0.55" stop-color="#67e8f9"/>
      <stop offset="1" stop-color="#a855f7"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.42" r="0.6">
      <stop offset="0" stop-color="#a855f7" stop-opacity="0.4"/>
      <stop offset="1" stop-color="#a855f7" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="64" height="64" rx="15" fill="#0b0b14"/>
  <rect width="64" height="64" rx="15" fill="url(#glow)"/>
  <g fill="none" stroke="#5eead4" stroke-width="2.4" stroke-linecap="round" opacity="0.95">
    <path d="M30 14 C 25 7, 21 7, 18 10"/>
    <path d="M34 14 C 39 7, 43 7, 46 10"/>
    <path d="M27 27 C 18 23, 14 21, 9 23"/>
    <path d="M27 31 C 17 31, 13 32, 8 35"/>
    <path d="M27 35 C 18 39, 14 42, 10 46"/>
    <path d="M37 27 C 46 23, 50 21, 55 23"/>
  </g>
  <g fill="url(#ant)">
    <circle cx="32" cy="18" r="6.6"/>
    <ellipse cx="32" cy="30" rx="5.6" ry="6.6"/>
    <ellipse cx="32" cy="45" rx="10.5" ry="13"/>
  </g>
  <circle cx="30" cy="17" r="1.1" fill="#0b0b14" opacity="0.55"/>
  <circle cx="34" cy="17" r="1.1" fill="#0b0b14" opacity="0.55"/>
  <rect x="36" y="36" width="26" height="26" rx="7" fill="#0b0b14"/>
  <rect x="38.5" y="38.5" width="21" height="21" rx="5" fill="#a855f7"/>
  <g fill="#ffffff">
    <rect x="42" y="50" width="3.6" height="6" rx="1"/>
    <rect x="47.2" y="45" width="3.6" height="11" rx="1"/>
    <rect x="52.4" y="41.5" width="3.6" height="14.5" rx="1"/>
  </g>
</svg>
`;

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
      var started = Date.now();
      var took = Math.round(Number(refresh.dataset.took)) || 0;
      var progress = function () {
        msg.textContent = "Fetching… " + Math.floor((Date.now() - started) / 1000) + " s" +
          (took ? " (the last run took " + took + " s)" : "");
      };
      progress();
      var counting = setInterval(progress, 1000);
      fetch("refresh", { method: "POST" })
        .then(function (r) {
          if (!r.ok) throw new Error("server said " + r.status);
          return r.json();
        })
        .then(function () { location.reload(); })
        .catch(function (e) {
          clearInterval(counting);
          refresh.disabled = false;
          msg.textContent = "Refresh failed — " + e.message;
        });
    });
  }

  // Tabs. Without this script the nav's links are ordinary anchors down one long page; with
  // it each link shows its own section and hides the rest. The summary tiles and the banners
  // sit outside every section, so they show above whichever tab is open. The open tab is
  // kept in the URL's # part, which "Refresh now" keeps across its reload, and in
  // localStorage for a fresh visit; the # part wins. A tab's # is "#tab-<key>", which names
  // no element, so the browser has nothing to jump to and the tiles stay in view; the links
  // keep their heading targets until this script rewrites them. Any older # naming
  // something inside a section (a heading, from a visit without this script) opens that
  // section's tab and is swapped for the tab form.
  var TAB_KEY = "aph-tab";
  var links = Array.prototype.slice.call(document.querySelectorAll(".topnav__list a[data-sec]"));
  var panes = {};
  Array.prototype.forEach.call(document.querySelectorAll("section[data-sec]"), function (s) {
    panes[s.getAttribute("data-sec")] = s;
  });
  if (links.length) {
    var fromHash = function () {
      var m = /^#tab-(.+)$/.exec(location.hash);
      if (m) return panes[m[1]] ? m[1] : null;
      var el = location.hash.length > 1 && document.getElementById(location.hash.slice(1));
      var sec = el && el.closest("section[data-sec]");
      return sec ? sec.getAttribute("data-sec") : null;
    };
    var show = function (k, save) {
      links.forEach(function (a) {
        var on = a.getAttribute("data-sec") === k;
        a.classList.toggle("is-current", on);
        if (on) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
      });
      Object.keys(panes).forEach(function (p) { panes[p].hidden = p !== k; });
      findStatus();
      if (save) {
        try { localStorage.setItem(TAB_KEY, k); } catch (e) {}
      }
    };
    var start = fromHash();
    if (!start) {
      try { start = localStorage.getItem(TAB_KEY); } catch (e) {}
    }
    // A remembered tab that no longer exists opens the first.
    if (!start || !panes[start]) start = links[0].getAttribute("data-sec");
    document.body.classList.add("tabbed");
    links.forEach(function (a) { a.setAttribute("href", "#tab-" + a.getAttribute("data-sec")); });
    show(start, false);
    if (location.hash && !/^#tab-/.test(location.hash) && fromHash()) {
      history.replaceState(null, "", "#tab-" + start);
      window.scrollTo(0, 0);
    }
    links.forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        show(a.getAttribute("data-sec"), true);
        history.replaceState(null, "", a.getAttribute("href"));
        window.scrollTo(0, 0);
      });
    });
    window.addEventListener("hashchange", function () {
      var k = fromHash();
      if (k) show(k, true);
    });
  }

  // A chosen sort outlives the reload. Refresh re-renders the whole page from a fresh run,
  // so without this every refresh threw the reader's order away and snapped back to the
  // server-side default. Keyed by the table's data-table name, never its position on the
  // page: adding a section above must not transplant one table's preference onto another.
  // Every access is guarded — localStorage throws outright in some privacy modes and when
  // the page is opened as a file:// URL, and a dashboard that dies there would be worse
  // than one that simply forgets.
  var SORT_KEY = "aph-sort:";
  function rememberSort(name, index, asc) {
    try {
      localStorage.setItem(SORT_KEY + name, index + ":" + (asc ? "a" : "d"));
    } catch (e) {}
  }
  function recallSort(name) {
    try {
      var raw = localStorage.getItem(SORT_KEY + name);
      if (!raw) return null;
      var bits = raw.split(":");
      var index = Number(bits[0]);
      return isNaN(index) ? null : { index: index, asc: bits[1] !== "d" };
    } catch (e) {
      return null;
    }
  }

  Array.prototype.forEach.call(document.querySelectorAll("table.sortable"), function (table) {
    var heads = Array.prototype.slice.call(table.tHead.rows[0].cells);
    var name = table.getAttribute("data-table");

    function applySort(th, i, asc, save) {
      heads.forEach(function (h) { h.removeAttribute("aria-sort"); });
      th.setAttribute("aria-sort", asc ? "ascending" : "descending");
      sort(table, i, asc ? 1 : -1);
      if (save && name) rememberSort(name, i, asc);
    }

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
        applySort(th, i, th.getAttribute("aria-sort") !== "ascending", true);
      });
    });

    // Restore last time's choice. Runs after the buttons exist so the header state matches.
    // A stored index that no longer names a sortable column — the table gained or lost one
    // since — is ignored rather than applied to whatever now sits at that position.
    var saved = name ? recallSort(name) : null;
    var target = saved ? heads[saved.index] : null;
    if (target && !target.hasAttribute("data-nosort")) {
      applySort(target, saved.index, saved.asc, false);
    }
  });

  // Tiles and "All ..." links open a tab rather than jumping down a long page.
  Array.prototype.forEach.call(document.querySelectorAll("a[data-tab]"), function (a) {
    a.addEventListener("click", function (e) {
      var tab = document.querySelector('.topnav__list a[data-sec="' + a.getAttribute("data-tab") + '"]');
      if (!tab || !document.body.classList.contains("tabbed")) return;
      e.preventDefault();
      tab.click();
    });
  });

  // Find a project: hides what does not match across every tab, and the totals rows with it,
  // since a total under a filtered list would be read as the total of what is left.
  var tools = document.getElementById("tools");
  var find = document.getElementById("find");
  var findMsg = document.getElementById("find-msg");
  var FINDABLE = ".sec table.sortable tbody tr, .pcard, .issues li, .filterable li";
  function findStatus() {
    if (!find || !findMsg) return;
    if (!find.value.trim()) { findMsg.textContent = ""; return; }
    var open = document.querySelector("section[data-sec]:not([hidden])");
    var shown = open ? open.querySelectorAll(FINDABLE) : [];
    var n = 0;
    Array.prototype.forEach.call(shown, function (el) { if (!el.hidden) n++; });
    findMsg.textContent = n + " match" + (n === 1 ? "" : "es") + " on this tab";
  }
  function applyFind() {
    var q = find.value.trim().toLowerCase();
    Array.prototype.forEach.call(document.querySelectorAll(FINDABLE), function (el) {
      el.hidden = q !== "" && el.textContent.toLowerCase().indexOf(q) === -1;
    });
    Array.prototype.forEach.call(document.querySelectorAll("table.sortable"), function (t) {
      t.classList.toggle("is-found", q !== "");
    });
    findStatus();
  }
  if (tools && find) {
    tools.hidden = false;
    find.addEventListener("input", applyFind);
    find.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { find.value = ""; applyFind(); find.blur(); }
    });
  }

  // Text size, remembered. Every size on the page is in rem, so one root value moves them all.
  var SIZES = [130, 150, 170, 190, 210];
  var SIZE_KEY = "aph-size";
  var sizeAt = 1;
  try {
    var savedSize = SIZES.indexOf(Number(localStorage.getItem(SIZE_KEY)));
    if (savedSize !== -1) sizeAt = savedSize;
  } catch (e) {}
  function applySize(step) {
    sizeAt = Math.max(0, Math.min(SIZES.length - 1, sizeAt + step));
    document.documentElement.style.fontSize = SIZES[sizeAt] + "%";
    if (step) {
      try { localStorage.setItem(SIZE_KEY, String(SIZES[sizeAt])); } catch (e) {}
    }
  }
  applySize(0);
  var sizeDown = document.getElementById("size-down");
  var sizeUp = document.getElementById("size-up");
  if (sizeDown) sizeDown.addEventListener("click", function () { applySize(-1); });
  if (sizeUp) sizeUp.addEventListener("click", function () { applySize(1); });

  // Shortcuts. Plain keys only, and never while typing or while the list is open.
  var help = document.getElementById("help");
  var helpOpen = document.getElementById("help-open");
  if (help && helpOpen) helpOpen.addEventListener("click", function () { help.showModal(); });
  document.addEventListener("keydown", function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (help && help.open) return;
    var tag = e.target && e.target.tagName;
    if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
    var k = e.key;
    if (k === "/" && find) { e.preventDefault(); find.focus(); }
    else if (k === "?" && help) { help.showModal(); }
    else if (k === "+" || k === "=") { applySize(1); }
    else if (k === "-") { applySize(-1); }
    else if (k === "r" && refresh && !refresh.hidden && !refresh.disabled) { refresh.click(); }
    else if (k >= "1" && k <= "9" && links[Number(k) - 1]) { links[Number(k) - 1].click(); }
  });

  // Projects: the cards' order, remembered.
  var pcards = document.getElementById("pcards");
  var pcardsSort = document.getElementById("pcards-sort");
  if (pcards && pcardsSort) {
    document.getElementById("pcards-tools").hidden = false;
    var CARD_KEY = "aph-cards";
    var orderCards = function () {
      var by = pcardsSort.value;
      var cards = Array.prototype.slice.call(pcards.children);
      cards.sort(function (a, b) {
        if (by === "name") return a.dataset.name.localeCompare(b.dataset.name);
        return Number(b.dataset[by]) - Number(a.dataset[by]);
      });
      cards.forEach(function (c) { pcards.appendChild(c); });
    };
    try {
      var savedOrder = localStorage.getItem(CARD_KEY);
      if (savedOrder && pcardsSort.querySelector('option[value="' + savedOrder + '"]')) pcardsSort.value = savedOrder;
    } catch (e) {}
    orderCards();
    pcardsSort.addEventListener("change", function () {
      orderCards();
      try { localStorage.setItem(CARD_KEY, pcardsSort.value); } catch (e) {}
    });
  }

  // Each sortable table's caption gets a link that saves it for a spreadsheet: the same rows in
  // the same order, with the raw figure from data-sort rather than the formatted text.
  Array.prototype.forEach.call(document.querySelectorAll("table.sortable[data-table]"), function (table) {
    if (!table.caption) return;
    var save = document.createElement("button");
    save.type = "button";
    save.className = "btn-link";
    save.textContent = "Save for a spreadsheet";
    table.caption.appendChild(document.createTextNode(" "));
    table.caption.appendChild(save);
    var field = function (cell) {
      var raw = cell.dataset.sort;
      var number = Number(raw);
      // data-sort holds the plain name or figure. The exceptions read better as shown: -1, which
      // stands for "no figure", and a date's millisecond count.
      var usable = raw !== undefined && raw !== "" && (isNaN(number) || (number >= 0 && number < 1e11));
      var text = usable ? raw : cell.textContent.trim().split(/\\s+/).join(" ");
      if (isNaN(Number(text)) && "=+-@".indexOf(text.charAt(0)) !== -1) text = "'" + text;
      return '"' + text.split('"').join('""') + '"';
    };
    save.addEventListener("click", function () {
      var lines = [];
      Array.prototype.forEach.call(table.rows, function (row) {
        if (row.parentNode.tagName === "TFOOT" || row.hidden) return;
        var parts = [];
        Array.prototype.forEach.call(row.cells, function (c) {
          parts.push(row.parentNode.tagName === "THEAD" ? '"' + c.textContent.trim().split('"').join('""') + '"' : field(c));
        });
        lines.push(parts.join(","));
      });
      var nl = String.fromCharCode(13, 10);
      var url = URL.createObjectURL(new Blob([lines.join(nl) + nl], { type: "text/csv" }));
      var a = document.createElement("a");
      a.href = url;
      a.download = table.getAttribute("data-table") + "-" + new Date().toISOString().slice(0, 10) + ".csv";
      a.click();
      URL.revokeObjectURL(url);
    });
  });

  // Charts: hover to read a day's figure. Every figure is also in the table under the chart.
  Array.prototype.forEach.call(document.querySelectorAll("svg.chart__svg[data-points]"), function (svg) {
    var pts = JSON.parse(svg.getAttribute("data-points"));
    var geo = svg.getAttribute("data-geo").split(",").map(Number);
    var NS = "http://www.w3.org/2000/svg";
    var cursor = document.createElementNS(NS, "line");
    var dot = document.createElementNS(NS, "circle");
    cursor.setAttribute("class", "chart__cursor");
    cursor.setAttribute("y1", geo[2]);
    cursor.setAttribute("y2", geo[2] + geo[3]);
    dot.setAttribute("class", "chart__dot");
    dot.setAttribute("r", 6);
    var tip = document.createElement("div");
    tip.className = "chart__tip";
    tip.hidden = true;
    svg.parentNode.style.position = "relative";
    svg.parentNode.appendChild(tip);
    svg.appendChild(cursor);
    svg.appendChild(dot);
    var off = function () { tip.hidden = true; cursor.style.display = "none"; dot.style.display = "none"; };
    off();
    svg.addEventListener("mouseleave", off);
    svg.addEventListener("mousemove", function (e) {
      var box = svg.getBoundingClientRect();
      var vb = svg.viewBox.baseVal;
      var at = ((e.clientX - box.left) / box.width) * vb.width;
      var i = pts.length > 1 ? Math.round(((at - geo[0]) / geo[1]) * (pts.length - 1)) : 0;
      i = Math.max(0, Math.min(pts.length - 1, i));
      var x = pts.length > 1 ? geo[0] + (i / (pts.length - 1)) * geo[1] : geo[0] + geo[1] / 2;
      var v = pts[i][1];
      cursor.setAttribute("x1", x);
      cursor.setAttribute("x2", x);
      cursor.style.display = "";
      if (v === null) dot.style.display = "none";
      else {
        dot.setAttribute("cx", x);
        dot.setAttribute("cy", geo[2] + geo[3] - (v / geo[4]) * geo[3]);
        dot.style.display = "";
      }
      var day = new Date(pts[i][0] + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
      tip.textContent = day + ": " + (v === null ? "no figure" : v.toLocaleString("en-GB"));
      tip.hidden = false;
      var figure = svg.parentNode.getBoundingClientRect();
      var left = box.left - figure.left + (x / vb.width) * box.width;
      tip.style.left = Math.min(left, figure.width - tip.offsetWidth) + "px";
      tip.style.top = box.top - figure.top + 4 + "px";
    });
  });
})();
`;

// --------------------------------------------------------------------- the CSS

const CSS = `/* Private dashboard — layers on the site's tokens.
   Colour here is wayfinding, not data: each section owns an --accent, and its nav link
   wears the same one. The status language is left alone — amber still means "look at
   this", teal "up", rose "down" — so the accents deliberately avoid carrying meaning.
   Accents run teal → violet along the tabs. The one exception is Notifications, amber on
   purpose: everything in it asks to be looked at. */
/* Read only on the owner's 4K monitor at 100% scaling, never a phone: every rem on the
   page scales from this base, which the A− and A+ buttons move. The column is measured in
   rem so it widens with it, up to the width of the screen. */
html { font-size: 150%; }
:root { --col: min(136rem, 100vw - 48px);
  --card: linear-gradient(180deg, rgba(255,255,255,.075), rgba(255,255,255,.04));
  --card-line: rgba(255,255,255,.13); --lift: 0 10px 34px rgba(0,0,0,.42);
  --r: 1rem; }
[hidden] { display: none !important; }
body.admin { color: var(--text); font-family: var(--font); background:
    radial-gradient(70rem 40rem at 12% -6%, rgba(94,234,212,.09), transparent 70%),
    radial-gradient(70rem 40rem at 90% -8%, rgba(196,181,253,.10), transparent 70%),
    var(--bg);
  background-attachment: fixed; }
body.admin::after { display: none; }
.wrap { width: var(--col); max-width: none; margin: 0 auto; padding: 1.1rem 0 3rem; }
.head { margin: 0 0 .9rem; }
.sub { color: var(--text-muted); margin: 0; font-size: .86rem; }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }

/* One accent per section, shared by the section and its nav link. */
[data-sec="att"] { --accent: var(--amber); }
[data-sec="ov"]  { --accent: #5eead4; }
[data-sec="proj"] { --accent: #5ee9dc; }
[data-sec="dl"]  { --accent: #62e4e4; }
[data-sec="ga"]  { --accent: #67dde8; }
[data-sec="tr"]  { --accent: #7dd3fc; }
[data-sec="act"] { --accent: #93c5fd; }
[data-sec="rel"] { --accent: #a5b4fc; }
[data-sec="trend"] { --accent: #c4b5fd; }

/* Sticky bar: glass over the page, its contents lined up with the centred column. */
.topnav { position: sticky; top: 0; z-index: 20; display: flex; align-items: center;
  flex-wrap: wrap; gap: .5rem .9rem;
  padding: .55rem calc((100vw - var(--col)) / 2);
  background: rgba(12,12,20,.82); border-bottom: 1px solid var(--card-line);
  box-shadow: 0 6px 24px rgba(0,0,0,.35);
  backdrop-filter: blur(16px) saturate(1.3); -webkit-backdrop-filter: blur(16px) saturate(1.3); }
.topnav__brand { display: inline-flex; align-items: center; gap: .5rem; font-weight: 700;
  font-size: .95rem; color: var(--text); text-decoration: none; margin-right: .3rem; }
.topnav__brand img { width: 1.5rem; height: 1.5rem; }
.topnav__list { display: flex; flex-wrap: wrap; gap: .15rem; list-style: none; margin: 0;
  padding: .2rem; background: rgba(255,255,255,.05); border: 1px solid var(--card-line);
  border-radius: 999px; }
.topnav__list a { display: block; font-size: .86rem; color: var(--text-muted);
  text-decoration: none; padding: .32rem .8rem; border-radius: 999px;
  border: 1px solid transparent; transition: background-color .12s, color .12s; }
.topnav__list a:hover { color: var(--text); background: rgba(255,255,255,.08); }
.topnav__list a:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }
/* Open tab: its own accent, plus a filled pill and bolder weight so it reads without the colour. */
.topnav__list a.is-current { color: var(--accent); border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 16%, transparent); font-weight: 700; }
.badge { display: inline-block; min-width: 1.35em; padding: 0 .35em; border-radius: 999px;
  text-align: center; font-size: .8em; font-weight: 700; color: #1a1205; background: var(--amber); }
.tools { display: flex; align-items: center; gap: .45rem; margin-left: auto; }
.find input { font: inherit; font-size: .86rem; color: var(--text); width: 15rem;
  padding: .36rem .8rem; background: rgba(255,255,255,.07);
  border: 1px solid var(--card-line); border-radius: 999px; }
.find input::placeholder { color: var(--text-dim); opacity: 1; }
.find input:focus-visible { outline: 2px solid var(--teal); outline-offset: 1px; }
.find-msg, .refresh-msg { color: var(--text-muted); font-size: .84rem; }
.sizer { display: inline-flex; gap: .15rem; }
.btn-tool { font: inherit; font-size: .86rem; font-weight: 600; color: var(--text); cursor: pointer;
  min-width: 2.1rem; padding: .32rem .5rem; background: rgba(255,255,255,.07);
  border: 1px solid var(--card-line); border-radius: 999px; }
.btn-tool:hover { background: rgba(255,255,255,.14); }
.btn-tool:focus-visible { outline: 2px solid var(--teal); outline-offset: 1px; }
.btn-refresh { font: inherit; font-size: .86rem; color: #06201c; background: var(--teal);
  border: 0; border-radius: 999px; padding: .38rem 1rem; cursor: pointer; font-weight: 700; }
.btn-refresh:hover { filter: brightness(1.1); }
.btn-refresh:focus-visible { outline: 2px solid var(--text); outline-offset: 2px; }
.btn-refresh[disabled] { opacity: .6; cursor: progress; }
.btn-link { font: inherit; color: var(--text); background: none; border: 0; padding: 0;
  cursor: pointer; text-decoration: underline; text-underline-offset: .15em; }
.btn-link:hover { color: var(--teal); }
.btn-link:focus-visible { outline: 2px solid var(--teal); outline-offset: 2px; }
#updated { color: var(--text); font-weight: 600; }
/* Amber plus the word "ago" carries the meaning — never colour alone. */
#updated.stale { color: var(--amber); }

/* Anchor jumps must clear the sticky bar. */
.sec h2 { scroll-margin-top: 5rem; }
/* Tabs (dashboard.js adds .tabbed): one section shows at a time, so the last two no longer
   share a grid and each takes the full column. */
.tabbed .cols--tail { display: block; }
.tabbed .sec { animation: rise .16s ease-out; }
@keyframes rise { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) {
  .tabbed .sec { animation: none; }
  .tile--link, .topnav__list a, .pcard { transition: none; }
}
h2 { font-size: 1.3rem; font-weight: 700; margin: 1.5rem 0 .8rem; color: var(--teal); letter-spacing: -.01em; }
/* Section heading takes its accent, with a matching rule so the colour isn't the only cue. */
.sec h2 { color: var(--accent); border-left: .2rem solid var(--accent); padding-left: .55rem; }

/* Summary tiles */
.tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr)); gap: .75rem; }
.tile { position: relative; overflow: hidden; display: flex; flex-direction: column; gap: .1rem;
  min-height: 5.6rem; padding: .75rem .95rem; color: var(--text); text-decoration: none;
  background: var(--card); border: 1px solid var(--card-line); border-radius: var(--r);
  box-shadow: var(--lift); }
.tile::before { content: ""; position: absolute; inset: 0 0 auto; height: .17rem;
  background: var(--tile-accent, var(--teal)); }
.tile:nth-child(7n+1) { --tile-accent: #5eead4; }
.tile:nth-child(7n+2) { --tile-accent: #67dde8; }
.tile:nth-child(7n+3) { --tile-accent: #7dd3fc; }
.tile:nth-child(7n+4) { --tile-accent: #93c5fd; }
.tile:nth-child(7n+5) { --tile-accent: #a5b4fc; }
.tile:nth-child(7n+6) { --tile-accent: #b4b4fd; }
.tile:nth-child(7n+7) { --tile-accent: #c4b5fd; }
.tile--link { transition: transform .12s, border-color .12s; }
.tile--link:hover { transform: translateY(-2px); border-color: var(--tile-accent); }
.tile--link:focus-visible { outline: 2px solid var(--tile-accent); outline-offset: 2px; }
.tile__label { font-size: .8rem; font-weight: 600; color: var(--text-muted); letter-spacing: .01em; }
.tile__value { font-size: 2rem; font-weight: 750; line-height: 1.15; letter-spacing: -.02em;
  font-variant-numeric: tabular-nums; }
.tile__sub { font-size: .8rem; color: var(--text-muted); min-height: 1.2em; }
.tile .spark { position: absolute; right: .9rem; top: 1.9rem; width: 40%; height: 1.9rem;
  color: var(--tile-accent); opacity: .9; }
/* Trend row under the visitor tiles: end labels flank the sparkline so the line is read
   against real dates rather than floating unanchored. */
.ga-trend { display: flex; align-items: center; gap: .6rem; margin: .8rem 0 0;
  font-size: .84rem; color: var(--text-muted); }
.ga-trend .spark { color: var(--accent); flex: none; width: 12rem; height: 1.6rem; }
.ga-trend__label { color: var(--text-dim); }

/* Overview */
.grid3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .9rem; align-items: stretch; }
.stack { display: flex; flex-direction: column; gap: .9rem; }
.stack .panel { flex: 1; }
.panel { margin: 0; padding: .95rem 1.1rem; background: var(--card); border: 1px solid var(--card-line);
  border-radius: var(--r); box-shadow: var(--lift); min-width: 0; }
.panel > h3, .sec .panel > h3 { margin: 0 0 .65rem; font-size: 1rem; font-weight: 700; color: var(--text); }
.good { margin: 0 0 .6rem; color: var(--teal); font-weight: 600; }
.counts { margin: .7rem 0 .4rem; color: var(--text-muted); font-size: .88rem; }
.counts strong { color: var(--text); }
.more { display: inline-block; margin-top: .55rem; font-size: .86rem; color: var(--text);
  text-underline-offset: .15em; }
.more:hover { color: var(--accent); }
.fine { margin: .55rem 0 0; color: var(--text-muted); font-size: .8rem; line-height: 1.45; }
.plain { list-style: none; margin: 0; padding: 0; display: grid; gap: .32rem; font-size: .88rem; }
.facts { margin: 0; display: grid; gap: .2rem; font-size: .88rem; }
.facts > div { display: flex; justify-content: space-between; gap: 1rem; padding: .22rem 0;
  border-bottom: 1px solid rgba(255,255,255,.07); }
.facts > div:last-child { border-bottom: 0; }
.facts dt { color: var(--text-muted); }
.facts dd { margin: 0; text-align: right; font-weight: 600; overflow-wrap: anywhere; }
.bars { list-style: none; margin: 0; padding: 0; display: grid; gap: .38rem; font-size: .88rem; }
.bars li { display: grid; grid-template-columns: 9.5rem minmax(0, 1fr) auto; gap: .1rem .6rem; align-items: center; }
.bars__track { height: .55rem; background: rgba(255,255,255,.07); border-radius: 999px; overflow: hidden; }
.bars__track span { display: block; height: 100%; background: var(--accent); border-radius: 999px; }
.bars__value { font-weight: 700; font-variant-numeric: tabular-nums; text-align: right; }
.bars__note { grid-column: 2 / -1; color: var(--text-muted); font-size: .8rem; }
.share { display: flex; height: .8rem; gap: 2px; border-radius: 999px; overflow: hidden; }
.share span { display: block; background: var(--os); }
.share__key { list-style: none; display: flex; flex-wrap: wrap; gap: .15rem 1rem; margin: .45rem 0 0;
  padding: 0; font-size: .86rem; }
.share__key li::before { content: ""; display: inline-block; width: .6em; height: .6em;
  margin-right: .35em; border-radius: 50%; background: var(--os); }
.charts--ov { margin-top: 1rem; }

/* Projects */
.pcards__tools { margin: 0 0 .7rem; font-size: .88rem; color: var(--text-muted); }
.pcards__tools select { font: inherit; color: var(--text); background: #1a1a22; margin-left: .4rem;
  padding: .28rem .6rem; border: 1px solid var(--card-line); border-radius: .5rem; }
.pcards__tools select:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }
.pcards { display: grid; grid-template-columns: repeat(auto-fill, minmax(26rem, 1fr)); gap: .9rem; }
.pcard { display: flex; flex-direction: column; gap: .55rem; padding: .95rem 1.1rem;
  background: var(--card); border: 1px solid var(--card-line); border-radius: var(--r);
  box-shadow: var(--lift); transition: border-color .12s; }
.pcard:hover { border-color: var(--accent); }
.pcard__head { display: flex; flex-wrap: wrap; align-items: center; gap: .3rem .55rem; }
.sec .pcard h3 { margin: 0; font-size: 1.05rem; }
.pcard h3 a { color: var(--text); text-decoration: none; }
.pcard h3 a:hover { color: var(--accent); text-decoration: underline; }
.pcard__ver { margin-left: auto; color: var(--text-muted); font-size: .86rem; font-variant-numeric: tabular-nums; }
.pcard__nums { display: grid; grid-template-columns: repeat(3, 1fr); gap: .4rem; }
.pcard__nums strong { display: block; font-size: 1.45rem; line-height: 1.15; font-variant-numeric: tabular-nums; }
.pcard__nums span { color: var(--text-muted); font-size: .8rem; }
.pcard__nums .dim { font-size: .86rem; font-weight: 400; }
.pcard .spark { width: 100%; height: 1.9rem; color: var(--accent); }
.facts--tight { font-size: .84rem; }
.pcard__links { margin: auto 0 0; padding-top: .35rem; display: flex; gap: 1.1rem; font-size: .86rem; }
.pcard__links a { color: var(--text); text-underline-offset: .15em; }
.pcard__links a:hover { color: var(--accent); }

/* Tables. border-collapse: separate, because collapse defeats the border-radius; overflow clips
   the corners. min-width is the floor the .tbl-scroll wrapper scrolls against. */
.tbl { width: 100%; min-width: 40rem; border-collapse: separate; border-spacing: 0;
  font-size: .9rem; overflow: hidden; background: var(--card);
  border: 1px solid var(--card-line); border-radius: var(--r); box-shadow: var(--lift); }
/* Without collapse the last row's own bottom border doubles up against the table's, so drop
   it where no tfoot follows (tfoot rows already carry border-bottom: 0). */
.tbl tbody:last-child tr:last-child > * { border-bottom: 0; }
/* While Find is narrowing a table, its totals row would add up what is no longer shown. */
.tbl.is-found tfoot { display: none; }
/* Wide tables scroll rather than crush. Focusable, so the region is keyboard-reachable. The
   padding keeps the table's shadow from being clipped by the scroller. */
.tbl-scroll { overflow-x: auto; padding-bottom: .8rem; }
/* Two blocks per row; minmax(0, …) lets a wide table scroll inside its half instead of
   pushing the grid wider than the column. */
.cols { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 1.4rem;
  align-items: start; }
/* A note above a table sits flush against the caption's first line, because .note carries no
   bottom margin and a caption has no top padding. */
.note + .tbl-scroll { margin-top: .75rem; }
.tbl-scroll:focus-visible { outline: 2px solid var(--teal); outline-offset: 2px; }
/* Few columns — nothing to crush, so no floor and nothing to scroll. */
.tbl--rel, .tbl--plain { min-width: 0; }
.tbl--plain { box-shadow: none; background: none; border: 0; border-radius: 0; font-size: .88rem; }
.tbl--plain th, .tbl--plain td { padding: .36rem .3rem; }
/* Every table gets a heading of its own: a dim caption is weak wayfinding, and this page is
   read by someone who needs the structure to be obvious rather than inferred from spacing. */
.sec h3 { font-size: 1rem; font-weight: 700; color: var(--text); margin: 1.3rem 0 .5rem; }

/* The caption is prose, so it must wrap to the screen rather than ride the table's min-width
   out of view: sized to the visible column, and pinned left so it stays put while the table
   scrolls under it. */
.tbl caption { caption-side: top; text-align: left; color: var(--text-muted);
  font-size: .82rem; line-height: 1.45;
  /* The table's rounded corner clips this box too, so the first line stays clear of it. */
  padding: .35rem 0 .5rem .55rem;
  position: sticky; left: 0; max-width: var(--col); }
.tbl th, .tbl td { padding: .55rem .75rem; border-bottom: 1px solid rgba(255,255,255,.08); text-align: left; }
.tbl thead th { color: var(--text-muted); background: rgba(255,255,255,.045); font-size: .82rem;
  font-weight: 600; letter-spacing: .01em; }
/* The sort control fills the header cell so the whole header is the click target. */
.tbl thead th:has(.sort-btn) { padding: 0; }
.sort-btn { font: inherit; color: inherit; letter-spacing: inherit; text-transform: inherit;
  background: none; border: 0; padding: .55rem .75rem; width: 100%; text-align: inherit;
  cursor: pointer; }
.sort-btn:hover { color: var(--text); }
.sort-btn:focus-visible { outline: 2px solid var(--teal); outline-offset: -2px; }
/* Direction is a character, not a colour — readable in greyscale and to a screen reader
   (the th also carries aria-sort). */
th[aria-sort] .sort-btn { color: var(--teal); }
th[aria-sort="ascending"] .sort-btn::after { content: " ▲"; }
th[aria-sort="descending"] .sort-btn::after { content: " ▼"; }
.tbl tbody th { font-weight: 600; }
.tbl tfoot th, .tbl tfoot td { border-bottom: 0; font-weight: 700; background: rgba(255,255,255,.045); }
/* Tracking one row across nine columns is exactly what a row highlight is for, so it has to
   be visible — and it has to cross the OS columns, whose tints are cell background-colours
   and would paint over a row background. Layering the wash as a background-image leaves the
   tint showing underneath. Neutral white throughout: a highlighted row must never read as
   the amber/teal/rose status language. Faint striping keeps rows separable without hovering. */
.tbl tbody tr:nth-child(even) > * {
  background-image: linear-gradient(rgba(255,255,255,.028), rgba(255,255,255,.028)); }
.tbl tbody tr:hover > * {
  background-image: linear-gradient(rgba(255,255,255,.1), rgba(255,255,255,.1)); }
.n { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
.tbl th.n, .tbl td.n { text-align: right; }
/* A thin bar along the foot of a cell: the row's share of the largest figure in its column. */
.databar { position: relative; }
.databar::after { content: ""; position: absolute; right: .75rem; bottom: .22rem; height: .14rem;
  width: var(--w); max-width: calc(100% - 1.5rem);
  background: var(--accent); border-radius: 999px; opacity: .85; }
/* The three OS columns are tinted so the eye can track one across a wide row. The heading
   carries the colour; the figures stay in text ink so nothing competes with the numbers.
   These hues sit well clear of amber/rose — a tinted column must never read as a warning. */
.os--win { --os: #60a5fa; }
.os--mac { --os: #e879f9; }
.os--linux { --os: #86efac; }
.tbl thead th.os, .tbl thead th.os .sort-btn { color: var(--os); }
.tbl td.os { background: color-mix(in srgb, var(--os) 7%, transparent); }
.strong { font-weight: 700; }
.dim { color: var(--text-dim); }
.country-flag { font-size: 1.25em; margin-right: .45em; vertical-align: -.1em; }
.warn { color: var(--amber); }
.repo { display: block; font-weight: 400; font-size: .82rem; color: var(--text-dim); }

.d { font-size: .82rem; white-space: nowrap; }
.d--up { color: var(--teal); }
.d--down { color: var(--rose); }
/* Trends: two charts to a row. The line takes the section accent; every label is text ink,
   so the axis reads at AA contrast whatever the accent. */
.charts { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .9rem 1.2rem; }
.chart { margin: 0; padding: .95rem 1.1rem; background: var(--card); border: 1px solid var(--card-line);
  border-radius: var(--r); box-shadow: var(--lift); }
.chart figcaption { margin-bottom: .5rem; font-size: .9rem; }
.chart__note { display: block; color: var(--text-muted); font-size: .82rem; }
.chart__svg { display: block; width: 100%; height: auto; }
.chart__svg text { fill: var(--text-muted); font-size: 15px; }
.chart__grid line { stroke: rgba(255,255,255,.1); stroke-width: 1; }
.chart__line polyline { fill: none; stroke: var(--accent); stroke-width: 2.5;
  stroke-linejoin: round; vector-effect: non-scaling-stroke; }
.chart__line polygon { fill: var(--accent); opacity: .13; }
.chart__line circle { fill: var(--accent); }
.chart__cursor { stroke: var(--text-muted); stroke-width: 1; stroke-dasharray: 4 4; }
.chart__dot { fill: var(--text); stroke: var(--bg); stroke-width: 2; }
.chart__tip { position: absolute; z-index: 5; pointer-events: none; padding: .22rem .6rem;
  font-size: .88rem; font-weight: 600; white-space: nowrap; color: var(--text);
  background: #1d1d28; border: 1px solid var(--accent); border-radius: .5rem;
  transform: translateX(.6rem); font-variant-numeric: tabular-nums; }
.chart details { margin-top: .5rem; font-size: .88rem; }
.chart summary { cursor: pointer; color: var(--text-muted); }
.chart summary:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.chart details .tbl { margin-top: .5rem; box-shadow: none; }
.spark { color: var(--violet); display: block; }
/* Downloads per OS: the three OS columns and Total share one width so the figures line up as
   a set, and Trend gets enough room for its line to show a shape. Other takes what is left. */
.tbl--dl .c-name { width: 22%; }
.tbl--dl .c-num { width: 11%; }
.tbl--dl .c-trend { width: 24%; }
.sparkcell .spark { width: 100%; height: 1.6rem; color: var(--accent); }

/* The heading is the cue and the wording is the cue: "⚠ Broken now" says it in text, so the
   amber only reinforces what already reads in greyscale. The count is dim because it is the
   least urgent thing in the line — the reader wants the word first. */
.issues-h { font-size: 1rem; font-weight: 700; color: var(--text); margin: 1.3rem 0 .5rem; }
.issues-h:first-child { margin-top: 0; }
.issues-h--now { color: var(--amber); }
.issues-h .count { color: var(--text-dim); font-weight: 600; }
.issues { margin: 0; padding-left: 1.2rem; display: grid; gap: .45rem; }
.issues li { color: var(--text-muted); font-size: .9rem; line-height: 1.5; overflow-wrap: anywhere; }
.issues strong { color: var(--text); }
.issues .age { color: var(--text-dim); white-space: nowrap; }
.note { background: var(--card); border: 1px solid var(--card-line);
  border-radius: var(--r); padding: .7rem .95rem; color: var(--text-muted); font-size: .9rem; margin: 0; }
.note.ok { color: var(--teal); }
.banner { border-color: var(--amber); color: var(--text); margin-bottom: 1rem; }
.banner strong { color: var(--amber); }
.row--missing th { opacity: .75; }
.flag { font-size: .8rem; color: var(--amber); border: 1px solid var(--amber);
  border-radius: .4rem; padding: 0 .3rem; vertical-align: middle; }
.chips { display: flex; flex-wrap: wrap; gap: .45rem; margin: .6rem 0; }
.chip { background: rgba(255,255,255,.07); border: 1px solid var(--card-line);
  border-radius: 999px; padding: .1rem .6rem; font-size: .8rem; color: var(--text-muted); }
.chip strong { color: var(--text); }
.rels { list-style: none; margin: 0; padding: 0; display: grid; gap: .2rem; font-size: .86rem; }
.ref { font-size: .82rem; color: var(--text-muted); }
.foot { margin-top: 2rem; color: var(--text-dim); font-size: .82rem; }
code { background: rgba(255,255,255,.08); padding: .05rem .3rem; border-radius: .3rem; font-size: .95em; }
kbd { font: inherit; font-size: .88em; font-weight: 700; padding: .05rem .4rem; color: var(--text);
  background: rgba(255,255,255,.1); border: 1px solid var(--card-line); border-radius: .35rem; }

/* The shortcuts list. */
.help { max-width: 38rem; padding: 1.3rem 1.5rem; color: var(--text); background: #15151e;
  border: 1px solid var(--card-line); border-radius: var(--r); box-shadow: 0 20px 60px rgba(0,0,0,.6); }
.help::backdrop { background: rgba(0,0,0,.6); }
.help h2 { margin: 0 0 .8rem; color: var(--text); }
.keys { display: grid; grid-template-columns: auto 1fr; gap: .4rem 1rem; margin: 0 0 .9rem; font-size: .92rem; }
.keys dd { margin: 0; color: var(--text-muted); }
.help form { margin-top: 1rem; text-align: right; }
`;

// ------------------------------------------------------------------------ main

// Fetch everything, update history, write the page. Exported so serve.mjs can call it on a
// schedule and on demand without shelling out to a second Node process.
export async function generate() {
  const started = Date.now();
  // Look for the login again each run: the long-lived server process may have started before
  // the keyring holding it was unlocked, and without this it would stay logged out forever.
  resolveAuth();
  const { projects, analytics } = JSON.parse(
    await readFile(join(ROOT, "src/projects.json"), "utf8")
  );
  const published = projects.filter(isPublished);
  const propertyId = analytics?.propertyId || "";

  if (!hasToken) {
    console.warn(
      "! Not authenticated — traffic stats skipped and GitHub allows only 60 calls/hour.\n" +
        "  Easiest fix: run `gh auth login` (this picks the CLI's login up automatically).\n" +
        "  Or set a token: export GITHUB_TOKEN=<token with public_repo scope>"
    );
  }

  // openSUSE is another host with no shared rate limit, and collectObs never throws, so its
  // calls all start now and run alongside the GitHub ones below instead of after them.
  const obsRun = Promise.all(published.map(collectObs));

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
  // A project not released yet can still have a public repo with issues and pull requests.
  // Fetched for Notifications only: it has no downloads, so it stays out of every table.
  // Repos the site does not list at all ride along here for the same reason.
  const others = await unlistedRepos(projects);
  console.log(`Also checking repos not on the site: ${others.map((p) => p.repo).join(", ")}`);
  const unreleased = [];
  for (const p of [...projects.filter((x) => x.repo && !isPublished(x)), ...others]) {
    try {
      unreleased.push(await collectProject(p));
    } catch (err) {
      console.warn(`! ${p.slug}: stats fetch failed (${err.message}) — skipped`);
    }
  }

  // Google Analytics, in parallel with nothing — it is four calls against a different API
  // and a failure here must not touch the GitHub figures. collectAnalytics returns null
  // rather than throwing, and null renders as "couldn't read", never as zero — and stores
  // nothing. Its daily figures are stored, each run replacing every day it re-read, so the
  // local copy matches Google for that window rather than drifting from it.
  const ga = await collectAnalytics(propertyId);
  if (propertyId && !ga) console.warn(`! Google Analytics: ${gaError} — visitor figures skipped`);
  const posts = await loadPosts(join(ROOT, "src/posts"));
  const postViews = posts.length
    ? await collectPostViews(propertyId, posts[posts.length - 1].dateISO)
    : null;
  if (postViews?.error) console.warn(`! Blog readership: ${postViews.error} — table skipped`);
  const clicks = await collectDownloadClicks(propertyId);
  if (clicks?.error) console.warn(`! Download clicks: ${clicks.error} — table skipped`);
  const obs = (await obsRun).filter(Boolean);

  const now = Date.now();
  const health = await contentHealth(projects);
  // Read by attentionItems, so a dead GA credential is on the tab that opens first, not only
  // inside the Visitors tab.
  health.gaDown = Boolean(propertyId && !ga);
  health.unreleased = unreleased.filter((r) => r.ok);

  // Save the run, then read the whole record back, so the page shows exactly what was stored.
  // The first open imports history.json, which is never written again; a database that cannot
  // be read throws here and stops the run rather than starting again from empty.
  await mkdir(OUT, { recursive: true });
  const store = openStore(OUT, { importFrom: HISTORY });
  let history;
  let trends;
  let base;
  try {
    const prior = loadHistory(store);
    base = baselineSnapshot(prior, now);
    updateAttention(prior, attentionItems(rows.filter((r) => r.ok), health), [...rows, ...unreleased], now);
    saveRun(store, { now, rows, obs, ga, postViews, clicks, attention: prior.attention });
    history = loadHistory(store);
    trends = readTrends(store);
    try {
      await backup(store, now);
    } catch (err) {
      // The run is already saved; a missing backup is worth a warning, not a lost run.
      console.warn(`! Backup of ${store.file} failed (${err.message}) — no older backup was removed`);
    }
  } finally {
    closeStore(store);
  }
  // Copy the site stylesheet in rather than linking ../src/assets/style.css: a relative
  // path out of .stats/ resolves when the file is opened from disk but 404s when serve.mjs
  // serves the folder, which silently drops every colour and font to browser defaults.
  // Copying keeps .stats/ self-contained and identical either way.
  await copyFile(join(ROOT, "src/assets/style.css"), join(OUT, "site.css"));
  await writeFile(join(OUT, "dashboard.css"), CSS);
  await writeFile(join(OUT, "dashboard.js"), JS);
  await writeFile(join(OUT, "favicon.svg"), ICON);
  const elapsed = ((Date.now() - started) / 1000).toFixed(1);
  await writeFile(
    PAGE,
    page({ rows, history, trends, base, health, projects, now, elapsed, ga, propertyId, posts, postViews, clicks, obs })
  );

  const failed = rows.filter((r) => !r.ok);
  console.log(
    `Stats for ${rows.length - failed.length}/${published.length} projects → ${PAGE}\n` +
      `${history.snapshots.length} snapshot(s) on file${base ? "" : " — change appears on the next run"}`
  );
  if (failed.length) {
    console.warn(
      `! No data for: ${failed.map((r) => r.slug).join(", ")}` +
        (failed.some((r) => r.rateLimited) ? " (GitHub rate limit)" : "") +
        " — excluded from the page totals and not stored."
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
