/**
 * The resume extension: what Pi can actually do, and what it must not do.
 *
 * `session_start` can notify but cannot seed the transcript, so the source is
 * checked for the two facts that matter: it injects on `before_agent_start`,
 * and it asks the CLI rather than embedding state that goes stale.
 */

import assert from "node:assert/strict";
import { test } from "node:test";

import { RESUME_EXTENSION_FILE, piResumeExtension } from "../_resume-surface.js";

test("the extension injects on the event that can carry a message", () => {
  const source = piResumeExtension();

  assert.match(source, /pi\.on\("session_start"/u, "the reason comes from session_start");
  assert.match(source, /event\.reason === "resume"/u);
  assert.match(source, /pi\.on\("before_agent_start"/u, "the message rides before_agent_start");
  assert.match(source, /messageType !== "user"/u, "a custom-message run is not a resume");
  assert.match(source, /customType: "rule-mcp-resume"/u);
  assert.match(source, /display: false/u, "the context reaches the model, not the transcript");
});

test("the block comes from the CLI, and a failure is silent", () => {
  const source = piResumeExtension();

  assert.match(source, /execFileSync\("rule-mcp", \["resume", "--dir", cwd\]/u);
  assert.match(source, /timeout: TIMEOUT_MS/u, "a slow CLI does not block the first turn");
  assert.match(source, /catch \{\s*return "";/u, "a spawn failure degrades to silence");
  assert.match(source, /let injected = false/u, "one injection per session");
});

test("the artifact has a name the uninstaller removes", () => {
  assert.equal(RESUME_EXTENSION_FILE, "rule-mcp-resume.js");
});
