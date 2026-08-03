// The stats server's listen port: PORT → STATS_PORT → 4321.
//
// Two halves on purpose. The unit tests pin the rules; the spawn tests below then run the
// real serve.mjs and connect to the socket, because every rule here can be right while the
// value is lost somewhere between the environment and the bind.

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { resolvePort, DEFAULT_PORT } from "../lib/port.mjs";

const SERVE = join(dirname(dirname(fileURLToPath(import.meta.url))), "serve.mjs");

// ------------------------------------------------------------------------ the rules

test("PORT is used when valid", () => {
  assert.equal(resolvePort({ PORT: "5999" }), 5999);
  assert.equal(resolvePort({ PORT: "1024" }), 1024);
  assert.equal(resolvePort({ PORT: "65535" }), 65535);
});

test("PORT beats STATS_PORT", () => {
  assert.equal(resolvePort({ PORT: "5999", STATS_PORT: "4321" }), 5999);
});

test("PORT absent falls back exactly as before", () => {
  assert.equal(resolvePort({}), DEFAULT_PORT);
  assert.equal(resolvePort({ STATS_PORT: "5001" }), 5001);
  assert.equal(resolvePort({ PORT: "", STATS_PORT: "5001" }), 5001);
  assert.equal(resolvePort({ PORT: "" }), DEFAULT_PORT);
  // STATS_PORT keeps its old leniency — this is the untouched path, not a new rule.
  assert.equal(resolvePort({ STATS_PORT: "abc" }), DEFAULT_PORT);
});

test("PORT present but unusable is fatal, never a silent fallback", () => {
  for (const bad of ["abc", "0", "80", "1023", "65536", "99999", "-1", "5999.5", " 5999 "]) {
    assert.throws(
      () => resolvePort({ PORT: bad, STATS_PORT: "4321" }),
      RangeError,
      `PORT=${bad} should be rejected`,
    );
  }
});

test("the rejection names the bad value and the range", () => {
  // Markup characters specifically: a console layer that treats them as formatting swallows
  // the value and prints PORT='' — a message that is worse than useless. Plain "abc" cannot
  // catch that, so it is not the only case tested.
  for (const bad of ["abc", "[abc]", "{abc}", "<abc>", "$(id)"]) {
    let message = "";
    try {
      resolvePort({ PORT: bad });
    } catch (err) {
      message = err.message;
    }
    assert.ok(message.includes(bad), `message should contain ${bad}: ${message}`);
    assert.ok(message.includes("1024"), `message should state the range: ${message}`);
    assert.ok(message.includes("65535"), `message should state the range: ${message}`);
  }
});

// ------------------------------------------------------------------ the running server

/** Start serve.mjs and resolve once it says it is listening; kills it before returning. */
async function listeningPort(env) {
  const child = spawn(process.execPath, [SERVE], {
    env: { ...process.env, PORT: "", STATS_PORT: "", ...env },
    stdio: ["ignore", "pipe", "pipe"],
  });
  try {
    let out = "";
    for await (const chunk of child.stdout) {
      out += chunk;
      const line = out.match(/dashboard on http:\/\/127\.0\.0\.1:(\d+)/);
      if (!line) continue;
      // The log line is only the server's claim. Connect, so the assertion is about the
      // socket that actually exists.
      const res = await fetch(`http://127.0.0.1:${line[1]}/`);
      await res.arrayBuffer();
      return Number(line[1]);
    }
    throw new Error(`serve.mjs exited without listening:\n${out}`);
  } finally {
    child.kill("SIGKILL");
  }
}

// Ports well clear of the 4321 default so a stale server can't make these pass by accident.
test("serve.mjs binds PORT", async () => {
  assert.equal(await listeningPort({ PORT: "5993" }), 5993);
});

test("serve.mjs binds STATS_PORT when PORT is absent", async () => {
  assert.equal(await listeningPort({ STATS_PORT: "5994" }), 5994);
});

test("serve.mjs prefers PORT over STATS_PORT", async () => {
  assert.equal(await listeningPort({ PORT: "5995", STATS_PORT: "5994" }), 5995);
});

/** Run serve.mjs to completion with a bad PORT. */
async function rejects(port) {
  const child = spawn(process.execPath, [SERVE], {
    env: { ...process.env, PORT: port },
    stdio: ["ignore", "ignore", "pipe"],
  });
  let stderr = "";
  child.stderr.on("data", (c) => (stderr += c));
  const [code] = await once(child, "exit");
  return { code, stderr };
}

test("serve.mjs exits non-zero on a bad PORT, with the value intact", async () => {
  for (const bad of ["abc", "[abc]", "80"]) {
    const { code, stderr } = await rejects(bad);
    assert.notEqual(code, 0, `PORT=${bad} should exit non-zero`);
    assert.ok(stderr.includes(bad), `stderr should show ${bad} intact, got: ${stderr}`);
  }
});
