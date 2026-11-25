/**
 * @module tools/devserver/devserver
 *
 * The dev-server surface: what runs on this machine, and what the next free
 * port is.
 *
 * `start` and `restart` are refused: a start has to write the record ADR 251
 * names, and no step has written that record yet. A stop exists and is narrow.
 * It needs the pid and the port, it refuses unless that pid really listens on
 * that port, and it never signals in bulk.
 */

import { listenPorts, scanRange, PORT_RANGE } from "./_scan.js";
import { tailLog } from "./_logs.js";
import { readRecords, startServer } from "./_start.js";
import { stopProcess } from "./_stop.js";

/** Actions the tool answers today. */
export const READ_ONLY_ACTIONS = ["status", "list", "ports", "records", "logs"];

/** Actions refused on purpose, with what each one waits for. */
export const REFUSED_ACTIONS = ["restart"];

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
export async function devserver({ action = "status", pid, port, expect, command, cwd, lines } = {}) {
  const asked = String(action ?? "status")
    .trim()
    .toLowerCase();

  // ADR 251: one listener, named by its port and pid, never a bulk kill.
  if (asked === "stop") {
    return stopProcess({ pid, port, expect }).message;
  }

  if (asked === "start") {
    return startServer({ command, cwd }).then((result) => result.message);
  }

  if (asked === "logs") {
    return tailLog({ pid, lines }).message;
  }

  if (asked === "records") {
    const records = readRecords();

    if (records.length === 0) {
      return "No record on disk, so no process can be proven.";
    }

    const lines = ["# Records", ""];

    for (const entry of records) {
      lines.push(`- \`${entry.port}\` pid ${entry.pid}: ${entry.command}`);
    }

    return lines.join("\n");
  }

  if (REFUSED_ACTIONS.includes(asked)) {
    return [
      `\`${asked}\` is not implemented.`,
      "",
      "A restart has to wait until a start and a stop are proven on a real run (ADR 251). Until then, stop the process and start it again as two calls.",
    ].join("\n");
  }

  if (!READ_ONLY_ACTIONS.includes(asked)) {
    return `Unknown action "${action}". Use ${READ_ONLY_ACTIONS.join(", ")}, ${REFUSED_ACTIONS.join(", ")}.`;
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
    "`stop` needs the pid and the port of one listener. `start` waits for the record ADR 251 names.",
  ].join("\n");
}
