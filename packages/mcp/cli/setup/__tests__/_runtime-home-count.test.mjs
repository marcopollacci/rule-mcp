/**
 * The uninstall scan counts a purge before it draws. A broken link in that
 * tree used to throw, the alternate screen closed, and the wizard never appeared.
 */
import { strict as assert } from "node:assert";
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { countFiles } from "../_runtime-home.js";

test("countFiles treats a broken symlink as one entry and keeps going", () => {
  const dir = mkdtempSync(join(tmpdir(), "rule-mcp-count-"));

  try {
    writeFileSync(join(dir, "keep.txt"), "x");
    symlinkSync("does-not-exist", join(dir, "broken"));
    mkdirSync(join(dir, "nested"));
    symlinkSync(join(dir, "missing-dir"), join(dir, "nested", "link"));
    symlinkSync(dir, join(dir, "loop"));

    assert.equal(countFiles(dir), 4);
    assert.equal(countFiles(join(dir, "missing")), 0);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
