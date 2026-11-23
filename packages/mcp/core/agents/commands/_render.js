/** @module core/agents/commands/render - one command to one file, per format */

import { compressText } from "../../text/_compression.js";
import { compressionEnabled } from "../../text/_level.js";
import { commandHelp, listAgentCommands } from "./_definitions.js";
import { ARGUMENTS_PROSE, FORMAT_EXT, FORMATS, quoted } from "./_formats.js";

/**
 * The guard every rendered body opens with.
 *
 * A host without an input hook (Claude Code, Codex, Gemini, Cursor, Windsurf,
 * Cline, Roo, VS Code) expands the template and sends it to the model, so
 * `/rule-check help` arrives as an ordinary argument: `help` became the path to
 * check, and the guardrail run answered a question nobody asked. The block is
 * embedded rather than looked up, because the host only ever sees this file.
 *
 * The sentence names the text it tests instead of interpolating the placeholder:
 * the host substitutes every occurrence, so `$ARGUMENTS` here would render as
 * "If ui check this HTML is exactly help" - a condition no reader can apply.
 *
 * @param {{ name: string }} command
 * @returns {string}
 */
function helpGuard(command) {
  return [
    "If the text typed after this command is only help, --help or -h (with or without a leading area or persona id), print the block below verbatim and stop: it is the whole answer, do not run the task.",
    "",
    "```text",
    commandHelp(command.name),
    "```",
  ].join("\n");
}

/**
 * Render one command to a single agent format's file content.
 *
 * @param {{ name: string, description: string, argumentHint: string, body: string }} command
 * @param {"args"|"opencode"|"workflow"|"gemini"|"prompt"|"plain"|"skill"} format
 * @param {{ compress?: boolean }} [options]
 * @returns {string}
 */
export function renderAgentCommand(command, format, options = {}) {
  const spec = FORMATS[format];

  if (!spec) {
    throw new Error(`Unknown agent command format: ${format}`);
  }

  const { name, description, argumentHint, body: rawBody } = command;
  const placeholder = spec.placeholder ?? ARGUMENTS_PROSE;
  // Only the task body is compressed: the guard and the frontmatter are
  // instructions and code-shaped fields, and the compressor turns "print the
  // block below verbatim and stop: it is the whole answer" into a sentence a
  // model may paraphrase.
  const taskBody = options.compress ? compressText(rawBody) : rawBody;
  const body = [helpGuard(command), taskBody].join("\n\n").replaceAll("$ARGUMENTS", placeholder);

  if (spec.frontmatter === "toml") {
    return [`description = ${quoted(description)}`, 'prompt = """', body, '"""', ""].join("\n");
  }

  if (spec.frontmatter === "yaml") {
    // Claude Code / Pi / Cursor / Roo / VS Code prompt files all read this shape.
    // A host without `argument-hint` (opencode) gets the hint folded into the
    // description instead, in the same `<hint> — <description>` order Pi renders.
    const described = spec.hint === "description" && argumentHint ? `${argumentHint} — ${description}` : description;
    const frontmatter = ["---", `description: ${quoted(described)}`];

    if (spec.hint !== "description") {
      frontmatter.push(`argument-hint: "${argumentHint}"`);
    }

    return [...frontmatter, "---", body, ""].join("\n");
  }

  if (spec.frontmatter === "skill") {
    // Agent Skills reads one directory per skill, each containing a SKILL.md
    // whose `name` is the bare skill id - `name: image-convert`, never
    // `name: /image-convert`. The slash form was written by this branch and is
    // what made Copilot CLI report "Failed to load 62 skills": every installed
    // skill answered a name the loader does not accept, so it rejected the set
    // instead of the individual entries.
    return ["---", `name: ${name}`, `description: ${quoted(description)}`, "---", "", `# ${name}`, "", body, ""].join("\n");
  }
  // Prose-only workflow file (Windsurf, Cline).
  return [`# ${name}`, "", body, ""].join("\n");
}

/**
 * Render the full command set for a format as `{ filename, content }` pairs,
 * in canonical order. Callers own the actual filesystem writes.
 *
 * The rendered file is read by the agent on every session, so its task body runs
 * through the compression pass before it reaches disk (measured ~6% on the
 * shipped bodies; the help guard, the frontmatter and the placeholders are
 * code-shaped and pass untouched; the guard guarantees structure - ADR 070).
 *
 * @param {"args"|"workflow"|"gemini"} format
 * @returns {Array<{ name: string, filename: string, content: string }>}
 */
export function renderAgentCommandFiles(format, only) {
  const ext = FORMAT_EXT[format];

  if (!ext) {
    throw new Error(`Unknown agent command format: ${format}`);
  }
  // `only` is the resolved selection: an install writes what the user chose,
  // and absent means everything, which is what every caller wanted before the
  // surface grew a command per skill.
  const wanted = only ? new Set(only) : null;

  const compress = compressionEnabled();

  return listAgentCommands()
    .filter((command) => !wanted || wanted.has(command.name))
    .map((command) => ({
      name: command.name,
      filename: `${command.name}${ext}`,
      content: renderAgentCommand(command, format, { compress }),
    }));
}
