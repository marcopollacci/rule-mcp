/**
 * The dispatcher: every action reaches the module that answers it.
 *
 * Each module has its own tests. What is pinned here is the routing, because a
 * `logs` that silently falls through to `status` still returns a plausible
 * screen, and no other test would notice.
 */

import { strict as assert } from "node:assert";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { READ_ONLY_ACTIONS, REFUSED_ACTIONS, devserver } from "../_devserver.js";

test("an unknown action lists the ones that exist", async () => {
  const text = await devserver({ action: "restart-now" });

  assert.match(text, /Unknown action "restart-now"/u);
  for (const action of READ_ONLY_ACTIONS) {
    assert.match(text, new RegExp(action, "u"), `${action} is offered`);
  }
});

test("records answers from the state directory", async () => {
  const stateDir = mkdtempSync(join(tmpdir(), "rule-mcp-dispatch-"));
  const before = process.env.RULE_MCP_STATE_DIR;

  process.env.RULE_MCP_STATE_DIR = stateDir;
  mkdirSync(join(stateDir, "devservers"), { recursive: true });
  writeFileSync(join(stateDir, "devservers/123.json"), JSON.stringify({ port: 3005, pid: 123, command: "pnpm dev", cwd: "/r", startedAt: 1, log: "/tmp/x.log" }));

  const text = await devserver({ action: "records" });

  assert.match(text, /# Records/u);
  assert.match(text, /`3005` pid 123: pnpm dev/u);

  if (before === undefined) {
    delete process.env.RULE_MCP_STATE_DIR;
  } else {
    process.env.RULE_MCP_STATE_DIR = before;
  }

  rmSync(stateDir, { recursive: true, force: true });
});

test("logs reaches the tail, not the status screen", async () => {
  const stateDir = mkdtempSync(join(tmpdir(), "rule-mcp-dispatch-"));
  const before = process.env.RULE_MCP_STATE_DIR;

  process.env.RULE_MCP_STATE_DIR = stateDir;
  mkdirSync(join(stateDir, "devservers"), { recursive: true });
  writeFileSync(join(stateDir, "devservers/321.json"), JSON.stringify({ port: 3006, pid: 321, command: "vite", cwd: "/r", startedAt: 1, log: join(stateDir, "one.log") }));
  writeFileSync(join(stateDir, "one.log"), "ready\n");

  const text = await devserver({ action: "logs" });

  assert.match(text, /vite on http:\/\/localhost:3006/u, "the log header, not the port table");
  assert.doesNotMatch(text, /First free in/u);

  if (before === undefined) {
    delete process.env.RULE_MCP_STATE_DIR;
  } else {
    process.env.RULE_MCP_STATE_DIR = before;
  }

  rmSync(stateDir, { recursive: true, force: true });
});

test("start without a command is refused, and restart stays refused", async () => {
  assert.match(await devserver({ action: "start" }), /pass the command to start/u);

  for (const action of REFUSED_ACTIONS) {
    assert.match(await devserver({ action }), /is not implemented/u);
  }
});
