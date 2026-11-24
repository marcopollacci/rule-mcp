/**
 * The resumed session starts on one named step, not on a list of proposals.
 *
 * The handoff report proposes the first open step of every ready plan. A
 * session that has to choose between them spends its first turn choosing, so
 * the injected block names the one step the plan orders next.
 */

import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

const { nextStepBlock } = await import("../_context.js").catch(() => ({}));

const PLAN = "# demo plan\n\nStatus: `in-progress`\n\n## WS1 First workstream\n\n- [ ] WS1-T1 write the thing.\n- [ ] WS1-T2 write the next thing.\n";

test("a plan with an open step is named in the block", () => {
  const root = mkdtempSync(join(tmpdir(), "rule-mcp-resume-next-"));

  mkdirSync(join(root, "docs/plans"), { recursive: true });
  writeFileSync(join(root, "docs/plans/_demo.md"), PLAN);

  const section = nextStepBlock(root);

  assert.match(section, /### The step to take/u);
  assert.match(section, /`demo - WS1 First workstream`, 2 open/u);
  assert.match(section, /WS1-T1 write the thing/u, "the step travels verbatim, inside a fence");
  assert.match(section, /```text/u);

  rmSync(root, { recursive: true, force: true });
});

test("no open plan means no section, and the block is not invented", () => {
  const root = mkdtempSync(join(tmpdir(), "rule-mcp-resume-next-"));
  const done = "# done plan\n\nStatus: `done`\n\n## WS1\n\n- [x] WS1-T1 finished.\n";

  mkdirSync(join(root, "docs/plans"), { recursive: true });
  writeFileSync(join(root, "docs/plans/_done.md"), done);

  assert.equal(nextStepBlock(root), "");

  rmSync(root, { recursive: true, force: true });
});
