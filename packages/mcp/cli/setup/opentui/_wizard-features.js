/** The Features step: one screen per multi-level feature, then attribution. */

import { featureIds, FEATURES, levelsFor, readLevel } from "../../../core/runtime/features/index.js";
import { mergedEnv } from "../../../core/runtime/features/_store.js";
import { attributionItems, featureLevelItems } from "./_items.js";
import { BACK, CANCEL } from "./_answers.js";

/**
 * Ask the feature levels and the single attribution question.
 *
 * Attribution is one question, not one per agent: the table holds which agents
 * have a documented key, and the review lists the rest by name.
 *
 * @param {{ screen: object, answers: object }} context
 * @returns {Promise<unknown>} an answer to take for navigation, or undefined to continue
 */
export async function askFeatures({ screen, answers }) {
  // One level screen per feature that offers more than on/off; binary features
  // share a single radio each so every switch is owned here.
  const envView = mergedEnv({ env: process.env });

  for (const id of featureIds()) {
    if (answers.features[id]) {
      continue;
    }

    const levels = levelsFor(id);

    if (levels.length < 2) {
      continue;
    }

    const chosen = await screen.ask({
      title: FEATURES[id].label,
      help: [`Feature: ${id}`, "Pick the level written into ~/.rule-mcp/config/env.json."],
      items: featureLevelItems(id),
      mode: "radio",
      initial: [readLevel(id, envView)],
      height: Math.min(8, levels.length + 2),
    });

    if (chosen === CANCEL || chosen === BACK) {
      return chosen;
    }

    answers.features[id] = chosen;
  }

  const attribution = await screen.ask({
    title: "Commit attribution",
    help: ["hide writes the documented value for every agent whose vendor page names one.", "keep removes only the value an install wrote; an undocumented agent is left alone."],
    items: attributionItems(),
    mode: "radio",
    initial: [answers.attribution],
    height: 6,
  });

  if (attribution === CANCEL || attribution === BACK) {
    return attribution;
  }

  answers.attribution = attribution;

  return;
}

/**
 * Ask whether this run copies the bundled catalog.
 *
 * Global only. Project scope never writes `~/.agents/skills`, and the server
 * already serves the same files, so the default is to leave the directories
 * alone. An earlier copy stays until uninstall removes that group.
 *
 * @param {{ screen: object, answers: object }} context
 * @returns {Promise<unknown>}
 */
export async function askBundledSkills({ screen, answers }) {
  if (answers.scope === "project") {
    answers.skills = false;

    return;
  }

  const choice = await screen.ask({
    title: "Copy the bundled skill catalog?",
    help: [
      "Agents that read SKILL.md discover these on their own.",
      "The server already serves the same catalog. No leaves those directories alone.",
      // Codex has no slash-command file format, so its /rule-* commands are
      // written as SKILL.md directories in the same folder under the Commands
      // dimension. Without this line, a No here looks ignored.
      "Codex writes its /rule-* commands there as SKILL.md files too; those belong to Commands, not to this question.",
    ],
    items: [
      {
        id: "no",
        label: "No",
        note: "default",
        detail: ["Do not copy skills into ~/.agents/skills or ~/.claude/skills.", "An earlier copy stays until uninstall removes it."],
      },
      {
        id: "yes",
        label: "Yes",
        note: "~/.agents/skills",
        detail: ["Copy every bundled skill, and mirror them where Claude discovers skills."],
      },
    ],
    mode: "radio",
    initial: [answers.skills ? "yes" : "no"],
  });

  if (choice === CANCEL || choice === BACK) {
    return choice;
  }

  answers.skills = choice === "yes";
}
