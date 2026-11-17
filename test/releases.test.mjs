// Which release files and which releases count as the app, shared by the site build and
// the stats dashboard through lib/github.mjs.

import { test } from "node:test";
import assert from "node:assert/strict";

import { isCompanionFile, assetPlatform, appReleases } from "../lib/github.mjs";

test("licence notices shipped beside a binary are companion files, not downloads", () => {
  for (const name of ["LICENSE", "LICENSE.brotli", "LICENSE.jpeg-xl", "windows-LICENSE.libjpeg-turbo", "COPYING", "NOTICE"]) {
    assert.ok(isCompanionFile(name), name);
    assert.equal(assetPlatform(name), null, name);
  }
});

test("real downloads are not mistaken for licence notices", () => {
  assert.equal(assetPlatform("Pressless-1.0.0-x86_64.AppImage"), "linux");
  assert.equal(assetPlatform("Pressless-1.0.0-windows.zip"), "win");
  assert.equal(isCompanionFile("licensed-app-linux.AppImage"), false);
});

test("only version-tagged, non-draft releases are the app", () => {
  const tags = appReleases([
    { tag_name: "v1.0.0" },
    { tag_name: "0.3.1" },
    { tag_name: "jpeg-xl-0.12.0", prerelease: true },
    { tag_name: "deps-mpv-20261015", prerelease: true },
    { tag_name: "P06-complete" },
    { tag_name: "v2.0.0", draft: true },
  ]).map((r) => r.tag_name);
  assert.deepEqual(tags, ["v1.0.0", "0.3.1"]);
  assert.deepEqual(appReleases(null), []);
});
