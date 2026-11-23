/**
 * @module prompts/areas-prompts
 *
 * One MCP/slash prompt per area hub, built from the area mapping.
 *
 * The hub skill owns its area's command: `/rule-area-frontend` IS `rule-frontend`.
 * Leaf skills keep their tools; the hub routes to them from free text (ADR 109).
 */

import { skillAreas, skillToolName } from "./_areas-base.js";

/** Readable skill + tool pairs for hub routing prose. */
function memberRoutingList(members) {
  const pairs = members.map((skill) => `\`${skill}\` / \`${skillToolName(skill)}\``);
  const shown = pairs.slice(0, 12);

  return pairs.length > shown.length ? `${shown.join(", ")}, and ${pairs.length - shown.length} more` : shown.join(", ");
}

/**
 * The area name capitalized for prose. The slug stays lowercase everywhere it is
 * an id; only the description, which leads the slash-command hint, reads as a
 * sentence.
 */
function areaLabel(area) {
  return `${area.charAt(0).toUpperCase()}${area.slice(1)}`;
}

/** The lines every area hub prompt shares: route leaves from free text, check, commit. */
function hubPromptLines(area, hub, members) {
  const evidence = members.length > 0 ? `the hub \`${hub}\` and whichever leaf skills the request names: ${memberRoutingList(members)}` : `the \`${hub}\` skill`;

  return [
    `You are the ${area} area specialist for rule-mcp (collector slash only; ADR 109).`,
    `Route this request through \`rule_tool\` first, then load ${evidence} as source of truth.`,
    "The request is free text: extract every framework, platform, database or tool it names (e.g. rspack, pnpm, eslint, husky, react) and call the matching leaf `rule_tool_*` / load that skill; call several when the request spans several leaves. Never invent APIs, files, dependencies, commands, or requirements not present in the skill evidence.",
    "If the request is a check (whole tokens such as check, controlla, validate, verify, guardrail, lint), call `rule_tool_check` on the named paths or the git diff against the routed skill(s) and skip the implement path (ADR 108).",
    "Baseline: involve TDD (write failing tests first) and a11y (WCAG 2.2 AA, axe-core where applicable). If the request has no test/a11y surface, ask the user what to cover before finishing.",
    "Validate generated code with `rule_tool_check` and iterate until all guardrails pass.",
    "Compression is implicit: if the user is working in compression mode, keep the response compressed.",
    `When the work is done, propose a conventional commit message with a mandatory scope, e.g. "feat(${area}): ...".`,
  ].join("\n");
}

/**
 * One prompt per area hub only (ADR 109). Leaf skills stay as tools, not slash.
 *
 * @returns {Array<{ name: string, description: string, text: string, skill: string, area: string, members: string[], arguments: object[] }>}
 */
export function listAreaPrompts() {
  const prompts = [];

  for (const [area, entry] of skillAreas()) {
    if (!entry.hub) {
      continue;
    }

    const members = [...entry.members].sort((a, b) => a.localeCompare(b));

    prompts.push({
      name: `rule-area-${area}`,
      skill: entry.hub,
      area,
      members,
      description: `${areaLabel(area)} work: route free text to the right ${area} leaf skills/tools`,
      text: hubPromptLines(area, entry.hub, members),
      arguments: [{ name: "request", description: `A ${area} task, in free text (name leaves like rspack/pnpm/react when known)`, required: true }],
    });
  }

  return prompts;
}

/** The one area command: the id is the first word of the request (ADR 251). */
export const AREA_DISPATCH_NAME = "rule-area";

/** The area ids, in the order the dispatcher lists them. */
export function areaIds() {
  return [...skillAreas().keys()].sort((a, b) => a.localeCompare(b));
}

/**
 * The single `/rule-area` prompt.
 *
 * It replaces the 11 per-area hubs: a slash template substitutes text, so the
 * id travels as the first argument instead of in the command name, and one file
 * per host carries the whole vocabulary.
 *
 * @returns {{ name: string, description: string, text: string, arguments: object[] }}
 */
export function areaDispatcherPrompt() {
  const ids = areaIds();
  const lines = skillAreas();

  return {
    name: AREA_DISPATCH_NAME,
    description: `Route a request to one area: ${ids.join(", ")}`,
    text: [
      `Area ids: ${[...lines.entries()].map(([area, entry]) => `${area} (hub \`${entry.hub}\`, ${entry.members.length} leaf skills)`).join("; ")}.`,
      "",
      "Read the area from the first word of the request; the rest is the task.",
      "When the first word names no area, infer it from the task and say which one you used.",
      "Baseline: write failing tests first (TDD) and cover a11y (WCAG 2.2 AA) where applicable; if the request has no test or a11y surface, ask the user what to cover.",
      "Finish by proposing a conventional commit message with a mandatory scope.",
    ].join("\n"),
    arguments: [
      { name: "area", description: `One of: ${ids.join(", ")}. First word of the request.`, required: true },
      { name: "request", description: "The task, in free text (name leaves like rspack/pnpm/react when known)", required: true },
    ],
  };
}

/**
 * The task text for one area request, or undefined for an unknown id.
 *
 * @param {string} area
 * @param {string} [request]
 * @returns {string|undefined}
 */
export function areaRequestText(area, request = "") {
  const entry = skillAreas().get(`${area ?? ""}`.toLowerCase());

  if (!entry) {
    return;
  }

  const members = [...entry.members].sort((a, b) => a.localeCompare(b));

  return [`Area: ${area} (hub \`${entry.hub}\`)`, "", `Request: ${request}`, "", hubPromptLines(area, entry.hub, members)].join("\n");
}
