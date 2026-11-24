/**
 * The harness the resume extension is driven through.
 *
 * The extension is generated text, so a test writes it to disk and imports it
 * the way Pi would. The CLI is faked on `PATH`: a real spawn would take the
 * whole twenty-second timeout and prove nothing about this module.
 */

import { chmodSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { piResumeExtension } from "../_resume-surface.js";

/** Write the generated extension and import it, the way Pi loads it. */
export async function loadExtension() {
  const dir = mkdtempSync(join(tmpdir(), "rule-mcp-resume-ext-"));
  const file = join(dir, "rule-mcp-resume.js");

  writeFileSync(file, piResumeExtension());

  const module = await import(`${pathToFileURL(file).href}?t=${Date.now()}`);

  return { dir, extension: module.default };
}

/** A host that records what the extension registered. */
export function fakeHost() {
  const handlers = new Map();
  const calls = [];

  return {
    calls,
    pi: {
      on: (name, handler) => handlers.set(name, handler),
      sendUserMessage: (...arguments_) => calls.push(["sendUserMessage", ...arguments_]),
      sendMessage: (...arguments_) => calls.push(["sendMessage", ...arguments_]),
    },
    fire: (name, event) => handlers.get(name)?.(event, {}),
  };
}

/** A `rule-mcp` on PATH that answers with a fixed block. */
export function fakeCli(body) {
  const dir = mkdtempSync(join(tmpdir(), "rule-mcp-fake-bin-"));
  const file = join(dir, "rule-mcp");

  writeFileSync(file, `#!/bin/sh\nprintf '%s\\n' '${body}'\n`);
  chmodSync(file, 0o755);

  return dir;
}

/** Run one case with `PATH` replaced, then put it back. */
export async function withPath(dir, run) {
  const before = process.env.PATH;

  process.env.PATH = dir;

  try {
    return await run();
  } finally {
    process.env.PATH = before;
  }
}
