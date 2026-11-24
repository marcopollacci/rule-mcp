/**
 * Resolving the step a request names.
 *
 * The corpus behind this module is explicit: 524 of 3 932 human prompts open
 * with "vai" or "procedi", and 417 name a plan id. So the cases below are the
 * ones a person actually types, and each has an answer that cannot be confused
 * with another.
 */

import { strict as assert } from "node:assert";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { continuationOf, nextStep } from "../_step.js";
import { firstOpenStep, openCount } from "../_step-scan.js";

/** A project whose plans are the ones each test writes. */
function project(plans) {
  const root = mkdtempSync(join(tmpdir(), "rule-mcp-next-"));

  mkdirSync(join(root, "docs/plans"), { recursive: true });
  writeFileSync(join(root, "docs/plans/plan-of-plans.md"), "# plan-of-plans\n\nStatus: `in-progress`\n");

  for (const [name, body] of Object.entries(plans)) {
    writeFileSync(join(root, "docs/plans", name), body);
  }

  return root;
}

const PLAN = `# demo plan

Status: \`in-progress\`

## WS1 First workstream

- [x] WS1-T1 done already.
- [ ] WS1-T2 the open one that matters.
- [ ] WS1-T3 after it.

## WS2 Second workstream

- [ ] WS2-T1 a later step.
`;

test("a continuation word carries no plan name", () => {
  for (const word of ["vai", "vai avanti", "procedi pure", "andiamo avanti", "continue", "next"]) {
    assert.equal(continuationOf(word), "", `${word}: names no plan`);
  }

  assert.equal(continuationOf("vai con la fase 4"), "fase 4", "the phase survives the continuation");
  assert.equal(continuationOf("continua con WS1-T1"), "ws1-t1", "a step id survives it too");
});

test("the first open step is the first one not ticked", () => {
  const found = firstOpenStep(PLAN);

  assert.equal(found.id, "WS1-T2");
  assert.equal(found.workstream, "WS1 First workstream");
  assert.match(found.step, /the open one that matters/u);
  assert.equal(openCount(PLAN), 3);
});

test("a wrapped step keeps its continuation lines", () => {
  const wrapped = "## WS1\n\n- [ ] WS1-T1 a step that wraps\n  onto a second line\n  and a third.\n- [ ] WS1-T2 next.\n";
  const found = firstOpenStep(wrapped);

  assert.match(found.step, /onto a second line and a third/u, "half a step is worse than none");
});

test("a bare continuation takes the cascade's first plan", () => {
  const root = project({ "_demo.md": PLAN });
  const result = nextStep(root, { want: "vai" });

  assert.equal(result.status, "found");
  assert.equal(result.plan, "demo");
  assert.equal(result.id, "WS1-T2");
  assert.equal(result.open, 3);

  rmSync(root, { recursive: true, force: true });
});

test("a plan slug resolves to that plan, not the first one", () => {
  const other = PLAN.replaceAll("WS1", "WSX").replaceAll("WS2", "WSY").replace("# demo plan", "# other plan");
  const root = project({ "_aaa.md": PLAN, "_zzz.md": other });

  assert.equal(nextStep(root, { want: "zzz" }).plan, "zzz");
  assert.equal(nextStep(root, { want: "aaa" }).plan, "aaa");

  rmSync(root, { recursive: true, force: true });
});

test("a step id resolves to that step, and a closed one says so", () => {
  const root = project({ "_demo.md": PLAN });

  assert.equal(nextStep(root, { want: "WS2-T1" }).id, "WS2-T1");
  assert.equal(nextStep(root, { want: "WS1-T1" }).status, "closed", "a ticked step is not the next step");
  assert.match(nextStep(root, { want: "WS1-T1" }).message, /WS1-T1/u);

  rmSync(root, { recursive: true, force: true });
});

test("a phase resolves to its own workstream", () => {
  const root = project({ "_demo.md": PLAN });
  const result = nextStep(root, { want: "WS2" });

  assert.equal(result.status, "found");
  assert.equal(result.id, "WS2-T1");
  assert.equal(result.workstream, "WS2 Second workstream");

  rmSync(root, { recursive: true, force: true });
});

test("two plans with one name are ambiguous, and it names them", () => {
  const root = project({ "_demo.md": PLAN, "_demo-two.md": PLAN });
  const result = nextStep(root, { want: "demo" });

  assert.equal(result.status, "ambiguous");
  assert.deepEqual(result.candidates.sort(), ["demo", "demo-two"]);

  rmSync(root, { recursive: true, force: true });
});

test("an unknown name and a closed plan both answer without inventing a step", () => {
  const done = "# done plan\n\nStatus: `done`\n\n## WS1\n\n- [x] WS1-T1 finished.\n";
  const root = project({ "_done.md": done });

  assert.equal(nextStep(root, { want: "nothing-like-this" }).status, "missing");
  assert.equal(nextStep(root, {}).status, "closed");

  rmSync(root, { recursive: true, force: true });
});
