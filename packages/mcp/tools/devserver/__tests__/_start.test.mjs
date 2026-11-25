/**
 * Starting one command, and writing the record a later stop trusts (ADR 251).
 *
 * The spawn is faked in every case but one: a real child that binds a port is
 * the only way to prove that the record names a server that actually listens.
 */

import { strict as assert } from "node:assert";
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { readRecords, startServer } from "../_start.js";

/** A scan that reports the given ports as taken. */
const scan = (taken) => ({ ok: true, listeners: taken.map((port) => ({ port, pid: 1, command: "x" })), firstFree: undefined });
const free = (...taken) => {
  const ports = scan(taken);
  const used = new Set(taken);
  let candidate = 3000;

  while (used.has(candidate)) {
    candidate += 1;
  }

  return { ...ports, firstFree: candidate };
};

const spawned = () => {
  const calls = [];
  const spawn = (command, options) => {
    calls.push({ command, options });

    return { pid: 987_654, unref: () => {} };
  };

  return { calls, spawn };
};

test("a start without a command is refused", async () => {
  const result = await startServer({ command: "  " });

  assert.equal(result.status, "refused");
  assert.match(result.message, /pass the command/u);
});

test("the child learns the first free port, and the record names it", async () => {
  const stateDir = mkdtempSync(join(tmpdir(), "rule-mcp-start-"));
  const { calls, spawn: fakeSpawn } = spawned();
  const result = await startServer({
    command: "pnpm dev",
    cwd: "/repo",
    stateDir,
    spawn: fakeSpawn,
    ports: free(3000, 3001),
    listens: () => true,
    now: () => 1_700_000_000_000,
  });

  assert.equal(result.status, "started", result.message);
  assert.equal(result.port, 3002);
  assert.equal(calls[0].options.env.PORT, "3002", "the convention every dev server honours");
  assert.equal(calls[0].options.detached, true, "the child outlives the tool call");

  const record = JSON.parse(readFileSync(join(stateDir, "devservers", "987654.json"), "utf8"));

  assert.deepEqual(Object.keys(record).sort(), ["command", "cwd", "log", "pid", "port", "startedAt"].sort());
  assert.equal(record.port, 3002);
  assert.equal(record.command, "pnpm dev");
  assert.equal(record.cwd, "/repo");

  rmSync(stateDir, { recursive: true, force: true });
});

test("a child that never binds is reported, and the record still names it", async () => {
  const stateDir = mkdtempSync(join(tmpdir(), "rule-mcp-start-"));
  const { spawn: fakeSpawn } = spawned();
  const result = await startServer({
    command: "sleep 10",
    stateDir,
    spawn: fakeSpawn,
    ports: free(),
    listens: () => false,
    wait: async () => false,
  });

  assert.equal(result.status, "refused");
  assert.match(result.message, /nothing listens/u);
  assert.ok(existsSync(result.record), "the record is what a stop would check");

  rmSync(stateDir, { recursive: true, force: true });
});

test("a range with no free port is refused before any spawn", async () => {
  const { calls, spawn: fakeSpawn } = spawned();
  const taken = Array.from({ length: 3001 }, (_, index) => 3000 + index);
  const result = await startServer({ command: "pnpm dev", spawn: fakeSpawn, ports: { ok: true, listeners: [], firstFree: null } });

  assert.equal(result.status, "refused");
  assert.match(result.message, /every port in 3000-6000 is taken/u);
  assert.deepEqual(calls, [], "nothing was launched");
  assert.equal(taken.length, 3001);
});

test("a real child binds a real port, and the record says which", async () => {
  const stateDir = mkdtempSync(join(tmpdir(), "rule-mcp-start-real-"));
  const code = `require("node:http").createServer((q, r) => r.end("ok")).listen(process.env.PORT, "127.0.0.1")`;

  const result = await startServer({
    command: `${JSON.stringify(process.execPath)} -e ${JSON.stringify(code)}`,
    stateDir,
    ports: free(),
    wait: async (port, { listens }) => {
      for (let attempt = 0; attempt < 60; attempt += 1) {
        if (listens(port)) {
          return true;
        }

        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      return false;
    },
  });

  assert.equal(result.status, "started", result.message);
  assert.ok(existsSync(result.record));
  assert.equal(readRecords(stateDir)[0].port, result.port);

  try {
    process.kill(result.pid, "SIGKILL");
  } catch {
    // It may have exited already; the assertion above is what matters.
  }

  rmSync(stateDir, { recursive: true, force: true });
});
