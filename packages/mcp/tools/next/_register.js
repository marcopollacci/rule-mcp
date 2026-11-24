/** Register the rule_tool_next MCP tool. */
import { z } from "zod/v4";

import { registerTool } from "../router/index.js";
import { completeStep } from "./_complete.js";
import { next, renderComplete } from "./_next.js";

const NextSchema = z.object({
  projectDir: z.string().optional().default(".").describe("Project root directory"),
  want: z
    .string()
    .optional()
    .describe('What the user typed, verbatim: a plan slug, a step id such as "WS1-T1", a phase ("fase 4"), or nothing for the plan a resumed session should take'),
  complete: z.boolean().optional().default(false).describe("Tick the resolved step, but only against evidence this tool can check"),
  evidence: z.string().optional().describe("With complete: a project-relative path that exists once the step is done. The plan is never ticked on a claim alone"),
});

/** Register the rule_tool_next tool. */
export function registerNextTool() {
  registerTool({
    name: "rule_tool_next",
    entry: "action",
    description:
      "Resolve the plan step a request names, or the one a resumed session should take, and return it verbatim with its workstream. With complete + evidence, tick it against a file that exists and report the plan delta. Read-only without complete.",
    zodSchema: NextSchema,
    handler: async (arguments_) => {
      const projectDir = arguments_.projectDir || ".";

      if (arguments_.complete) {
        return {
          content: [{ type: "text", text: renderComplete(completeStep(projectDir, { want: arguments_.want ?? "", evidence: arguments_.evidence ?? "" })) }],
        };
      }

      return { content: [{ type: "text", text: next(projectDir, { want: arguments_.want ?? "" }) }] };
    },
  });
}
