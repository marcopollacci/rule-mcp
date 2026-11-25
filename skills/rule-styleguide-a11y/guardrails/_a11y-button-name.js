/** Guardrail `a11y-button-name`: Every button has an accessible name. */
import { a11yRule } from "./_a11y-helpers.js";

/** A naming attribute on the button itself: aria-label, aria-labelledby or title. */
const NAMED_TAG = /\b(?:aria-label|aria-labelledby|title)\s*=/i;
/** A child that names the button: an img with a non-empty alt, or a descendant with its own label. */
const NAMED_CHILD = /\balt\s*=\s*(?:"[^"\s][^"]*"|'[^'\s][^']*'|\{)|\baria-label(?:ledby)?\s*=/i;

/** Flags a button with no text, no naming attribute and no named image inside. */
export const a11yButtonName = a11yRule({
  id: "a11y-button-name",
  wcag: "4.1.2",
  label: "Every button has an accessible name",
  description: 'A button with no text, no aria-label and no named image is announced as "button", so the user cannot tell what it does.',
  suggestion: "Add visible text, aria-label / aria-labelledby, or an img with a non-empty alt inside",
  find: (code) =>
    [...code.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi)]
      .filter(([, attributes, content]) => {
        if (NAMED_TAG.test(attributes) || NAMED_CHILD.test(content)) {
          return false;
        }

        return content.replaceAll(/<[^>]*>/g, "").trim() === "";
      })
      .map((m) => m[0]),
});
