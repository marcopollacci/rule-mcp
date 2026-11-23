/** @module core/history/squash-verify - what a close produced, checked against the plan */

import { lintCommits } from "../commit/index.js";
import { getFeatureCommitRange, gitLines, mergeCommits } from "../git/index.js";

/**
 * What the rewrite produced, and whether it is exactly what was planned.
 *
 * The base travels with the check: a squash on the base branch itself (the
 * case where the feature is everything the remote does not have yet) has a
 * merge base of its own, and reading the default one here counted zero commits
 * and rolled a correct squash back as an "unexpected change".
 */
function verifySquash(projectDir, { original, consolidation, baseBranch }) {
  const range = getFeatureCommitRange(projectDir, { baseBranch });
  const changed = gitLines(projectDir, ["diff", "--name-only", `${original}..HEAD`]);
  const allowed = new Set(consolidation?.paths);
  const unexpected = changed.filter((file) => !allowed.has(file));

  return {
    commits: range.count,
    violations: lintCommits(range.commits ?? []).violations.length,
    merges: range.range ? mergeCommits(projectDir, range.range).length : 0,
    treeUnchanged: changed.length === 0,
    documentsConsolidated: Boolean(consolidation),
    changed,
    unexpected,
    valid: range.count === 1 && unexpected.length === 0,
  };
}

export { verifySquash };
