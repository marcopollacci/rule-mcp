/** Rendering: MCP-prompt suppression, the .prompt.md format, and placeholder hygiene. */
import { strict as assert } from "node:assert";
import { test } from "node:test";

import { COMMAND_TARGETS, FORMATS, FORMAT_EXT, commandHelp, listAgentCommands, renderAgentCommand, renderAgentCommandFiles, suppressesMcpPrompts } from "./_targets.fixture.mjs";

console.log("agent command targets test: rendering");

test("hosts that namespace MCP prompts have them suppressed", () => {
  assert.equal(suppressesMcpPrompts("claude"), true, "Claude shows /rule:* - suppress");
  assert.equal(suppressesMcpPrompts("vscode"), true, "VS Code shows /mcp.rule-mcp.* - suppress");
  assert.equal(suppressesMcpPrompts("pi"), false, "Pi already exposes bare /rule-mcp-* prompts");
  assert.equal(suppressesMcpPrompts("jetbrains"), false, "no clean files installed - keep the MCP prompts");
});

test("the prompt format renders .prompt.md with frontmatter and no $ARGUMENTS", () => {
  assert.equal(FORMAT_EXT.prompt, ".prompt.md", "VS Code prompt files use the .prompt.md suffix");
  const files = renderAgentCommandFiles("prompt");
  assert.ok(
    files.every((f) => f.filename.endsWith(".prompt.md")),
    "every rendered file uses the prompt-file suffix",
  );
  for (const command of listAgentCommands()) {
    const out = renderAgentCommand(command, "prompt");
    assert.ok(out.startsWith("---\n"), `${command.name}: prompt files open with frontmatter`);
    assert.match(out, /\ndescription: ".*"\n/, `${command.name}: description is a quoted scalar`);
    assert.match(out, /\nargument-hint: ".*"\n/, `${command.name}: argument-hint drives the chat input hint`);
    assert.ok(!out.includes("$ARGUMENTS"), `${command.name}: VS Code does not substitute $ARGUMENTS`);
    assert.match(out, /request/i, `${command.name}: the body must still say what the request is`);
  }
});

test("the opencode format folds the argument hint into the description", () => {
  // opencode 2.4.0 reads every command through its own field set
  // (template|description|agent|model|subagent|subtask) and has no
  // `argument-hint`, so the hint has to ride in the description its completion
  // popup already renders next to the command name.
  assert.equal(FORMAT_EXT.opencode, ".md", "opencode commands are Markdown files");
  assert.equal(FORMATS.opencode.hint, "description", "opencode carries the hint in the description");
  for (const command of listAgentCommands()) {
    const out = renderAgentCommand(command, "opencode");
    assert.ok(out.startsWith(`---\ndescription: "${command.argumentHint} — `), `${command.name}: the hint leads the description, separated like Pi renders it`);
    assert.ok(!out.includes("argument-hint"), `${command.name}: opencode has no argument-hint field to write`);
    assert.ok(out.includes("$ARGUMENTS"), `${command.name}: opencode substitutes $ARGUMENTS`);
  }
});

test("the opencode targets render the opencode format", () => {
  const targets = COMMAND_TARGETS.filter((target) => target.agent === "opencode");
  assert.equal(targets.length, 2, "opencode has a global and a project target");
  for (const target of targets) {
    assert.equal(target.format, "opencode", `${target.label}: argument-hint is dropped by opencode, so the hint moves into the description`);
  }
});

test("formats without argument substitution never leak a placeholder", () => {
  for (const format of ["prompt", "plain", "workflow"]) {
    for (const command of listAgentCommands()) {
      const out = renderAgentCommand(command, format);
      assert.ok(!out.includes("$ARGUMENTS"), `${format}/${command.name}: no $ARGUMENTS leak`);
      assert.ok(!out.includes("{{args}}"), `${format}/${command.name}: no {{args}} leak`);
    }
  }
});

test("every rendered body answers help before it runs the task", () => {
  // Hosts without an input hook (Claude Code, Codex, Gemini, Cursor, Windsurf,
  // Cline, Roo, VS Code) expand the template and send it to the model, so `help`
  // used to arrive as an ordinary argument and became a path to check. The guard
  // is in the body: the model prints the block and stops.
  const GUARD = "only help, --help or -h";

  for (const format of ["args", "opencode", "prompt", "plain", "workflow", "gemini", "skill"]) {
    for (const command of listAgentCommands()) {
      const out = renderAgentCommand(command, format);
      let body = out.replace(/^---\n[\s\S]*?\n---\n/, "").trimStart();

      if (format === "gemini") {
        body = body.replace(/^[\s\S]*?prompt = """\n?/, "");
      }

      if (format === "workflow" || format === "skill") {
        body = body.replace(/^#[^\n]*\n+/, "");
      }

      assert.ok(body.trimStart().startsWith("If "), `${format}/${command.name}: the guard is the first instruction`);
      assert.ok(out.includes(GUARD), `${format}/${command.name}: the guard names the help tokens`);
      assert.ok(out.includes(commandHelp(command.name)), `${format}/${command.name}: the body carries the shared help block`);

      // The line the body opens with, cut before the placeholder so the
      // replacement cannot split it.
      const taskStart = command.body
        .split("\n")
        .map((line) => line.split("$ARGUMENTS", 1)[0].trim())
        .find((line) => line.length > 0);

      // The block closes, then the original body starts: the guard is an opener,
      // not a replacement.
      assert.ok(out.includes(`\`\`\`\n\n${taskStart}`), `${format}/${command.name}: the task body follows the guard`);
    }
  }
});

test("the help guard keeps the host's own argument token", () => {
  const [command] = listAgentCommands();
  assert.match(renderAgentCommand(command, "args"), /only help, --help or -h/);
  assert.ok(renderAgentCommand(command, "gemini").includes("{{args}}"), "gemini substitutes {{args}} in the body");
  assert.ok(!renderAgentCommand(command, "prompt").includes("$ARGUMENTS"), "prompt files have no substitution, guard included");
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
