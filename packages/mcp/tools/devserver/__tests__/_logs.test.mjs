/**
 * The log tail: it follows the record, and it says the URL the run opened.
 *
 * Two refusals matter: no record means no log is proven, and a record whose log
 * is gone must say so instead of reading a stranger's file.
 */

import { strict as assert } from "node:assert";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { tailLog } from "../_logs.js";
import { recordDir } from "../_start.js";

/** A state dir with one record and one log. */
function state({ log = "ready on 3002\ncompiled ok\n", lines = 40 } = {}) {
  const stateDir = mkdtempSync(join(tmpdir(), "rule-mcp-logs-"));
  const dir = recordDir(stateDir);
  const file = join(dir, "2024.log");

  mkdirSync(dir, { recursive: true });
  writeFileSync(file, Array.from({ length: lines }, (_, index) => `line ${index + 1}`).join("\n") + (lines > 1 ? "\n" : ""));
  writeFileSync(join(dir, "4242.json"), JSON.stringify({ port: 3002, pid: 4242, command: "pnpm dev", cwd: "/repo", startedAt: 1, log: file }));

  if (log === null) {
    rmSync(file, { force: true });
  }

  return { stateDir, dir, file };
}

test("the newest record answers with its URL and its tail", () => {
  const { stateDir } = state();
  const result = tailLog({ stateDir, lines: 2 });

  assert.equal(result.status, "ok");
  assert.equal(result.url, "http://localhost:3002");
  assert.match(result.message, /pnpm dev on http:\/\/localhost:3002 \(pid 4242\)/u);
  assert.match(result.message, /line 40/u, "the last line is there");
  assert.doesNotMatch(result.message, /line 1$/mu, "older lines are not");

  rmSync(stateDir, { recursive: true, force: true });
});

test("a pid nobody recorded is refused", () => {
  const { stateDir } = state();

  assert.match(tailLog({ stateDir, pid: 9 }).message, /no record for pid 9/u);

  rmSync(stateDir, { recursive: true, force: true });
});

test("no record at all refuses instead of reading anything", () => {
  const stateDir = mkdtempSync(join(tmpdir(), "rule-mcp-logs-empty-"));

  assert.match(tailLog({ stateDir }).message, /no record on disk/u);

  rmSync(stateDir, { recursive: true, force: true });
});

test("a record whose log is gone says so, and still names the URL", () => {
  const { stateDir } = state({ log: null });
  const result = tailLog({ stateDir });

  assert.equal(result.status, "refused");
  assert.match(result.message, /which is gone/u);
  assert.equal(result.url, "http://localhost:3002");

  rmSync(stateDir, { recursive: true, force: true });
});

test("the line count is capped, so one call cannot return a whole log", () => {
  const { stateDir } = state({ lines: 600 });
  const result = tailLog({ stateDir, lines: 9999 });

  assert.equal(result.status, "ok");
  assert.match(result.message, /line 600/u);
  assert.doesNotMatch(result.message, /line 1$/mu);

  rmSync(stateDir, { recursive: true, force: true });
});
