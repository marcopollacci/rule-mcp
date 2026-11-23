/** The wizard's rail: step lists, their order, and the plan the review screen builds. */

import { DIMENSIONS } from "../../install/_profiles.js";
import { buildInstallPlan } from "../_plan-install.js";
import { buildProjectInstallPlan } from "../_plan-project.js";

/** The rail labels, in the order the wizard lights them. */
export const INSTALL_STEPS = ["Preflight", "Profile", "Agents", "Scope", "Transport", "Surface", "Features", "Completions", "Review", "Install", "Done"];

/** The uninstall rail, in the same order. */
export const UNINSTALL_STEPS = ["Select", "Purge", "Review", "Remove", "Done"];

/** Where each install step sits on that rail. */
export const INSTALL_RAIL = { preflight: 0, profile: 1, agents: 2, scope: 3, transport: 4, surface: 5, features: 6, completions: 7, review: 8, install: 9, done: 10 };

/** Where each uninstall step sits on that rail. */
export const UNINSTALL_RAIL = { select: 0, purge: 1, review: 2, remove: 3, done: 4 };

/**
 * The install steps, always the same order.
 *
 * Surface is the only place that picks a tier: the slash-command files follow
 * that answer, so there is no separate Commands screen (ADR 169). Depth is not
 * a step either: every host is installed up to its own ceiling.
 *
 * Shell completions is its own step: it is the only one that writes into a
 * shell's own tree, and the destination is a choice, not a constant.
 *
 * @returns {string[]}
 */
export function installOrder() {
  return ["preflight", "profile", "agents", "scope", "transport", "surface", "features", "completions", "review"];
}

/**
 * The uninstall steps this machine needs.
 *
 * @param {{ hasPurge?: boolean }} [options]
 * @returns {string[]}
 */
export function uninstallOrder({ hasPurge = false } = {}) {
  return ["select", ...(hasPurge ? ["purge"] : []), "review"];
}

/** The dimensions map the manifest records. */
export const dimensionMap = (dimensions) => Object.fromEntries(DIMENSIONS.map((dimension) => [dimension, dimensions.includes(dimension)]));

/**
 * The plan the review screen lists and the run executes.
 *
 * A project scope answers with the roots it writes and the kind of entry; a
 * global one answers with neither, and the two plans are built by the modules
 * that already own them.
 */
export const installPlan = ({ answers, context, force }) => {
  if (answers.scope === "project") {
    return buildProjectInstallPlan({
      agents: answers.dimensions.includes("server") ? answers.agents : [],
      projects: answers.projects ?? [],
      projectConfig: answers.projectConfig ?? "shared",
    });
  }

  return buildInstallPlan({
    agents: answers.dimensions.includes("server") ? answers.agents : [],
    mode: answers.mode,
    completions: answers.completions ?? [],
    extras: {
      rules: answers.dimensions.includes("rules"),
      commands: answers.dimensions.includes("commands"),
      // The install always goes to the host ceiling. The profile decides whether
      // hooks are part of that write; a host with no hook file skips them.
      hooks: answers.dimensions.includes("hooks"),
      doctor: answers.dimensions.includes("doctor"),
      // The catalog copy is its own answer. A profile does not imply it.
      skills: answers.skills === true,
      // The platform service belongs to daemon mode and is automatic there.
      service: answers.mode === "daemon",
    },
    force,
    context,
    selection: answers.selection,
    surface: answers.surface,
    profile: answers.profile,
    dimensions: dimensionMap(answers.dimensions),
    features: Object.entries(answers.features ?? {}).map(([id, level]) => ({ id, level })),
    adrPolicy: answers.adrPolicy ?? null,
    // Only the agents this run installs into: an attribution write for an agent
    // whose config was not written would be a setting nobody asked for.
    attribution: answers.attribution ?? null,
    attributionAgents: answers.dimensions.includes("server") ? answers.agents : [],
  });
};
