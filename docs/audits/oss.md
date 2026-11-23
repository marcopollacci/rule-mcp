# oss audit

- **Role**: oss v1
- **Date**: 2026-11-23

Status: `in-progress`.

Writing: STE100~80. Short sentences, active voice, one idea per sentence, same word for the same thing. Keep about 20% natural tone. Keep findings and summaries short and actionable.

Evidence only: the commands this run executed with their measured values, the files it read,
the sources it consulted. No opinions - those belong in the review.

Scope: whole project. No request text was given to this run.
Repository: `github.com/pixu1980/rule-mcp`, default branch `main`, working tree clean.

## Evidence

Each row names one measurement, the command that produced it, and the value.

| What was measured     | How                                              | Result                                              |
| --------------------- | ------------------------------------------------ | --------------------------------------------------- |
| Repository state      | `curl api.github.com/repos/pixu1980/rule-mcp`    | 7 stars, 1 fork, 0 watchers, 5 open pull requests.  |
| Commit count          | `git rev-list --count HEAD`                      | 1515 commits from 2026-07-16 to 2026-11-23.         |
| Contributor logins    | `/contributors` and `git shortlog -sn --all`     | Two logins, three shortlog lines, two of them bots. |
| Release list          | `/releases?per_page=100`                         | 5 releases, each with tarball, SBOM and SHA256SUMS. |
| Tag signing           | `git log -1 --format='%G?'`                      | Value N. Both gpgsign settings are unset.           |
| Label list            | `/labels?per_page=100`                           | 11 labels, no `needs-triage`.                       |
| Issue list            | `/issues?state=all`                              | 0 issues, so 0 triage activity.                     |
| npm publication       | `npm view rule-mcp version`                      | E404, package not found.                            |
| Community profile     | `/community/profile`                             | 100 percent, but `issue_template` is null.          |
| Branch protection     | `/branches/main/protection`                      | 401, the state needs an owner token.                |
| Scorecard             | `api.securityscorecards.dev` for this repository | Overall 5.1, with 7 checks at 0 or -1.              |
| Skill and persona set | `ls -1d skills/rule-*` and `ls -1 personas`      | 82 skills and 19 personas.                          |
| Documentation volume  | `find docs -name '*.md' \| wc -l`                | 434 Markdown files, 250 of them ADRs.               |
| Tracked file count    | `git ls-files \| wc -l`                          | 2715 tracked files, `.git` at 45M.                  |
| Ignored disk weight   | `du -sh .claude coverage node_modules`           | 549M, 610M and 255M, all gitignored.                |
| README size           | `wc -w < README.md` and a badge count            | 314 words, 0 images, 8 headings.                    |
| Pages site            | `curl -o /dev/null -w '%{http_code}'`            | 200.                                                |
| Graph health          | `tokensave_health` and six related graph tools   | 8461 of 10000 over 2654 files.                      |

## Commands

The command lines below ran in the repository root, on Node v26.13.1 and pnpm 12.23.0.

```text
node --version            -> v26.13.1
pnpm --version            -> 12.23.0
git --version             -> git version 2.54.0
git status --porcelain    -> 0 lines
git rev-list --count HEAD -> 1515
git count-objects -vH     -> size-pack 29.06 MiB
grep -c '!\[' README.md   -> 0 images or badges
grep -c '^#' README.md    -> 8 headings
git ls-files .claude      -> 0 files
ls -1 .claude/worktrees   -> busy-ptolemy-8ee616, pensive-gauss-ae1b68
grep -rIn 'stale|needs-triage' .github/workflows/ -> no match
grep -n '16.5' docs/plans/plan-of-plans.md       -> no match
grep -n '^## ' CHANGELOG.md                      -> 5 version headings
git grep -lI -E 'pixu1980/rule([^-m]|$)' -- .    -> 10 files, all docs/adr or docs/handoff
node --import ./scripts/alias-hook.mjs --test packages/mcp/transport/__tests__/_https.test.mjs
                           -> 11 passed, 0 failed

```

Host-side state comes from the GitHub API.

```text
GET /repos/pixu1980/rule-mcp
  topics [], has_discussions false, has_wiki false, has_projects false
  license.spdx_id "NOASSERTION", created_at 2026-07-16, pushed_at 2026-11-23

GET /repos/pixu1980/rule-mcp/community/profile
  health_percentage 100, code_of_conduct.key other, license.key other

GET /repos/pixu1980/rule-mcp/releases?per_page=100
  v0.1.0 2026-11-10T15:18:04Z, v0.1.1 15:34:14Z, v0.1.2 15:44:21Z,
  v0.1.3 16:11:28Z, v0.2.0 2026-11-23T17:20:42Z

git log --format=%ad --date=format:%Y-%m | sort | uniq -c
  159 2026-07, 84 2026-08, 613 2026-09, 440 2026-10, 219 2026-11

git for-each-ref --sort=creatordate --format='%(refname:short) %(creatordate:short)' refs/tags
  v0.1.0 2026-11-10, v0.1.1 2026-11-10, v0.1.2 2026-11-10,
  v0.1.3 2026-11-10, v0.2.0 2026-11-23

git cat-file -p refs/tags/v0.2.0 -> annotated tag object, unsigned

```

## Files read

- `README.md`, `CONTRIBUTING.md`, `GOVERNANCE.md`, `MAINTAINERS.md`, `AUTHORS`, `TRADEMARK.md`.
- `SECURITY.md`, `CODE_OF_CONDUCT.md`, `LICENSE`, `LICENSES/MIT.txt`, `REUSE.toml`.
- `SECURITY-INSIGHTS.yml`, `server.json`, `CHANGELOG.md`, `.gitignore`.
- `package.json`, `packages/mcp/package.json`.
- `.github/FUNDING.yml`, `.github/CODEOWNERS`, `.github/semantic.yml`, `.github/dependabot.yml`.
- `.github/PULL_REQUEST_TEMPLATE.md`, `.github/ISSUE_TEMPLATE/{bug,feature,config}.yml`.
- `.github/workflows/{ci,pages,release,scorecard}.yml`.
- `docs/01-getting-started.md`, `docs/04-install.md`, `docs/08-release.md`, `docs/21-surface-map.md`, `docs/plans/plan-of-plans.md`.
- The four evidence skills of this role, `skills/rule-process-{readme,npm-release,changelog,adr}/SKILL.md`.
- `.githooks/`: six hooks, `commit-msg`, `pre-commit`, `pre-push`, `post-commit`, `post-merge`, `post-rewrite`.

## Sources consulted

- https://opensource.guide/best-practices/ fetched 2026-11-23. Used for maintainer process and written expectations.
- https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/about-community-profiles-for-public-repositories fetched 2026-11-23. Used for the community profile checklist.
- https://api.securityscorecards.dev/projects/github.com/pixu1980/rule-mcp fetched 2026-11-23. Used for the Scorecard score and reasons.
- https://api.github.com/repos/pixu1980/rule-mcp and its sub-resources fetched 2026-11-23. Used for host-side state.
- https://registry.npmjs.org/rule-mcp fetched 2026-11-23. Used for package publication state.
- https://github.com/ossf/scorecard/blob/main/docs/checks.md returned HTTP 503. Not read.

## Graph health (TokenSave)

- `tokensave_health` returns 8461 over 2654 files.
- acyclicity 0.998, with 6 edges inside cycles.
- depth 0.8571, max chain 14, ideal 12.
- equality 0.5138, gini 0.4862, reported as "high inequality".
- redundancy 0.9876, 68 dead functions of 5475.
- modularity 0.9992, 1193 components after hub removal.
- coverage_discipline 1.0, 0 skip-test-coverage annotations.
- `tokensave_dsm` reports 2654 files, 2999 edges, density 0.0004, 431 clusters, largest cluster 250.
- `tokensave_dependency_depth` reports max depth 14. The longest chain runs from `packages/mcp/tools/__tests__/_pi-tool-descriptions.test.mjs` to `packages/mcp/core/text/_level.js`.
- `tokensave_gini` on lines per file reports 0.4246. Largest files: `guardrail-corpus.mjs` 1919, `docs/adr/ADR.md` 1459, `CHANGELOG.md` 1199.
- `tokensave_coupling` fan_in: `packages/mcp/core/skills/_lru.js` 223, `packages/mcp/tools/router/index.js` 54, `packages/mcp/cli/paths/index.js` 47.
- `tokensave_hotspots`: `_lru.js#has` 311 edges, `packages/docs/style.css` 176, `callTool` in `router/call/_pipeline.js` 106.
- `tokensave_circular` reports one cycle over the four `transport/session-registry/` files.

## OpenSSF Scorecard, 2026-11-23T17:19:49Z

Overall score 5.1. Reasons stay verbatim from the API.

- Code-Review 0: Found 0/30 approved changesets.
- Branch-Protection 0: branch protection not enabled on development/release branches.
- SAST 0: no SAST tool detected.
- Dangerous-Workflow 0: dangerous workflow patterns detected.
- Signed-Releases 0: Project has not signed or included provenance with any releases.
- CII-Best-Practices 0: no effort to earn an OpenSSF best practices badge detected.
- Fuzzing 0: project is not fuzzed.
- Packaging -1: packaging workflow not detected.
- CI-Tests -1: no pull request found.
- License 9: license file detected.
- Pinned-Dependencies 9: dependency not pinned by hash detected.
- Contributors 3: one contributing organization found.
- Dependency-Update-Tool 10, Security-Policy 10, Token-Permissions 10.
- Binary-Artifacts 10, Vulnerabilities 10, Maintained 10.

## Findings, evidence statements

- E1 License detection. `LICENSE` is a 272-byte pointer to `LICENSES/MIT.txt` and holds no license body. GitHub returns `license.spdx_id "NOASSERTION"`. The community profile returns `license.key "other"`. Scorecard returns 9 with "license file detected". Two of three sources cannot name the license.
- E2 Install route. `README.md` states "There is no npm package". `docs/08-release.md` line 94 states the same. `CONTRIBUTING.md` states "The published npm package is `packages/mcp` (`rule-mcp`)". `npm view rule-mcp version` returns E404. `packages/mcp/package.json` sets `publishConfig.access: public`. `.github/workflows/release.yml` holds no publish step. `server.json` advertises an npm package named `rule-mcp` at version 0.2.0.
- E3 Node version. `README.md` says Node 24+. `docs/01-getting-started.md` says 24 or newer. `CONTRIBUTING.md` says ">= 20". `release.yml` runs on node 26. The local runtime is v26.13.1. `package.json` carries no `engines` field.
- E4 Setup step. The `CONTRIBUTING.md` clone block runs `git clone .../rule-mcp.git` and then `cd rule`. The clone directory is `rule-mcp`.
- E5 Triage promises. `CONTRIBUTING.md` promises a `needs-triage` label, a 60-day stale ping and a 14-day close. The label API lists no `needs-triage` label. No workflow mentions `stale`. `.github/ISSUE_TEMPLATE/bug.yml` sets `labels: [bug, needs-triage]`.
- E6 Branch control. `GOVERNANCE.md` line 48 names branch protection as "owner action 16.5" in `docs/plans/plan-of-plans.md`. That file holds no "16.5" string. Its section 2 lists "repository policy / OSS Stage 0" as closed. Scorecard returns 0 for Branch-Protection. The protection endpoint returns 401 without an owner token.
- E7 Review path. Scorecard Code-Review is 0, with "Found 0/30 approved changesets". `.github/CODEOWNERS` is `* @pixu1980`. The contributors API lists two logins. `git shortlog` lists three lines, two of them bots.
- E8 Release cadence and signing. The project publishes 5 releases in 130 days of history. Four of them landed inside 53 minutes on 2026-11-10. All tags are annotated and unsigned. `commit.gpgsign` and `tag.gpgsign` are unset. Scorecard returns 0 for Signed-Releases and -1 for Packaging.
- E9 Supply chain. `.github/dependabot.yml` runs weekly for npm and github-actions. It sets a 7-day cooldown and a minor/patch group. Five dependabot pull requests (#12 to #16) stay open. Token-Permissions, Vulnerabilities, Binary-Artifacts, Security-Policy and Dependency-Update-Tool score 10. Pinned-Dependencies scores 9.
- E10 Metadata drift. `SECURITY-INSIGHTS.yml` names the project `rule` and the repository `rule`. It cited `docs/plans/oss.md` before this run created that file. It carries `last-updated: 2026-09-11`, 73 days before this run. `server.json` names the server `io.github.pixu1980/rule-mcp`.
- E11 Discovery surface. The repository sets no topics. Discussions, wiki and projects are off. It has 7 stars, 1 fork and 0 watchers. `README.md` holds 314 words, no image and no badge. The Pages site returns 200.
- E12 First outside contribution. PR #11 by `ftUns` is the only pull request from outside the maintainer. It closed 34 seconds after it opened, unmerged. It carries 0 reviews, 8 changed files and 1 comment. The comment reads "Opened by mistake, sorry for the noise: we're keeping this work in our fork for now."
- E13 Reported test failure. The PR #11 body reports one failure in `transport/__tests__/_https.test.mjs`, with 3209 of 3210 tests passing. At HEAD the same file reports 11 passed and 0 failed.
- E14 Community files. The community profile reports 100 percent. README, code of conduct, contributing guide, pull request template and two issue forms are present. The code of conduct is Contributor Covenant v3.0. The profile reports `issue_template null` while both forms sit on disk.
- E15 Funding. `.github/FUNDING.yml` names `github: pixu1980`. `GOVERNANCE.md` states the project is "unfunded today" and promises an annual aggregate summary in that section. The section carries no year summary.
- E16 Repository hygiene. The tree tracks 2715 files and `.git` takes 45M. The working tree is clean. `.claude` takes 549M, `coverage` 610M and `node_modules` 255M on disk, all gitignored. Two git worktrees live under `.claude/worktrees`.
- E17 README shape. README carries the name, a one-line purpose, the facts block and four entry links. The facts block states 82 skills, 105 tools, 172 resources, 13 prompts and 16 commands. `docs/21-surface-map.md` and `ls -1d skills/rule-*` agree with those counts. README carries no usage example block.
- E18 Commit scale. The history holds 1515 commits across 130 days. `docs/adr/` holds 250 records. `docs/plans/plan-of-plans.md` holds 4 open checkboxes, none of them in a governance workstream.

## Unknowns

- Branch protection, required checks and review rules need an owner token. The endpoint returns 401.
- `security_and_analysis` is null for an anonymous request. Secret scanning and push protection states are unknown.
- GitHub Sponsors balance and payout history are not public. Only the funding file is visible.
- The MCP registry listing for `io.github.pixu1980/rule-mcp` was not confirmed in a registry query.
- The full `pnpm test:all` suite of 3210 tests was not run in this audit. One suite ran, as the commands section records.
