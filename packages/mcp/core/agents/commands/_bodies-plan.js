/**
 * @module core/agents/commands/bodies-plan
 *
 * The two bodies that read the plan: advancing it, and reporting where it is.
 * Split out of `_bodies-session.js`, which sits at the size cap (ADR 061).
 */

import { STE100_WRITING_LINE } from "../../directive/_ste100.js";

/** /rule-next -> rule_tool_next, then execute the step it returns. */
export const NEXT_BODY = [
  "Advance the plan: $ARGUMENTS",
  "",
  "1. Call `rule_tool_next` with `want` set to the arguments verbatim: a plan slug, a step id such as `WS1-T1`, a phase such as `fase 4`, or empty for the plan a resumed session should take.",
  "2. The tool answers with the step, its workstream and how many steps stay open. Execute that step and nothing else: the plan orders the work.",
  "3. When the step produced something a path can prove, call `rule_tool_next` again with `complete: true` and `evidence` set to that project-relative path. The tool ticks the checkbox only when the path exists.",
  "4. Report what changed and what the plan says comes next. If the step cannot be done, say why and leave the checkbox open.",
  `5. ${STE100_WRITING_LINE}`,
  "6. Finish by proposing a conventional commit with a mandatory scope if the tree changed.",
].join("\n");

/** /rule-state -> rule_tool_state, one screen. */
export const STATE_BODY = [
  "Report the project state: $ARGUMENTS",
  "",
  "1. Call `rule_tool_state` and present its screen as it comes: version, decisions, plans, tree, last CI, last handoff.",
  "2. Read the numbers, do not re-derive them. A field the tool marks unknown stays unknown.",
  "3. When the next step it names is the one the user wants, offer `/rule-next`; do not start it unprompted.",
  `4. ${STE100_WRITING_LINE}`,
  "5. Finish by proposing a conventional commit with a mandatory scope only if the run changed a tracked file.",
].join("\n");
