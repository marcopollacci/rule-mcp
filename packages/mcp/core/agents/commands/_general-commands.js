/**
 * @module core/agents/commands/general-commands
 *
 * The three commands that are not MCP prompts (ADR 098): the router, the
 * auto-detecting check, the deterministic fixer and the plan advancer. Their
 * bodies live in the body modules; this module is the branch table.
 */

import { ROUTER, generalCheckBody, generalFixBody } from "./_bodies.js";
import { NEXT_BODY, STATE_BODY } from "./_bodies-plan.js";
import { ROUTER_COMMAND, CHECK_COMMAND, FIX_COMMAND, NEXT_COMMAND, STATE_COMMAND } from "./_names.js";

/** One command definition, or null when the name is a prompt instead. */
export function generalCommand(name) {
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

  if (name === NEXT_COMMAND) {
    return {
      name,
      description: "Advance the plan step a request names, or the one a resumed session takes",
      argumentHint: "[want]",
      body: NEXT_BODY,
    };
  }

  if (name === STATE_COMMAND) {
    return {
      name,
      description: "Report the project state: version, decisions, plans, tree, last CI, last handoff",
      argumentHint: "[focus]",
      body: STATE_BODY,
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

  return null;
}
