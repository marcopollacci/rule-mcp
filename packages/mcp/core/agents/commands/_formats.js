/** @module core/agents/commands/formats - render formats and the shared scalar quoting */

/**
 * Render formats, as data. Three independent axes:
 *   - `ext`         the filename suffix the host discovers
 *   - `frontmatter` "yaml" (Markdown hosts), "toml" (Gemini), or null (prose only)
 *   - `placeholder` the host's argument token, or null when the host does NOT
 *                   substitute one (then `$ARGUMENTS` is replaced by prose, so a
 *                   literal, meaningless token never reaches the model)
 *   - `hint`        where the argument hint goes: "frontmatter" writes
 *                   `argument-hint`, "description" merges it into the
 *                   description because the host has no such field, "none"
 *                   drops it
 */
export const FORMATS = {
  // Claude Code, Pi, Cursor - substitute $ARGUMENTS and read `argument-hint`
  args: { ext: ".md", frontmatter: "yaml", placeholder: "$ARGUMENTS", hint: "frontmatter" },
  // opencode - same Markdown shape, but every command is decoded against its own
  // field set (template|description|agent|model|subagent|subtask): an
  // `argument-hint` key is silently dropped, so the hint rides in the
  // description the completion popup already renders next to the command name
  opencode: { ext: ".md", frontmatter: "yaml", placeholder: "$ARGUMENTS", hint: "description" },
  // Roo Code / forks - frontmatter menu entry, arguments typed by hand
  plain: { ext: ".md", frontmatter: "yaml", placeholder: null, hint: "frontmatter" },
  // VS Code Copilot Chat prompt files - `/name`, ${input:...} only, no $ARGUMENTS
  prompt: { ext: ".prompt.md", frontmatter: "yaml", placeholder: null, hint: "frontmatter" },
  // Windsurf, Cline - workflow files, no argument substitution
  workflow: { ext: ".md", frontmatter: null, placeholder: null, hint: "none" },
  // Gemini CLI (and forks) - TOML with {{args}}
  gemini: { ext: ".toml", frontmatter: "toml", placeholder: "{{args}}", hint: "none" },
  // Agent Skills (Codex, Copilot CLI) - one directory per skill holding a
  // SKILL.md whose `name` is the bare skill id
  skill: { ext: "/SKILL.md", frontmatter: "skill", placeholder: null, hint: "none" },
};

/** Supported render formats -> file extension. */
export const FORMAT_EXT = Object.fromEntries(Object.entries(FORMATS).map(([format, spec]) => [format, spec.ext]));

/**
 * Stand-in for `$ARGUMENTS` on hosts that do not substitute anything: the text
 * the user typed after the command is already appended to the prompt by the
 * host, so the body only has to name it.
 */
export const ARGUMENTS_PROSE = "the request typed after this command in the chat input";

/** Collapse whitespace and wrap a string as a safe double-quoted YAML/TOML scalar. */
export function quoted(text) {
  return `"${String(text)
    .replaceAll(/\s+/g, " ")
    .trim()
    .replaceAll('"', String.raw`\"`)}"`;
}
