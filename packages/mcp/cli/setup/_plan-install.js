/**
 * @module cli/setup/plan-install
 *
 * Assembling the install plan from the wizard's answers.
 *
 * Order matters: the runtime home and the shim come first because the agent
 * writes reference the launcher, and the health check comes last because it
 * is the only step that reports on all the others.
 */

import { attributionTask } from "./_task-attribution.js";
import { agentInstallTask, runtimeHomeTask, shimTask } from "./_task-core.js";
import { launcherTask } from "./_task-launcher.js";
import { commandsTask, dockerTask, doctorTask, manifestTask, rulesTask, serviceTask, skillsTask } from "./_task-extras.js";
import { featuresTask } from "./_task-features.js";
import { cliVerifyTask } from "./_task-cli.js";
import { completionsTask } from "./_task-completions.js";

import { checkedAgents, dimensionsOf } from "./_plan-install-guards.js";

/**
 * @param {{ agents?: string[], mode?: string, extras?: object, force?: boolean, context?: object, selection?: object|null, surface?: object|null, profile?: string|null, dimensions?: object|null, features?: Array<{ id: string, level: string }>|string[], adrPolicy?: string|null }} answers
 * @returns {Array<{ id: string, title: string, detail: string, run: Function }>}
 */
export function buildInstallPlan({
  agents = [],
  mode = "stdio",
  extras = {},
  force = false,
  context = {},
  selection = null,
  surface,
  profile = null,
  dimensions = null,
  features = [],
  adrPolicy = null,
  attribution = null,
  attributionAgents = [],
  completions = [],
} = {}) {
  const targets = checkedAgents(agents);
  const plan = [runtimeHomeTask()];

  if ((Array.isArray(features) && features.length > 0) || adrPolicy) {
    plan.push(featuresTask({ features, adrPolicy }));
  }

  // The copy comes before the shim: a launcher is a copy plus a pointer, and a
  // pointer written to a copy that does not exist is the failure this replaces.
  plan.push(launcherTask());

  if (context.hasLocalBin) {
    plan.push(shimTask(context.localBin));
  }

  // Attribution is per agent, so it runs where the agent configs are written,
  // and only when a mode was asked for: absent means the vendor's own default
  // stands and no file is touched.
  if (attribution) {
    plan.push(attributionTask({ mode: attribution, agents: attributionAgents ?? [] }));
  }

  // The guard hooks are not a step of their own: they are written by the
  // Claude installer, so declining them is an argument to that install rather
  // than a task the plan can leave out. `extras` only ever carries the steps
  // that were kept, so the test is presence - `!== false` was true for an
  // absent key, which made the hooks impossible to decline.
  plan.push(...targets.map((agent) => agentInstallTask(agent, mode, force, extras.hooks === true, extras.commands === true, surface)));

  if (extras.rules) {
    plan.push(rulesTask(agents));
  }

  if (extras.commands) {
    plan.push(commandsTask(force, agents, selection));
  }

  // Opt-in and selected per destination: a completion file is the only artifact
  // that lands in a shell's own tree, so nothing is written without an answer.
  if (completions.length > 0) {
    plan.push(completionsTask({ targets: completions }));
  }

  // Opt-in. The server already serves this catalog, so a run that did not
  // ask for the copy leaves ~/.agents/skills alone. Uninstall still removes
  // a copy when that group is selected.
  if (extras.skills === true) {
    plan.push(skillsTask());
  }

  if (mode === "daemon" && extras.service) {
    plan.push(serviceTask());
  }

  if (mode === "docker") {
    plan.push(dockerTask());
  }

  // The install proves its own launcher before it reports success: a shim on
  // PATH that does not answer is an install that failed, not a warning.
  plan.push(cliVerifyTask());

  // The manifest is written before the health check, so the check can read what
  // this run claims it installed instead of re-detecting it. It is written even
  // when every optional step was declined: "this machine has the server entry"
  // is exactly the fact the uninstall needs, and the dimensions say the rest.
  plan.push(
    manifestTask({
      mode,
      profile,
      dimensions: dimensions ?? dimensionsOf(extras, agents),
      surface,
      commands: selection,
    }),
  );

  if (extras.doctor) {
    plan.push(doctorTask());
  }

  return plan;
}
