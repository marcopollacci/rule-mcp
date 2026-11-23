/**
 * @module cli/setup/task-completions
 *
 * The Shell completions step: write the completion script where the answer says.
 *
 * It is its own step because it is the only part of an install that writes into
 * a shell's own tree instead of an agent's, and because the destination is a
 * choice: the documented `~/.zsh/completions` path does not exist for an
 * oh-my-zsh user, and a file zsh never reads is an install that lied.
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { generateCompletions } from "../completions/index.js";
import { completionTargets } from "../completions/_targets.js";

/**
 * @param {{ targets?: string[], env?: Record<string, string|undefined>, home?: string }} [options]
 * @returns {{ id: string, title: string, detail: string, run: Function }}
 */
export const completionsTask = ({ targets = [], env = process.env, home } = {}) => {
  const all = completionTargets({ env, home });
  const chosen = all.filter((target) => targets.includes(target.id));

  return {
    id: "completions",
    title: "Shell completions",
    detail: chosen.length > 0 ? chosen.map((target) => target.path).join(", ") : "no shell answered",
    run: ({ dryRun } = {}) => {
      if (chosen.length === 0) {
        return { status: "skip", summary: "no completion target selected" };
      }

      const lines = [];

      for (const target of chosen) {
        if (dryRun) {
          lines.push(`${target.path} (would write)`);
          continue;
        }

        // A shell's own directory is not created by this install beyond what the
        // answer named: `~/.config/fish/completions` missing is a fish that was
        // never started, and creating it is harmless; a custom oh-my-zsh tree is
        // the user's, so only the leaf directory is made.
        mkdirSync(dirname(target.path), { recursive: true });
        writeFileSync(target.path, generateCompletions(target.shell), "utf8");
        lines.push(target.path);
      }

      const written = chosen.filter((target) => existsSync(target.path)).length;
      const summary = dryRun ? `${chosen.length} target(s) would be written` : `${written}/${chosen.length} file(s) written`;

      return { status: "ok", summary, lines };
    },
  };
};
