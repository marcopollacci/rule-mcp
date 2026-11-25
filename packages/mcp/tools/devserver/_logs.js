/**
 * @module tools/devserver/logs
 *
 * The tail of a log this tool wrote, with the URL the run opened.
 *
 * The record names the log (ADR 251), so a tail never guesses a path. Only the
 * last bytes are read: a dev server can log for hours, and a tool that loads a
 * gigabyte to show forty lines is worse than no tool.
 */

import { closeSync, openSync, readSync, statSync } from "node:fs";

import { readRecords } from "./_start.js";

/** How much of the file the tail reads, and how many lines it returns. */
const TAIL_BYTES = 64 * 1024;
const DEFAULT_LINES = 40;

/** The last bytes of a file, as text. */
function readTail(file, bytes = TAIL_BYTES) {
  const size = statSync(file).size;
  const start = Math.max(0, size - bytes);
  const length = size - start;
  const buffer = Buffer.alloc(length);
  const handle = openSync(file, "r");

  try {
    readSync(handle, buffer, 0, length, start);
  } finally {
    closeSync(handle);
  }

  return buffer.toString("utf8");
}

/**
 * The tail of one record's log, plus the URL that record opened.
 *
 * @param {{ pid?: number|string, lines?: number|string, stateDir?: string, read?: typeof readTail }} [options]
 * @returns {{ status: "ok"|"refused", message: string, url?: string, port?: number, log?: string }}
 */
export function tailLog({ pid, lines = DEFAULT_LINES, stateDir, read = readTail } = {}) {
  const records = readRecords(stateDir);
  const wanted = Number(pid);
  const record = Number.isInteger(wanted) && wanted > 0 ? records.find((entry) => entry.pid === wanted) : records[0];

  if (!record) {
    return {
      status: "refused",
      message: Number.isInteger(wanted) && wanted > 0 ? `no record for pid ${wanted}, so no log is proven` : "no record on disk, so there is no log to follow",
    };
  }

  let text;

  try {
    text = read(record.log);
  } catch {
    return { status: "refused", message: `the record names ${record.log}, which is gone`, port: record.port, url: `http://localhost:${record.port}` };
  }

  const count = Math.min(Math.max(Number(lines) || DEFAULT_LINES, 1), 500);
  const tail = text.split("\n");
  const kept = tail
    .slice(Math.max(0, tail.length - count))
    .join("\n")
    .trimEnd();
  const url = `http://localhost:${record.port}`;

  return {
    status: "ok",
    port: record.port,
    url,
    log: record.log,
    message: [`# ${record.command} on ${url} (pid ${record.pid})`, "", "```text", kept || "(no output yet)", "```"].join("\n"),
  };
}
