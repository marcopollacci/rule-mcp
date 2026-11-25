/**
 * The Pi extension's host hooks, in their own file.
 *
 * `_help-parity.test.mjs` sits at the size cap: what each generated source does
 * at runtime is a concern of its own, next to the parity of the text they carry.
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import { buildHelpSurface } from "../installers/_help-surface.js";
import { opencodeHelpPlugin, piHelpExtension } from "../installers/_help-emit.js";

test("the Pi extension answers /rule-state from the CLI, in the same handler", () => {
  // One `input` handler: a host that keeps one per event name would drop a
  // second registration, and the screen would silently go through the model.
  const source = piHelpExtension();

  assert.match(source, /\/\^\\\/rule-state/u, "it recognises the command alone");
  assert.match(source, /execFileSync\("rule-mcp", \["state", "--dir"/u, "the screen comes from the CLI");
  assert.equal((source.match(/pi\.on\("input"/gu) ?? []).length, 1, "one input handler, not two");
});
