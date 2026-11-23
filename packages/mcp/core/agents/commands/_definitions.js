/** @module core/agents/commands/definitions */

import { listPrompts } from "@mcp/prompts/index.js";
import { promptHelp } from "@mcp/prompts/index.js";
import { buildHelpMessage, helpHeading } from "@mcp/prompts/_help.js";
import { areaIds, AREA_DISPATCH_NAME, skillAreas } from "@mcp/prompts/_areas.js";
import { ROUTER, generalCheckBody, generalFixBody } from "./_bodies.js";
import { areaBody, areaDispatchBody } from "./_bodies-area.js";
import { ADR_BODY, COMPRESS_BODY, EXPORT_BODY, GIT_BODY, HANDOFF_BODY, HANDON_BODY, INIT_BODY, KEEP_BODY, STATS_BODY, USAGE_BODY } from "./_bodies-session.js";
import { commandNames, ROUTER_COMMAND, CHECK_COMMAND, FIX_COMMAND } from "./_names.js";
import { personaBody, personaDispatchBody, personaTarget } from "./_personas.js";
import { PERSONA_DISPATCH_NAME } from "@mcp/prompts/_registry.js";
import { activeRoles } from "../../review/roles/index.js";

/**
 * Full definition for a single command: name, description, argument hint, body.
 *
 * @param {string} name
 * @returns {{ name: string, description: string, argumentHint: string, body: string }}
 */
export function commandDefinition(name) {
  if (name === ROUTER_COMMAND) {
    return { name, description: ROUTER.description, argumentHint: ROUTER.argumentHint, body: ROUTER.body };
  }

  if (name === CHECK_COMMAND) {
    return {
      name,
      description: "Auto-detect area from context and run rule-mcp guardrails validation",
      argumentHint: "[target]",
      body: generalCheckBody,
    };
  }

  if (name === FIX_COMMAND) {
    return {
      name,
      description: "Apply the deterministic guardrail fixes of every skill to the changed files",
      argumentHint: "[target]",
      body: generalFixBody,
    };
  }

  if (name === AREA_DISPATCH_NAME) {
    const areas = areaIds().map((area) => {
      const entry = skillAreas().get(area);

      return { area, hub: entry?.hub ?? `rule-${area}`, members: [...(entry?.members ?? [])] };
    });

    return {
      name,
      description: `Route a request to one area: ${areaIds().join(", ")}`,
      argumentHint: "<area> <request>",
      body: areaDispatchBody(areas),
    };
  }

  if (name === PERSONA_DISPATCH_NAME) {
    return {
      name,
      description: "Audit, review and plan as one specialist persona",
      argumentHint: "<persona> <request>",
      body: personaDispatchBody(activeRoles().map(({ id, role }) => ({ id, role }))),
    };
  }

  const prompt = listPrompts().find((p) => p.name === name);

  if (!prompt) {
    throw new Error(`Unknown command: ${name}`);
  }

  const primary = prompt.arguments?.[0];
  const argumentHint = primary ? (primary.required ? `<${primary.name}>` : `[${primary.name}]`) : "<request>";
  const persona = personaTarget(name);
  const sessionBodies = {
    "rule-handoff": HANDOFF_BODY,
    "rule-handon": HANDON_BODY,
    "rule-compress": COMPRESS_BODY,
    "rule-stats": STATS_BODY,
    "rule-adr": ADR_BODY,
    "rule-export": EXPORT_BODY,
    "rule-keep": KEEP_BODY,
    "rule-usage": USAGE_BODY,
    "rule-init": INIT_BODY,
    "rule-git": GIT_BODY,
  };
  const area = name.startsWith("rule-area-") ? null : null;
  const body = persona ? personaBody(persona) : (sessionBodies[name] ?? areaBody(prompt.description));

  return { name, description: prompt.description, argumentHint, body };
}

/**
 * Every command definition, in canonical order.
 *
 * @returns {Array<{ name: string, description: string, argumentHint: string, body: string }>}
 */
export function listAgentCommands() {
  return commandNames().map((name) => commandDefinition(name));
}

/**
 * The argument the two general commands take. They are not MCP prompts (ADR 098),
 * so their help block is built here instead of from a prompt definition.
 */
const GENERAL_HELP_ARGUMENTS = {
  [CHECK_COMMAND]: {
    name: "target",
    description: "Paths or files to check. Default: the current git diff, then the whole project.",
    required: false,
  },
  [FIX_COMMAND]: {
    name: "target",
    description: "Paths or files to fix. Default: the files the current git diff touches, then the whole project.",
    required: false,
  },
};

/**
 * The usage block `/rule-* help` prints for one command.
 *
 * One text per command, whichever surface asks: the MCP prompt path, the CLI
 * help command, and the generated Pi extension and opencode plugin all read it
 * from here.
 *
 * @param {string} name
 * @returns {string}
 */
export function commandHelp(name) {
  const fromPrompt = promptHelp(name);

  if (fromPrompt !== undefined) {
    return fromPrompt;
  }

  const command = commandDefinition(name);
  const argument = GENERAL_HELP_ARGUMENTS[name];
  const block = buildHelpMessage(name, { description: command.description, arguments: argument ? [argument] : [] }, []);

  return `${helpHeading(name)}\n\n${block}`;
}
