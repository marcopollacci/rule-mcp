/** The generated surfaces: one prompt and one command per active role, all from the registry. */
import { strict as assert } from "node:assert";
import test from "node:test";

import { activeRoles, getPrompt, listAgentCommands, listPrompts } from "./_surfaces.fixture.mjs";

test("one persona prompt addresses every active role", () => {
  const names = new Set(listPrompts().map((prompt) => prompt.name));

  assert.ok(names.has("rule-persona"), "the dispatcher addresses the whole catalog (ADR 249)");

  for (const role of activeRoles()) {
    assert.equal(names.has(`rule-persona-${role.id}`), false, `the per-role ${role.id} prompt must be gone`);
  }
});

test("the request decides how deep the run goes", () => {
  const sectionOf = (topic) => {
    const prompt = getPrompt("rule-persona", { persona: "security", ...(topic !== undefined && { topic }) });
    const text = prompt.messages.map((message) => message.content.text).join("\n");

    assert.ok(!text.includes("{{"), "no placeholder reaches the client");
    assert.match(text, /Security Engineer/);

    return text;
  };

  const audit = sectionOf("the auth flow");

  assert.match(audit, /## The operation: audit$/m, "no stage keyword runs the audit alone");
  assert.match(audit, /docs\/audits\/security\.md/);
  assert.ok(!audit.includes("docs/plans/security.md"), "an audit run does not promise the plan");
  assert.ok(!audit.includes("docs/reviews/security.md"), "nor the review");

  const review = sectionOf("review the auth flow");

  assert.match(review, /## The operation: audit, then review/);
  assert.match(review, /docs\/audits\/security\.md/);
  assert.match(review, /docs\/reviews\/security\.md/);
  assert.match(review, /distilled from the audit/, "the review points back at the audit");
  assert.ok(!review.includes("docs/plans/security.md"), "a review does not promise the plan");

  const plan = sectionOf("plan the auth fix");

  assert.match(plan, /## The operation: audit, review, plan/);
  assert.match(plan, /docs\/audits\/security\.md/);
  assert.match(plan, /docs\/reviews\/security\.md/);
  assert.match(plan, /docs\/plans\/security\.md/);
});

test("a role prompt takes an optional topic and makes it the binding scope", () => {
  const prompt = getPrompt("rule-persona", { persona: "privacy", topic: "the flight recorder exports" });
  const text = prompt.messages.map((message) => message.content.text).join("\n");

  assert.match(text, /the flight recorder exports/);
  assert.match(text, /## Scope: binding/, "the topic is a scope, not a suggestion");
});

test("one agent command addresses every active role", () => {
  const commands = new Set(listAgentCommands().map((command) => command.name));

  assert.ok(commands.has("rule-persona"), "the dispatcher is the persona command (ADR 249)");

  for (const role of activeRoles()) {
    assert.ok(!commands.has(`rule-persona-${role.id}`), `the per-role ${role.id} command must be gone`);
  }
});

test("persona command bodies route through the tools and carry the depth intent", () => {
  for (const command of listAgentCommands()) {
    if (command.name !== "rule-persona") {
      continue;
    }

    assert.match(command.body, /rule_tool_plan/, `${command.name}: body must get the contract from rule_tool_plan`);
    assert.match(command.body, /rule_tool_impersonation/, `${command.name}: body must hand the trio to rule_tool_impersonation`);
    assert.match(command.body, /commit/, `${command.name}: body must close with a scoped commit`);
    assert.match(command.body, /Depth intent/, `${command.name}: body must state the depth rule`);
    assert.match(command.body, /operation=plan/, `${command.name}: a plan ask runs the deepest operation`);
    assert.match(command.body, /operation=review/, `${command.name}: a review ask runs audit plus review`);
    assert.match(command.body, /operation=audit/, `${command.name}: the fallback is the audit`);
    // The request typed after the command is the run's focus: it must be
    // forwarded into rule_tool_plan as `topic` (handoff-style pass-through).
    assert.match(command.body, /\$ARGUMENTS/, `${command.name}: body must carry the request placeholder`);
    assert.match(command.body, /unchanged as `topic`/, `${command.name}: body must forward the request as topic`);
    assert.match(command.body, /binding scope/, `${command.name}: body must call the request the binding scope`);
  }
});

test("the persona dispatcher accepts the id and a free-form request", () => {
  const personaDefs = listPrompts().filter((p) => p.name === "rule-persona");

  for (const prompt of personaDefs) {
    assert.equal(prompt.arguments.length, 2, `${prompt.name}: the id plus the request`);
    assert.equal(prompt.arguments[0].name, "persona", `${prompt.name}: the id comes first`);
    assert.equal(prompt.arguments[1].name, "topic", `${prompt.name}: the argument is the request`);
    assert.match(prompt.arguments[1].description, /request/, `${prompt.name}: the argument description must call it a request`);
  }

  // Help surfaces an invocation example, so the user sees how the request slots in.
  const help = getPrompt("rule-persona", { persona: "help" });
  const helpText = help.messages[0].content.text;

  assert.match(helpText, /^RuleMCP Help: command `\/rule-persona`\n\nUsage: \/rule-persona/, "the dispatcher answers /rule-persona help with its own block");
  assert.match(helpText, /persona|topic/, "the usage block names the argument the command takes");

  // The request reaches the model: a persona prompt with a topic must say so.
  const withRequest = getPrompt("rule-persona-security", { topic: "the SSE daemon token handling" });
  const text = withRequest.messages.map((message) => message.content.text).join("\n");

  assert.match(text, /the SSE daemon token handling/, "the request must land in the filled template");
});
