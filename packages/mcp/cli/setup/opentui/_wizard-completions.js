/** The Shell completions step: which shells get a completion file, and where. */

import { detectedCompletionTargets } from "../../completions/_targets.js";
import { completionItems } from "./_completions-items.js";
import { BACK, CANCEL } from "./_answers.js";

/**
 * Ask where the completion script goes.
 *
 * A checkbox, not a radio: zsh and fish side by side are a machine a person
 * actually has, and the answer is the list of files to write. Nothing selected
 * is a real answer and writes nothing.
 *
 * @param {{ screen: object, answers: object }} context
 * @returns {Promise<unknown>} an answer to take for navigation, or undefined to continue
 */
export async function askCompletions({ screen, answers }) {
  const { all, detected } = detectedCompletionTargets();

  if (all.length === 0) {
    answers.completions = [];

    return;
  }

  const chosen = await screen.ask({
    title: "Shell completions",
    help: ["Tick every shell whose completion script should be written.", "Detection picks your login shell; nothing else is touched."],
    items: completionItems(),
    mode: "check",
    initial: answers.completions ?? detected,
    height: Math.min(8, all.length + 2),
  });

  if (chosen === CANCEL || chosen === BACK) {
    return chosen;
  }

  answers.completions = Array.isArray(chosen) ? chosen : [];
}
