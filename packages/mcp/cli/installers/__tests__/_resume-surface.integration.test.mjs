/**
 * The resume extension, driven through a fake host.
 *
 * Three promises, each one behavioural rather than textual:
 *
 * 1. it injects once per resumed session, not once per turn;
 * 2. it never starts a turn of its own - it returns a message from an event the
 *    host already opened, and calls no `sendUserMessage` or `sendMessage`;
 * 3. it degrades to silence when the CLI cannot answer, so a broken shim never
 *    blocks the first prompt.
 *
 * The extension is generated text, so the test writes it to disk and imports it
 * the way Pi would. The CLI is faked on `PATH`: a real spawn would take the
 * whole twenty-second timeout and prove nothing about this module.
 */

import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { fakeCli, fakeHost, loadExtension, withPath } from "./_resume.fixture.mjs";

test("a resumed session is seeded once, and the second turn gets nothing", async () => {
  const { dir, extension } = await loadExtension();
  const bin = fakeCli("## PIX RESUMED SESSION\n\nstep WS2-T4");
  const host = fakeHost();

  extension(host.pi);

  await withPath(bin, async () => {
    host.fire("session_start", { reason: "resume" });

    const first = await host.fire("before_agent_start", { messageType: "user", prompt: "vai" });
    const second = await host.fire("before_agent_start", { messageType: "user", prompt: "vai ancora" });

    assert.equal(first.message.customType, "rule-mcp-resume");
    assert.match(first.message.content, /PIX RESUMED SESSION/u);
    assert.equal(first.message.display, false, "the model reads it, the reader does not");
    assert.equal(second, undefined, "one injection per session");
  });

  assert.deepEqual(host.calls, [], "the extension opens no turn of its own");

  rmSync(dir, { recursive: true, force: true });
  rmSync(bin, { recursive: true, force: true });
});

test("a session that is not a resume gets nothing", async () => {
  const { dir, extension } = await loadExtension();
  const bin = fakeCli("## PIX RESUMED SESSION");
  const host = fakeHost();

  extension(host.pi);

  for (const reason of ["startup", "new", "fork", "reload"]) {
    host.fire("session_start", { reason });

    const injected = await host.fire("before_agent_start", { messageType: "user", prompt: "ciao" });

    assert.equal(injected, undefined, `${reason}: no block`);
  }

  rmSync(dir, { recursive: true, force: true });
  rmSync(bin, { recursive: true, force: true });
});

test("a run started by a custom message is not a user turn", async () => {
  const { dir, extension } = await loadExtension();
  const bin = fakeCli("## PIX RESUMED SESSION");
  const host = fakeHost();

  extension(host.pi);

  await withPath(bin, async () => {
    host.fire("session_start", { reason: "resume" });

    assert.equal(await host.fire("before_agent_start", { messageType: "custom" }), undefined);
  });

  rmSync(dir, { recursive: true, force: true });
  rmSync(bin, { recursive: true, force: true });
});

test("a CLI that cannot answer leaves the session silent, not broken", async () => {
  const { dir, extension } = await loadExtension();
  const empty = mkdtempSync(join(tmpdir(), "rule-mcp-empty-bin-"));
  const host = fakeHost();

  extension(host.pi);

  await withPath(empty, async () => {
    host.fire("session_start", { reason: "resume" });

    const injected = await host.fire("before_agent_start", { messageType: "user", prompt: "vai" });

    assert.equal(injected, undefined, "a missing CLI injects nothing and throws nothing");
  });

  rmSync(dir, { recursive: true, force: true });
  rmSync(empty, { recursive: true, force: true });
});
