/**
 * What the caller reads: the step, the refusal, the tick.
 *
 * The resolver has its own tests. These pin the rendered answer, because the
 * text is what a model acts on: a missing "nothing to run" or a lost step
 * sentence changes the decision, not just the wording.
 */

import { strict as assert } from "node:assert";
import { test } from "node:test";

import { renderComplete, renderNext } from "../_next.js";

test("a found step is fenced, with its workstream and the open count", () => {
  const text = renderNext({
    status: "found",
    plan: "demo",
    workstream: "WS1 First",
    id: "WS1-T1",
    step: "WS1-T1 write the thing.",
    open: 3,
  });

  assert.match(text, /# Next step: demo - WS1 First/u);
  assert.match(text, /Step `WS1-T1`, 3 open in this plan\./u);
  assert.match(text, /```text\nWS1-T1 write the thing\.\n```/u, "the instruction travels verbatim");
  assert.match(text, /Execute that step/u);
});

test("a plan that cannot be read says nothing to run, and lists candidates", () => {
  const ambiguous = renderNext({ status: "ambiguous", candidates: ["demo", "demo-two"], message: "2 plans match" });

  assert.match(ambiguous, /No step to run: 2 plans match/u);
  assert.match(ambiguous, /Candidates: `demo`, `demo-two`/u);

  assert.match(renderNext({ status: "closed", message: "every plan is closed" }), /No step to run: every plan is closed/u);
});

test("a ticked step reports the delta and what comes next", () => {
  const text = renderComplete({ status: "ticked", plan: "demo", id: "WS1-T1", was: 3, open: 2, next: "WS1-T2: write the next thing." });

  assert.match(text, /# Ticked WS1-T1 in demo/u);
  assert.match(text, /3 open before, 2 after\./u);
  assert.match(text, /Next: WS1-T2/u);
});

test("a refused tick names the plan and the step, and does not claim success", () => {
  const text = renderComplete({ status: "refused", plan: "demo", id: "WS1-T1", message: "src/missing.js does not exist" });

  assert.match(text, /^Not ticked: src\/missing\.js does not exist/u);
  assert.match(text, /Plan: `demo`, step WS1-T1/u);
  assert.doesNotMatch(text, /Ticked/u);
});
