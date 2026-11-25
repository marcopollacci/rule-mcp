/** Guardrail `a11y-role-button-focusable`: A role="button" element is reachable by keyboard. */
import { a11yRule } from "./_a11y-helpers.js";

/** Flags a non-native element with role="button" and no tabindex. */
export const a11yRoleButtonFocusable = a11yRule({
  id: "a11y-role-button-focusable",
  wcag: "2.1.1",
  label: "A role=button element is reachable by keyboard",
  description: 'role="button" on a non-native element announces a button that Tab never reaches, so a keyboard user hears about a control they cannot use.',
  suggestion: 'Use a native <button>, or add tabindex="0" and Enter/Space handling',
  find: (code) =>
    [...code.matchAll(/<(?!button\b)[a-z][\w-]*\b[^>]*\brole\s*=\s*\{?\s*["']button["']\s*\}?[^>]*>/gi)].map((m) => m[0]).filter((tag) => !/\btabindex\s*=/i.test(tag)),
});
