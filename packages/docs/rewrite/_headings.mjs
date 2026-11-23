/**
 * @module packages/docs/rewrite/headings
 *
 * The two heading decisions a rendered page needs: one H1 per page, and a
 * title that names the subject instead of the ordinal.
 */

/**
 * Drop the `NN - ` chapter prefix from the first heading of a rendered page.
 *
 * The generated inventories carry it in their H1 (`# 13 - Personas`) because the
 * file name is the route. A reader should see the subject, not the ordinal.
 *
 * @param {string} html
 * @returns {string}
 */
export function stripHeadingNumber(html) {
  return html.replace(/<h1>\d{2}\s*[-:]\s*/u, "<h1>");
}

/**
 * Remove the leading H1 from a Markdown source.
 *
 * A composed page owns one H1, so every source it draws from contributes its
 * sections and not a second title.
 *
 * @param {string} markdown
 * @returns {string}
 */
export function dropLeadingHeading(markdown) {
  return markdown.replace(/^#\s+.*(?:\n|$)/mu, "");
}
