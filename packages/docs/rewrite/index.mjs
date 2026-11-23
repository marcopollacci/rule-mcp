/**
 * @module packages/docs/rewrite
 *
 * The passes over a rendered page, one file per decision: where an off-set
 * link points (`_base.mjs`), what a link becomes (`_links.mjs`), which heading
 * a reader sees (`_headings.mjs`), and how a box that scrolls stays reachable
 * (`_scroll.mjs`).
 */

export * from "./_base.mjs";
export * from "./_headings.mjs";
export * from "./_links.mjs";
export * from "./_scroll.mjs";
