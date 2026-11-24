#!/usr/bin/env node

/**
 * @module scripts/audits/prompt-corpus
 *
 * Read the user prompts out of every local agent session, and report what they
 * ask for. The point is evidence: a proposed tool has to answer a request that
 * appears often, not one that appears in the last session.
 *
 *   node --import ./scripts/alias-hook.mjs scripts/audits/prompt-corpus/index.mjs
 *   node ... --json     machine-readable aggregate
 *
 * The readers live in `_sources.mjs` and the patterns in `_signals.mjs`, so both
 * can be reused without this report.
 */

import { FAMILIES, SIGNALS, TEMPLATE, contentWords, isItalian } from "./_signals.mjs";
import { allPrompts } from "./_sources.mjs";

/** A count and its share of the corpus. */
const rate = (count, total) => `${String(count).padStart(5)}  ${String(Math.round((count / total) * 100)).padStart(2)}%`;

/** The share of prompts that match each pattern. */
const score = (prompts, patterns) => patterns.map(([label, pattern]) => [label, prompts.filter((entry) => pattern.test(entry.prompt)).length]);

const main = () => {
  const prompts = allPrompts();
  const human = prompts.filter((entry) => !TEMPLATE.test(entry.prompt));
  const byHost = new Map();

  for (const entry of prompts) {
    byHost.set(entry.host, (byHost.get(entry.host) ?? 0) + 1);
  }

  const italian = prompts.filter((entry) => isItalian(entry.prompt)).length;
  const lengths = prompts.map((entry) => entry.prompt.length).sort((left, right) => left - right);
  const frequency = new Map();

  for (const entry of prompts) {
    for (const word of contentWords(entry.prompt)) {
      frequency.set(word, (frequency.get(word) ?? 0) + 1);
    }
  }

  const top = [...frequency].sort((left, right) => right[1] - left[1]).slice(0, 40);

  if (process.argv.includes("--json")) {
    process.stdout.write(
      JSON.stringify(
        {
          total: prompts.length,
          human: human.length,
          byHost: Object.fromEntries(byHost),
          italian,
          families: score(prompts, FAMILIES),
          signals: score(human, SIGNALS),
          words: top,
        },
        null,
        2,
      ),
    );

    return;
  }

  process.stdout.write(`prompts: ${prompts.length} (${human.length} human, ${prompts.length - human.length} template)\n`);
  process.stdout.write(`by host: ${[...byHost].map(([host, count]) => `${host} ${count}`).join(", ")}\n`);
  process.stdout.write(`italian: ${italian} (${Math.round((italian / prompts.length) * 100)}%)\n`);
  process.stdout.write(`length: median ${lengths[Math.floor(lengths.length / 2)]} chars\n\n`);

  process.stdout.write("signals (human prompts)\n");

  for (const [label, count] of score(human, SIGNALS).sort((left, right) => right[1] - left[1])) {
    process.stdout.write(`${rate(count, human.length)}  ${label}\n`);
  }

  process.stdout.write("\nfamilies (all prompts)\n");

  for (const [label, count] of score(prompts, FAMILIES).sort((left, right) => right[1] - left[1])) {
    process.stdout.write(`${rate(count, prompts.length)}  ${label}\n`);
  }

  process.stdout.write(
    `\ntop words: ${top
      .slice(0, 30)
      .map(([word, count]) => `${word}(${count})`)
      .join(" ")}\n`,
  );
};

main();
