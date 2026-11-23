/**
 * The Shell completions step, driven through the fake screen.
 *
 * Its own file because `_wizard.test.mjs` sits at the 150-line cap: a step that
 * writes into a shell's own tree is a concern, not another case of the flow.
 */
import assert from "node:assert/strict";
import { rmSync } from "node:fs";
import { test } from "node:test";

import { FEATURE_ANSWERS, SCOPE_ANSWER, fakeScreen, reset, runInstallWizard } from "./_wizard.fixture.mjs";

test.after(() => rmSync(process.env.RULE_MCP_HOME, { recursive: true, force: true }));

/** A standard install whose completions step answers with `destinations`. */
async function installWith(destinations) {
  reset();
  const screen = fakeScreen(["next", "standard", ["claude"], SCOPE_ANSWER, "stdio", "standard", ...FEATURE_ANSWERS, "no", "run", "close"]);
  const ask = screen.ask;

  screen.ask = async (spec) => {
    const answer = await ask(spec);

    return spec.title === "Shell completions" ? destinations : answer;
  };

  await runInstallWizard({ screen });

  return screen;
}

test("the completions step is asked and writes nothing when it is empty", async () => {
  const screen = await installWith([]);

  assert.equal(
    screen.asks.some((spec) => spec.title === "Shell completions"),
    true,
    "the step is asked",
  );
  assert.equal(globalThis.__wizardStub.plans.at(-1).includes("completions"), false, "no tick means no task");
});

test("a ticked destination adds the task to the plan", async () => {
  const screen = await installWith(["zsh-oh-my-zsh"]);

  assert.ok(globalThis.__wizardStub.plans.at(-1).includes("completions"), "the task reaches the plan");
  assert.equal(screen.asks.find((spec) => spec.title === "Shell completions").mode, "check", "it is a checklist");
});
