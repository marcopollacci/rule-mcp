/**
 * @module tools/state/state
 *
 * One screen that answers "where is this project".
 *
 * The corpus asked for it 106 times ("recap", "stato del progetto", "piani
 * appesi"). `doctor` answers about the environment, `handon` about a handoff;
 * nothing answered about the project itself.
 *
 * Every source is injected so the tests do not need git, gh or a clock.
 */

import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { nextStep } from "../next/index.js";
import { planFiles } from "../next/_step-locate.js";
import { openCount } from "../next/_step-scan.js";

/** Run a command, or "" when it cannot run here. */
const quiet = (file, arguments_) => {
  try {
    return execFileSync(file, arguments_, { encoding: "utf8", timeout: 5000, stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
};

/** The version the root manifest claims. */
export const manifestVersion = (projectDir) => {
  try {
    return JSON.parse(readFileSync(join(projectDir, "package.json"), "utf8")).version ?? "";
  } catch {
    return "";
  }
};

/** How many ADR files the log holds, the index excluded. */
export const adrCount = (projectDir) => {
  try {
    return readdirSync(join(projectDir, "docs/adr")).filter((name) => name.endsWith(".md") && name !== "ADR.md").length;
  } catch {
    return 0;
  }
};

/** Open steps across every plan, and the one the cascade orders next. */
export function planState(projectDir) {
  let open = 0;

  for (const file of planFiles(projectDir)) {
    open += openCount(readFileSync(file, "utf8"));
  }

  const next = nextStep(projectDir);

  return { open, next: next.status === "found" ? `${next.id || "step"} in ${next.plan} - ${next.workstream}` : "" };
}

/** The newest handoff file, or "". */
export const lastHandoff = (projectDir) => {
  try {
    const dir = join(projectDir, "docs/handoff");
    const files = readdirSync(dir).filter((name) => /^\d{2}-.+\.md$/u.test(name));

    return files.sort((left, right) => statSync(join(dir, right)).mtimeMs - statSync(join(dir, left)).mtimeMs)[0] ?? "";
  } catch {
    return "";
  }
};

/** Changed paths git reports, and how many. */
export const dirtyTree = (run) => {
  const out = run("git", ["status", "--porcelain"]);

  return { count: out === "" ? 0 : out.split("\n").filter(Boolean).length };
};

/** The last CI conclusion, when `gh` is here and the branch has a run. */
export const lastCi = (run) => {
  const out = run("gh", ["run", "list", "--limit", "1", "--json", "conclusion,status,displayTitle"]);

  if (out === "") {
    return "";
  }

  try {
    const [first] = JSON.parse(out);

    return first ? `${first.conclusion || first.status} (${first.displayTitle})` : "";
  } catch {
    return "";
  }
};

/**
 * The project state as one screen.
 *
 * @param {string} projectDir
 * @param {{ run?: (file: string, arguments_: string[]) => string }} [options]
 * @returns {string} Markdown
 */
export function projectState(projectDir, { run = quiet } = {}) {
  const version = manifestVersion(projectDir);
  const plans = planState(projectDir);
  const dirty = dirtyTree(run);
  const ci = lastCi(run);
  const handoff = lastHandoff(projectDir);

  return [
    "# Project state",
    "",
    `- version: ${version === "" ? "unknown" : `\`${version}\``}`,
    `- decisions: ${adrCount(projectDir)} ADRs`,
    `- plans: ${plans.open} open step(s)${plans.next ? `, next \`${plans.next}\`` : ""}`,
    `- tree: ${dirty.count === 0 ? "clean" : `${dirty.count} changed path(s)`}`,
    `- last CI: ${ci === "" ? "unknown (no gh, or no run on this branch)" : ci}`,
    `- last handoff: ${handoff === "" ? "none" : `\`${handoff}\``}`,
  ].join("\n");
}
