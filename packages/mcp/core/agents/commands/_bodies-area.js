/** @module core/agents/commands/bodies-area - the area command bodies (ADR 109, ADR 249) */

import { CHECK_INTENT_KEYWORDS_LIST } from "./_check-intent.js";
import { checkModeSteps } from "./_bodies.js";
import { toolNameForSkill } from "../../../tools/skill/_skill-tool.js";

/**
 * Uniform body for an area hub command (ADR 109: collectors only). Check intent
 * in $ARGUMENTS flips to the guardrail-only path (ADR 108).
 *
 * @param {string} description - the prompt's registry description
 * @param {{ skill?: string, members?: string[] }} [opts]
 * @returns {string}
 */
export function areaBody(description, { skill, members = [] } = {}) {
  const skillClause = skill ? `the routed leaf skill(s), defaulting to hub \`${skill}\` when the request names none` : "the routed leaf skill(s) for this area";

  const leafLines =
    members.length > 0
      ? [
          `Leaf skills/tools in this area (call those the request names; several when needed): ${members
            .map((name) => {
              // The same rule the runtime mints tools by: strip `rule-`,
              // then hyphens become underscores.
              const tool = toolNameForSkill(name);

              return `\`${name}\` / \`${tool}\``;
            })
            .join(", ")}.`,
          "",
        ]
      : [];

  return [
    "Route this request through rule-mcp: $ARGUMENTS",
    "",
    `Scope: ${description}`,
    "",
    ...leafLines,
    `Check intent: if the request contains any of these whole tokens (case-insensitive) - ${CHECK_INTENT_KEYWORDS_LIST} - run the guardrail-only path and skip the normal route/implement path.`,
    "",
    ...checkModeSteps(skillClause),
    "",
    "Otherwise (no check intent):",
    "1. Parse the request for every leaf topic (framework, tool, database, ...). Call `rule_tool` and/or each matching leaf `rule_tool_*`, then load that skill evidence as source of truth.",
    "2. Never invent APIs, files, dependencies, commands, or requirements not present in the evidence; if evidence is missing, call `rule_tool_search` or state uncertainty.",
    "3. Baseline: write failing tests first (TDD) and cover a11y (WCAG 2.2 AA) where applicable; if there is no test/a11y surface, ask the user what to cover.",
    "4. Validate generated code with `rule_tool_check`; iterate until all guardrails pass.",
    "5. Write every comment, identifier and generated document in English, American spelling (color, behavior, organize - see rule-process-ai).",
    "6. Finish by proposing a conventional commit message with a mandatory scope.",
    "7. Responses are compressed automatically by the server: keep it factual and free of filler.",
  ].join("\n");
}

/**
 * Body for the one `/rule-area` command (ADR 249).
 *
 * The body carries the vocabulary: the model reads the area from the first word
 * of the request and routes with the hub and leaves named for it.
 *
 * @param {Array<{ area: string, hub: string, members: string[] }>} areas
 * @returns {string}
 */
export function areaDispatchBody(areas = []) {
  return [
    "Route this request through rule-mcp: $ARGUMENTS",
    "",
    "Read the area from the first word of the request; the rest of that text is the task.",
    `Areas: ${areas.map((entry) => `${entry.area} (hub \`${entry.hub}\`, leaves ${entry.members.length})`).join(", ")}.`,
    "When the first word names no area, infer it from the task and say which one you used.",
    "",
    `Check intent: if the request contains any of these whole tokens (case-insensitive) - ${CHECK_INTENT_KEYWORDS_LIST} - run the guardrail-only path below and skip the implement path. The target is the rest of the text after the area.`,
    "",
    ...checkModeSteps("the hub skill of the named area and whichever leaf skills the request names"),
    "",
    "Otherwise (no check intent):",
    "1. Load the hub skill of the named area, then parse the rest of the request for every leaf topic (framework, tool, database, ...). Call `rule_tool` and/or each matching leaf `rule_tool_*`, then treat that evidence as source of truth.",
    "2. Never invent APIs, files, dependencies, commands, or requirements not present in the evidence; if evidence is missing, call `rule_tool_search` or state uncertainty.",
    "3. Baseline: write failing tests first (TDD) and cover a11y (WCAG 2.2 AA) where applicable; if there is no test/a11y surface, ask the user what to cover.",
    "4. Validate generated code with `rule_tool_check`; iterate until all guardrails pass.",
    "5. Write every comment, identifier and generated document in English, American spelling (color, behavior, organize - see rule-process-ai).",
    "6. Finish by proposing a conventional commit message with a mandatory scope.",
    "7. Responses are compressed automatically by the server: keep it factual and free of filler.",
  ].join("\n");
}
