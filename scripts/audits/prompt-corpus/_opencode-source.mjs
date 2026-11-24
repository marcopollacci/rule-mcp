/** @module scripts/audits/prompt-corpus/opencode-source - the opencode session store */

import { execFileSync } from "node:child_process";
import { homedir } from "node:os";
import { join } from "node:path";

import { countable } from "./_sources.mjs";

const HOME = homedir();

/** opencode sessions, read through the sqlite CLI. */
export function opencodePrompts() {
  const db = join(HOME, ".local/share/opencode/opencode.db");
  let rows;

  try {
    rows = JSON.parse(
      execFileSync(
        "sqlite3",
        [
          "-json",
          db,
          "select json_extract(p.data,'$.text') as t from part p join message m on m.id = p.message_id where json_extract(p.data,'$.type') = 'text' and json_extract(m.data,'$.role') = 'user' limit 40000",
        ],
        { encoding: "utf8", maxBuffer: 512 * 1024 * 1024 },
      ) || "[]",
    );
  } catch {
    return [];
  }

  const prompts = [];

  for (const row of rows) {
    const prompt = countable(row.t);

    if (prompt) {
      prompts.push({ host: "opencode", prompt });
    }
  }

  return prompts;
}
