// The Builds tab's two judgements, which also decide the stats server's desktop notices:
// whether a newest release counts as having no files, and which faults are alarms.

import { test } from "node:test";
import assert from "node:assert/strict";

import { filesState, buildAlarms } from "../stats.mjs";

const NOW = Date.parse("2026-11-09T12:00:00Z");
const minutesAgo = (m) => new Date(NOW - m * 60_000).toISOString();

const repo = (over = {}) => ({
  repo: "me/app",
  name: "App",
  latestTag: "v1.0.0",
  latestAt: minutesAgo(600),
  latestFiles: ["app.AppImage"],
  push: { branch: "main", head: { sha: "aaa" }, ci: { state: "passed", sha: "aaa", message: "m", failed: [] } },
  ...over,
});

test("a release with files is ok, and a repo with no release has no state", () => {
  assert.equal(filesState(repo(), NOW), "ok");
  assert.equal(filesState(repo({ latestFiles: null }), NOW), null);
});

test("an empty release waits an hour for its build to attach files, then counts as none", () => {
  assert.equal(filesState(repo({ latestFiles: [], latestAt: minutesAgo(59) }), NOW), "pending");
  assert.equal(filesState(repo({ latestFiles: [], latestAt: minutesAgo(61) }), NOW), "none");
});

test("a passing repo raises no alarm; an empty release does only after the hour", () => {
  assert.deepEqual(buildAlarms([repo()], NOW), []);
  assert.deepEqual(buildAlarms([repo({ latestFiles: [], latestAt: minutesAgo(5) })], NOW), []);
  const [a] = buildAlarms([repo({ latestFiles: [] })], NOW);
  assert.equal(a.key, "nofiles:me/app:v1.0.0");
});

test("a failed build is an alarm keyed by its commit, so a new failure is a new alarm", () => {
  const failed = (sha) =>
    repo({ push: { branch: "main", ci: { state: "failed", sha, message: "m", failed: [{ name: "CI", url: "u" }] } } });
  const [a] = buildAlarms([failed("aaa")], NOW);
  const [b] = buildAlarms([failed("bbb")], NOW);
  assert.equal(a.key, "ci:me/app:aaa");
  assert.notEqual(a.key, b.key);
  assert.match(a.body, /CI failed on main/);
});

test("a push that ran no checks is judged by the newest push that did", () => {
  const r = repo({
    push: { branch: "main", ci: null, lastChecked: { state: "failed", sha: "old", message: "m", failed: [{ name: "CI" }] } },
  });
  assert.deepEqual(buildAlarms([r], NOW).map((a) => a.key), ["ci:me/app:old"]);
});

test("a project that has never attached files is source-only, not an alarm", () => {
  const sourceOnly = repo({ latestFiles: [], filesBefore: false });
  assert.equal(filesState(sourceOnly, NOW), "source");
  assert.deepEqual(buildAlarms([sourceOnly], NOW), []);
  // An earlier release had files, so this empty one is a release cut without its build.
  assert.equal(filesState(repo({ latestFiles: [], filesBefore: true }), NOW), "none");
});
