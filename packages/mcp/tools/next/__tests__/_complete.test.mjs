/**
 * Ticking a step against a fact, never against a claim.
 *
 * The rule is the whole point: a wrong tick is worse than an unticked step,
 * because the next session trusts the plan and skips what was never done.
 */

import { strict as assert } from "node:assert";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { completeStep } from "../_complete.js";
import { nextStep } from "../_step.js";

const PLAN = `# demo plan

Status: \`in-progress\`

## WS1 First workstream

- [ ] WS1-T1 write the thing.
- [ ] WS1-T2 write the next thing.
`;

/** A project with one plan, and a place for the evidence to land. */
function project() {
  const root = mkdtempSync(join(tmpdir(), "rule-mcp-complete-"));

  mkdirSync(join(root, "docs/plans"), { recursive: true });
  writeFileSync(join(root, "docs/plans/_demo.md"), PLAN);

  return root;
}

test("a tick without evidence is refused, and the plan is untouched", () => {
  const root = project();
  const result = completeStep(root, { want: "WS1-T1" });

  assert.equal(result.status, "refused");
  assert.match(result.message, /evidence/u);
  assert.match(readFileSync(join(root, "docs/plans/_demo.md"), "utf8"), /- \[ \] WS1-T1/u, "the checkbox stays open");

  rmSync(root, { recursive: true, force: true });
});

test("evidence that does not exist refuses the tick", () => {
  const root = project();
  const result = completeStep(root, { want: "WS1-T1", evidence: "src/missing.js" });

  assert.equal(result.status, "refused");
  assert.match(result.message, /does not exist/u);
  assert.match(readFileSync(join(root, "docs/plans/_demo.md"), "utf8"), /- \[ \] WS1-T1/u);

  rmSync(root, { recursive: true, force: true });
});

test("evidence outside the project proves nothing", () => {
  const root = project();
  const result = completeStep(root, { want: "WS1-T1", evidence: "../../etc/hosts" });

  assert.equal(result.status, "refused");
  assert.match(result.message, /outside the project/u);

  rmSync(root, { recursive: true, force: true });
});

test("a tick lands when the evidence exists, and it reports the delta", () => {
  const root = project();

  mkdirSync(join(root, "src"), { recursive: true });
  writeFileSync(join(root, "src/thing.js"), "export const thing = 1;\n");

  const result = completeStep(root, { want: "WS1-T1", evidence: "src/thing.js" });

  assert.equal(result.status, "ticked");
  assert.equal(result.id, "WS1-T1");
  assert.equal(result.was, 2);
  assert.equal(result.open, 1, "one step is done");
  assert.match(result.next, /WS1-T2/u, "the report names what comes next");
  assert.ok(existsSync(join(root, "docs/plans/_demo.md")));

  const after = readFileSync(join(root, "docs/plans/_demo.md"), "utf8");

  assert.match(after, /- \[x\] WS1-T1/u, "the checkbox is ticked");
  assert.match(after, /- \[ \] WS1-T2/u, "and only that one");
  assert.equal(nextStep(root, { want: "WS1-T1" }).status, "closed", "the step no longer resolves as next");

  rmSync(root, { recursive: true, force: true });
});

test("the same step cannot be ticked twice", () => {
  const root = project();

  writeFileSync(join(root, "thing.js"), "1\n");
  completeStep(root, { want: "WS1-T1", evidence: "thing.js" });

  const again = completeStep(root, { want: "WS1-T1", evidence: "thing.js" });

  assert.notEqual(again.status, "ticked", "the second call has nothing to tick");

  rmSync(root, { recursive: true, force: true });
});
