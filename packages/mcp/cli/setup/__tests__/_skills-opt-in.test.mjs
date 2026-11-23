/**
 * Declining the bundled skills must actually decline them.
 *
 * The report this covers: "I chose not to install the skills globally and they
 * are there anyway". They are not. Two different writes land in
 * `~/.agents/skills`:
 *
 * - the commands dimension, because Codex has no slash-command file format and
 *   reads SKILL.md directories instead (ADR 170), so its 16 `/rule-*` commands
 *   are written there as `name/SKILL.md`;
 * - the skills dimension, the opt-in copy of the ~60 bundled catalog skills.
 *
 * Only the second is the question in the wizard. This pins the first apart from
 * it, so a No stays a No and the file count stays the tell.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { buildInstallPlan } from "../_plan-install.js";
import { resolveExtras, resolveSetupOptions } from "../_options.js";

const ids = (plan) => plan.map((task) => task.id);

test("--no-skills removes the skills task and keeps the commands one", () => {
  const options = resolveSetupOptions({ skills: false, commands: true, agent: "codex" });

  assert.ok(!options.extras.includes("skills"), "--no-skills is not in the extras");

  const plan = buildInstallPlan({ agents: ["codex"], extras: { rules: false, commands: true, skills: false } });

  assert.ok(!ids(plan).includes("skills"), "no skills task in the plan");
  assert.ok(ids(plan).includes("commands"), "the commands task stays");
});

test("no skills answer at all is not the same as an explicit no", () => {
  assert.ok(!resolveExtras({}).includes("skills"), "absent means the opt-in stays off");

  const plan = buildInstallPlan({ agents: ["codex"], extras: { commands: true } });

  assert.ok(!ids(plan).includes("skills"), "an install that never asked writes no catalog copy");
});

test("the skills task and the Codex commands are different writes into one directory", () => {
  const withSkills = buildInstallPlan({ agents: ["codex"], extras: { commands: true, skills: true } });
  const skills = withSkills.find((task) => task.id === "skills");
  const commands = withSkills.find((task) => task.id === "commands");

  assert.match(skills.detail, /bundled skills/i, "the skills task names the catalog it copies");
  assert.doesNotMatch(skills.title, /command/i, "it is not the command surface");

  // Codex reads SKILL.md directories, so its commands share the folder without
  // being the catalog: the detail names the agent and the count of commands.
  assert.match(commands.detail, /codex/, "the commands task names the host it writes for");
});
