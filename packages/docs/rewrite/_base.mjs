/**
 * @module packages/docs/rewrite/base
 *
 * Where a link that leaves the emitted set points: the GitHub blob URL of the
 * clone the site is built from, or nothing when the clone has no GitHub remote.
 */

import { execFileSync } from "node:child_process";

/**
 * The GitHub blob base for links that leave the emitted set, or null when the
 * clone has no GitHub remote.
 *
 * @param {string} projectDir
 * @returns {string|null}
 */
export function repoBase(projectDir) {
  try {
    const url = execFileSync("git", ["config", "--get", "remote.origin.url"], { encoding: "utf8", cwd: projectDir }).trim();
    const match = /github\.com[:/]([^/]+\/[^/]+?)(?:\.git)?$/u.exec(url);

    if (match) {
      return `https://github.com/${match[1]}/blob/main/`;
    }
  } catch {
    // No git or no remote: an off-set link stays relative.
  }

  return null;
}
