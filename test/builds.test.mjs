// The Builds tab's two judgements, which also decide the stats server's desktop notices:
// whether a newest release counts as having no files, and which faults are alarms.

import { test } from "node:test";
import assert from "node:assert/strict";

import { filesState, buildAlarms, otherFailures, dashboardScript, fixLine } from "../stats.mjs";

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

// A run no push started: GitHub emails the user when one fails, so it is a fault too.
const run = (over) => ({
  id: 1, workflow_id: 9, name: "Build binaries", event: "workflow_dispatch", status: "completed",
  conclusion: "failure", head_branch: "main", head_sha: "abc1234def", html_url: "https://run/1",
  head_commit: { message: "Release prep\n\nbody" }, ...over,
});

test("a failed run started by hand, by a timer or by a release is listed", () => {
  for (const event of ["workflow_dispatch", "schedule", "release"]) {
    const [f] = otherFailures([run({ event })]);
    assert.equal(f.event, event);
    assert.equal(f.message, "Release prep");
  }
  assert.deepEqual(otherFailures([run({ event: "push" })]), []);
  assert.deepEqual(otherFailures([run({ event: "pull_request" })]), []);
  assert.deepEqual(otherFailures([run({ status: "in_progress", conclusion: null })]), []);
  assert.deepEqual(otherFailures([run({ conclusion: "cancelled" })]), []);
});

test("a workflow counts by its newest run, so a later pass of any kind clears it", () => {
  assert.deepEqual(otherFailures([run({ id: 2, conclusion: "success" }), run({ id: 1 })]), []);
  assert.deepEqual(otherFailures([run({ id: 2, event: "push", conclusion: "success" }), run({ id: 1 })]), []);
  assert.deepEqual(otherFailures([run({ id: 2 }), run({ id: 1, conclusion: "success" })]).map((f) => f.id), [2]);
  // Another workflow's newer run does not hide this one.
  assert.equal(otherFailures([run({ id: 3, workflow_id: 8, conclusion: "success" }), run({ id: 1 })]).length, 1);
});

// The page's script is written inside a template string in stats.mjs, where a stray backslash
// or backtick breaks it without breaking stats.mjs itself.
test("the dashboard's script parses", () => {
  assert.doesNotThrow(() => new Function(dashboardScript()));
});

// A notification's "Fix: …" sentence moves to a line of its own; the age that closed the
// item stays with the fault, and an item with no fix is left as it was.
test("fixLine puts the remedy on its own line and keeps the age with the fault", () => {
  const age = '<span class="age">(first noticed today)</span>';
  assert.equal(
    fixLine(`<strong>A</strong> failed. Fix: open the run, push again. ${age}`),
    `<strong>A</strong> failed. ${age}<span class="fix"><strong>Fix</strong> open the run, push again.</span>`
  );
  assert.equal(
    fixLine(`No stills on B ${age}, C. Fix: ask each session.`),
    `No stills on B ${age}, C.<span class="fix"><strong>Fix</strong> ask each session.</span>`
  );
  assert.equal(fixLine(`Three pull requests are open. ${age}`), `Three pull requests are open. ${age}`);
});
