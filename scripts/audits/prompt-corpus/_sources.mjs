/**
 * @module scripts/audits/prompt-corpus/sources
 *
 * Read the user prompts out of every local agent session. Read-only, and every
 * host gets the same shape so the aggregate cannot privilege one of them.
 *
 * - pi: `~/.pi/agent/sessions/**.jsonl`, `message` entries whose `message.role`
 *   is `user`;
 * - claude: `~/.claude/projects/**.jsonl`, `user` entries, text blocks only;
 * - opencode: `~/.local/share/opencode/opencode.db`, `part` rows of type text
 *   whose message is a user message.
 */

import { readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

import { lines } from "./_jsonl.mjs";
import { opencodePrompts } from "./_opencode-source.mjs";

const HOME = homedir();

/** Every file under a root, filtered by extension. */
export function walk(root, extension) {
  const out = [];
  const visit = (dir) => {
    let entries;

    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const full = join(dir, entry.name);

      if (entry.isDirectory()) {
        visit(full);
      } else if (entry.name.endsWith(extension)) {
        out.push(full);
      }
    }
  };

  visit(root);

  return out;
}

/** The text of one message content, whichever shape the host used. */
export function textOf(content) {
  if (typeof content === "string") {
    return content;
  }

  if (!Array.isArray(content)) {
    return "";
  }

  return content
    .filter((block) => block && block.type === "text" && typeof block.text === "string")
    .map((block) => block.text)
    .join("\n");
}

/**
 * A prompt worth counting.
 *
 * Too short to carry an ask, a slash command rather than words, or harness
 * noise: an attachment, a system reminder, a pasted tool result.
 *
 * @param {unknown} text
 * @returns {string|null}
 */
export function countable(text) {
  const trimmed = String(text ?? "").trim();

  if (trimmed.length < 12 || trimmed.startsWith("/") || trimmed.startsWith("<") || /^\s*<(system-reminder|command-|local-command|attachment)/i.test(trimmed)) {
    return null;
  }

  return trimmed;
}

/** pi sessions. */
export function piPrompts() {
  const prompts = [];

  for (const file of walk(join(HOME, ".pi/agent/sessions"), ".jsonl")) {
    for (const entry of lines(file)) {
      // pi nests the message: `{ type: "message", message: { role, content } }`.
      if (entry.type !== "message" || (entry.role ?? entry.message?.role) !== "user") {
        continue;
      }

      const prompt = countable(textOf(entry.message?.content ?? entry.content));

      if (prompt) {
        prompts.push({ host: "pi", prompt });
      }
    }
  }

  return prompts;
}

/** claude code sessions. */
export function claudePrompts() {
  const prompts = [];

  for (const file of walk(join(HOME, ".claude/projects"), ".jsonl")) {
    for (const entry of lines(file)) {
      if (entry.type !== "user" || entry.isSidechain) {
        continue;
      }

      const prompt = countable(textOf(entry.message?.content));

      if (prompt) {
        prompts.push({ host: "claude", prompt });
      }
    }
  }

  return prompts;
}

export { lines } from "./_jsonl.mjs";
export { opencodePrompts } from "./_opencode-source.mjs";

/** Every prompt on this machine, from every host that keeps a store. */
export function allPrompts() {
  return [...piPrompts(), ...claudePrompts(), ...opencodePrompts()];
}
