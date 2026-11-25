# oss plan

- **Role**: oss v1
- **Date**: 2026-11-23

Status: `in-progress`.

Writing: STE100~80. Short sentences, active voice, one idea per sentence, same word for the same thing. Keep about 20% natural tone. Keep findings and summaries short and actionable.

Steps re-derived from the open findings in [the review](../reviews/oss.md) on every run, worst
first, grouped into one workstream per severity. Mark an executed step or sub-step with `[x]` -
the next sync keeps the mark while its finding stays open. This file is deleted by the run that
finds nothing open.

## Dependency graph

```
WS1 - high
  WS2 - medium
    WS3 - low
      WS4 - info
```

Depends on: WS2 after WS1 (shared CONTRIBUTING.md and README.md).
Depends on: WS3 after WS2 (shared GOVERNANCE.md and CONTRIBUTING.md).
Feeds: none. Every edge ends inside this plan.
Shared files: `CONTRIBUTING.md` (E2, E3, E4, E5), `GOVERNANCE.md` (E6, E15), `README.md` (E2, E3, E17), `SECURITY-INSIGHTS.yml` (E10).

Reference: [the audit](../audits/oss.md) and [the review](../reviews/oss.md). Evidence skills: [readme](../../skills/rule-process-readme/SKILL.md), [npm-release](../../skills/rule-process-npm-release/SKILL.md). Also [changelog](../../skills/rule-process-changelog/SKILL.md) and [adr](../../skills/rule-process-adr/SKILL.md).

### WS1 - high

- [x] **WS1-T1 - Step 1 - E1 (high)**: License is a pointer file, so hosts cannot name it. GitHub returns NOASSERTION and the community profile returns key other.
  - [ ] **WS1-T1.1 - 1.1**: Put the full MIT text in LICENSE and keep LICENSES/MIT.txt as the REUSE copy.
  - [ ] **WS1-T1.2 - 1.2**: Re-run the GitHub license detection and record the new spdx_id.
- [ ] **WS1-T2 - Step 2 - E2 (high)**: Three documents disagree on the install route, and server.json advertises an npm package that returns 404.
  - [ ] **WS1-T2.1 - 2.1**: Pick the one install route the project supports today.
  - [ ] **WS1-T2.2 - 2.2**: Align README.md, CONTRIBUTING.md, docs/08-release.md and server.json packages with that route.
- [ ] **WS1-T3 - Step 3 - E6 (high)**: Branch protection is off and GOVERNANCE points at owner action 16.5 that no plan file holds.
  - [ ] **WS1-T3.1 - 3.1**: Enable branch protection on main with the ci checks and one review.
  - [ ] **WS1-T3.2 - 3.2**: Replace the 16.5 reference in GOVERNANCE.md with the live setting or a current owner action.
- [ ] **WS1-T4 - Step 4 - E7 (high)**: Scorecard finds 0 approved changesets of 30 sampled, with one human reviewer and CODEOWNERS set to one login.
  - [ ] **WS1-T4.1 - 4.1**: Review pull requests through the host review flow so approvals are recorded.
  - [ ] **WS1-T4.2 - 4.2**: Add a second reviewer or document the solo-maintainer review rule in GOVERNANCE.md.

### WS2 - medium

- [ ] **WS2-T1 - Step 5 - E10 (medium)**: SECURITY-INSIGHTS.yml names rule instead of rule-mcp, cites a deleted plan, and is 73 days stale.
  - [ ] **WS2-T1.1 - 5.1**: Rename the project and repository entries to rule-mcp.
  - [ ] **WS2-T1.2 - 5.2**: Point the assessment comment at a file that exists and refresh last-updated.
- [ ] **WS2-T2 - Step 6 - E11 (medium)**: The repository sets no topics, keeps discussions off, and the README carries no badge or example.
  - [ ] **WS2-T2.1 - 6.1**: Add repository topics for mcp, ai-agents and styleguide.
  - [ ] **WS2-T2.2 - 6.2**: Decide whether Discussions opens, and record the decision.
- [ ] **WS2-T3 - Step 7 - E12 (medium)**: The only outside pull request closed in 34 seconds, unmerged, with no review.
  - [ ] **WS2-T3.1 - 7.1**: Reply with the triage path on the next outside contribution and record the response time.
- [ ] **WS2-T4 - Step 8 - E17 (medium)**: The README states surface counts and entry links but carries no usage example.
  - [ ] **WS2-T4.1 - 8.1**: Add a short request and response example to README.md.
- [ ] **WS2-T5 - Step 9 - E3 (medium)**: Two minimum Node versions are in force: 24 in the README and getting started, 20 in CONTRIBUTING.
  - [ ] **WS2-T5.1 - 9.1**: State one minimum Node version in README.md, docs/01-getting-started.md and CONTRIBUTING.md.
- [ ] **WS2-T6 - Step 10 - E5 (medium)**: CONTRIBUTING promises a needs-triage label and stale automation that the repository does not carry.
  - [ ] **WS2-T6.1 - 10.1**: Add the needs-triage label, or drop it from CONTRIBUTING.md and bug.yml.
  - [ ] **WS2-T6.2 - 10.2**: Add a stale workflow, or remove the stale promise from CONTRIBUTING.md.
- [ ] **WS2-T7 - Step 11 - E8 (medium)**: No release is signed or carries provenance, and 4 of 5 releases shipped inside 53 minutes.
  - [ ] **WS2-T7.1 - 11.1**: Sign tags, or publish an attestation with the tarball and SHA256SUMS.
  - [ ] **WS2-T7.2 - 11.2**: Publish the release cadence the project intends to keep.

### WS3 - low

- [ ] **WS3-T1 - Step 12 - E15 (low)**: GOVERNANCE promises an annual funding summary that the section does not carry.
  - [ ] **WS3-T1.1 - 12.1**: Publish the first annual summary, including a zero total.
- [ ] **WS3-T2 - Step 13 - E16 (low)**: 1.4 GB of ignored build and worktree state sits inside the checkout.
  - [ ] **WS3-T2.1 - 13.1**: Remove the stale worktrees and the coverage output from the checkout.
- [ ] **WS3-T3 - Step 14 - E4 (low)**: The first copy-paste step of CONTRIBUTING names a directory that the clone does not create.
  - [ ] **WS3-T3.1 - 14.1**: Change cd rule to cd rule-mcp in CONTRIBUTING.md.

### WS4 - info

- [ ] **WS4-T1 - Step 15 - E13 (info)**: The test failure an outside contributor reported does not reproduce at HEAD.
  - [ ] **WS4-T1.1 - 15.1**: Note the reproducing environment in the issue template so the next report is comparable.
- [ ] **WS4-T2 - Step 16 - E14 (info)**: The community profile reports 100 percent but does not see the two issue forms on disk.
  - [ ] **WS4-T2.1 - 16.1**: Re-read the profile after a form edit and record the value.
- [ ] **WS4-T3 - Step 17 - E18 (info)**: 1515 commits in 130 days produced 250 ADRs and 4 open plan checkboxes.
  - [ ] **WS4-T3.1 - 17.1**: Close or move the 4 open plan checkboxes.
- [ ] **WS4-T4 - Step 18 - E9 (info)**: Supply-chain checks score 9 to 10, and five dependabot pull requests stay open.
  - [ ] **WS4-T4.1 - 18.1**: Merge or close the five open dependabot pull requests.
