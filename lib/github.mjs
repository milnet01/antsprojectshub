import { execFileSync } from "node:child_process";

// Shared GitHub I/O and release-asset matching.
//
// Used by both build.mjs (the public site) and stats.mjs (the local dashboard) so the two
// can never disagree about which file counts as a Windows/macOS/Linux download — if they
// drifted, the dashboard would report numbers the site doesn't show.

// Auth: GITHUB_TOKEN if set (CI always sets it), otherwise borrow the GitHub CLI's login.
// The fallback means no personal token has to be created or stored just to lift the 60
// calls/hour anonymous limit — `gh` is already authenticated on the dev machine, and its
// token carries the push access the traffic endpoints require. A missing or logged-out
// `gh` falls through to unauthenticated, which every caller already handles.
function readToken() {
  if (process.env.GITHUB_TOKEN) return { token: process.env.GITHUB_TOKEN, source: "env" };
  try {
    const out = execFileSync("gh", ["auth", "token"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    if (out) return { token: out, source: "gh" };
  } catch {
    /* gh not installed or not logged in — unauthenticated is a supported mode */
  }
  return { token: "", source: "none" };
}

let TOKEN = "";
// `let`, not `const`: importers get a live binding, so a later resolveAuth() that finds a
// token updates every call-site's view without them re-importing anything.
export let hasToken = false;
export let tokenSource = "none";

// Re-checked before each run rather than resolved once at import, because `gh` usually keeps
// the token in the desktop keyring — which is still locked when the stats service starts at
// boot. Resolving once would leave that process unauthenticated for its entire life: traffic
// stats permanently blank and every run capped at 60 calls/hour, even hours later after a
// manual refresh. A found token is cached, so only the not-found case ever pays for a repeat
// `gh` call.
export function resolveAuth() {
  if (!hasToken) {
    const { token, source } = readToken();
    TOKEN = token;
    hasToken = Boolean(token);
    tokenSource = source;
  }
  return { hasToken, tokenSource };
}

resolveAuth();

// Full result — callers that need to tell "no permission" from "nothing there" (the
// traffic endpoints answer 403 without a push-access token, 404 for a missing repo).
export async function ghRequest(path) {
  try {
    const res = await fetch(`https://api.github.com${path}`, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "ants-projects-hub-build",
        "X-GitHub-Api-Version": "2022-11-28",
        ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
      },
    });
    const remaining = Number(res.headers.get("x-ratelimit-remaining"));
    if (!res.ok) return { ok: false, status: res.status, remaining, data: null };
    return { ok: true, status: res.status, remaining, data: await res.json() };
  } catch (err) {
    return { ok: false, status: 0, remaining: NaN, data: null, error: err.message };
  }
}

// Body-or-null. The site build's only failure mode is "use the fallback", so it never
// needs the status code.
export async function ghJson(path) {
  return (await ghRequest(path)).data;
}

// Files that ride along with a release but are never the thing a visitor wants to run:
// signatures, checksum manifests (`SHA256SUMS` as well as `foo.zip.sha256`), auto-updater
// metadata, SBOMs and Python wheels. Excluded from platform matching *before* ASSET_PAT
// runs, because several of them carry an OS name and GitHub lists assets alphabetically —
// `finbreak-0.1.18-windows.cdx.json` would otherwise sort ahead of the real `.exe` and win
// the Windows download button, and `RetroDB-...-Linux.zip.sha256` would be counted as a
// Linux download. Source archives are deliberately NOT here: a `*-Windows.zip` really is
// the download for several projects.
const COMPANION_PAT =
  /\.(sig|asc|pem|sha\d+|zsync|blockmap|torrent|ya?ml|json|whl|txt|md)$|sha\d+sums?|checksums?|cosign|sbom|intoto|\.att\b/i;

export const isCompanionFile = (name) => COMPANION_PAT.test(name);

// Match a release asset to a platform by filename. Deliberately conservative: a Linux
// match needs an AppImage/deb/rpm/flatpak extension or the word "linux" — so a plain
// source `*.tar.gz` (e.g. a Python sdist) is NOT mistaken for a Linux binary.
export const ASSET_PAT = {
  win: /\.(exe|msi)$|windows|win-?(64|32)|[-_]win[-_.]/i,
  mac: /\.(dmg|pkg)$|macos|mac[-_.]|osx|darwin/i,
  linux: /\.(appimage|deb|rpm|flatpak)$|linux/i,
};

// Newest *stable* release from a newest-first, draft-free list — falling back to a
// prerelease only for repos that have only ever shipped prereleases, so they still get a
// download rather than none.
export function pickLatestRelease(nonDraft) {
  return nonDraft.find((r) => !r.prerelease) || nonDraft[0] || null;
}

export function pickAsset(assets, pl) {
  const pat = ASSET_PAT[pl];
  if (!pat) return null;
  return (assets || []).find((a) => !isCompanionFile(a.name) && pat.test(a.name)) || null;
}

// The one place that decides which OS an asset belongs to. First match wins, so a file is
// never double-counted across two platforms; null means it matched nothing (a companion
// file, a source tarball, or a binary named in a way the patterns above don't recognise).
export function assetPlatform(name) {
  if (isCompanionFile(name)) return null;
  return Object.keys(ASSET_PAT).find((k) => ASSET_PAT[k].test(name)) || null;
}
