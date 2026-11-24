# 251: Signal a dev server only against a record it can prove

- **Date**: 2026-11-24
- **Status**: accepted
- **Tags**: cli, devserver, process
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

The corpus shows 74 prompts that start, stop or restart a server or an app. The server ships only a report today: it scans ports 3000-6000 and names the first free one. A start or a stop from a tool needs more. A pid gets reused. A port gets claimed by another tool. A process whose parent leaves keeps running. A stop that guesses its target can end the editor, the MCP server, or a build that was nearly finished.

## Decision

A start records what it launched in the runtime state directory: the port, the pid, the command line, the working directory and the start time. A stop signals a pid only when the record matches the pid and the live command line still matches the recorded one. When either side differs, the tool refuses and says which fact disagreed. A start picks the first free port in 3000-6000 and writes it into the record. A process whose parent leaves stays alive and is reported as orphaned, never killed. Restart waits until start and stop are proven by tests on a real process table.

## Consequences

Positive: every stop is auditable, and a stale record refuses instead of killing a stranger. Negative: a record can go stale after a reboot, and the port chosen at start can be taken between the bind and the record write, so the reader must treat the record as a claim the tool re-checks.

## What would end this

The runtime gains a supervisor that owns child processes, so this tool asks it instead of tracking pids itself.

## Alternatives Considered

1. Shell out to the project's dev command and let the user stop it by hand. That is what happens today. It leaves no record, so no tool can prove a target.
1. Track a process by port alone. A port outlives no process identity: the next listener inherits the same number and a stop would hit the wrong one.
1. Delegate to the platform supervisor (launchd, systemd). That owns the lifecycle properly, but it is a daemon decision, not a dev-server one.
