# prompt-corpus-engineering

- **Plan**: `docs/plans/_prompt-corpus-engineering.md` (retired)
- **ADR**: 252 (`252-close-out-plan-prompt-corpus-engineering.md`)

## Delivered

- WS0-T1 Fix scripts/audits/prompt-corpus/index.mjs for prettier and eslint, and commit it, so every number in this plan can be recomputed.
- WS0-T2 Record the measured baseline in this file when the script changes the counts.
- WS1-T1 rule_tool_next: resolve the plan by slug or id (fase N, Phase N, M6, WS2-T3), read its open steps, and return the step verbatim with its workstream.
- WS1-T2 Accept a bare "vai": infer the plan from the newest handoff, then its first open step, and say which plan and step it chose.
- WS1-T3 Tick the executed step and report the plan delta, instead of leaving the checkbox to a human edit.
- WS1-T4 /rule-next slash command, plus the tool in the surface, with a test per branch (named id, bare "vai", ambiguous plan, closed plan).
- WS2-T1 Reuse WS1-T1 to resolve the first open step, and render the resume block the newest handoff already carries.
- WS2-T2 Pi extension: inject at session_start (the help extension is the pattern to copy).
- WS2-T3 opencode plugin and Claude hook for the same payload, or a documented reason why a host cannot.
- WS2-T4 Test that an injected resume is one entry, TUI-only where the host allows it, and never a model turn.
- WS3-T1 rule_tool_devserver read-only half: status, list, ports over the 3000-6000 scan, with the process that owns each port. start and stop are refused, because a stop that guesses its target can end the editor or the MCP server.
- WS3-T1b start: launch one command, pick the first free port in 3000-6000, and write the record ADR 251 names (port, pid, command, cwd, startedAt) into the runtime state directory. ADR 251 is accepted, so the record's shape is decided; this is the step that writes it. Moved before WS3-T3, which cannot start before a process exists.
- WS3-T3 Log tail and the URL report, for a process this tool started. Blocked by WS3-T1b: with no start there is no log to follow and no URL the tool opened. A tail of a log the user names is a different feature and needs its own line.
- WS4-T1 /rule-state": version, ADR count, open plan steps, dirty tree, last CI conclusion, last handoff.
- WS4-T2 Reuse WS1-T1 for the next open step, and gh for the CI line, with a fallback when gh is absent. Satisfied by WS4-T1: planState calls nextStep, and with gh off PATH the line reads "unknown (no gh, or no run on this branch)". Verified by running the screen with the PATH stripped.
- WS4-T3 One screen, no model turn where the host allows it.
- WS5-T1 rule_tool_interview: a schema of questions in, answers out as one document (ADR, plan or requirements).
- WS5-T2 Refuse to invent an answer; leave an unanswered question open and say so.
- WS5-T3 Tests: incomplete answers, refused answer, and the document shape.

## Where it lives now

The ADR holds the decision and its consequences. This file records that the
plan closed and what it delivered; nothing in it is open.
