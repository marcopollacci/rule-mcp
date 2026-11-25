/**
 * @module tools/devserver/start
 *
 * Launch one command and record what it launched.
 *
 * ADR 251 fixes the record: port, pid, command, working directory, start time.
 * The record is what makes a later stop safe, so the start is not finished until
 * the record is on disk. The port comes from the scan, and the child learns it
 * through `PORT`, the one convention every dev server honours.
 */

import { spawn as spawnProcess } from "node:child_process";
import { closeSync, existsSync, mkdirSync, openSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { getRuntimePaths } from "@mcp/cli/paths/index.js";

import { scanRange } from "./_scan.js";

/** Where the records and the logs live, under the runtime state directory. */
export function recordDir(stateDir = getRuntimePaths().stateDir) {
  return join(stateDir, "devservers");
}

/** Every record on disk, newest first. A record the OS no longer matches is stale, and still reported. */
export function readRecords(stateDir) {
  const dir = recordDir(stateDir);

  if (!existsSync(dir)) {
    return [];
  }

  const records = [];

  for (const name of readdirSafe(dir)) {
    if (!name.endsWith(".json")) {
      continue;
    }

    try {
      records.push(JSON.parse(readFileSync(join(dir, name), "utf8")));
    } catch {
      // A half-written record is not a record: the next start rewrites it.
    }
  }

  return records.sort((left, right) => right.startedAt - left.startedAt);
}

/** The names in a directory, or none when it does not exist yet. */
function readdirSafe(dir) {
  try {
    return readdirSync(dir);
  } catch {
    return [];
  }
}

/** Wait until the port answers, so the record never names a server that failed to bind. */
async function waitForListen(port, { attempts = 40, sleepMs = 100, listens } = {}) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (listens(port)) {
      return true;
    }

    await new Promise((resolve) => setTimeout(resolve, sleepMs));
  }

  return false;
}

/**
 * Start one command on the first free port in the documented range.
 *
 * @param {{ command?: string, cwd?: string, stateDir?: string, spawn?: Function, ports?: object, listens?: (port: number) => boolean, now?: () => number, wait?: typeof waitForListen }} [options]
 * @returns {Promise<{ status: "started"|"refused", message: string, port?: number, pid?: number, log?: string, record?: string }>}
 */
export async function startServer({ command = "", cwd = process.cwd(), stateDir, spawn = spawnProcess, ports, listens, now = Date.now, wait = waitForListen } = {}) {
  const line = String(command ?? "").trim();

  if (line === "") {
    return { status: "refused", message: "pass the command to start, for example `pnpm dev`" };
  }

  const scanned = ports ?? scanRange();

  if (!scanned.ok) {
    return { status: "refused", message: `${scanned.reason}, so no free port can be proven` };
  }

  if (scanned.firstFree === null) {
    return { status: "refused", message: "every port in 3000-6000 is taken" };
  }

  const port = scanned.firstFree;
  const dir = recordDir(stateDir);

  mkdirSync(dir, { recursive: true });

  const log = join(dir, `${now()}.log`);
  const out = openSync(log, "a");

  let child;

  try {
    child = spawn(line, { cwd, shell: true, detached: true, stdio: ["ignore", out, out], env: { ...process.env, PORT: String(port) } });
  } catch (error) {
    return { status: "refused", message: `the command did not start: ${error?.message ?? "unknown reason"}` };
  } finally {
    closeSync(out);
  }

  const pid = child?.pid;

  if (!pid) {
    return { status: "refused", message: `the command started no process: ${line}` };
  }

  const bound = listens
    ? await wait(port, { listens })
    : await wait(port, {
        listens: (candidate) => (scanRange().listeners ?? []).some((entry) => entry.port === candidate),
      });

  const record = {
    port,
    pid,
    command: line,
    cwd,
    startedAt: now(),
    log,
  };
  const recordPath = join(dir, `${pid}.json`);

  writeFileSync(recordPath, `${JSON.stringify(record, null, 2)}\n`, "utf8");
  child.unref?.();

  if (!bound) {
    return {
      status: "refused",
      port,
      pid,
      log,
      record: recordPath,
      message: `pid ${pid} started but nothing listens on ${port} yet; the log is ${log}`,
    };
  }

  return { status: "started", port, pid, log, record: recordPath, message: `"${line}" lists on http://localhost:${port} (pid ${pid}); log ${log}` };
}
