# Prompt-corpus engineering plan

Status: `in-progress`
Owner: rule-mcp
Created: 2026-11-24
Reference: [`scripts/audits/prompt-corpus/index.mjs`](../../scripts/audits/prompt-corpus/index.mjs)

## Context

A read of 4 321 user prompts across pi (3 154), claude (962) and opencode (205) shows where the server is missing an answer. 3 938 are human, 77% Italian, median 148 characters. The dominant request is not a skill lookup: it is "advance the plan" (485 prompts, 202 naming a plan id such as `fase 4`, `Phase 3`, `M6`, `OSS-001`). Next come context transfer (401), a broken thing (331), resume (181), state recap (106), interviews (99), clean-up sweeps (89), distrust of a claim (83), atomic commit and push (80), dev server lifecycle (74).

The server has 105 tools and 16 slash commands. `rule_tool_handon` proposes the next open step and stops there, by design. Nothing turns a named plan id into work, nothing resumes a session on its own, and nothing starts or stops a dev server.

## Dependency graph

```text
WS0 audit script ──► WS1 rule_tool_next ──► WS2 session resume hook
                            │                        │
                            └──► WS4 /rule-state ◄────┘
WS3 devserver (independent)
WS5 interview (independent)
```

## WS0 Corpus audit

Measured on 2026-11-24 by `node scripts/audits/prompt-corpus/index.mjs`: 4 321 prompts, 3 932 human, pi 3 154 / claude 962 / opencode 205, 77% Italian, median 148 characters. Signals on human prompts: advance the plan 524 (13%), named plan id 417 (11%), something is broken 328 (8%), resume 181 (5%), state recap 106 (3%), interview 99 (3%), stale docs sweep 89 (2%), distrust a claim 83 (2%), atomic commit and push 80 (2%), dev server lifecycle 74 (2%).

- [x] WS0-T1 Fix `scripts/audits/prompt-corpus/index.mjs` for prettier and eslint, and commit it, so every number in this plan can be recomputed.
- [x] WS0-T2 Record the measured baseline in this file when the script changes the counts.

## WS1 Advancing a plan

- [x] WS1-T1 `rule_tool_next`: resolve the plan by slug or id (`fase N`, `Phase N`, `M6`, `WS2-T3`), read its open steps, and return the step verbatim with its workstream.
- [x] WS1-T2 Accept a bare "vai": infer the plan from the newest handoff, then its first open step, and say which plan and step it chose.
- [x] WS1-T3 Tick the executed step and report the plan delta, instead of leaving the checkbox to a human edit.
- [x] WS1-T4 `/rule-next` slash command, plus the tool in the surface, with a test per branch (named id, bare "vai", ambiguous plan, closed plan).

## WS2 Resume on session start

- [x] WS2-T1 Reuse WS1-T1 to resolve the first open step, and render the resume block the newest handoff already carries.
- [x] WS2-T2 Pi extension: inject at `session_start` (the help extension is the pattern to copy).
- [ ] WS2-T3 opencode plugin and Claude hook for the same payload, or a documented reason why a host cannot.
- [ ] WS2-T4 Test that an injected resume is one entry, TUI-only where the host allows it, and never a model turn.

## WS3 Dev server lifecycle

- [ ] WS3-T1 `rule_tool_devserver`: `start`, `stop`, `status`, `list`, with the 3000-6000 port scan the global instructions already describe.
- [ ] WS3-T2 Selective stop ("every node process except the MCP servers") with a test on a real process table.
- [ ] WS3-T3 Log tail and the first-available-port report, so a run says the URL it opened.

## WS4 Project state

- [ ] WS4-T1 `/rule-state": version, ADR count, open plan steps, dirty tree, last CI conclusion, last handoff.
- [ ] WS4-T2 Reuse WS1-T1 for the next open step, and `gh` for the CI line, with a fallback when `gh` is absent.
- [ ] WS4-T3 One screen, no model turn where the host allows it.

## WS5 Structured interview

- [ ] WS5-T1 `rule_tool_interview`: a schema of questions in, answers out as one document (ADR, plan or requirements).
- [ ] WS5-T2 Refuse to invent an answer; leave an unanswered question open and say so.
- [ ] WS5-T3 Tests: incomplete answers, refused answer, and the document shape.

## Acceptance

Each workstream lands with its tests, its documentation line, and the surface counts updated by the census. A workstream that cannot keep the guardrails green does not land.
