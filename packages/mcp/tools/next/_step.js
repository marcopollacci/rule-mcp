/**
 * @module tools/next/step
 *
 * Resolve one open plan step from whatever the user typed.
 *
 * The corpus that motivated this module: 524 prompts out of 3 932 start with
 * "vai" or "procedi" and 417 name a plan id (`fase 4`, `Phase 3`, `M6`,
 * `WS2-T3`). The handoff proposes the next step and stops; this answers the
 * question the prompt actually asks: which step, and what does it say.
 *
 * Read-only. The caller executes the step; ticking its checkbox is the next
 * decision, not this module's.
 */

import { readFileSync } from "node:fs";

import { firstOpenStep, matchStep, openCount } from "./_step-scan.js";
import { fromPlan, mtimeOf, ordered, phaseOf, planFiles, slugOf, workstreamIndex } from "./_step-locate.js";

/**
 * What a plain continuation leaves behind.
 *
 * "vai", "procedi pure" and "andiamo avanti" name no plan: they ask for the
 * next one. "vai con la fase 4" keeps the phase, because the phase is the ask.
 *
 * @param {string} [want]
 * @returns {string} the request with the continuation words stripped, lower-cased
 */
export function continuationOf(want = "") {
  let rest = String(want ?? "")
    .trim()
    .toLowerCase();

  rest = rest.replace(/^(?:vai|procedi|andiamo|continua|prosegui|segui|go|proceed|continue|next)\b[\s,:;-]*/u, "");
  rest = rest.replace(/^(?:pure|avanti|con|col|con\s+il|col\s+prossimo|al\s+prossimo|with|to|the\s+next)\b[\s,:;-]*/u, "");
  rest = rest.replace(/^(?:la|il|lo|le|gli|i|the)\s+/u, "");

  return rest.trim();
}

/** A step id as the plan writes it, or "" when the request is not one. */
const stepIdOf = (want) => want.match(/^([a-z]{1,8}\d*-t\d+[a-z]?)$/iu)?.[1] ?? "";

/** The step a step id names, across every plan. */
function byStepId(files, stepId) {
  for (const file of files) {
    const text = readFileSync(file, "utf8");
    const found = firstOpenStep(text) === null ? null : matchStep(text, stepId);

    if (found) {
      return { status: "found", plan: slugOf(file), path: file, open: openCount(text), ...found };
    }
  }

  return { status: "closed", message: `no plan carries an open step ${stepId.toUpperCase()}` };
}

/** The plan a phase belongs to, when only the phase was named. */
function byPhase(files, phase) {
  // Every skill plan carries phases, so "fase 4" alone is not a key. The plan
  // worked most recently wins, and the answer names it.
  const carriers = files.filter((file) => workstreamIndex(readFileSync(file, "utf8"), phase) !== -1);

  if (carriers.length === 0) {
    return null;
  }

  const [newest] = carriers.sort((left, right) => mtimeOf(right) - mtimeOf(left));

  return { ...fromPlan(newest, phase), others: carriers.length - 1 };
}

/**
 * The step the request names, or the one a resumed session should take.
 *
 * The cases are explicit because they fail differently: a named step that is
 * closed is not the same answer as a step id nobody knows.
 *
 * @param {string} projectDir
 * @param {{ want?: string }} [options] - what the user typed, verbatim
 * @returns {{ status: "found"|"ambiguous"|"closed"|"missing", plan?: string, path?: string, workstream?: string, step?: string, id?: string, open?: number, others?: number, candidates?: string[], message?: string }}
 */
export function nextStep(projectDir, { want = "" } = {}) {
  const files = ordered(projectDir, planFiles(projectDir));
  const asked = continuationOf(want);

  // Bare "vai": the cascade decides, and the answer names the plan it picked.
  if (asked === "") {
    for (const file of files) {
      const found = fromPlan(file);

      if (found.status === "found") {
        return found;
      }
    }

    return { status: "closed", message: "every plan is closed" };
  }

  const stepId = stepIdOf(asked);

  if (stepId !== "") {
    return byStepId(files, stepId);
  }

  const named = files.filter((file) => slugOf(file).includes(asked) || file.toLowerCase().includes(asked));

  if (named.length > 1) {
    return { status: "ambiguous", candidates: named.map((file) => slugOf(file)), message: `${named.length} plans match "${want}"` };
  }

  if (named.length === 1) {
    return fromPlan(named[0], phaseOf(asked));
  }

  const phase = phaseOf(asked);
  const located = phase === "" ? null : byPhase(files, phase);

  return located ?? { status: "missing", message: `no plan matches "${want}"` };
}
