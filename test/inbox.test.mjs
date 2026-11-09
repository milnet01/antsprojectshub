// Which inbox notes the stats server sends: each new fault once, a fault that clears and
// comes back again, nothing for a read that failed, and the user's own upstream pull
// requests only when they gain comments or stop being open.

import { test } from "node:test";
import assert from "node:assert/strict";

import { inboxItems, planNotes } from "../lib/inbox.mjs";

const NOW = Date.parse("2026-11-09T12:00:00Z");

const repo = (over = {}) => ({
  repo: "me/app",
  name: "App",
  issuesOk: true,
  issueList: [],
  prList: [],
  upstreamPrs: [],
  latestTag: "v1.0.0",
  latestAt: "2026-11-01T00:00:00Z",
  latestFiles: ["app.AppImage"],
  filesBefore: true,
  lostAssets: [],
  push: { branch: "main", ci: { state: "passed", sha: "aaa", message: "m", failed: [] } },
  ...over,
});

const issue = { n: 7, title: "Crash on start", url: "https://github.com/me/app/issues/7" };
const plan = (repos, sent = {}) => planNotes(sent, inboxItems(repos, NOW));

test("a new issue is sent once, with its title and link but none of its text", () => {
  const first = plan([repo({ issueList: [issue] })]);
  assert.equal(first.send.length, 1);
  assert.equal(first.send[0].repo, "me/app");
  assert.match(first.send[0].body, /#7/);
  assert.match(first.send[0].body, /Crash on start/);
  assert.match(first.send[0].body, /issues\/7/);
  const again = plan([repo({ issueList: [issue] })], first.next);
  assert.deepEqual(again.send, []);
});

test("the same fault always produces the same body, so dedupe can match it", () => {
  const a = plan([repo({ issueList: [issue] })]).send[0].body;
  const b = plan([repo({ issueList: [issue] })]).send[0].body;
  assert.equal(a, b);
});

test("a closed issue is forgotten, so reopening it sends again", () => {
  const { next } = plan([repo({ issueList: [issue] })]);
  const closed = plan([repo()], next);
  assert.deepEqual(closed.send, []);
  assert.deepEqual(plan([repo({ issueList: [issue] })], closed.next).send.length, 1);
});

test("an issue list that could not be read neither sends nor forgets", () => {
  const { next } = plan([repo({ issueList: [issue] })]);
  const unread = plan([repo({ issuesOk: false, issueList: [] })], next);
  assert.deepEqual(unread.send, []);
  assert.deepEqual(plan([repo({ issueList: [issue] })], unread.next).send, []);
});

test("a failed build is sent once per commit", () => {
  const failed = (sha) =>
    repo({ push: { branch: "main", ci: { state: "failed", sha, message: "fix", failed: [{ name: "CI", url: "https://run" }] } } });
  const first = plan([failed("aaa")]);
  assert.equal(first.send.length, 1);
  assert.match(first.send[0].body, /CI/);
  assert.deepEqual(plan([failed("aaa")], first.next).send, []);
  assert.equal(plan([failed("bbb")], first.next).send.length, 1);
});

test("a release that lost its files is sent; a source-only one is not", () => {
  const lost = plan([repo({ latestFiles: [], filesBefore: true })]);
  assert.equal(lost.send.length, 1);
  assert.match(lost.send[0].body, /v1\.0\.0/);
  assert.deepEqual(plan([repo({ latestFiles: [], filesBefore: false })]).send, []);
  const partial = plan([repo({ lostAssets: ["win"] })]);
  assert.equal(partial.send.length, 1);
  assert.match(partial.send[0].body, /Windows/);
});

test("an upstream pull request is news only when it gains comments or stops being open", () => {
  const up = (comments) => ({ n: 5, title: "Fix", url: "https://github.com/up/x/pull/5", comments });
  const seen = plan([repo({ upstreamPrs: [up(0)] })]);
  assert.deepEqual(seen.send, []);
  const commented = plan([repo({ upstreamPrs: [up(2)] })], seen.next);
  assert.equal(commented.send.length, 1);
  assert.match(commented.send[0].body, /comment/);
  assert.deepEqual(plan([repo({ upstreamPrs: [up(2)] })], commented.next).send, []);
  const gone = plan([repo({ upstreamPrs: [] })], commented.next);
  assert.equal(gone.send.length, 1);
  assert.match(gone.send[0].body, /no longer open/);
  assert.match(gone.send[0].body, /pull\/5/);
  // A failed search (null) is not "closed".
  assert.deepEqual(plan([repo({ upstreamPrs: null })], commented.next).send, []);
});

test("a run with nothing sent yet sends what is open now, but no upstream comment counts", () => {
  const first = plan(
    [repo({ issueList: [issue], upstreamPrs: [{ n: 5, title: "Fix", url: "u", comments: 3 }] })],
    {}
  );
  assert.equal(first.send.length, 1);
  assert.match(first.send[0].body, /Crash on start/);
});
