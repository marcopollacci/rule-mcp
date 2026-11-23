/**
 * @module cli/help-text
 *
 * The `rule-mcp help` guide, rendered from the live commander program.
 *
 * One source of truth: the programs' own `usage()`, `description()` and
 * options. A hand-written copy drifts, so a new command or flag cannot fail to
 * appear here.
 */

/** The guide's opening; everything after the command list is prose. */
const HELP_HEADER = `rule-mcp - MCP server for the rule-mcp-* skill ecosystem.

Usage:
  rule-mcp <command> [options]

Commands:`;

/** The prose after the generated command list. */
const HELP_FOOTER = String.raw`Aliases:
  rule-mcp <command> --help    Show per-command help
  rule-mcp help <command>      Print one command's usage block, CLI or slash

Examples:
  rule-mcp help
  rule-mcp help rule-handoff         # the same block /rule-handoff help prints
  pnpm start / pnpm dev              # STDIO - spawnable by IDE/agent via mcp.json
  pnpm up                            # SSE - on-demand HTTP daemon from repo
  rule-mcp serve --transport sse
  rule-mcp tools list
  rule-mcp doctor --telemetry
  rule-mcp adr new "Use PostgreSQL" --status accepted --tags database
  rule-mcp handoff --compress | pbcopy
  rule-mcp install --completions detect        # or tick them in the Shell completions step
  rule-mcp config --global

Install modes:
  local (default)    Uses node + script path - works without global install
  --global           Clean command - needs the installer launcher on PATH (./scripts/install.sh)

Universal installer:
  ./scripts/install.sh             Auto-detect + configure all agents
  ./scripts/install.sh --models    Also configure model API keys
  ./scripts/install.sh --help      Full options

Windows:
  .\scripts\install.ps1          Auto-detect + configure all agents`;

/** Commander's own generated flags are not part of the guide. */
const isHelpOption = (option) => option.flags.includes("--help");

/**
 * Render the full guide for one program.
 *
 * @param {import("commander").Command} program
 * @returns {string}
 */
export function renderHelpText(program) {
  const lines = [HELP_HEADER, ""];

  for (const command of program.commands) {
    const usage = command.usage();
    const label = `  ${command.name()}${usage ? ` ${usage}` : ""}`;

    lines.push(`${label.padEnd(34)}${command.description()}`);

    const documented = command.options.filter((entry) => !isHelpOption(entry));

    for (const option of documented) {
      lines.push(`    ${option.flags.padEnd(28)}${option.description}`);
    }

    for (const subcommand of command.commands) {
      lines.push(`    ${`${subcommand.name()}`.padEnd(26)}${subcommand.description()}`);
    }

    lines.push("");
  }

  return [lines.join("\n").trimEnd(), "", HELP_FOOTER].join("\n");
}
