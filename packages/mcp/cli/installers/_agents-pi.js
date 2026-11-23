/** @module cli/installers/agents-pi - the Pi coding agent install */

import { join } from "node:path";

import { HOME, readText, writeText } from "./_paths.js";
import { commandConfig } from "./_env-command.js";
import { upsertJsonServer } from "./_writers-json.js";
import { commandTemplate } from "./_writers-text.js";
import { piHelpExtension } from "./_help-emit.js";

/**
 * Installs rule-mcp into Pi coding agent.
 * @param {{ entrypoint: string, dryRun?: boolean, global?: boolean, mode?: string }} opts
 * @returns {Array<{ file: string, action: string }>}
 */
const installPi = ({ entrypoint, dryRun = false, global = false, mode = "stdio" }) => {
  // Pi uses $PI_CODING_AGENT_DIR/mcp.json or ~/.pi/agent/mcp.json
  const piDir = process.env.PI_CODING_AGENT_DIR ? join(process.env.PI_CODING_AGENT_DIR) : join(HOME, ".pi", "agent");
  const file = join(piDir, "mcp.json");
  const promptFile = join(piDir, "prompts", "rule.md");
  // The extension answers `/<command> help` before the template reaches the model.
  const extensionFile = join(piDir, "extensions", "rule-mcp-help.js");

  return [
    writeText({
      file,
      content: upsertJsonServer(readText(file), commandConfig(entrypoint, { global, mode, agentName: "pi" })),
      dryRun,
    }),
    writeText({ file: promptFile, content: commandTemplate(), dryRun }),
    writeText({ file: extensionFile, content: piHelpExtension(), dryRun }),
  ];
};

export { installPi };
