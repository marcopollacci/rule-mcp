/** Branch coverage for selection presets, unknown values and hubs-only. */
import assert from "node:assert/strict";
import { test } from "node:test";

import { ROUTER_COMMAND } from "../../../core/agents/commands/index.js";
import { resolveSelection } from "../_selection.js";

test("an unknown preset and family are reported as problems", () => {
  const { commands, problems } = resolveSelection({ preset: "nope", families: ["ghost"] });

  assert.ok(problems.some((line) => /unknown preset/u.test(line)));
  assert.ok(commands.includes(ROUTER_COMMAND), "the router is always written");
});

test("the areas family is one command, whatever hubsOnly says", () => {
  for (const hubsOnly of [true, false]) {
    const { commands, problems } = resolveSelection({ families: ["areas"], hubsOnly });

    assert.deepEqual(problems, []);
    assert.deepEqual(commands, [ROUTER_COMMAND, "rule-area"], `hubsOnly=${hubsOnly}: router plus the dispatcher`);
  }
});

test("a skill filter no longer selects a file, because leaves are tools", () => {
  const { commands, problems } = resolveSelection({
    families: ["areas"],
    hubsOnly: false,
    skills: ["rule-frontend-react"],
  });

  assert.deepEqual(problems, [], "the skill name is still validated");
  assert.deepEqual(commands, [ROUTER_COMMAND, "rule-area"]);
});

test("an unknown area and skill are reported", () => {
  const { problems } = resolveSelection({
    families: ["areas"],
    areas: ["no-such-area"],
    skills: ["rule-mcp-no-such-skill"],
  });

  assert.ok(problems.some((line) => /unknown area/u.test(line)));
  assert.ok(problems.some((line) => /unknown skill/u.test(line)));
});
