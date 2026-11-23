/** Resolve one prompt by name: help, persona, workflow, area or task. */
import { HANDOFF_USAGE } from "./_handoff-options.js";
import { activeRoles, operationForPrompt, roleById, parsePersonaCommand } from "../core/review/roles/index.js";
import { fillRoleTemplate } from "../core/review/template/index.js";
import { HELP_TOKENS, helpHeading, promptExamples, buildHelpMessage } from "./_help.js";
import { listPrompts, PERSONA_DISPATCH_NAME } from "./_registry.js";
import { AREA_DISPATCH_NAME, areaDispatcherPrompt, areaRequestText } from "./_areas.js";
import { handoffPrompt } from "./_handoff-prompt.js";
import { taskPrompt } from "./_task-prompts.js";

/**
 * The usage block for one prompt, or undefined when the name is not a prompt.
 *
 * This is the single source every surface prints: the MCP prompt path returns it
 * as an assistant message, `rule-mcp help <name>` prints it, and the generated
 * host artifacts embed it.
 *
 * @param {string} name
 * @returns {string|undefined}
 */
export function promptHelp(name) {
  const def = listPrompts().find((p) => p.name === name);

  if (!def) {
    return;
  }

  const block = name === "rule-handoff" ? HANDOFF_USAGE : buildHelpMessage(name, def, promptExamples(name));

  return `${helpHeading(name)}\n\n${block}`;
}

/**
 * Get a specific prompt by name with its system message content.
 *
 * @param {string} name - Prompt name
 * @param {Record<string, string>} [args] - Prompt arguments from the client
 * @returns {{ name: string, description: string, messages: Array<{ role: string, content: { type: string, text: string } }> }|null}
 */
export function getPrompt(name, args = {}) {
  const user = (text) => [{ role: "user", content: { type: "text", text } }];

  // ── Generic `/rule-mcp-* help` ──────────────────────────────────────
  // Any prompt whose primary argument is `help` (or --help / -h) returns
  // its usage block instead of running a task.
  const def = listPrompts().find((p) => p.name === name);
  const primary = def?.arguments?.[0];
  const primaryValue = primary ? args?.[primary.name] : undefined;

  if (primaryValue !== undefined && HELP_TOKENS.has(String(primaryValue).trim().toLowerCase())) {
    // Help is returned as a ready-made assistant message: the client displays it
    // immediately instead of asking the model to generate it (no reasoning, no tokens).
    const helpText = promptHelp(name);

    return {
      name,
      description: `${name} usage`,
      messages: [{ role: "assistant", content: { type: "text", text: helpText } }],
    };
  }

  // ── Review personas: one prompt per active role, filled from the registry ──
  const parsed = parsePersonaCommand(name);

  if (parsed) {
    const role = roleById(parsed.roleId);

    if (role) {
      const operation = operationForPrompt(args?.topic);
      const label = { audit: "Audit", review: "Audit and review", plan: "Audit, review and plan" }[operation];

      return {
        name,
        description: `${label} as a ${role.role}`,
        messages: user(fillRoleTemplate(role, { operation, topic: args?.topic })),
      };
    }
  }

  if (name === "rule-handoff") {
    return handoffPrompt(args, user);
  }

  if (name === AREA_DISPATCH_NAME) {
    const areaText = areaRequestText(args?.area, args?.request);

    if (areaText) {
      return { name, description: `${AREA_DISPATCH_NAME} ${args?.area}`, messages: user(areaText) };
    }

    // An unknown id is a request the model has to answer, not a silent fallthrough.
    return { name, description: `${AREA_DISPATCH_NAME} ${args?.area ?? ""}`.trim(), messages: user(`${areaDispatcherVocabulary()}\n\nRequest: ${args?.request ?? ""}`) };
  }

  if (name === PERSONA_DISPATCH_NAME) {
    const role = activeRoles().find((entry) => entry.id === String(args?.persona ?? "").toLowerCase());

    if (role) {
      const operation = operationForPrompt(args?.topic);
      const label = { audit: "Audit", review: "Audit and review", plan: "Audit, review and plan" }[operation];

      return {
        name,
        description: `${label} as a ${role.role}`,
        messages: user(fillRoleTemplate(role, { operation, topic: args?.topic })),
      };
    }

    return { name, description: name, messages: user(`${personaDispatcherVocabulary()}\n\nRequest: ${args?.topic ?? ""}`) };
  }

  return taskPrompt(name, args, user);
}

/** The area vocabulary, for a request that names no area the registry knows. */
function areaDispatcherVocabulary() {
  return areaDispatcherPrompt().text;
}

/** The persona vocabulary, for a request that names no role the catalog knows. */
function personaDispatcherVocabulary() {
  const roles = activeRoles().map((entry) => `${entry.id} (${entry.role})`);

  return [
    "Persona ids: " + roles.join(", ") + ".",
    "",
    "Read the persona from the first word of the request; the rest is the task. When the first word names no",
    "persona, infer it and say which one you used.",
    "Baseline: write failing tests first (TDD) and cover a11y (WCAG 2.2 AA) where applicable; if the request has no test or a11y surface, ask the user what to cover.",
    "Finish by proposing a conventional commit with a mandatory scope.",
  ].join("\n");
}
