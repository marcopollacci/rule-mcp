/**
 * @module cli/installers/help-surface
 *
 * The zero-token `help` surface for hosts that can answer without the model.
 *
 * `/rule-<command> help` already has one text (see `commandHelp`). What differs
 * per host is whether that text can reach the chat without a model turn:
 *
 *   - Pi 1.6.0: the `input` event fires before prompt-template expansion, and
 *     returning `{ action: "handled" }` skips the agent entirely. `appendEntry`
 *     plus `registerEntryRenderer` persists and paints the block as a TUI-only
 *     entry that never enters LLM context.
 *   - opencode 2.4.0: a plugin adds a command through
 *     `ctx.command.transform`, and `ctx.session.synthetic` stores a message
 *     without requesting a generation.
 *
 * Every other host reads command files only: the text there always reaches the
 * model, so no artifact is generated for it.
 *
 * The blocks are embedded at install time instead of read from the binary at
 * runtime: the extension then costs one file read per session, no spawn, and
 * nothing breaks when the binary moves.
 */

import { commandHelp, listAgentCommands } from "../../core/agents/commands/index.js";

/** The custom entry type the Pi extension appends and renders. */
export const HELP_EVENT = "rule-mcp-help";

/** Argument tokens that ask a slash command for its usage block. */
export const HELP_TOKENS = ["help", "--help", "-h"];

/** The one command name opencode's plugin registers. */
export const OPENCODE_HELP_COMMAND = "rule-help";

/**
 * Every command with its help block, in canonical order.
 *
 * @returns {Array<{ name: string, description: string, text: string }>}
 */
export function buildHelpSurface() {
  return listAgentCommands().map(({ name, description }) => ({ name, description, text: commandHelp(name) }));
}
