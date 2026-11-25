/**
 * One screen of project state, from sources the test supplies.
 *
 * The screen must never invent a number: a missing `gh` says unknown, and a
 * command that cannot run reports what it answered, not what we hoped.
 */

import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { adrCount, manifestVersion, projectState } from "../_state.js";

/** A project with two ADRs, one plan with two open steps, and a version. */
function project() {
  const root = mkdtempSync(join(tmpdir(), "rule-mcp-state-"));

  writeFileSync(join(root, "package.json"), JSON.stringify({ version: "1.2.3" }));
  mkdirSync(join(root, "docs/adr"), { recursive: true });
  writeFileSync(join(root, "docs/adr/ADR.md"), "# index\n");
  writeFileSync(join(root, "docs/adr/001-one.md"), "# 001\n");
  writeFileSync(join(root, "docs/adr/002-two.md"), "# 002\n");
  mkdirSync(join(root, "docs/plans"), { recursive: true });
  writeFileSync(join(root, "docs/plans/_demo.md"), "# demo\n\nStatus: `in-progress`\n\n## WS1\n\n- [ ] WS1-T1 one.\n- [x] WS1-T2 done.\n- [ ] WS1-T3 two.\n");
  mkdirSync(join(root, "docs/handoff"), { recursive: true });
  writeFileSync(join(root, "docs/handoff/07-recent.md"), "# seven\n");

  return root;
}

test("the manifest version and the ADR count come from disk", () => {
  const root = project();

  assert.equal(manifestVersion(root), "1.2.3");
  assert.equal(adrCount(root), 2, "the index is not a decision");

  rmSync(root, { recursive: true, force: true });
});

test("the screen names the next step, the tree and the handoff", () => {
  const root = project();
  const screen = projectState(root, { run: (file) => (file === "git" ? "M a\nM b\n" : "") });

  assert.match(screen, /version: `1\.2\.3`/u);
  assert.match(screen, /2 ADRs/u);
  assert.match(screen, /open step\(s\), next `WS1-T1 in demo - WS1`/u);
  assert.match(screen, /tree: 2 changed path\(s\)/u);
  assert.match(screen, /last handoff: `07-recent\.md`/u);
  assert.match(screen, /last CI: unknown/u, "no gh answer means unknown, not a guess");

  rmSync(root, { recursive: true, force: true });
});

test("the newest handoff wins when several exist", () => {
  const root = project();
  const older = join(root, "docs/handoff/04-older.md");

  const newest = join(root, "docs/handoff/08-newest.md");

  writeFileSync(older, "# four\n");
  writeFileSync(newest, "# eight\n");
  // The filesystem may stamp both within the same tick, so the order is stated
  // instead of hoped for: 08 is one hour newer than 04, and 07 in between.
  utimesSync(older, new Date(1_700_000_000_000), new Date(1_700_000_000_000));
  utimesSync(join(root, "docs/handoff/07-recent.md"), new Date(1_700_001_000_000), new Date(1_700_001_000_000));
  utimesSync(newest, new Date(1_700_002_000_000), new Date(1_700_002_000_000));

  const screen = projectState(root, { run: () => "" });

  assert.match(screen, /last handoff: `08-newest\.md`/u);

  rmSync(root, { recursive: true, force: true });
});

test("a clean tree and a CI answer are reported as they come", () => {
  const root = project();
  const run = (file) => (file === "git" ? "" : JSON.stringify([{ conclusion: "success", status: "completed", displayTitle: "ci" }]));
  const screen = projectState(root, { run });

  assert.match(screen, /tree: clean/u);
  assert.match(screen, /last CI: success \(ci\)/u);

  rmSync(root, { recursive: true, force: true });
});
