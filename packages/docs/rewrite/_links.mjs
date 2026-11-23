/**
 * @module packages/docs/rewrite/links
 *
 * Two decisions about a link, and the one that cannot be made:
 *
 * - a link in the emitted set becomes the page it points at;
 * - a link that leaves it becomes a GitHub URL, opened without an opener;
 * - a link with no destination at all keeps its text and loses the promise.
 */

import { dirname, join, relative } from "node:path";

import { posix } from "../_collect.mjs";

/**
 * @param {string} html
 * @param {{ dir: string, out: string, routes: Map<string, string>, base: string|null }} options
 * @returns {string}
 */
export function rewriteLinks(html, { dir, out, routes, base }) {
  return html.replaceAll(/(href|src)="([^"]+?)"/gu, (whole, attribute, target) => {
    if (/^(?:https?:|mailto:|#|data:)/u.test(target)) {
      // An external destination opens in a new tab and cannot reach back into
      // this page through window.opener.
      if (attribute === "href" && /^https?:/u.test(target)) {
        return `${attribute}="${target}" target="_blank" rel="noopener noreferrer"`;
      }

      return whole;
    }

    const hash = target.indexOf("#");
    const path = hash === -1 ? target : target.slice(0, hash);
    const fragment = hash === -1 ? "" : target.slice(hash);
    const joined = posix(join(dir, path));
    const resolved = routes.get(joined);
    const from = out === "index.html" ? "." : posix(dirname(out));

    if (resolved) {
      return `${attribute}="${posix(relative(from, resolved))}${fragment}"`;
    }

    // A site asset is served by the site: the brand marks live under assets/.
    if (joined.startsWith("assets/")) {
      return `${attribute}="${posix(relative(from, joined))}${fragment}"`;
    }

    // Not a page. Anything inside the repository becomes a GitHub URL, so the
    // site never serves a navigation dead end. A path that climbs out of the
    // tree, or a build with no GitHub remote to point at, marks the link
    // instead: `unwrapDeadLinks` turns it back into its own text, because a
    // page that emits a relative link to a file it never wrote is a dead end
    // whatever the reason.
    if (!joined.startsWith("..") && base) {
      const external = ` ${attribute}="${base}${joined}${fragment}"`;

      return attribute === "href" ? `${external} target="_blank" rel="noopener noreferrer"` : external;
    }

    return `${attribute}="__unresolved__${target}"`;
  });
}

/**
 * Turn a link the site cannot serve back into its own text: the text stays, so
 * the sentence still reads, and only the promise of a destination goes.
 *
 * @param {string} html
 * @returns {string}
 */
export function unwrapDeadLinks(html) {
  return html.replaceAll(/<a\s[^>]*href="__unresolved__[^"]*"[^>]*>([\s\S]*?)<\/a>/gu, "$1").replaceAll(/\s(?:href|src)="__unresolved__[^"]*"/gu, "");
}
