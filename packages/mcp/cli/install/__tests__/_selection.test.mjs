/**
 * What an install writes, chosen rather than assumed.
 *
 * Area slash commands are hubs only (ADR 117). Personas and tasks still fan
 * out. The selection is data - families, areas - so the interactive picker and
 * the flags decide the same thing the same way.
 */
import { strict as assert } from "node:assert";
import { test } from "node:test";

import { FAMILIES, PRESETS, resolveSelection } from "../_selection.js";

test("the families partition the command surface, with nothing left over", () => {
  const all = resolveSelection({ families: FAMILIES.map((family) => family.id) }).commands;
  const everything = resolveSelection({ preset: "full" }).commands;

  assert.deepEqual(new Set(all), new Set(everything), "selecting every family is the same as asking for everything");
  assert.equal(all.length, 16, `one area, one persona and the tasks: ${all.length}`);
  assert.ok(
    all.every((name) => !/^rule-(area|persona)-[a-z]/.test(name)),
    "no per-area or per-role file",
  );
});

test("each preset is a subset of the next", () => {
  const minimal = new Set(resolveSelection({ preset: "minimal" }).commands);
  const standard = new Set(resolveSelection({ preset: "standard" }).commands);
  const full = new Set(resolveSelection({ preset: "full" }).commands);

  for (const name of minimal) {
    assert.ok(standard.has(name), `${name}: minimal must fit inside standard`);
  }

  for (const name of standard) {
    assert.ok(full.has(name), `${name}: standard must fit inside full`);
  }

  // ADR 117: full and standard share the same area hubs; full equals standard
  // when both include personas+tasks. minimal stays smaller.
  assert.ok(minimal.size < standard.size, `minimal < standard: ${minimal.size} < ${standard.size}`);
  assert.deepEqual(standard, full, "standard and full match once leaf area slash is gone");
});

test("the router is in every preset, because nothing works without it", () => {
  for (const preset of Object.keys(PRESETS)) {
    assert.ok(resolveSelection({ preset }).commands.includes("rule"), `${preset}: the dispatcher is not optional`);
  }
});

test("minimal is the router and the one area command", () => {
  const { commands } = resolveSelection({ preset: "minimal" });

  assert.deepEqual(commands, ["rule", "rule-area"], "router plus the area dispatcher (ADR 251)");
  assert.ok(
    commands.every((name) => name !== "rule-persona"),
    "and not the persona dispatcher",
  );
});

test("a chosen area no longer removes a file, because the vocabulary is one file", () => {
  const { commands, problems } = resolveSelection({ families: ["areas"], areas: ["frontend", "data"] });

  assert.deepEqual(problems, [], "the ids are still validated against the catalog");
  assert.ok(commands.includes("rule-area"), "the dispatcher carries every area");
  assert.equal(commands.filter((name) => name.startsWith("rule-area")).length, 1, "one file, not one per area");
});

test("picking skills validates the name and keeps the single area command", () => {
  const { commands, problems } = resolveSelection({ families: ["areas"], areas: ["frontend"], skills: ["rule-frontend-react"] });

  assert.deepEqual(problems, []);
  assert.ok(commands.includes("rule-area"), "leaves are tools, so nothing per skill is written");
});

test("personas and tasks are their own families", () => {
  const personas = resolveSelection({ families: ["personas"] }).commands;

  assert.deepEqual(personas, ["rule", "rule-persona"], "one command for every role (ADR 251)");
  assert.ok(
    personas.every((name) => !/-(audit|review|plan)$/.test(name)),
    "the per-operation persona commands stay gone (ADR 120)",
  );
  assert.ok(
    personas.every((name) => name !== "rule-area"),
    "and nothing from another family",
  );

  const tasks = resolveSelection({ families: ["tasks"] }).commands;

  assert.ok(tasks.includes("rule-handoff") && tasks.includes("rule-check"), "the one-shot tasks");
});

test("an empty selection is the router alone, not a crash", () => {
  const { commands } = resolveSelection({});

  assert.deepEqual(commands, ["rule"], "something has to answer, and it is the dispatcher");
});

test("an unknown family, area or skill is reported rather than silently dropped", () => {
  const result = resolveSelection({ families: ["areas", "nope"], areas: ["frontend", "nowhere"], skills: ["rule-mcp-not-a-skill"] });

  assert.ok(
    result.problems.some((problem) => /nope/.test(problem)),
    `the family is named: ${JSON.stringify(result.problems)}`,
  );
  assert.ok(
    result.problems.some((problem) => /nowhere/.test(problem)),
    "so is the area",
  );
  assert.ok(
    result.problems.some((problem) => /rule-mcp-not-a-skill/.test(problem)),
    "and the skill",
  );
  assert.ok(result.commands.includes("rule-area"), "and what was valid still resolves");
});

test("the selection is sorted and free of duplicates", () => {
  const { commands } = resolveSelection({ preset: "full" });

  assert.deepEqual(commands, [...new Set(commands)], "a command is written once");
  assert.deepEqual(
    [...commands].sort((a, b) => a.localeCompare(b)),
    commands,
    "and in the order every other surface uses",
  );
});
