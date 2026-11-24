/**
 * The step, as the caller reads it.
 *
 * One line says which plan and workstream answered, so a bare "vai" is never
 * silent about what it picked. The step itself is echoed verbatim: it is the
 * instruction, not a summary of one.
 */

import { nextStep } from "./_step.js";

/** Render one resolution as Markdown. */
export function renderNext(result) {
  if (result.status !== "found") {
    const list = result.candidates?.length ? `\n\nCandidates: ${result.candidates.map((name) => `\`${name}\``).join(", ")}` : "";

    return `No step to run: ${result.message}${list}`;
  }

  const where = result.workstream ? `${result.plan} - ${result.workstream}` : result.plan;

  return [
    `# Next step: ${where}`,
    "",
    result.id ? `Step \`${result.id}\`, ${result.open} open in this plan.` : `${result.open} open in this plan.`,
    "",
    // Fenced: the step is an instruction to follow verbatim, and the server
    // compresses prose around code. Fencing keeps its words intact.
    "```text",
    result.step,
    "```",
    "",
    "---",
    "",
    "Execute that step. Tick its checkbox in the plan once it lands, and report what changed. Nothing else in the plan starts before this step is done.",
  ].join("\n");
}

/** Resolve and render in one call. */
export function next(projectDir, options = {}) {
  return renderNext(nextStep(projectDir, options));
}

/** Render a tick, or the reason it did not happen. */
export function renderComplete(result) {
  if (result.status !== "ticked") {
    return `Not ticked: ${result.message}${result.plan ? `\n\nPlan: \`${result.plan}\`${result.id ? `, step ${result.id}` : ""}` : ""}`;
  }

  return [
    `# Ticked ${result.id} in ${result.plan}`,
    "",
    `${result.was} open before, ${result.open} after.`,
    "",
    "---",
    "",
    result.next ? `Next: ${result.next}` : "Nothing open is left in this plan.",
  ].join("\n");
}
