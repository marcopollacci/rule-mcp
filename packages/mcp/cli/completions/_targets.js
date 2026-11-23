/**
 * @module cli/completions/targets
 *
 * Where a completion script can live, per shell.
 *
 * The documented one-liner (`rule-mcp completions > ~/.zsh/completions/_rule-mcp`)
 * failed for every oh-my-zsh user, because that directory does not exist unless
 * they made it: zsh only completes from a directory on `fpath`, and oh-my-zsh
 * contributes its own. So the destinations are detected instead of assumed, and
 * each one declares whether zsh will actually read it.
 *
 * Detection is pure: it reads the environment and asks the filesystem whether a
 * directory exists. Nothing is created here.
 */

import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

/** The file name each shell expects for a command named `rule-mcp`. */
const FILE_NAME = { zsh: "_rule-mcp", bash: "rule-mcp", fish: "rule-mcp.fish" };

/** The shell a login shell path names, or "" for an unknown one. */
function shellOf(loginShell) {
  const name =
    String(loginShell ?? "")
      .split("/")
      .pop() ?? "";

  return name === "zsh" || name === "bash" || name === "fish" ? name : "";
}

/** The oh-my-zsh directories that contribute `fpath` entries. */
function ohMyZshDirectories(home, env) {
  const root = env.ZSH ?? join(home, ".oh-my-zsh");
  const custom = env.ZSH_CUSTOM ?? join(root, "custom");

  return { root, custom };
}

/**
 * Every destination this machine offers, detected.
 *
 * A target is offered when its directory exists or when the shell it belongs to
 * is the login shell: offering a fish directory to a zsh-only machine is a tick
 * whose only effect is a stray file.
 *
 * @param {{ env?: Record<string, string|undefined>, home?: string }} [options]
 * @returns {Array<{ id: string, shell: string, label: string, dir: string, file: string, path: string, detected: boolean, reason?: string }>}
 */
export function completionTargets({ env = process.env, home = env.HOME || homedir() } = {}) {
  const loginShell = shellOf(env.SHELL) || undefined;
  const targets = [];
  const add = (target) => {
    if (targets.some((entry) => entry.id === target.id)) {
      return;
    }

    targets.push({ ...target, file: FILE_NAME[target.shell], path: join(target.dir, FILE_NAME[target.shell]) });
  };

  const ohMyZsh = ohMyZshDirectories(home, env);
  const hasOhMyZsh = existsSync(ohMyZsh.root);

  if (hasOhMyZsh) {
    // `oh-my-zsh.sh` puts `$ZSH/completions` and `$ZSH_CUSTOM/completions` on
    // fpath before compinit runs, so a file there is read without touching a
    // dotfile. The custom tree is the one to prefer: it is the user's, and it
    // survives an oh-my-zsh update.
    add({
      id: "zsh-oh-my-zsh",
      shell: "zsh",
      label: "zsh (oh-my-zsh custom)",
      dir: join(ohMyZsh.custom, "completions"),
      detected: loginShell === "zsh",
      reason: "oh-my-zsh adds $ZSH_CUSTOM/completions to fpath before compinit runs",
    });
  }

  add({
    id: "zsh-user",
    shell: "zsh",
    label: "zsh (own fpath directory)",
    dir: join(home, ".zsh", "completions"),
    detected: loginShell === "zsh" && !hasOhMyZsh,
    reason: "zsh reads it only when `fpath=(~/.zsh/completions $fpath)` runs first, before compinit",
  });

  add({
    id: "bash-user",
    shell: "bash",
    label: "bash (bash-completion 2.x)",
    dir: join(home, ".local", "share", "bash-completion", "completions"),
    detected: loginShell === "bash",
    reason: "bash-completion 2.x loads these on demand, with no dotfile edit",
  });

  add({
    id: "fish-user",
    shell: "fish",
    label: "fish",
    dir: join(home, ".config", "fish", "completions"),
    detected: loginShell === "fish",
    reason: "fish autoloads every *.fish file in this directory",
  });

  return targets.map((target) => ({ ...target, exists: existsSync(target.dir) || existsSync(target.path) }));
}

/**
 * The targets this machine offers, split by whether they are detected defaults.
 *
 * @param {{ env?: Record<string, string|undefined>, home?: string }} [options]
 * @returns {{ all: ReturnType<typeof completionTargets>, detected: string[] }}
 */
export function detectedCompletionTargets(options = {}) {
  const all = completionTargets(options);

  return { all, detected: all.filter((target) => target.detected).map((target) => target.id) };
}
