// Ants Projects Hub — private stats dashboard server.
//
// Serves .stats/dashboard.html on localhost and keeps it fresh:
//   • regenerates on start (so a machine that was off catches up the moment it boots)
//   • regenerates every REFRESH_HOURS (default 24)
//   • regenerates on demand when the page's "Refresh now" button POSTs /refresh
//
// LOCAL ONLY, like everything else in .stats/: the listener binds to 127.0.0.1, so it is
// reachable from this machine and nowhere else — not the local network, not the internet.
// Nothing here is ever part of the published site.
//
//   node serve.mjs                 → http://127.0.0.1:4321
//   STATS_PORT=5000 node serve.mjs

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { setTimeout as sleep } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { generate } from "./stats.mjs";
import { resolveAuth } from "./lib/github.mjs";

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT = join(ROOT, ".stats");
const PORT = Number(process.env.STATS_PORT) || 4321;
const REFRESH_HOURS = Number(process.env.STATS_REFRESH_HOURS) || 24;
const AUTH_WAIT_MIN = Number(process.env.STATS_AUTH_WAIT_MINUTES ?? 15);

const TYPES = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript" };
const FILES = {
  "/": "dashboard.html",
  "/dashboard.html": "dashboard.html",
  "/site.css": "site.css",
  "/dashboard.css": "dashboard.css",
  "/dashboard.js": "dashboard.js",
};

const stamp = () => new Date().toISOString().replace("T", " ").slice(0, 19);
const log = (msg) => console.log(`[${stamp()}] ${msg}`);

// One refresh at a time. Two overlapping runs would race on history.json and could write a
// snapshot twice; a concurrent caller just waits for the run already in flight.
let inFlight = null;
function refresh(reason) {
  if (inFlight) return inFlight;
  log(`refreshing (${reason})`);
  inFlight = generate()
    .then((r) => {
      log(`done — ${r.ok}/${r.total} projects`);
      return r;
    })
    .catch((err) => {
      // A failed refresh must not kill the server: the previously generated page is still
      // on disk and still worth serving.
      log(`refresh failed: ${err.message}`);
      throw err;
    })
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}

const server = createServer(async (req, res) => {
  if (req.method === "POST" && req.url === "/refresh") {
    try {
      const r = await refresh("button");
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: r.ok, total: r.total }));
    } catch (err) {
      res.writeHead(500, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  const name = FILES[req.url];
  if (!name) {
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("Not found");
    return;
  }
  try {
    const body = await readFile(join(OUT, name));
    res.writeHead(200, {
      "content-type": TYPES[name.slice(name.lastIndexOf("."))],
      // Always hand back what's on disk — a cached copy would hide the refresh that just ran.
      "cache-control": "no-store",
    });
    res.end(body);
  } catch {
    res.writeHead(503, { "content-type": "text/plain" });
    res.end("Dashboard not generated yet — try again in a moment.");
  }
});

// Listen before refreshing, not after: the previously generated page is already on disk, and
// the startup refresh below can wait several minutes for credentials. Serving first means the
// tray icon and the bookmark always open something instead of "connection refused".
server.listen(PORT, "127.0.0.1", () => {
  log(`dashboard on http://127.0.0.1:${PORT} — refreshing every ${REFRESH_HOURS}h`);
});

setInterval(() => refresh("scheduled").catch(() => {}), REFRESH_HOURS * 3600_000);

// At boot this service starts before the desktop session unlocks the keyring that `gh` keeps
// the GitHub login in, so refreshing straight away yields an incomplete run: traffic skipped
// and the 60-calls-an-hour anonymous ceiling hit part-way down the project list. Waiting for
// the login to actually appear beats guessing a fixed delay — a slow login still works, and a
// fast one costs no delay at all. If it never arrives we refresh anyway, because a partial
// run that says so on the page still beats figures going stale for a day.
async function waitForAuth() {
  if (resolveAuth().hasToken) return;
  log(`no GitHub login yet — waiting up to ${AUTH_WAIT_MIN} min for the keyring to unlock`);
  const deadline = Date.now() + AUTH_WAIT_MIN * 60_000;
  while (Date.now() < deadline) {
    await sleep(15_000);
    if (resolveAuth().hasToken) {
      log("GitHub login available — refreshing now");
      return;
    }
  }
  log(`still no GitHub login after ${AUTH_WAIT_MIN} min — refreshing unauthenticated`);
}

await waitForAuth();
await refresh("startup").catch(() => {
  log("startup refresh failed — serving the last generated page, if any");
});
