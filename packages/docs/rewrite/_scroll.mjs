/**
 * @module packages/docs/rewrite/scroll
 *
 * A box that scrolls must be reachable from the keyboard: a wide table goes
 * inside a named scroll container, and a wide code block gets a tab stop.
 *
 * Both are WCAG 2.1.1 (`scrollable-region-focusable`): a scrollable box with no
 * tab stop cannot be scrolled without a pointer.
 */

/**
 * Wrap every table in a scroll container.
 *
 * A wide table (the surface map is 160 rows of four columns) otherwise pushes
 * the whole document wider than the viewport, so a 320px screen scrolls in two
 * directions and WCAG 2.2 SC 1.4.10 reflow fails. The wrapper scrolls instead,
 * which keeps the table element and its implicit roles intact.
 *
 * The wrapper is keyboard-reachable and named by its header row (WCAG 2.2
 * SC 2.1.1, the `scrollable-region-focusable` rule).
 *
 * @param {string} html
 * @returns {string}
 */
export function wrapTables(html) {
  return html.replaceAll(/<table>([\s\S]*?)<\/table>/gu, (whole, inner) => {
    const header = /<thead>[\s\S]*?<tr>([\s\S]*?)<\/tr>/u.exec(inner)?.[1] ?? "";
    const label = header
      .replaceAll(/<[^>]+>/gu, " ")
      .replaceAll(/\s+/gu, " ")
      .trim();

    return `<div data-part="table-scroll" role="region" tabindex="0" aria-label="Table: ${label || "scrollable"}"><table>${inner}</table></div>`;
  });
}

/**
 * Make a scrolling code block reachable from the keyboard.
 *
 * A `pre` wider than the viewport scrolls sideways on a phone. The attribute is
 * added once, so a second pass over the same HTML changes nothing.
 *
 * @param {string} html
 * @returns {string}
 */
export function focusCodeBlocks(html) {
  return html.replaceAll(/<pre(?![^>]*\btabindex=)/gu, '<pre tabindex="0"');
}
