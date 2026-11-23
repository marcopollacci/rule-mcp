/** @module cli/setup/opentui/completions-items - the rows the Shell completions step shows */

import { completionTargets } from "../../completions/_targets.js";

/**
 * One row per detected destination, so the screen names the file it would write.
 *
 * @param {{ env?: Record<string, string|undefined>, home?: string }} [options]
 * @returns {Array<{ id: string, label: string, note?: string, detail: string[] }>}
 */
export function completionItems(options = {}) {
  return completionTargets(options).map((target) => ({
    id: target.id,
    label: target.label,
    note: target.detected ? "detected" : undefined,
    detail: [target.path, "", target.reason, target.exists ? "The directory already exists." : "The directory is created by this step."],
  }));
}
