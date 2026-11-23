# Session handoff 62 - OSS audit baseline

- Branch: `main`. It is the only branch.
- Commit range: `009720d5..5706365f`, plus the commit that adds this file.
- Date: 2026-11-23.
- Role run: `oss`, audit operation, over the whole project.

## What this session did

- Ran the Open Source Steward audit on the repository.
- Wrote three documents: the evidence audit, the finding review and the remediation plan.
- Measured governance, contribution path, funding, release cadence and discovery surface.
- Checked all three documents against the 67 guardrails of `rule-process-ai` and `rule-styleguide-markdown`.
- Committed the three documents as one `docs(oss)` commit.

## Evidence collected

- OpenSSF Scorecard 5.1, read from the public API on 2026-11-23T17:19:49Z.
- 5 releases, 1515 commits, 250 ADRs, 2715 tracked files.
- 2 contributor logins: the maintainer and a bot.
- 0 issues, 5 open Dependabot pull requests.
- `npm view rule-mcp` returns E404.
- GitHub reads the license as `NOASSERTION`.
- 1 tag per release, annotated, unsigned.

## Finding state

18 findings stay open: 4 high, 7 medium, 3 low, 4 info. The table with status lives in [the review](../reviews/oss.md). Each id maps to a measurement in [the audit](../audits/oss.md).

High severity, worst first:

- E1 license body missing, so hosts cannot name the license.
- E2 three documents disagree on the install route.
- E6 branch protection is off, and GOVERNANCE cites a missing owner action.
- E7 zero approved changesets of 30 sampled.

## Documents in tree

- `docs/audits/oss.md`: evidence only, overwritten on every OSS audit run.
- `docs/reviews/oss.md`: finding table with severity and status.
- `docs/plans/oss.md`: workstreams WS1 to WS4, 22 steps, `Status: in-progress`.

## Plan graph

- ready: 70, `oss` among them.
- blocked: 12.
- unknown edges: 0, cycles: 0.

## Decisions on record

- Area and persona are one command each, keyed by the first word of the request.
- Slash-command help answers without a model turn where the host allows it.
- The server floor is Node 24, and the wizard floor stays 26.4.
- The release asset is the source tree, built with pnpm, and the tag needs no signature.
- ADR numbers stay stable, and a separate command closes numbering holes.
- Prose sentences cap at 25 words, with dictionary identifiers kept as they are.

## Recent commits

- `5706365f chore(changelog): refresh`
- `802cd38b docs(oss): add audit, review and remediation plan`

## Verification

- `rule_tool_check` returned 67 of 67 passing for all three documents.
- The docs preview server answered 200 at `http://localhost:3009/`.
- `git status --porcelain` reported a clean tree before the handoff commit.

## Next steps

1. Start with WS1-T1, the E1 license body, because GitHub and the community profile both fail to name the license.
2. Ask the owner before E2 and E6, because both choose a single route the project must keep.
3. Run the same persona again after the fixes, so the review flips the closed findings.

### Resume Prompt

```prompt
Resume work on rule-mcp-workspace from docs/handoff/62-oss-audit-baseline.md. Run `rule_tool_handon` first: it checks which claims in this handoff still hold before any of them are trusted.
The open work is the OSS remediation plan in docs/plans/oss.md, 18 findings, 4 of them high. Start with WS1-T1 (finding E1): put the full MIT text in LICENSE and keep LICENSES/MIT.txt as the REUSE copy, then re-check docs/audits/oss.md E1.
Every commit is `type(scope): subject`; the commit-msg hook rejects a scope-less message.
Writing: STE100~80. Short sentences, active voice, one idea per sentence, same word for the same thing.
```
