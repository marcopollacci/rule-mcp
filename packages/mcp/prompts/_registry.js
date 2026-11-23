/** The prompt registry: static definitions plus generated persona prompts. */
import { suppressesPrompts } from "./_client-suppression.js";
import { activeRoles } from "../core/review/roles/index.js";
import { ADR_FEATURE_PROMPTS, isAdrFeatureOff } from "../core/runtime/features/_adr-gate.js";
import { PROMPT_DEFS } from "./_defs.data.js";
import { areaDispatcherPrompt } from "./_areas.js";

/**
 * List all available prompts with their descriptions and argument schemas.
 *
 * @returns {Array<{ name: string, description: string, arguments: Array<{ name: string, description: string, required?: boolean }> }>}
 */
export function listPrompts() {
  // One area prompt, not one per hub (ADR 251): the id is the first word of the
  // request, so 11 files collapse into one and leaf skills keep tools only.
  const { name: areaName, description: areaDescription, arguments: areaArguments } = areaDispatcherPrompt();
  const areas = [{ name: areaName, description: areaDescription, arguments: areaArguments }];
  const all = [...PROMPT_DEFS, ...areas, ...rolePrompts()].sort((left, right) => left.name.localeCompare(right.name));

  if (!isAdrFeatureOff()) {
    return all;
  }

  return all.filter((prompt) => !ADR_FEATURE_PROMPTS.has(prompt.name));
}

/**
 * One prompt per active review persona: `rule-persona-<role>` - 19 persona
 * commands for the 19 active roles (ADR 112). The depth of the run (audit,
 * audit+review, audit+review+plan) is read from the request, not from the
 * command name; see `core/review/roles/operation-intent`.
 *
 * The names are shared with the agent commands on purpose: the command
 * generator derives its set from this registry, so a second name for the same
 * role would be the drift ADR 020 removed.
 *
 * @returns {Array<{ name: string, description: string, arguments: object[] }>}
 */
export const PERSONA_DISPATCH_NAME = "rule-persona";

/**
 * The one persona prompt (ADR 251).
 *
 * 19 role commands were 19 copies of one body with a different constant. The
 * role id is the first word of the request; `rule_tool_plan` still takes the
 * same `role` parameter, so nothing downstream changes.
 *
 * @returns {Array<{ name: string, description: string, arguments: object[] }>}
 */
function rolePrompts() {
  const roles = activeRoles()
    .map((role) => role.id)
    .sort((a, b) => a.localeCompare(b));

  return [
    {
      name: PERSONA_DISPATCH_NAME,
      description: `Audit, review and plan as one specialist persona: ${roles.join(", ")}`,
      arguments: [
        { name: "persona", description: `One of: ${roles.join(", ")}. First word of the request.`, required: true },
        {
          name: "topic",
          description:
            "Free-text request for this run (what to look at, e.g. a component, a directory, a concern). Naming a review or a plan in it raises the run to audit+review or audit+review+plan; default: audit only, over the whole project.",
          required: false,
        },
      ],
    },
  ];
}

/**
 * Whether MCP prompts are suppressed for this client.
 *
 * Claude Code exposes MCP prompts as `/<server>:<prompt> (MCP)` and offers no
 * client-side way to hide them, so an install ships clean `/rule-mcp-*` commands
 * and hides the prefixed duplicates. `RULE_MCP_NO_PROMPTS=1` hides them
 * everywhere; `RULE_MCP_NO_MCP_PROMPTS` hides them for the clients it names,
 * which is what a shared `.mcp.json` needs. `listPrompts()` itself stays pure
 * (the full registry) - only `listActivePrompts()` honors the policy.
 *
 * @param {string} [clientName] - from {@link module:prompts/client-suppression.clientIdentity}
 * @returns {boolean}
 */
export function promptsSuppressed(clientName) {
  return suppressesPrompts({ clientName });
}

/**
 * The prompts the server should advertise: the full registry, or an empty list
 * when the policy suppresses them for this client.
 *
 * @param {string} [clientName]
 * @returns {ReturnType<typeof listPrompts>}
 */
export function listActivePrompts(clientName) {
  return promptsSuppressed(clientName) ? [] : listPrompts();
}
