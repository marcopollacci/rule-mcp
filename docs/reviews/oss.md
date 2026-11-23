# oss review

- **Role**: oss v1
- **Date**: 2026-11-23

Status: `in-progress`.

Writing: STE100~80. Short sentences, active voice, one idea per sentence, same word for the same thing. Keep about 20% natural tone. Keep findings and summaries short and actionable.

Findings distilled from [the audit](../audits/oss.md). A finding this run no longer reports is
flipped to resolved and kept one run for visibility, then removed.

Details for every id sit in [the audit](../audits/oss.md).

| Finding | Severity | Status | Evidence    | Summary                                                                                      |
| ------- | -------- | ------ | ----------- | -------------------------------------------------------------------------------------------- |
| E1      | high     | open   | oss.md E1.  | License stays a pointer file. Hosts return NOASSERTION.                                      |
| E2      | high     | open   | oss.md E2.  | Three docs disagree on the install route. server.json advertises a missing package.          |
| E6      | high     | open   | oss.md E6.  | Protection is off. GOVERNANCE cites owner action 16.5 that no plan holds.                    |
| E7      | high     | open   | oss.md E7.  | Scorecard counts 0 approved changesets of 30. One human reviewer owns CODEOWNERS.            |
| E3      | medium   | open   | oss.md E3.  | Two minimum Node versions are in force. CONTRIBUTING says 20, README says 24.                |
| E5      | medium   | open   | oss.md E5.  | CONTRIBUTING promises a needs-triage label and stale automation the repo lacks.              |
| E8      | medium   | open   | oss.md E8.  | No release is signed or carries provenance. Four of five shipped inside 53 minutes.          |
| E10     | medium   | open   | oss.md E10. | SECURITY-INSIGHTS.yml says rule, not rule-mcp. It cited a missing plan and is 73 days stale. |
| E11     | medium   | open   | oss.md E11. | The repository sets no topics and keeps discussions off. README has no badge and no example. |
| E12     | medium   | open   | oss.md E12. | The only outside pull request closed in 34 seconds, unmerged, with no review.                |
| E17     | medium   | open   | oss.md E17. | README states counts and links. It carries no usage example.                                 |
| E4      | low      | open   | oss.md E4.  | The first copy-paste step names a directory the clone does not create.                       |
| E15     | low      | open   | oss.md E15. | GOVERNANCE promises an annual funding summary the section does not carry.                    |
| E16     | low      | open   | oss.md E16. | 1.4 GB of ignored build and worktree state sits inside the checkout.                         |
| E9      | info     | open   | oss.md E9.  | Supply-chain checks score 9 to 10. Five dependabot pull requests stay open.                  |
| E13     | info     | open   | oss.md E13. | The reported test failure does not reproduce at HEAD.                                        |
| E14     | info     | open   | oss.md E14. | The community profile reports 100 percent. It does not see the two issue forms.              |
| E18     | info     | open   | oss.md E18. | 1515 commits in 130 days produced 250 ADRs and 4 open checkboxes.                            |
