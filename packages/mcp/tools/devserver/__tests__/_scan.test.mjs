/**
 * The dev-server scan: read what the OS says, refuse what it cannot see.
 *
 * `run` exists so a test can answer for the operating system. A scan that
 * guesses "free" invites a port clash, so an unavailable `lsof` says unknown.
 */

import assert from "node:assert/strict";
import { test } from "node:test";

import { PORT_RANGE, listenPorts, scanRange } from "../_scan.js";
import { REFUSED_ACTIONS, devserver } from "../_devserver.js";

/** The shape `lsof -nP -iTCP -sTCP:LISTEN` prints. */
const LSOF = [
  "COMMAND   PID  USER   FD   TYPE  DEVICE SIZE/OFF NODE NAME",
  "node    72891  user   23u  IPv4 0x1234      0t0  TCP *:3000 (LISTEN)",
  "node    11111  user   20u  IPv6 0x9999      0t0  TCP *:3001 (LISTEN)",
  "node    22222  user   20u  IPv6 0x9998      0t0  TCP *:7000 (LISTEN)",
].join("\n");

/** A port that answers the scan without touching the machine. */
const run = (file) => (file === "lsof" ? LSOF : "");

test("the range is the documented one", () => {
  assert.equal(PORT_RANGE.from, 3000);
  assert.equal(PORT_RANGE.to, 6000);
});

test("listeners inside the range are reported, sorted, with their pid", () => {
  const scanned = scanRange(listenPorts({ run }));

  assert.equal(scanned.ok, true);
  assert.deepEqual(
    scanned.inside.map((entry) => [entry.port, entry.pid]),
    [
      [3000, 72891],
      [3001, 11111],
    ],
    "7000 is outside the range",
  );
});

test("the first free port skips what is taken", () => {
  assert.equal(scanRange(listenPorts({ run })).firstFree, 3002);
});

test("a machine without lsof reports unknown, never free", () => {
  const scanned = scanRange(
    listenPorts({
      run: () => {
        throw new Error("spawn lsof ENOENT");
      },
    }),
  );

  assert.equal(scanned.ok, false);
  assert.match(scanned.reason, /unknown/u);
  assert.equal(scanned.inside.length, 0);
});

test("restart stays refused, and an unknown action says so", async () => {
  // Start and stop exist now; restart waits until both are proven on a real run.
  for (const action of REFUSED_ACTIONS) {
    const text = await devserver({ action });

    assert.match(text, /is not implemented/u);
    assert.match(text, /ADR/u, `${action} names what is missing`);
  }

  assert.match(await devserver({ action: "nope" }), /Unknown action/u);
});
