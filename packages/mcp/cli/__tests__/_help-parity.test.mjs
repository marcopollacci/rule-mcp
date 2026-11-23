/**
 * One help text per command, and the same text everywhere it is asked for.
 *
 * The slash commands ship as host artifacts (file templates, a Pi extension, an
 * opencode plugin) and the CLI is a fourth surface. Each one used to compose its
 * own block, so the answers could disagree. This contract pins:
 *   - every registered CLI command is documented in the `rule-mcp help` guide,
 *     and answers `--help` with its own usage line
 *   - `/rule-<cmd> help` (MCP prompt), `rule-mcp help <cmd>` and the generated
 *     host artifacts all print the identical block
 *   - the host artifacts short-circuit the model: Pi handles the input and
 *     appends a TUI-only entry, opencode sends a synthetic message
 */
import { strict as assert } from "node:assert";
import { test } from "node:test";
import { spawnSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { buildProgram } from "../_program.js";
import { renderHelpText } from "../_help-text.js";
import { HELP_EVENT, buildHelpSurface } from "../installers/_help-surface.js";
import { piHelpExtension, opencodeHelpPlugin } from "../installers/_help-emit.js";
import { commandHelp, listAgentCommands } from "../../core/agents/commands/index.js";
import { getPrompt, listPrompts } from "../../prompts/index.js";

console.log("help parity test");

const commands = listAgentCommands();

test("every CLI command is documented in the usage guide", () => {
  const program = buildProgram();
  const guide = renderHelpText(program);

  for (const command of program.commands) {
    const name = command.name();
    assert.match(guide, new RegExp(String.raw`\b${name}\b`), `${name}: missing from the rule-mcp help guide`);

    const description = command.description();

    if (description) {
      assert.ok(guide.includes(description), `${name}: the guide must carry the command's own description`);
    }

    const options = command.options.filter((entry) => !entry.flags.includes("--help"));

    for (const option of options) {
      assert.ok(guide.includes(option.flags), `${name}: the guide must list ${option.flags}`);
    }
  }
});

test("every CLI command answers --help with a usage line", () => {
  const program = buildProgram();

  for (const command of program.commands) {
    const help = command.helpInformation();
    assert.match(help, /^Usage:/, `${command.name()}: --help must open with a usage line`);
    assert.ok(help.includes("--help") || help.includes("-h"), `${command.name()}: --help must be listed`);
  }
});

test("a slash command's help is one block, shared by the prompt path and the CLI", () => {
  for (const command of commands) {
    const help = commandHelp(command.name);
    assert.ok(help.length > 0, `${command.name}: a help block is generated`);
    assert.match(help, new RegExp(String.raw`Usage: /${command.name}\b`), `${command.name}: the block names its own usage`);

    // rule-handoff carries a curated option vocabulary (HANDOFF_USAGE) instead of
    // the generic description-plus-arguments block; every other command repeats
    // its description so the block stands alone.
    if (command.name !== "rule-handoff") {
      assert.ok(help.includes(command.description), `${command.name}: the block carries the command description`);
    }
  }

  // The MCP prompt path returns the block as an assistant message: same text.
  for (const prompt of listPrompts()) {
    const [primary] = prompt.arguments ?? [];
    const answer = getPrompt(prompt.name, { [primary.name]: "help" }).messages[0];
    assert.equal(answer.role, "assistant", `${prompt.name}: help must not ask the model to generate it`);
    assert.equal(answer.content.text, commandHelp(prompt.name), `${prompt.name}: one help text, not two`);
  }
});

test("the help surface covers every command once", () => {
  const surface = buildHelpSurface();
  assert.deepEqual(
    surface.map((entry) => entry.name),
    commands.map((command) => command.name),
    "the surface follows the canonical command order",
  );
  for (const entry of surface) {
    assert.equal(entry.text, commandHelp(entry.name), `${entry.name}: the surface reuses the shared block`);
  }
});

test("the Pi extension short-circuits the model instead of prompting it", () => {
  const source = piHelpExtension();

  assert.ok(source.includes(HELP_EVENT), "the entry renderer and the appended entry share one custom type");
  assert.match(source, /pi\.on\("input"/, "the raw input is intercepted before template expansion");
  assert.match(source, /action: "handled"/, "handled stops the agent turn entirely");
  assert.match(source, /pi\.appendEntry\(/, "the block is a custom entry, not a model message");
  assert.match(source, /registerEntryRenderer/, "the entry needs a renderer to show up in the chat");
  assert.ok(!/sendMessage|registerCommand/.test(source), "nothing here injects a model-visible message");

  for (const entry of buildHelpSurface()) {
    assert.ok(source.includes(entry.name), `${entry.name}: the extension knows the command`);
  }
});

test("the opencode plugin answers in one small turn, never with the template", () => {
  const source = opencodeHelpPlugin();

  // synthetic admits the text and wakes the session, so this is one turn: the
  // point is that it carries the usage block, not the file template.
  assert.match(source, /session\.synthetic\(/, "the answer goes in as synthetic input");
  assert.match(source, /Print the block below verbatim/, "the turn is asked to copy the block, not to paraphrase it");
  assert.ok(!/session\.prompt\(/.test(source), "the template prompt is what this command exists to skip");
  assert.match(source, /command\.transform/, "commands are registered through the documented transform");

  for (const entry of buildHelpSurface()) {
    assert.ok(source.includes(entry.name), `${entry.name}: the plugin knows the command`);
  }
});

test("installers write the help surface and hand back its path", () => {
  const home = mkdtempSync(join(tmpdir(), "rule-mcp-help-surface-"));
  const script = [
    'const { installPi } = await import("@mcp/cli/installers/_agents-cli.js");',
    'const { installOpencode } = await import("@mcp/cli/installers/_agents-opencode.js");',
    'const pi = installPi({ entrypoint: "rule-mcp", dryRun: true }).map((result) => (typeof result === "string" ? result : result.file));',
    'const opencode = installOpencode({ entrypoint: "rule-mcp", dryRun: true }).map((result) => (typeof result === "string" ? result : result.file));',
    "console.log(JSON.stringify({ pi, opencode }));",
  ].join("\n");
  // HOME is read when `_paths.js` loads, so the installer runs in its own process.
  const child = spawnSync(process.execPath, ["--import", "./scripts/alias-hook.mjs", "--input-type=module", "-e", script], {
    cwd: new URL("../../../../", import.meta.url).pathname,
    env: { ...process.env, HOME: home, PI_CODING_AGENT_DIR: join(home, ".pi", "agent"), RULE_MCP_NO_AUTOUPDATE: "1" },
    encoding: "utf8",
  });
  assert.equal(child.status, 0, `${child.stdout}\n${child.stderr}`);

  const { pi, opencode } = JSON.parse(child.stdout);
  assert.ok(pi.includes(join(home, ".pi", "agent", "extensions", "rule-mcp-help.js")), "Pi gets the extension in its auto-discovered extensions directory");
  assert.ok(opencode.includes(join(home, ".config", "opencode", "plugins", "rule-mcp-help.js")), "opencode gets the plugin in its auto-discovered plugins directory");
});
