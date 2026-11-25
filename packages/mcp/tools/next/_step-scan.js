/**
 * @module tools/next/step-scan
 *
 * Reading a plan's checkbox steps. One step is one line, plus the continuation
 * lines it wraps onto: a step cut at the wrap hands the next session half an
 * instruction, which is worse than handing it nothing.
 */

/** How many continuation lines a wrapped step may carry before it is cut. */
const MAX_CONTINUATION = 6;

/** True for a line that opens a new list item or heading, so the step ended. */
const startsBlock = (line) => /^\s*(?:[-*+]\s|\d{1,3}\.\s|#)/.test(line);

/** The nearest heading above line `index`, or "" when the plan opens with steps. */
function headingBefore(lines, index) {
  for (let at = index - 1; at >= 0; at -= 1) {
    const heading = lines[at].match(/^#{2,}\s+(.+?)\s*$/);

    if (heading) {
      return heading[1];
    }
  }

  return "";
}

/** The first unchecked step, at or after line `from`, with its workstream. */
export function firstOpenStep(text, from = 0) {
  const lines = text.split("\n");
  const index = lines.findIndex((line, at) => at >= from && /^\s*-\s*\[ \]\s+\S/.test(line));

  if (index === -1) {
    return null;
  }

  const step = [lines[index].replace(/^\s*-\s*\[ \]\s+/, "").trim()];

  // A step wraps at the column, so the continuation lines carry the rest of the
  // sentence. Cutting at the wrap hands the next session half a step.
  for (let at = index + 1; at < lines.length && step.length <= MAX_CONTINUATION; at += 1) {
    const line = lines[at];

    if (line.trim() === "" || startsBlock(line)) {
      break;
    }

    step.push(line.trim());
  }

  const id = /^\s*(?:\*\*|__|\*|_)?([A-Za-z]{1,8}\d*-T\d+[A-Za-z]?)\b/.exec(step.join(" "))?.[1] ?? "";

  return { workstream: headingBefore(lines, index), step: step.join(" "), id, line: index + 1 };
}

/** How many unchecked steps a plan still carries. */
export const openCount = (text) => (text.match(/^\s*-\s*\[ \]\s+\S/gm) ?? []).length;

/**
 * A named step, when it is still open.
 *
 * A ticked step answers nothing: the caller asked what to do next, and a
 * finished one is not it.
 *
 * @param {string} text
 * @param {string} stepId
 * @returns {{ workstream: string, step: string, id: string, line: number }|null}
 */
export function matchStep(text, stepId) {
  const lines = text.split("\n");
  const index = lines.findIndex((line) => new RegExp(String.raw`^\s*-\s*\[[ x]\]\s+(?:\*\*|__|\*|_)?${stepId}\b`, "i").test(line));

  if (index === -1 || /^\s*-\s*\[x\]/i.test(lines[index])) {
    return null;
  }

  return firstOpenStep(text, index);
}

/**
 * Tick one step in the plan text.
 *
 * The replacement is anchored to the step id and the unchecked marker, so a
 * step already ticked, or a line that merely mentions the id, is never touched.
 *
 * @param {string} text
 * @param {string} stepId
 * @returns {{ text: string, ticked: boolean }}
 */
export function tickStep(text, stepId) {
  const pattern = new RegExp(String.raw`^(\s*-\s*)\[ \](\s+(?:\*\*|__|\*|_)?${stepId}\b)`, "mu");

  if (!pattern.test(text)) {
    return { text, ticked: false };
  }

  return { text: text.replace(pattern, "$1[x]$2"), ticked: true };
}
