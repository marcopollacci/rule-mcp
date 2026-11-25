/** Register the rule_tool_interview MCP tool. */
import { z } from "zod/v4";

import { registerTool } from "../router/index.js";
import { interview } from "./_interview.js";

const InterviewSchema = z.object({
  kind: z.enum(["adr", "plan", "requirements"]).optional().default("requirements").describe("The document the answers become"),
  topic: z.string().optional().describe("The title subject"),
  questions: z
    .array(
      z.object({
        id: z.string(),
        prompt: z.string(),
        required: z.boolean().optional(),
        options: z.array(z.string()).optional(),
      }),
    )
    .describe("The schema: id, prompt, and whether the answer is required"),
  answers: z.record(z.string(), z.string()).optional().describe("What the user answered, by question id. A missing answer stays unanswered"),
});

/** Register the rule_tool_interview tool. */
export function registerInterviewTool() {
  registerTool({
    name: "rule_tool_interview",
    entry: "action",
    description:
      "Turn a schema of questions and the answers into one document (adr, plan or requirements). An unanswered question is marked, never filled in, and the document says it is incomplete.",
    zodSchema: InterviewSchema,
    handler: async (arguments_) => ({
      content: [{ type: "text", text: interview(arguments_ ?? {}).text }],
    }),
  });
}
