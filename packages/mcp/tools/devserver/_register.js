/** Register the rule_tool_devserver MCP tool. */
import { z } from "zod/v4";

import { registerTool } from "../router/index.js";
import { devserver } from "./_devserver.js";

const DevserverSchema = z.object({
  action: z
    .enum(["status", "list", "ports", "start", "stop", "restart"])
    .optional()
    .default("status")
    .describe("status (default), list, ports. start/stop/restart are refused until the lifecycle ADR exists"),
});

/** Register the rule_tool_devserver tool. */
export function registerDevserverTool() {
  registerTool({
    name: "rule_tool_devserver",
    entry: "action",
    description:
      "Report the dev servers listening on 3000-6000, with the process that owns each port and the first free one. Read-only: start and stop are refused until a decision names how a stop proves its target.",
    zodSchema: DevserverSchema,
    handler: async (arguments_) => ({
      content: [
        {
          type: "text",
          text: await devserver({
            action: arguments_.action ?? "status",
            pid: arguments_.pid,
            port: arguments_.port,
            expect: arguments_.expect,
            command: arguments_.command,
            cwd: arguments_.cwd,
          }),
        },
      ],
    }),
  });
}
