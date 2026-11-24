# Install and uninstall

This chapter tells what the installer writes and removes. The tables come from real runs in an empty home directory.

## What setup does

`rule-mcp setup` has nine steps, and two opt-in ones. Add `--dry-run` to preview them. A dry run writes nothing.

| Step              | Result                                                                |
| ----------------- | --------------------------------------------------------------------- |
| Runtime home      | Creates `~/.rule-mcp/` with `state/`, `data/`, `projects/`, `config/` |
| Launcher copy     | Copies the server to `~/.rule-mcp/launcher/<version>/` (about 80 MB)  |
| Global shim       | Writes the `rule-mcp` command in `$PNPM_HOME/bin`                     |
| Configure agent   | Adds the MCP entry to the agent configuration                         |
| Instruction files | Adds the rules block to the instruction file of the agent             |
| Slash commands    | Writes the 16 `/rule-*` command files                                 |
| Global CLI        | Runs `rule-mcp --version`, `tools list`, and `doctor`                 |
| Install manifest  | Writes `~/.rule-mcp/config/install.json`                              |
| Health check      | Runs `rule-mcp doctor`                                                |

Two steps run only when the run asks for them. The wizard asks on its own screens; a script sets them with a flag.

| Opt-in step       | Flag                  | Result                                                                                               |
| ----------------- | --------------------- | ---------------------------------------------------------------------------------------------------- |
| Shell completions | `--completions <ids>` | Writes the completion script where the login shell reads it, and nothing when the flag is absent     |
| Bundled skills    | `--skills`            | Copies the ~60 catalog skills into `~/.agents/skills`; `--no-skills` and no flag both leave them out |

The completions step offers one row per destination it detected: `zsh (oh-my-zsh custom)` writes `$ZSH_CUSTOM/completions/_rule-mcp`, a plain zsh writes `~/.zsh/completions/_rule-mcp`, bash uses `~/.local/share/bash-completion/completions/rule-mcp`, and fish uses `~/.config/fish/completions/rule-mcp.fish`. With oh-my-zsh, the step prefers the custom tree: `oh-my-zsh.sh` puts it on `fpath` before `compinit` runs, and the file survives an update of oh-my-zsh. `--completions detect` resolves the same rows for a script, and `--no-completions` writes none.

Codex has no slash-command file format, so its 16 commands are written as `SKILL.md` directories in `~/.agents/skills`. They belong to the Slash commands step, not to Bundled skills. Declining the catalog leaves those 16 files in place, and the count tells them apart.

For a run with no prompts, use `rule-mcp setup --no-wizard --no-interactive`. Add `--agent <name>` for one agent. Claude also gets the guard hooks and the guard daemon. Add `--no-service` to skip the platform service.

## Session resume

A resumed session starts with one block. It holds the verified handoff and the step the plan orders next.

| Host        | What receives the block                                                                                                                                                                                                                                                                              |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Claude Code | The `SessionStart` hook answers with `additionalContext`, and that text joins the first prompt                                                                                                                                                                                                       |
| Pi          | The `rule-mcp-resume.js` extension injects it on the first user turn of a resumed session, with `display: false`, so the model reads it and the transcript stays clean                                                                                                                               |
| opencode    | Nothing. A server plugin can only call `session.prompt` or `session.synthetic`, and both admit input and wake the model, so the block would cost a turn and the model would answer it. The TUI plugin can draw a dialog but cannot seed the model context. opencode resumes by typing `/rule-handon` |

The block comes from `rule-mcp resume`, which renders the same text on any host. It never throws: a slow or failing read keeps the session silent rather than blocking the first turn.

## Launcher

The launcher copy lets the command work when the clone moves. `pnpm deploy` makes the copy with its dependencies. The `rule-mcp` shim selects the target in this order:

1. The version in `~/.rule-mcp/launcher/current`, if that copy exists.
2. The clone that the install used, if it still exists.
3. If neither exists, the shim stops with exit code `127` and tells you to run `rule-mcp setup`.

`rule-mcp doctor` shows the target in use.

## Uninstall

Select the command by what you want to remove. "Yes" means that the command removes the item.

| Item                    | `uninstall`  | `setup --uninstall` | `setup --uninstall --purge` |
| ----------------------- | ------------ | ------------------- | --------------------------- |
| MCP entry               | Yes          | Yes                 | Yes                         |
| Rules block and hooks   | Yes          | Yes                 | Yes                         |
| `install.json`          | Yes          | Yes                 | Yes                         |
| `config/env.json`       | Yes          | No                  | Yes                         |
| `/rule-*` command files | `/rule` only | Yes                 | Yes                         |
| Launcher copy and shim  | No           | Yes                 | Yes                         |
| `~/.rule-mcp/` data     | No           | No                  | Yes                         |

`--keep-config` keeps the two switches files. `--no-interactive` runs with the defaults and asks nothing. The uninstall does not touch the files of your project.

The uninstall removes its own entries and does not delete agent files. For example, `~/.claude.json` stays, and it can be empty after the uninstall.

You can also use `./scripts/uninstall.sh`. The script calls `rule-mcp setup --uninstall`.

## Install into selected projects

This command writes only into the projects that you name:

```bash
rule-mcp setup --scope project --project ~/my-project --project-config shared
```

The installer records each project in `~/.rule-mcp/state/projects.json`. `rule-mcp project add [path]` adds a project. It uses the agents and the configuration kind of the last project. `rule-mcp project remove [path]` removes the configuration and the record.

| Kind     | Entry                                           | Use                    |
| -------- | ----------------------------------------------- | ---------------------- |
| `shared` | `{ "command": "rule-mcp", "args": ["serve"] }`  | A file that you commit |
| `local`  | The full launcher path and the machine settings | A private project file |

A host with no private project file refuses `local`. The error is "has no local project config".

A project with Claude also gets three items at the project root. The rules block goes in `CLAUDE.md`, the commands go in `.claude/commands/`, and the hooks go in `.claude/settings.json`. A `local` install uses `.claude/settings.local.json`.

Each project also gets the git side of ADR numbering. `.githooks/post-merge` and `post-rewrite` run `rule-mcp handoff land --quiet --commit`. The `rule-mcp-index` merge driver builds `ADR.md` and `HANDOFF.md` again. A directory with no git repository skips this part.

## Docker

The `Dockerfile` builds an image that serves HTTP and SSE on port `37999`. Compose publishes the port on the loopback address only:

```bash
docker compose up -d
```

```bash
curl http://localhost:37999/health
```

CI does not build this image. There is no published image.
