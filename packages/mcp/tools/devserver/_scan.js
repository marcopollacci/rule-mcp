/**
 * @module tools/devserver/scan
 *
 * Which ports in the documented range are busy, and who holds them.
 *
 * Read-only: the scan asks the operating system, it never starts or stops
 * anything. `lsof` answers on macOS and Linux; a machine without it reports
 * "unknown" rather than a guess, because a wrong "free" invites a port clash.
 */

import { execFileSync } from "node:child_process";

/** The range the global instructions tell an agent to scan, first port first. */
export const PORT_RANGE = { from: 3000, to: 6000 };

/** The listener's owner, as far as the OS will say. */
function ownerOf(pid) {
  try {
    const line = execFileSync("ps", ["-o", "command=", "-p", String(pid)], { encoding: "utf8", timeout: 2000 }).trim();

    return line ? line.slice(0, 160) : "";
  } catch {
    return "";
  }
}

/**
 * Every listening TCP port, with its process when the OS names one.
 *
 * @param {{ run?: (file: string, arguments_: string[]) => string }} [options] - `run` exists so a test can answer for the OS
 * @returns {{ ok: boolean, reason?: string, listeners: Array<{ port: number, pid: number, command: string }> }}
 */
export function listenPorts({ run } = {}) {
  const exec = run ?? ((file, arguments_) => execFileSync(file, arguments_, { encoding: "utf8", timeout: 5000 }));

  let out;

  try {
    out = exec("lsof", ["-nP", "-iTCP", "-sTCP:LISTEN"]);
  } catch (error) {
    // lsof exits 1 when nothing listens; that is an empty answer, not a failure.
    const text = typeof error?.stdout === "string" ? error.stdout : "";

    if (text.trim() === "") {
      return { ok: false, reason: "lsof is not available here, so the ports are unknown", listeners: [] };
    }

    out = text;
  }

  const listeners = [];
  const seen = new Set();

  for (const line of String(out).split("\n").slice(1)) {
    const match = line.match(/^(\S+)\s+(\d+)\s+.*TCP\s+\S*:(\d+)\s+\(LISTEN\)/u);

    if (!match) {
      continue;
    }

    const port = Number(match[3]);
    const pid = Number(match[2]);

    if (!Number.isInteger(port) || seen.has(`${port}:${pid}`)) {
      continue;
    }

    seen.add(`${port}:${pid}`);
    listeners.push({ port, pid, command: ownerOf(pid) });
  }

  return { ok: true, listeners: listeners.sort((left, right) => left.port - right.port) };
}

/** The listeners inside the documented range, and the first free port in it. */
export function scanRange(ports = listenPorts()) {
  const inside = ports.listeners.filter((entry) => entry.port >= PORT_RANGE.from && entry.port <= PORT_RANGE.to);
  const taken = new Set(inside.map((entry) => entry.port));
  let firstFree = PORT_RANGE.from;

  while (taken.has(firstFree) && firstFree <= PORT_RANGE.to) {
    firstFree += 1;
  }

  return { ...ports, inside, firstFree: firstFree > PORT_RANGE.to ? null : firstFree };
}
