/** @module cli/setup/plan-install-guards - the pure checks an install plan runs before it is built */

import { allAgents } from "../installers/index.js";

/**
 * Refuse an agent list the plan cannot act on.
 *
 * The wizard's own list once carried a row whose id was `measured:none`, a note
 * about the study rather than a product, so ticking it put a task in the plan
 * that could only fail with `Unsupported agent`. The screen is fixed; this is
 * the boundary that keeps the next one from reintroducing it, because a plan
 * entry that cannot run is not a warning to report later - it is a broken plan.
 *
 * @param {string[]} agents
 * @returns {string[]}
 */
export const checkedAgents = (agents) => {
  const known = new Set(allAgents);
  const unknown = agents.filter((agent) => !known.has(agent));

  if (unknown.length > 0) {
    throw new Error(`Not an agent name: ${unknown.map((agent) => `"${agent}"`).join(", ")}. A plan can only install into known agents.`);
  }

  return agents;
};

/** The dimensions a flag-driven install wrote, when no profile answered. */
export const dimensionsOf = (extras, agents) => ({
  server: agents.length > 0,
  rules: Boolean(extras.rules),
  commands: Boolean(extras.commands),
  hooks: Boolean(extras.hooks),
  doctor: Boolean(extras.doctor),
});
