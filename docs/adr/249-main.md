# 249: main

_Consolidated at the feature close from 6 decisions of this feature (249, 250, 251, 252, 253, 254). Each decision is reproduced in full below._

---

<!-- source: docs/adr/249-merge-the-argument-hint-into-the-description-for-hosts-without-an-argument-hint-.md -->

# 249: Merge the argument hint into the description for hosts without an argument-hint field

- **Date**: 2026-11-23
- **Status**: accepted
- **Tags**: agent-commands, opencode, pi, slash-commands
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

The render formats declared one shape for every Markdown host that substitutes $ARGUMENTS, so Claude Code, Cursor, Pi and opencode all received description plus argument-hint. Pi 1.6.0 reads both fields and renders the hint before the description in its slash completion, but opencode 2.4.0 decodes a command against its own field set (template, description, agent, model, subagent, subtask) and silently drops argument-hint, so the hint never reached its completion popup. The generated /rule-area-* descriptions also started lowercase, which reads wrongly as the first thing after a command name.

## Decision

FORMATS gains a per-format hint strategy: frontmatter writes argument-hint, description folds it into the description in the same hint-then-description order Pi renders, none drops it. A new opencode format (ext .md, yaml, $ARGUMENTS, hint description) backs both opencode targets, which change format from args; args, plain and prompt keep their bytes unchanged. Area command descriptions are capitalized by areaLabel() in _areas-prompts.js, and docs/17-cli.md plus the CLI option list now name the new format.

## Consequences

opencode users now see an argument hint in the completion popup, at the cost of a slightly longer description line; the hint text is duplicated between the description and the existing Usage prose in rule-handoff until that description is trimmed. Hosts that adopt argument-hint later can move the opencode target back to args without touching the renderer. Capitalizing the area description also changes the same sentence inside the area body (Scope: Ui work: ...) and in the MCP prompt list.

## What would end this

opencode accepts an argument-hint field, or renders a hint column of its own: the opencode target moves back to the args format and the merged-description format is deleted.

## Alternatives Considered

1. Keep one args format and add a second per-target boolean (hintInDescription) threaded through renderAgentCommandFiles
1. Write the opencode commands as JSON entries in opencode.jsonc so the schema is explicit
1. Leave the hint out on opencode and rely on the description alone
1. Rewrite the argument names (options to topic) so the hint reads better on every host

---

<!-- source: docs/adr/250-answer-slash-command-help-without-a-model-turn-where-the-host-allows-it.md -->

# 250: Answer slash-command help without a model turn where the host allows it

- **Date**: 2026-11-23
- **Status**: accepted
- **Tags**: cli, help, slash-commands, pi, opencode
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

Two help surfaces had drifted. The CLI already answered --help for all 28 commands, because commander generates it, but `rule-mcp help` printed a hand-maintained string tagged auto-extracted with no generator and no parity test, and 12 commands (feature, project, handon, cache, roles, guard, update, agent-commands, reinstall, commit-lint, secrets, init) were missing from it. On the slash side, the help block existed only in the MCP prompt path: with prompt templates installed and MCP prompts suppressed, /rule-handoff help went to the model as ordinary text and cost a turn. Hosts differ: Pi fires an input event before template expansion and can handle the input, append a TUI-only entry that stays out of LLM context, and stop the agent; opencode plugins register a command and can store a synthetic message without requesting a generation; every other host reads command files only, so any help there reaches the model.

## Decision

One help text per command. commandHelp resolves it from promptHelp (the existing usage block, with the handoff's curated option vocabulary) and covers the two general commands that are not prompts. The CLI guide is rendered from the live commander program, so a new command or flag cannot be missing from it, and `rule-mcp help <command>` prints either a slash command's block or a CLI command's --help. Two host artifacts are generated from that same text at install time and removed on uninstall: a Pi extension that matches `/<command> help|--help|-h` in the input event, appends a custom entry rendered in the TUI and returns action handled; and an opencode plugin that registers /rule-help [command] and answers through ctx.session.synthetic. The text is embedded rather than read from the binary, so a session costs no spawn and the artifact survives the binary moving.

## Consequences

Zero tokens on Pi and opencode; every other host is unchanged and still pays a turn for help. The generated files are about 21 KB (Pi) and 26 KB (opencode) and are rewritten on every install, so a hand edit is lost. opencode's entry is `/rule-help <command>` rather than `/rule-handoff help`, because registering a duplicate name resolves by plugin load order, which is not a documented contract. Two sources now exist in effect: the repository functions and their embedded copies, kept honest by the installer and by the help parity test rather than by a manual sync.

## What would end this

opencode exposes an input or prompt interception hook, or its command registry documents same-name precedence: then one command name can serve both entry points and /rule-handoff help becomes zero-token there too.

## Alternatives Considered

1. Keep the hand-maintained HELP_TEXT and add only a parity test
1. Serve help exclusively through MCP prompts and leave the file templates alone
1. Have the Pi extension spawn `rule-mcp help <name>` instead of embedding the blocks
1. Shadow the rule-* command names in opencode so /rule-handoff help itself is zero-token
1. Write a deterministic verbatim help block into the templates of the hosts that cannot short-circuit

---

<!-- source: docs/adr/251-address-an-area-and-a-persona-through-one-command-each.md -->

# 251: Address an area and a persona through one command each

- **Date**: 2026-11-23
- **Status**: accepted
- **Tags**: architecture, cli, surface
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

The slash surface carried 44 commands. Eleven were `/rule-area-<area>` hubs and nineteen were `/rule-persona-<role>`. Each file differed from its siblings by one constant, so every host carried 30 near-copies of two bodies. A user had to remember the id before typing, and every new area or role added a file to every host directory.

## Decision

One /rule-area command and one `/rule-persona` command replace the two families. The id is the first word of the request, read by the body, because a slash template substitutes text and nothing else. Both commands keep two named MCP prompt arguments (area and request, persona and topic), so a client that renders prompts as forms still receives fields. The command bodies carry the vocabulary: every area id with its hub skill and leaf count, every role id with its title. The installer families and presets keep their names, and each family is now one command. The surface is 16 commands per host directory.

## Consequences

Positive: 30 fewer files per host directory, one body per family to maintain, and a new area or role reaches every host without a file. Negative: the model reads the id from the request instead of from the command name, so a misspelled id falls back to inference, and the argument hint is now two words.

## What would end this

A host exposes dynamic slash-command arguments, so the id can be a real field instead of the first word of free text.

## Alternatives Considered

1. Keep one command per area and per role, and generate the files on demand only. This keeps the id in the command name, but the fan-out and the drift stay.
1. Register one command per family and have the plugin dispatch by name. Hosts read files, not plugins, so the dispatch would exist on one host only.

---

<!-- source: docs/adr/252-close-out-plan-command-surface-collapse.md -->

# 252: Close out plan _command-surface-collapse

- **Date**: 2026-11-23
- **Status**: accepted
- **Tags**: docs, closeout, plan
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

The plan record docs/plans/_command-surface-collapse.md, "Command surface: collapse the area and persona families", finished with 9 closed items.

## Outcome

- Replace listAreaPrompts() with one rule-area prompt (arguments area, request).
- Replace rolePrompts() with one rule-persona prompt (arguments persona, topic).
- areaBody lists every area id with its hub skill and members.
- personaBody lists every role id and performs the depth-intent decision from the request.
- Drop the hub/skill narrowing that only existed for the 11 area commands; keep family and preset names.
- commandHelp and the generated host artifacts cover the two dispatchers (16 blocks).
- Rendering, areas, personas and help-parity suites assert the collapse (no `rule-area-<x>` or `rule-persona-<x>` left).
- Regenerate the census (15/16/17/21/22) and record the decision.
- agent-commands --sync removes the 30 stale files, writes the 2, and /rule-area ui check this HTML routes.

### Plan prose

The slash surface is 44 commands: 1 router, 11 `/rule-area-<area>` hubs, 19 `/rule-persona-<role>`, and 13 one-shot tasks. Two families are a fan-out of one concept (an area, a role), so every host carries 30 files whose bodies differ by one constant. Target: one `/rule-area [area] <prompt>` and one `/rule-persona [persona] <specific_prompt>`, and the 30 files gone (16 commands total).

Decisions taken: the id is the first word of `$ARGUMENTS`; the MCP prompts keep two named arguments each (`area`/`request`, `persona`/`topic`); the `areas` and `personas` families stay, each with one command.

16 commands per host directory, both dispatchers answering their own `help`, and every affected suite green.

## Decision

Fold the record into this ADR and the session handoff, then delete the source file. The full text stays in git history.

## Consequences

docs/plans/_command-surface-collapse.md is gone from the tree; this ADR keeps what it delivered and the handoff of this session names it.

## What would end this

The work this plan closed returns: a step it dismissed reopens, and this ADR no longer explains why.

---

<!-- source: docs/adr/253-close-out-review-privacy.md -->

# 253: Close out review privacy

- **Date**: 2026-11-23
- **Status**: accepted
- **Tags**: docs, closeout, review
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

The review record docs/reviews/privacy.md, "privacy review", finished with 0 closed items on 2026-11-23..

## Decision

Fold the record into this ADR and the session handoff, then delete the source file. The full text stays in git history.

## Consequences

docs/reviews/privacy.md is gone from the tree; this ADR keeps what it delivered and the handoff of this session names it.

## What would end this

The work this review closed returns: a step it dismissed reopens, and this ADR no longer explains why.

---

<!-- source: docs/adr/254-close-out-audit-privacy.md -->

# 254: Close out audit privacy

- **Date**: 2026-11-23
- **Status**: accepted
- **Tags**: docs, closeout, audit
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

The audit record docs/audits/privacy.md, "privacy audit", finished with 0 closed items on 2026-11-23..

## Decision

Fold the record into this ADR and the session handoff, then delete the source file. The full text stays in git history.

## Consequences

docs/audits/privacy.md is gone from the tree; this ADR keeps what it delivered and the handoff of this session names it.

## What would end this

The work this audit closed returns: a step it dismissed reopens, and this ADR no longer explains why.
