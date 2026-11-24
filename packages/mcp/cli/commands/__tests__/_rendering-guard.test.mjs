/**
 * The help guard, in its own file.
 *
 * `_rendering.test.mjs` sits at the 150-line cap: the guard is one concern of
 * the renderer, and it has four cases of its own.
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import { commandHelp, listAgentCommands, renderAgentCommand } from "./_targets.fixture.mjs";

test("the help guard keeps the host's own argument token", () => {
  const [command] = listAgentCommands();
  assert.match(renderAgentCommand(command, "args"), /only help, --help or -h/);
  assert.ok(renderAgentCommand(command, "gemini").includes("{{args}}"), "gemini substitutes {{args}} in the body");
  assert.ok(!renderAgentCommand(command, "prompt").includes("$ARGUMENTS"), "prompt files have no substitution, guard included");
});

test("a host that answers help itself renders no guard", () => {
  // Pi stops `/<command> help` in its input hook and opencode in its plugin, so
  // the block there is text the user reads in the transcript and the model
  // never uses. Both targets declare `helpGuard: "none"`.
  for (const command of listAgentCommands()) {
    const out = renderAgentCommand(command, "args", { helpGuard: "none" });

    assert.ok(!out.includes("print the block below verbatim"), `${command.name}: no guard line`);
    assert.ok(!out.includes(commandHelp(command.name)), `${command.name}: no embedded usage block`);
    const [firstLine] = command.body.split("\n", 1);
    const opening = firstLine.split("$ARGUMENTS", 1)[0].trim();

    assert.ok(out.includes(opening), `${command.name}: the task starts the body`);
    assert.ok(!out.includes("\n".repeat(3)), `${command.name}: no blank block left behind`);
  }
});

test("the guard names the text it tests instead of interpolating the placeholder", () => {
  // The host substitutes every occurrence of its token, so a guard written with
  // `$ARGUMENTS` in it rendered as "If ui check this HTML is exactly help" - a
  // condition no reader can apply, in every rendered file.
  for (const format of ["args", "opencode", "gemini", "prompt", "plain"]) {
    const out = renderAgentCommand(
      listAgentCommands().find((command) => command.name === "rule-area"),
      format,
    );

    assert.doesNotMatch(out.split("```text", 1)[0], /\$ARGUMENTS|\{\{args\}\}/, `${format}: the guard carries no placeholder`);
    assert.match(out.split("```text", 1)[0], /only help, --help or -h/, `${format}: the guard states the condition`);
  }
});

test("compression never rewrites the help guard", () => {
  // The guard is an instruction. The compressor strips articles and determiners,
  // which turned "print the block below verbatim and stop: it is the whole
  // answer" into a sentence a model can paraphrase - so only the task body is
  // compressed.
  const GUARD =
    "If the text typed after this command is only help, --help or -h (with or without a leading area or persona id), print the block below verbatim and stop: it is the whole answer, do not run the task.";

  for (const command of listAgentCommands()) {
    const compressed = renderAgentCommand(command, "args", { compress: true });
    assert.ok(compressed.includes(GUARD), `${command.name}: the guard survives compression verbatim`);
    assert.ok(compressed.includes(commandHelp(command.name)), `${command.name}: the block survives compression verbatim`);
  }
});

console.log("\nagent command targets: all checks passed");
