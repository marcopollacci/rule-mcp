/**
 * Stopping one listener, against evidence that names it (ADR 251).
 *
 * The refusals matter more than the happy path: a stop that names the wrong
 * process must do nothing. One case runs against the real process table, to
 * prove that reading a live command line works at all.
 */

import { strict as assert } from "node:assert";
import { spawn } from "node:child_process";
import { test } from "node:test";

import { commandOf } from "../_stop.js";
import { stopProcess } from "../_stop.js";

/** A live command line, read from the operating system. */
const realCommand = (pid) => commandOf(pid);

/** A stop that spies the signal instead of sending one. */
function harness({ pid = 4242, port = 3001, command = "node vite", listens = true, dies = true, scanned = true } = {}) {
  const signals = [];

  return {
    signals,
    stop: (options = {}) =>
      stopProcess({
        pid,
        port,
        waitMs: 50,
        kill: (target, signal) => {
          signals.push([target, signal]);

          if (!(signal === 0)) {
            return;
          }

          if (!dies && signals.some(([, sent]) => sent === "SIGTERM")) {
            return;
          }

          throw new Error("gone");
        },
        read: () => command,
        ports: scanned ? { ok: true, listeners: listens ? [{ pid, port, command }] : [] } : { ok: false, reason: "lsof is not available here" },
        ...options,
      }),
  };
}

test("a stop that names the pid, the port and the command ends that listener", () => {
  const { stop } = harness();
  const result = stop({ expect: "vite" });

  assert.equal(result.status, "stopped", result.message);
  assert.equal(result.pid, 4242);
  assert.equal(result.port, 3001);
});

test("a pid that does not listen on that port is refused before any signal", () => {
  const { stop, signals } = harness({ listens: false });
  const result = stop({});

  assert.equal(result.status, "refused");
  assert.match(result.message, /does not listen on 3001/u);
  assert.deepEqual(signals, [], "nothing was signalled");
});

test("a command line that disagrees is refused", () => {
  const { stop } = harness({ command: "node vite" });
  const result = stop({ expect: "webpack" });

  assert.equal(result.status, "refused");
  assert.match(result.message, /does not contain "webpack"/u);
});

test("a scan it cannot trust refuses instead of guessing", () => {
  const { stop } = harness({ scanned: false });

  assert.match(stop({}).message, /cannot prove/u);
});

test("a process that survives the signal is reported, not forced", () => {
  const { stop } = harness({ dies: false });
  const result = stop({});

  assert.equal(result.status, "refused");
  assert.match(result.message, /still runs|not running|did not reach/u);
});

test("a missing pid and an out-of-range port are refused", () => {
  assert.match(stopProcess({}).message, /pass the pid/u);
  assert.match(stopProcess({ pid: 1, port: 80 }).message, /inside 3000-6000/u);
});

test("a real process table answers with a live command line", async () => {
  const child = spawn(process.execPath, ["-e", "setTimeout(() => {}, 30000)"], { stdio: "ignore" });

  try {
    await new Promise((resolve) => setTimeout(resolve, 250));

    assert.match(realCommand(child.pid), /node/u, "the OS names the command that runs");

    child.kill("SIGKILL");
    await new Promise((resolve) => child.once("exit", resolve));

    assert.equal(realCommand(child.pid), "", "a dead pid has no command line");
  } finally {
    if (child.exitCode === null) {
      child.kill("SIGKILL");
    }
  }
});
