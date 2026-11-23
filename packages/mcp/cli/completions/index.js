import { generateBash } from "./_bash.js";
import { generateFish } from "./_fish.js";
import { generateZsh } from "./_zsh.js";

/**
 * @module cli/completions
 *
 * Shell auto-completion for rule-mcp: completion scripts for zsh, bash and
 * fish.
 *
 * Usage:
 *   rule-mcp completions          -> prints zsh completion (auto-detected)
 *   rule-mcp completions --shell zsh
 *   rule-mcp completions --shell bash
 *   rule-mcp completions --shell fish
 *
 * Installing is a step of its own: `rule-mcp install` asks where the script
 * goes, with one row per detected shell (`cli/completions/targets.js`). Redirecting
 * the output needs a directory that already exists and is already on the shell's
 * `fpath`, and `~/.zsh/completions` is not on it by default. A scripted install
 * answers the same question:
 *
 *   rule-mcp install --completions detect        # wherever the login shell reads them
 *   rule-mcp install --completions zsh-oh-my-zsh # $ZSH_CUSTOM/completions
 */

export function generateCompletions(shell = "zsh") {
  switch (shell) {
    case "bash": {
      return generateBash();
    }
    case "fish": {
      return generateFish();
    }
    case "zsh":
    default: {
      return generateZsh();
    }
  }
}
