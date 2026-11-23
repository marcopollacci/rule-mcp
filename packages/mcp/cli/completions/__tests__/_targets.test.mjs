/**
 * The Shell completions step: which destinations exist, and what gets written.
 *
 * The bug this covers: the documented `rule-mcp completions > ~/.zsh/completions/_rule-mcp`
 * failed on every oh-my-zsh machine, because that directory is not on `fpath`
 * unless the user built it. Detection now answers with the directory the login
 * shell actually reads.
 */

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { completionTargets, detectedCompletionTargets } from "../_targets.js";
import { completionsTask } from "../../setup/_task-completions.js";
import { completionItems } from "../../setup/opentui/_completions-items.js";
import { resolveCompletionTargets } from "../../setup/_options.js";

const sandbox = () => mkdtempSync(join(tmpdir(), "rule-mcp-completions-"));

test("an oh-my-zsh machine gets the custom completions directory", () => {
  const home = sandbox();
  mkdirSync(join(home, ".oh-my-zsh"), { recursive: true });

  const targets = completionTargets({ env: { SHELL: "/bin/zsh", HOME: home }, home });
  const ohMyZsh = targets.find((target) => target.id === "zsh-oh-my-zsh");

  assert.ok(ohMyZsh, "oh-my-zsh is detected from its directory");
  assert.equal(ohMyZsh.path, join(home, ".oh-my-zsh", "custom", "completions", "_rule-mcp"));
  assert.equal(ohMyZsh.detected, true, "the login shell is zsh, so it is preselected");
  assert.match(ohMyZsh.reason, /fpath/, "the row explains why zsh reads that directory");
  assert.equal(targets.find((target) => target.id === "zsh-user").detected, false, "the plain zsh directory is not preselected when oh-my-zsh owns fpath");

  rmSync(home, { recursive: true, force: true });
});

test("a plain zsh machine gets its own fpath directory, and the reason says why", () => {
  const home = sandbox();
  const targets = completionTargets({ env: { SHELL: "/bin/zsh", HOME: home }, home });
  const zsh = targets.find((target) => target.id === "zsh-user");

  assert.equal(
    targets.every((target) => target.id !== "zsh-oh-my-zsh"),
    true,
    "no oh-my-zsh directory, no oh-my-zsh row",
  );
  assert.equal(zsh.detected, true);
  assert.match(zsh.reason, /fpath=/, "the row names the fpath line the user needs");

  rmSync(home, { recursive: true, force: true });
});

test("a bash or fish login shell preselects its own directory", () => {
  const home = sandbox();

  for (const [shell, id] of [
    ["/bin/bash", "bash-user"],
    ["/usr/bin/fish", "fish-user"],
  ]) {
    const { detected } = detectedCompletionTargets({ env: { SHELL: shell, HOME: home }, home });

    assert.deepEqual(detected, [id], `${shell}: only its own target is preselected`);
  }

  rmSync(home, { recursive: true, force: true });
});

test("the task writes the script the shell expects, and only where it was told", () => {
  const home = sandbox();
  mkdirSync(join(home, ".oh-my-zsh"), { recursive: true });

  const task = completionsTask({ targets: ["zsh-oh-my-zsh"], env: { SHELL: "/bin/zsh", HOME: home }, home });

  assert.equal(task.id, "completions");
  const result = task.run({ dryRun: false });

  assert.equal(result.status, "ok");

  const written = join(home, ".oh-my-zsh", "custom", "completions", "_rule-mcp");
  assert.ok(existsSync(written), "the file exists after the run");
  assert.match(readFileSync(written, "utf8"), /#compdef rule-mcp|_rule-mcp/, "it is a zsh completion script");
  assert.equal(existsSync(join(home, ".zsh", "completions", "_rule-mcp")), false, "an unticked target is untouched");

  rmSync(home, { recursive: true, force: true });
});

test("a dry run writes nothing and says what it would write", () => {
  const home = sandbox();

  const task = completionsTask({ targets: ["fish-user"], env: { SHELL: "/usr/bin/fish", HOME: home }, home });
  const result = task.run({ dryRun: true });

  assert.equal(result.status, "ok");
  assert.match(result.summary, /would be written/);
  assert.equal(existsSync(join(home, ".config", "fish", "completions", "rule-mcp.fish")), false);

  rmSync(home, { recursive: true, force: true });
});

test("no destination selected is a skip, not an empty success", () => {
  const result = completionsTask({ targets: [] }).run({ dryRun: false });

  assert.equal(result.status, "skip");
  assert.match(result.summary, /no completion target/);
});

test("the step's rows name the path and whether the directory exists", () => {
  const home = sandbox();
  mkdirSync(join(home, ".config", "fish", "completions"), { recursive: true });
  const items = completionItems({ env: { SHELL: "/bin/bash", HOME: home }, home });

  assert.ok(items.length >= 2);
  assert.ok(
    items.every((item) => item.detail.some((line) => line.startsWith(home))),
    "every row shows the absolute path it would write",
  );
  assert.match(items.find((item) => item.id === "fish-user").detail.join(" "), /already exists/);

  rmSync(home, { recursive: true, force: true });
});

test("the flag resolves through the same detection, and drops unknown ids", () => {
  assert.deepEqual(resolveCompletionTargets(""), [], "absent writes nothing");
  assert.deepEqual(resolveCompletionTargets("nope,also-nope"), [], "an unknown id is not written somewhere arbitrary");

  const detected = resolveCompletionTargets("detect");
  assert.deepEqual(
    detected,
    completionTargets()
      .filter((target) => target.detected)
      .map((target) => target.id),
    "detect is the detection the wizard shows",
  );
});
