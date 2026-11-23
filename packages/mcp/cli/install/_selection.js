/**
 * @module cli/install/selection
 *
 * Which commands an install writes.
 *
 * Area slash commands are hubs only (ADR 109); leaf skills stay as tools.
 * Personas and session tasks still fan out. Selection is data - a preset, or
 * families plus areas - so the interactive picker and the flags decide the
 * same thing the same way, and a test can assert what each choice produces.
 *
 * The router is always written. It is the dispatcher every other command
 * routes through, and an install without it is an install that does nothing.
 */

import { commandNames, ROUTER_COMMAND } from "../../core/agents/commands/index.js";
import { AREA_COMMAND, PERSONA_COMMAND } from "../../core/agents/commands/_dispatchers.js";
import { areaOf, skillAreas } from "../../prompts/_areas.js";

/** The families a command belongs to, in the order a picker shows them. */
export const FAMILIES = [
  { id: "areas", label: "Areas and skills", hint: "one command per skill, grouped by area" },
  { id: "personas", label: "Review personas", hint: "audit, review and plan as a specialist" },
  { id: "tasks", label: "One-shot tasks", hint: "handoff, handon, init, compress, stats, usage, update, check" },
];

/** The family a command name belongs to. */
function familyOf(name) {
  if (name === ROUTER_COMMAND) {
    return "router";
  }

  // One command per family since ADR 249: the area and the persona are the
  // first word of the request, not the command name.
  if (name === AREA_COMMAND) {
    return "areas";
  }

  return name === PERSONA_COMMAND ? "personas" : "tasks";
}

/**
 * The presets, in the order a picker offers them.
 *
 * Area slash commands are hubs only (ADR 109). `minimal` is router + area hubs.
 * `standard` adds personas and tasks. `full` is the same area set plus every
 * persona and task (no per-skill slash).
 */
export const PRESETS = {
  minimal: { families: ["areas"], hubsOnly: true, label: "Minimal", hint: "the router and the area hubs" },
  standard: { families: ["areas", "personas", "tasks"], hubsOnly: true, label: "Standard", hint: "area hubs, personas and tasks" },
  full: { families: ["areas", "personas", "tasks"], hubsOnly: true, label: "Full", hint: "area hubs plus every persona and task (no leaf area slash)" },
};

/**
 * The commands a selection resolves to.
 *
 * @param {object} selection
 * @param {string} [selection.preset] - minimal, standard or full
 * @param {string[]} [selection.families] - ignored when a preset is given
 * @param {string[]} [selection.areas] - narrows the areas family; all of them when absent
 * @param {string[]} [selection.skills] - narrows further, by skill name
 * @returns {{ commands: string[], problems: string[] }}
 */
export function resolveSelection(selection = {}) {
  const problems = [];
  const preset = selection.preset ? PRESETS[selection.preset] : null;

  if (selection.preset && !preset) {
    problems.push(`unknown preset "${selection.preset}"`);
  }

  const known = new Set(FAMILIES.map((family) => family.id));
  const asked = preset ? preset.families : (selection.families ?? []);

  for (const family of asked) {
    if (!known.has(family)) {
      problems.push(`unknown family "${family}"`);
    }
  }

  const families = new Set(asked.filter((family) => known.has(family)));
  const areas = selection.areas?.length ? new Set(selection.areas) : null;
  const skills = selection.skills?.length ? new Set(selection.skills) : null;
  const allAreas = skillAreas();

  for (const area of areas ?? []) {
    if (!allAreas.has(area)) {
      problems.push(`unknown area "${area}"`);
    }
  }

  const allSkills = new Set([...allAreas.values()].flatMap((entry) => [entry.hub, ...entry.members].filter(Boolean)));

  for (const skill of skills ?? []) {
    if (!allSkills.has(skill)) {
      problems.push(`unknown skill "${skill}"`);
    }
  }

  const commands = commandNames().filter((name) => {
    if (name === ROUTER_COMMAND) {
      return true;
    }

    const family = familyOf(name);

    if (!families.has(family)) {
      return false;
    }

    // The area command carries the whole vocabulary, so a narrowed area list
    // no longer has a file to remove; `areas` and `skills` stay accepted and are
    // validated, and a narrowing that would leave nothing says so instead of
    // silently writing the whole family.
    if (family === "areas" && (areas || skills)) {
      return true;
    }

    return true;
  });

  return { commands, problems };
}
