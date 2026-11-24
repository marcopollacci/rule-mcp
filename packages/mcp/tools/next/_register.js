/** Register the rule_tool_next MCP tool. */
import { z } from "zod/v4";

import { registerTool } from "../router/index.js";
import { next } from "./_next.js";

const NextSchema = z.object({
  projectDir: z.string().optional().default(".").describe("Project root directory"),
  want: z
    .string()
    .optional()
    .describe('What the user typed, verbatim: a plan slug, a step id such as "WS1-T1", a phase ("fase 4"), or nothing for the plan a resumed session should take'),
});

/** Register the rule_tool_next tool. */
export function registerNextTool() {
  registerTool({
    name: "rule_tool_next",
    entry: "action",
    description:
      "Resolve the plan step a request names, or the one a resumed session should take, and return it verbatim with its workstream. Read-only: the caller executes the step and ticks its checkbox.",
    zodSchema: NextSchema,
    handler: async (arguments_) => ({
      content: [{ type: "text", text: next(arguments_.projectDir || ".", { want: arguments_.want ?? "" }) }],
    }),
  });
}
