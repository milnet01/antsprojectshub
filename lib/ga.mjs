// Google Analytics 4 — read-only Data API client for the private stats dashboard.
//
// LOCAL ONLY, same as the dashboard it feeds: nothing here is imported by build.mjs, so no
// GA figure can reach antsprojectshub.co.za. The site's own analytics.js is the WRITE half
// (it sends hits); this is the READ half (it asks for them back). They share only the
// property, and neither can switch the other on.
//
// Auth is a service-account key — the JWT-bearer flow, done by hand with node:crypto so the
// dashboard keeps its zero-runtime-dependency promise. Google's client libraries would pull
// in ~40 packages to sign one token. `gcloud auth application-default login` is NOT an
// option: Google blocks the analytics.readonly scope for gcloud's shared client ID, so the
// route its own README recommends returns "This app is blocked".

import { createSign } from "node:crypto";
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

const SCOPE = "https://www.googleapis.com/auth/analytics.readonly";
const DATA_API = "https://analyticsdata.googleapis.com/v1beta";

// Where the key lives. GOOGLE_APPLICATION_CREDENTIALS is the variable every Google tool
// already honours, so an override needs no bespoke name; the fallback is where this
// machine's key was put.
const KEY_PATH =
  process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  join(homedir(), ".config/gcloud/aph-ga-reader.json");

// Live bindings, read by the dashboard to caption the section. `export let` on purpose —
// importers rely on seeing the update, exactly as lib/github.mjs does with hasToken.
export let gaReady = false;
export let gaError = null;

let cachedToken = null; // { value, expiresAt }

const b64url = (buf) =>
  Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

// Sign a JWT asserting "this service account wants a read-only Analytics token", and trade
// it for an access token. Tokens last an hour; we cache with a 60s safety margin so a long
// -running serve.mjs doesn't re-sign on every refresh.
async function accessToken() {
  if (cachedToken && Date.now() < cachedToken.expiresAt) return cachedToken.value;

  const key = JSON.parse(await readFile(KEY_PATH, "utf8"));
  if (!key.client_email || !key.private_key) {
    throw new Error(`${KEY_PATH} is not a service-account key (no client_email/private_key)`);
  }
  const aud = key.token_uri || "https://oauth2.googleapis.com/token";
  const iat = Math.floor(Date.now() / 1000);
  const claim = { iss: key.client_email, scope: SCOPE, aud, exp: iat + 3600, iat };
  const signing =
    `${b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${b64url(JSON.stringify(claim))}`;
  const signer = createSign("RSA-SHA256");
  signer.update(signing);
  const assertion = `${signing}.${b64url(signer.sign(key.private_key))}`;

  const res = await fetch(aud, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Google puts the useful half in error_description; the bare error is usually
    // "invalid_grant", which on its own tells you nothing about which of six causes it was.
    throw new Error(json.error_description || json.error || `token endpoint returned ${res.status}`);
  }
  // Fall back to a conservative lifetime if the response omits expires_in: an arithmetic
  // NaN here would make the cache never hit, re-signing a JWT on every single call.
  const lifetime = Number(json.expires_in) || 3600;
  cachedToken = { value: json.access_token, expiresAt: Date.now() + (lifetime - 60) * 1000 };
  return cachedToken.value;
}

// One runReport call. Body is the REST shape (camelCase), per the v1beta reference.
async function runReport(propertyId, body) {
  const token = await accessToken();
  const res = await fetch(`${DATA_API}/properties/${propertyId}:runReport`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => null);
    throw new Error(detail?.error?.message || `Data API returned ${res.status}`);
  }
  return res.json();
}

// Rows come back as parallel dimension/metric arrays. Flatten to plain objects keyed by the
// names asked for, with metrics as numbers, so the render side never indexes by position.
function flatten(report, dims, mets) {
  return (report.rows || []).map((row) => {
    const out = {};
    dims.forEach((d, i) => (out[d] = row.dimensionValues?.[i]?.value ?? ""));
    mets.forEach((m, i) => (out[m] = Number(row.metricValues?.[i]?.value ?? 0)));
    return out;
  });
}

async function report(propertyId, range, dimensions, metrics, extra = {}) {
  const json = await runReport(propertyId, {
    dateRanges: [range],
    dimensions: dimensions.map((name) => ({ name })),
    metrics: metrics.map((name) => ({ name })),
    ...extra,
  });
  return flatten(json, dimensions, metrics);
}

// Everything the dashboard shows, in five calls. Returns null when GA can't be reached —
// never an object full of zeros. Same discipline as the GitHub side: the reader must be
// able to tell "nobody visited" from "we couldn't ask", and a false zero here would be
// read as a dead site.
export async function collectAnalytics(propertyId, { days = 28 } = {}) {
  gaReady = false;
  gaError = null;
  if (!propertyId) return null;
  const range = { startDate: `${days}daysAgo`, endDate: "today" };
  const byViews = [{ metric: { metricName: "screenPageViews" }, desc: true }];
  const bySessions = [{ metric: { metricName: "sessions" }, desc: true }];

  try {
    const [totals, daily, pages, sources, countries] = await Promise.all([
      // No dimensions: GA's own de-duplicated totals for the period. Summing the daily rows
      // instead would count a visitor who came back on Tuesday twice.
      report(propertyId, range, [], [
        "totalUsers",
        "sessions",
        "screenPageViews",
        "averageSessionDuration",
        "engagementRate",
      ]),
      report(propertyId, range, ["date"], ["activeUsers", "sessions", "screenPageViews"], {
        orderBys: [{ dimension: { dimensionName: "date" } }],
      }),
      report(
        propertyId,
        range,
        ["pagePath"],
        ["screenPageViews", "activeUsers", "userEngagementDuration"],
        { orderBys: byViews, limit: 25 }
      ),
      report(propertyId, range, ["sessionDefaultChannelGroup", "sessionSource"], ["sessions", "activeUsers"], {
        orderBys: bySessions,
        limit: 15,
      }),
      report(propertyId, range, ["country"], ["activeUsers", "sessions"], {
        orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
        limit: 12,
      }),
    ]);
    gaReady = true;
    return { days, daily, pages, sources, countries, totals: totals[0] || null };
  } catch (err) {
    gaError = err.message;
    return null;
  }
}
