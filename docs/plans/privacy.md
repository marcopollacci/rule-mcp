# privacy plan

- **Role**: privacy v2.
- **Date**: 2026-11-23.

Status: `in-progress`.

Steps re-derived from the open findings in [the review](../reviews/privacy.md) on every run, worst
first, grouped into one workstream per severity. Mark an executed step or sub-step with `[x]` -
the next sync keeps the mark while its finding stays open. This file is deleted by the run that
finds nothing open.

Reference: [the audit](../audits/privacy.md) holds the measured evidence for every step below.

## Dependency graph

```
WS1 - high
  WS2 - medium
    WS3 - low
```

Depends on: WS2 depends on WS1.

Feeds: WS1 feeds WS2, and WS2 feeds WS3.

Shared files: `docs/11-privacy.md` is touched by WS2-T4, WS2-T3 and WS3-T7.

### WS1 - high

- [ ] **WS1-T1 - F-P1 (high)**: Level `anonymous` keeps prompt text.
  - [ ] **WS1-T1.1**: Read `RULE_MCP_NO_PROMPT_TEXT` in `promptsEnabled()`.
  - [ ] **WS1-T1.2**: Keep `RULE_MCP_NO_PROMPTS` as the prompt-list key only.
  - [ ] **WS1-T1.3**: Add a test: level `anonymous` leaves no prompt text.
- [ ] **WS1-T2 - F-P12 (high)**: Slug collision lets cleanup delete another project's transcripts.
  - [ ] **WS1-T2.1**: Filter `pi` and `claude` sessions by the recorded cwd.
  - [ ] **WS1-T2.2**: Add a test: `/app-one` and `/app/one` stay separate.
- [ ] **WS1-T3 - F-P2 (high)**: The 7-day raw retention never runs.
  - [ ] **WS1-T3.1**: Call `maintain()` from the recorder write path.
  - [ ] **WS1-T3.2**: Add a test: an 8-day-old event is dropped.

### WS2 - medium

- [ ] **WS2-T1 - F-P13 (medium)**: Cleanup covers four agents; four more survive erasure.
  - [ ] **WS2-T1.1**: State the coverage limit in the erasure section.
  - [ ] **WS2-T1.2**: List each skipped agent with its reason.
- [ ] **WS2-T2 - F-P3 (medium)**: Retention is scoped to the current project.
  - [ ] **WS2-T2.1**: Add a sweep over `projects/`.
  - [ ] **WS2-T2.2**: Delete a project directory whose log and rollup are expired.
- [ ] **WS2-T3 - F-P5 (medium)**: Prompt text is recorded verbatim by default.
  - [ ] **WS2-T3.1**: Decide the default: text or length.
  - [ ] **WS2-T3.2**: Document the decision in `docs/11-privacy.md`.
- [ ] **WS2-T4 - F-P7 (medium)**: Self-update `git fetch` is absent from the privacy chapter.
  - [ ] **WS2-T4.1**: Name the channel in `docs/11-privacy.md`.
  - [ ] **WS2-T4.2**: State the `60 s` throttle and the off switch.
- [ ] **WS2-T5 - F-P9 (medium)**: The local record loses malformed lines.
  - [ ] **WS2-T5.1**: Serialize writes across processes.
  - [ ] **WS2-T5.2**: Skip a bad prefix instead of the whole line.

### WS3 - low

- [ ] **WS3-T1 - F-P10 (low)**: The installation id is not stable.
  - [ ] **WS3-T1.1**: Document that a reinstall creates a new id.
  - [ ] **WS3-T1.2**: Report the id count in `rule_tool_stats`.
- [ ] **WS3-T2 - F-P11 (low)**: Telemetry files are mode `0644`.
  - [ ] **WS3-T2.1**: Write telemetry files at `0600`.
- [ ] **WS3-T3 - F-P14 (low)**: Four stores have no age limit.
  - [ ] **WS3-T3.1**: Add an age limit for rollups.
  - [ ] **WS3-T3.2**: Document what each store holds.
- [ ] **WS3-T4 - F-P15 (low)**: The observability skill says "never the prompt text".
  - [ ] **WS3-T4.1**: Correct the skill sentence to match the recorder.
- [ ] **WS3-T5 - F-P4 (low)**: The export cap is not enforced.
  - [ ] **WS3-T5.1**: Call `pruneExports()` after each successful export.
- [ ] **WS3-T6 - F-P6 (low)**: `event.path` stores the path as received.
  - [ ] **WS3-T6.1**: Store a path hash plus extension, or document the raw path.
- [ ] **WS3-T7 - F-P8 (low)**: `pnpx prettier` can reach the npm registry.
  - [ ] **WS3-T7.1**: Name the channel in `docs/11-privacy.md`.
  - [ ] **WS3-T7.2**: Prefer a locally resolved prettier.
