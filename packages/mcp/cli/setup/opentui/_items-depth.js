/**
 * @module cli/setup/opentui/items-depth
 *
 * The transport screen: how the server reaches an agent.
 *
 * Split out of `items.js`, which is past the 150-line cap and may only shrink
 * (ADR 053, ADR 177). Depth is not a screen: every host is installed up to its
 * own ceiling, so this module no longer asks how much to write.
 */

import { remoteModeAgents } from "../../installers/index.js";

/** The three transports, with what each one costs the user. */
const MODE_ITEMS = [
  {
    id: "stdio",
    label: "stdio",
    detail: ["The agent starts a local process per session.", "No background service, no port, works everywhere.", "", "Supported by every agent in the catalog."],
  },
  {
    id: "daemon",
    label: "daemon",
    detail: ["One background SSE service on port 37999.", "Registered with launchd, systemd, or the Windows", "service manager and started at login."],
  },
  {
    id: "docker",
    label: "docker",
    detail: ["The SSE service in a container via compose.", "Needs Docker Compose v2 and a daemon token."],
  },
];

/**
 * The transport rows for the agents on the previous screen.
 *
 * Daemon and docker are discouraged, never removed, when someone selected
 * cannot use them: the row names who, so the reason travels with the choice
 * instead of arriving later as a per-agent failure.
 *
 * @param {string[]} [agents]
 * @returns {Array<{ id: string, label: string, note: string, detail: string[] }>}
 */
export function modeItems(agents = []) {
  const unsupported = agents.filter((agent) => !remoteModeAgents.has(agent));

  if (agents.length === 0 || unsupported.length === 0) {
    return MODE_ITEMS.map((item) => ({ ...item, note: item.id === "stdio" ? "" : `${remoteModeAgents.size} hosts` }));
  }

  const note = `not recommended${unsupported.length > 0 ? ` for ${unsupported.join(", ")}` : ""}`;

  return MODE_ITEMS.map((item) => ({
    ...item,
    label: item.id === "stdio" ? item.label : `${item.label} (${note})`,
    note: item.id === "stdio" ? "" : `${[...remoteModeAgents].join(", ")} only`,
  }));
}
