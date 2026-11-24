/**
 * @module tools/next/step-locate
 *
 * Finding the plan a request names, and the workstream inside it.
 *
 * Kept apart from the resolution cases in `_step.js` so each file answers one
 * question: where is the plan, and what does it still want done.
 */

import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { markdownFiles } from "../handoff/_closeout-docs.js";
import { planGraph } from "../handon/_plan-graph-order.js";
import { firstOpenStep, openCount } from "./_step-scan.js";

/** Every plan file under `docs/plans`, top level and per skill area. */
export function planFiles(projectDir) {
  const root = join(projectDir, "docs/plans");

  // The handoff closeout already walks `docs/` and returns relative paths; a
  // second walker here would be another copy of the same loop.
  return markdownFiles(root)
    .filter((relative) => relative !== "plan-of-plans.md")
    .map((relative) => join(root, relative));
}

/** The name a plan answers to: its file stem without the leading underscore. */
export const slugOf = (file) => file.split("/").pop().replace(/^_/, "").replace(/\.md$/, "");

/** The modification time of a plan file, for the phase tie-break. */
export const mtimeOf = (file) => {
  try {
    return statSync(file).mtimeMs;
  } catch {
    return 0;
  }
};

/**
 * The workstream a request names: a number ("fase 4", "Phase 3") or a code
 * ("WS2", "M6", "OSS-001", "RTM8.2"). Both appear verbatim in the corpus.
 *
 * @param {string} want
 * @returns {string} the key, or "" when the request names no workstream
 */
export function phaseOf(want) {
  const number = /^(?:fase|phase|passo|step)[\s-]*(\d+)$/iu.exec(want)?.[1];

  if (number) {
    return number;
  }

  return /^([a-z]{2,6}[-\s]?\d+(?:\.\d+)?)$/iu.exec(want)?.[1]?.replaceAll(/\s+/gu, "").toUpperCase() ?? "";
}

/**
 * The line a workstream heading starts at, or -1.
 *
 * A number matches the heading that spells it (`fase 4`, `Phase 4`, `WS 4`); a
 * code matches the heading that opens with it (`## WS2 ...`, `## M6 ...`).
 */
export function workstreamIndex(text, key) {
  const code = key.replaceAll(/[.*+?^${}()|[\]\\]/gu, String.raw`\$&`);
  const pattern = /^\d+$/u.test(key)
    ? new RegExp(String.raw`^#{2,}\s+(?:WS\s*${key}\b|(?:fase|phase|passo|step)\s*${key}\b)`, "iu")
    : new RegExp(String.raw`^#{2,}\s+${code}\b`, "u");

  return text.split("\n").findIndex((line) => pattern.test(line));
}

/** The plan's step: its first open one, or the first open one of the named phase. */
export function fromPlan(file, phase = "") {
  const text = readFileSync(file, "utf8");
  const plan = { plan: slugOf(file), path: file, open: openCount(text) };

  if (phase === "") {
    const found = firstOpenStep(text);

    return found ? { status: "found", ...plan, ...found } : { status: "closed", message: `${plan.plan} has no open step` };
  }

  const at = workstreamIndex(text, phase);

  if (at === -1) {
    return { status: "missing", message: `${plan.plan} carries no phase ${phase}` };
  }

  const found = firstOpenStep(text, at);

  return found ? { status: "found", ...plan, ...found } : { status: "closed", message: `phase ${phase} of ${plan.plan} has no open step` };
}

/** Order the plans the way the cascade does, so a bare "vai" resumes what a session would. */
export function ordered(projectDir, files) {
  let ready = [];

  try {
    ready = planGraph(projectDir).ready.map((plan) => plan.path);
  } catch {
    ready = [];
  }

  const rank = (path) => {
    const index = ready.indexOf(path);

    return index === -1 ? Number.MAX_SAFE_INTEGER : index;
  };

  return [...files].sort((left, right) => rank(left) - rank(right) || left.localeCompare(right));
}
