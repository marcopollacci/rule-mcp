/** @module scripts/audits/prompt-corpus/jsonl - one session store, read line by line */

import { readFileSync } from "node:fs";

/** One JSONL session store, read line by line. */
function lines(file) {
  let text;

  try {
    text = readFileSync(file, "utf8");
  } catch {
    return [];
  }

  const parsed = [];

  for (const line of text.split("\n")) {
    if (!line.trim()) {
      continue;
    }

    try {
      parsed.push(JSON.parse(line));
    } catch {
      // A truncated last line is a session the harness was still writing.
    }
  }

  return parsed;
}

export { lines };
