/** @module core/agents/commands/dispatchers - the two command names that carry a vocabulary */

/** The one area command: the id is the first word of the request (ADR 251). */
export const AREA_COMMAND = "rule-area";

/** The one persona command: the role id is the first word of the request (ADR 251). */
export const PERSONA_COMMAND = "rule-persona";
