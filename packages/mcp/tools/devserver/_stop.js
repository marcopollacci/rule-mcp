/**
 * @module tools/devserver/stop
 *
 * Ending one listener, against evidence that names it.
 *
 * ADR 251 fixes the rule: a stop signals a pid only when a fact proves the
 * target. Here the facts are the port the process listens on, and optionally a
 * substring of its live command line. A bulk stop ("every node process except
 * the MCP servers") is refused: identifying those would be the same guess the
 * ADR forbids.
 */

import { execFileSync } from "node:child_process";

import { PORT_RANGE, listenPorts } from "./_scan.js";

/** The live command line of a pid, or "" when the process is gone. */
export function commandOf(pid, { run } = {}) {
  const exec = run ?? ((file, arguments_) => execFileSync(file, arguments_, { encoding: "utf8", timeout: 2000 }));

  try {
    return String(exec("ps", ["-o", "command=", "-p", String(pid)])).trim();
  } catch {
    return "";
  }
}

/** Whether a pid is still alive, without sending a signal that can be observed. */
const alive = (pid, kill) => {
  try {
    kill(pid, 0);

    return true;
  } catch {
    return false;
  }
};

/**
 * Stop one listener, or explain why it was not stopped.
 *
 * @param {{ pid?: number|string, port?: number|string, expect?: string, kill?: Function, waitMs?: number, ports?: object, read?: (pid: number) => string }} [options]
 * @returns {{ status: "stopped"|"refused", message: string, pid?: number, port?: number }}
 */
export function stopProcess({ pid, port, expect = "", kill = process.kill, waitMs = 2000, ports, read = commandOf } = {}) {
  const target = Number(pid);
  const listenerPort = Number(port);

  if (!Number.isInteger(target) || target <= 0) {
    return { status: "refused", message: "pass the pid of the listener to stop" };
  }

  if (!Number.isInteger(listenerPort) || listenerPort < PORT_RANGE.from || listenerPort > PORT_RANGE.to) {
    return { status: "refused", message: `pass the port it listens on, inside ${PORT_RANGE.from}-${PORT_RANGE.to}` };
  }

  const command = read(target);

  if (command === "") {
    return { status: "refused", message: `pid ${target} is not running` };
  }

  if (expect && !command.includes(expect)) {
    return { status: "refused", message: `pid ${target} runs "${command}", which does not contain "${expect}"` };
  }

  const scanned = ports ?? listenPorts();

  if (!scanned.ok) {
    return { status: "refused", message: `${scanned.reason}, so the port cannot prove this pid` };
  }

  const owns = (scanned.listeners ?? []).some((entry) => entry.port === listenerPort && entry.pid === target);

  if (!owns) {
    return { status: "refused", message: `pid ${target} does not listen on ${listenerPort}, so it is not the server this stop names` };
  }

  try {
    kill(target, "SIGTERM");
  } catch (error) {
    return { status: "refused", message: `the signal did not reach pid ${target}: ${error?.message ?? "unknown reason"}` };
  }

  const deadline = Date.now() + waitMs;

  while (Date.now() < deadline) {
    if (!alive(target, kill)) {
      return { status: "stopped", pid: target, port: listenerPort, message: `pid ${target} stopped (was "${command}")` };
    }

    // Busy wait on purpose: this runs once per explicit stop, and a timer would
    // keep the process alive in a test.
    execSleep(100);
  }

  return { status: "refused", pid: target, port: listenerPort, message: `pid ${target} still runs after ${waitMs} ms; nothing else was signalled` };
}

/** A short block, so a poll loop does not need a promise. */
function execSleep(ms) {
  const until = Date.now() + ms;

  while (Date.now() < until) {
    // Polling a dead process is the cheap part; the wait is bounded by waitMs.
  }
}
