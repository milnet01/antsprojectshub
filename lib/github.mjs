// Shared GitHub I/O and release-asset matching.
//
// Used by both build.mjs (the public site) and stats.mjs (the local dashboard) so the two
// can never disagree about which file counts as a Windows/macOS/Linux download — if they
// drifted, the dashboard would report numbers the site doesn't show.

const TOKEN = process.env.GITHUB_TOKEN || "";
export const hasToken = Boolean(TOKEN);

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
  return (assets || []).find((a) => pat && pat.test(a.name)) || null;
}

// The one place that decides which OS an asset belongs to. First match wins, so a file is
// never double-counted across two platforms; null means it matched nothing (a source
// tarball, or a binary named in a way the patterns above don't recognise).
export function assetPlatform(name) {
  return Object.keys(ASSET_PAT).find((k) => ASSET_PAT[k].test(name)) || null;
}
