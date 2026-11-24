/**
 * @module tools/next/complete
 *
 * Tick a step, but only against a fact this module can check.
 *
 * A model that says "done" is a claim. A file that exists at the path the step
 * promised is a fact. So the caller passes the evidence it produced, and the
 * tick happens only when that evidence is on disk: a wrong tick is worse than
 * an unticked step, because the next session trusts the plan.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { nextStep } from "./_step.js";
import { openCount, tickStep } from "./_step-scan.js";

/** The path a piece of evidence names, refused when it escapes the project. */
function insideProject(projectDir, evidence) {
  const root = resolve(projectDir);
  const path = resolve(root, evidence);

  return path === root || path.startsWith(`${root}/`) ? path : null;
}

/**
 * Verify the evidence, then tick the resolved step and report the delta.
 *
 * @param {string} projectDir
 * @param {{ want?: string, evidence?: string }} [options]
 * @returns {{ status: "ticked"|"refused"|"missing"|"closed", message: string, plan?: string, id?: string, was?: number, open?: number, next?: string }}
 */
export function completeStep(projectDir, { want = "", evidence = "" } = {}) {
  const resolved = nextStep(projectDir, { want });

  if (resolved.status !== "found") {
    return { status: resolved.status === "closed" ? "closed" : "missing", message: resolved.message ?? "no open step to tick" };
  }

  const id = resolved.id;

  if (!id) {
    return { status: "refused", message: "the step carries no id, so the tick could not be anchored to it", plan: resolved.plan };
  }

  if (!evidence) {
    return {
      status: "refused",
      plan: resolved.plan,
      id,
      message: "pass the evidence the step produced: a project-relative path that exists once the step is done. The plan is not ticked on a claim alone.",
    };
  }

  const path = insideProject(projectDir, evidence);

  if (path === null) {
    return { status: "refused", plan: resolved.plan, id, message: `${evidence} is outside the project, so it proves nothing about this step` };
  }

  if (!existsSync(path)) {
    return { status: "refused", plan: resolved.plan, id, message: `${evidence} does not exist, so the step is not done` };
  }

  const before = readFileSync(resolved.path, "utf8");
  const was = openCount(before);
  const { text, ticked } = tickStep(before, id);

  if (!ticked) {
    return { status: "refused", plan: resolved.plan, id, message: `${id} is no longer open in the plan` };
  }

  writeFileSync(resolved.path, text, "utf8");

  const after = nextStep(projectDir, { want: resolved.plan });

  return {
    status: "ticked",
    plan: resolved.plan,
    id,
    was,
    open: openCount(text),
    next: after.status === "found" ? `${after.id || "next"}: ${after.step}` : (after.message ?? ""),
    message: `${id} is ticked in ${resolved.path.split("/").pop()}`,
  };
}

/** Where the evidence for a tick lives, for a caller that needs the path back. */
export const evidencePath = (projectDir, evidence) => join(projectDir, evidence);
