/** Register the rule_tool_state MCP tool. */
import { z } from "zod/v4";

import { registerTool } from "../router/index.js";
import { projectState } from "./_state.js";

const StateSchema = z.object({
  projectDir: z.string().optional().default(".").describe("Project root directory"),
});

/** Register the rule_tool_state tool. */
export function registerStateTool() {
  registerTool({
    name: "rule_tool_state",
    entry: "action",
    description: "One screen of project state: version, ADR count, open plan steps with the next one, dirty tree, last CI conclusion, last handoff. Reads only.",
    zodSchema: StateSchema,
    handler: async (arguments_) => ({
      content: [{ type: "text", text: projectState(arguments_.projectDir || ".") }],
    }),
  });
}
