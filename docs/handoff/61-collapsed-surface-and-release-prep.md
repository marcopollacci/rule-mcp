# 61 - Collapsed surface, completions, and the release prep

- **Date**: 2026-11-23
- **Branch**: `main` (only branch; `origin/main` was 37 commits behind before the close)
- **Commit range covered**: `302f66b0..586cfc9a` before the feature close; after it, the feature is the single commit `e2302281` plus `586cfc9a`
- **Version**: `0.1.3` in the manifests, `0.2.0` derived by `pnpm release`

## What shipped

- **One help text, four surfaces.** `commandHelp` resolves from `promptHelp`, the CLI guide renders from the live commander program, `rule-mcp help <command>` prints either a slash block or a CLI usage, and the installer writes two host artifacts that embed the same blocks. The Pi extension answers `/<command> help|--help|-h` in the input hook and shows a TUI-only entry, so help costs no model turn. The opencode plugin registers `/rule-help [command]`.
- **A guard in every rendered command body.** Each host file opens with the condition on the text typed after the command, then the usage block, then the task. The guard names the text instead of interpolating the placeholder, because the host substitutes every occurrence.
- **16 commands instead of 44.** `/rule-area <area> <request>` and `/rule-persona <persona> <request>` replace 11 area hubs and 19 role commands. The id is the first word of the request; the bodies carry the vocabulary. MCP prompts stay at 13.
- **Shell completions as an install step.** Detection offers one row per destination (`zsh` with oh-my-zsh writes `$ZSH_CUSTOM/completions`, plain zsh writes its own fpath directory, bash, fish). `--completions detect` for scripts, `--no-completions` to write none. Verified on this machine with oh-my-zsh: `whence -w _rule-mcp` answers `function` after `compinit`.
- **Levels are no longer asked.** The wizard installs each host up to its ceiling; `--level` remains the scripted cap. `docs/06-integration-levels.md` says so.
- **Purge counting survives a broken link.** `countFiles` uses `lstat`, so a dangling link in a purge tree no longer throws out of the uninstall scan.

## Decisions

`docs/adr/249-main.md` is the consolidated document for this feature's six decisions:

- 249: merge the argument hint into the description for hosts without that field.
- 250: answer slash command help without a model turn where the host allows it.
- 251: address an area and a persona through one command each.
- 252: close out the plan `_command-surface-collapse`.
- 253: close out the review `privacy`.
- 254: close out the audit `privacy`.

## Feature close

The squash ran over `origin/main..HEAD`. Two obstacles, both recorded here:

1. `rule_tool_git action=squash` rolled back with "the squash left an unexpected change". The verifier re-derived the feature range with the default base, so a close whose base is the remote counted zero commits. Fixed in `fix(history)`, and the fix is inside the squashed commit.
2. The post-commit hook adds a `chore(changelog): refresh` commit after any non-chore commit, which lands `CHANGELOG.md` outside the planned paths. The squash was replayed with `RULE_MCP_HOOK_NO_SIDE_EFFECTS=1`, using the same steps the tool runs: consolidate the six ADRs into `docs/adr/249-main.md`, delete the originals, rebuild `docs/adr/ADR.md` and `docs/handoff/HANDOFF.md`, `git reset --soft 302f66b0`, one commit.

Consequence: the CHANGELOG now carries one entry for the whole feature instead of one per change. The per-change story stays in git history before `e2302281` and in this document.

## Verification (commands actually run)

| Check | Outcome |
| --- | --- |
| `prettier --check '**/*.{js,mjs,json,md}'` | clean, including the 93 newly tracked files under `docs/` |
| `eslint bin/ packages/ scripts/__tests__/ --max-warnings 50` | 0 errors, 42 warnings |
| `pnpm census:check` | current |
| `node scripts/build/version/index.mjs --check` | `0.1.3 in sync (7 places)` |
| `pnpm test:e2e:docs-site` | 23 passed, axe WCAG 2.2 AA included |
| Suites touched this session | `cli`, `cli/setup`, `cli/commands`, `cli/install`, `cli/completions`, `cli/installers`, `core/agents/commands`, `core/history`, `core/review/personas`, `core/review/docs`, `prompts`, `tools/handon`, `scripts/__tests__/docs`, `scripts/__tests__/plans` all green |
| `rule_tool_check` | All 7 project checks pass |
| Docs site | 24 pages, `http://localhost:3000/` answers 200 |
| `pnpm release --dry-run` | `0.1.3 -> 0.2.0 (minor)`, tag `v0.2.0`, tag free, branch `main` |

Not run, because they only execute on a tag: `pnpm audit:gate`, `pnpm build` (tarball and SBOM), the publish job.

## Open work

- **The release itself.** On `main` with a clean tree: `pnpm release --dry-run`, then `pnpm release`. It writes `0.2.0` in the manifests, the changelog heading, the scoop and winget fields, commits `chore(release): v0.2.0`, tags, and pushes `main` with the tag.
- **Pushing.** Nothing was pushed. `origin/main` is 2 commits behind (`e2302281`, `586cfc9a`), and the 37 original commits exist only in the reflog of this clone.
- **`SECURITY.md`** moves to `0.2.x` by itself, because `scripts/build/version` now stamps the supported row.
- **Deferred by the user, not to be started without a request:** archiving the session handoffs older than `v0.1.3`, and pruning the 84 skill plans (1 265 open steps).

## Notes for the next session

- `unicorn/prefer-options-parameter` is off in `eslint.config.mjs`, with the reason beside it. The dependency bump to `eslint-plugin-unicorn` 80 is committed, so the rule stays off until the 34 signatures are converted on purpose.
- Do not run `rule_tool_git action=squash` on `main` again expecting the verifier to agree: the hook still adds a commit, so pass `RULE_MCP_HOOK_NO_SIDE_EFFECTS=1` or close on a real feature branch.
- `docs/plans`, `docs/audits` and `docs/reviews` are now tracked. They stay out of the published site (`packages/docs/_collect.mjs`).

### Resume Prompt

next session opens with this block.

```prompt
Resume work on rule-mcp-workspace at docs/handoff/61-collapsed-surface-and-release-prep.md.
First step: run `rule_tool_handon` with that file, then confirm the tree is clean and `main` is ahead of `origin/main` by 2.
Then cut the 0.2.0 release: `pnpm release --dry-run` must print `0.1.3 -> 0.2.0` and tag `v0.2.0`, then `pnpm release`. Never push before the dry run agrees.
The feature close already happened: the range `302f66b0..HEAD` is one commit, and docs/adr/249-main.md holds the six decisions.
Verification of record: prettier clean, eslint 0 errors, census current, version in sync, docs-site e2e 23/23, rule_tool_check 7/7. Do not re-run a claimed check; re-verify only what changed.
Every commit is `type(scope): subject`; the commit-msg hook rejects a scope-less message.
Writing: STE100~80. Short sentences, active voice, one idea per sentence, same word for the same thing.
```
