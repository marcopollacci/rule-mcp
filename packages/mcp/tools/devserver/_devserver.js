/**
 * @module tools/devserver/devserver
 *
 * The dev-server surface: what runs on this machine, and what the next free
 * port is.
 *
 * `start` and `stop` are refused on purpose. Nothing else in this surface
 * launches a process or sends a signal, and a `stop` that guesses its target is
 * worse than no `stop`: it can end the editor, the MCP server, or a build that
 * was nearly finished. That decision earns its own ADR, so the tool says so
 * instead of acting.
 */

import { listenPorts, scanRange, PORT_RANGE } from "./_scan.js";

/** Actions the tool answers today. */
export const READ_ONLY_ACTIONS = ["status", "list", "ports"];

/** Actions that need the ADR before they can exist. */
export const REFUSED_ACTIONS = ["start", "stop", "restart"];

/** Render the range as a sentence. */
const range = `${PORT_RANGE.from}-${PORT_RANGE.to}`;

/** One line per listener, or a sentence when there is none. */
function listenerLines(inside) {
  if (inside.length === 0) {
    return [`No listener in ${range}.`];
  }

  return inside.map((entry) => `- \`${entry.port}\` pid ${entry.pid}${entry.command ? `: ${entry.command}` : ""}`);
}

/**
 * Answer one dev-server question.
 *
 * @param {{ action?: string }} [options]
 * @returns {string} Markdown
 */
export function devserver({ action = "status" } = {}) {
  const asked = String(action ?? "status")
    .trim()
    .toLowerCase();

  if (REFUSED_ACTIONS.includes(asked)) {
    return [
      `\`${asked}\` is not implemented.`,
      "",
      "This tool only reports what runs. Starting or stopping a process from a server needs a decision first: which command owns a port, how a stop proves its target, and what happens to a process whose parent leaves. Until that ADR exists, a run reports, and the caller owns the lifecycle.",
    ].join("\n");
  }

  if (!READ_ONLY_ACTIONS.includes(asked)) {
    return `Unknown action "${action}". Use ${READ_ONLY_ACTIONS.join(", ")}.`;
  }

  const scanned = scanRange(listenPorts());

  if (!scanned.ok) {
    return `# Dev servers\n\n${scanned.reason}.`;
  }

  if (asked === "list") {
    return ["# Listeners", "", ...listenerLines(scanned.inside)].join("\n");
  }

  if (asked === "ports") {
    return [
      "# Ports",
      "",
      `First free in ${range}: ${scanned.firstFree === null ? `none, the whole range is taken` : `\`${scanned.firstFree}\``}.`,
      "",
      `Taken: ${scanned.inside.length === 0 ? "none" : scanned.inside.map((entry) => `\`${entry.port}\``).join(", ")}.`,
    ].join("\n");
  }

  return [
    "# Dev servers",
    "",
    ...listenerLines(scanned.inside),
    "",
    `First free in ${range}: ${scanned.firstFree === null ? "none" : `\`${scanned.firstFree}\``}.`,
    "",
    "`start` and `stop` are not implemented: this tool reports, the caller owns the lifecycle.",
  ].join("\n");
}
