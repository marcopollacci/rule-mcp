# 63 - The corpus becomes five tools, and the plan closes itself

- **Date**: 2026-11-25
- **Branch**: `main` (the only branch; range `90d1ce67..HEAD`, pushed through `d20e64af`)
- **Commit range covered**: `90d1ce67..HEAD`, 4 commits local at close
- **Version**: `0.2.1`, no release cut in this session

## What shipped

The prompt corpus (4 321 prompts across pi, claude and opencode) became five pieces of surface, and the plan that ordered them closed itself into ADR 252.

- **`rule_tool_next`** resolves the step a request names: a plan slug, a step id (`WS1-T1`, `WS1-T1.1`, `WS1-T3b`), a phase (`fase 4`, `WS2`), or a bare "vai". With `complete` and `evidence` it ticks the checkbox only when that path exists, and reports the delta. `/rule-next` is the slash form.
- **`/rule-state`** answers version, ADR count, open steps with the next one, dirty tree, last CI and last handoff. The Pi extension answers it from `rule-mcp state` with no model turn.
- **`rule_tool_devserver`** reports listeners on 3000-6000, stops one listener against the port and pid that prove it, starts one command on the first free port and writes the record ADR 251 names, and tails that log with its URL.
- **`rule_tool_interview`** turns a schema of questions and answers into one document. An unanswered question stays unanswered.
- **Resume**: the injected block now names the next plan step, Pi injects it on the first turn of a resumed session with `display: false`, and `docs/04-install.md` says which host receives it and why opencode cannot.

## Decisions

- 251: signal a dev server only against a record it can prove.
- 252: close out the prompt-corpus plan.

## Defects found by using the tools

- `rule_tool_next` could not read a step id inside emphasis (`**WS1-T1 …`), then dropped the numeric suffix (`WS1-T1.1`), and in that case ticked the child while reporting the parent. Both fixed with a lookahead that refuses a longer id.
- The corpus audit found the first defect: my own resolver was the thing that failed on a second plan.
- `LICENSE` carried a heading and a fence, so GitHub answered `NOASSERTION`. With the bare MIT text it answers `MIT`.
- `server.json` advertised an npm package that returns 404 while three documents disagreed. One route now: git clone and the release tarball.
- The Pi help extension registered two `input` handlers; a host that keeps one per name lost the second. Merged into one.

## Verification of record

`pnpm run ci` on the pushed tree: 3 321 tests, 0 failures. Remaining red: the branch coverage floor, 91.88% against 92%. Not fixed; the gap is uncovered branches in the new modules, listed below.

```text
_devserver.js  66.66%   28-34, 49-50, 64-65, 87-112
_next.js       81.25%   40-41
_state.js      83.78%   23-27, 93-94
_complete.js   71.42%   43-44, 70-71
_register.js    0% funcs
```

## Open work

- **Coverage floor**: tests only, no code. The five files above take the run back over 92%.
- **`/rule-state` mislabels CI**: `lastCi` reads the newest run of any workflow, so it prints `skipped (Pages)` when the `ci` run is what matters. One fix, one test.
- **`oss` plan, 38 steps open**: WS1-T2 closed (one install route), WS1-T1 closed (MIT recognised). Next are WS1-T3 (branch protection) and WS1-T4 (Scorecard approvals), both needing owner action on GitHub.
- **`package-manager-distribution`, 6 workstreams**: WS1-T1 is the ADR that names which channels are in scope.
- **Plan index**: 71 plans ready, 12 blocked, 84 with open steps. Most are the skill catalog roadmap.

## Notes for the next session

- `rule-mcp tools call` resolves the installed launcher, not the working tree. Use `node --import ./scripts/alias-hook.mjs` with the modules directly when testing a change.
- Commit with `RULE_MCP_HOOK_NO_SIDE_EFFECTS=1` and you must follow it with a `chore(changelog): refresh` commit, or CI fails on `changelog --check`.
- A commit scope is lower-case letters, digits, dot, underscore or hyphen: `test(devserver,next)` is rejected.

### Resume Prompt

next session opens with this block.

```prompt
Resume work on rule-mcp-workspace at docs/handoff/63-the-corpus-becomes-five-tools.md.
First step: run `rule_tool_handon` with that file, then `rule_tool_state` to see the tree and the next plan step.
Then close the coverage gap, because it is the only red on CI: cover the uncovered branches of tools/devserver/_devserver.js, tools/next/_next.js and _complete.js, tools/state/_state.js, and the four tool registrars, until branches reach 92%.
After that, fix the `last CI` line in tools/state/_state.js so it reads the ci workflow and not the newest run of any workflow, with a test that pins it.
The plan prompt-corpus-engineering is closed into ADR 252. Two plans carry the work: `oss` (38 steps) and `package-manager-distribution` (WS1-T1 is the channels ADR).
Verification of record: 3321 tests pass, branch coverage 91.88% against a 92% floor, MIT recognised, one install route. Do not re-run a claimed check; re-verify only what changed.
Every commit is `type(scope): subject`; the commit-msg hook rejects a scope-less message and a scope with a comma.
Writing: STE100~80. Short sentences, active voice, one idea per sentence, same word for the same thing.
```
