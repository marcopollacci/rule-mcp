/**
 * Reading measure of the docs site, measured in Chromium.
 *
 * Two properties that only the built site can prove: prose keeps a readable
 * line length when the window grows past a laptop, and the stylesheet is mobile
 * first, so every media query adds width instead of taking it away.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "@playwright/test";

import { installSite, PROSE_PAGES, ROOT } from "./_site.mjs";

const site = installSite(test);

/** Viewports wide enough that an uncapped measure runs past a readable line. */
const WIDE = [1280, 1440, 1920];

/** Characters in the longest line a reader tracks, at the upper end. */
const MAX_LINE_CHARS = 80;

test("prose keeps a reading measure when the window widens", async ({ browser }) => {
  const failures = [];

  for (const width of WIDE) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();

    for (const out of PROSE_PAGES) {
      await page.goto(site.url(out));

      const measure = await page.evaluate(() => {
        /** Characters whose box shares the first line of a block. */
        const firstLineChars = (block) => {
          const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
          const range = document.createRange();
          const nodes = [];

          let top = null;
          let count = 0;

          while (walker.nextNode()) {
            nodes.push(walker.currentNode);
          }

          for (const node of nodes) {
            const text = node.textContent;

            for (let index = 0; index < text.length; index += 1) {
              range.setStart(node, index);
              range.setEnd(node, index + 1);
              const rect = range.getBoundingClientRect();

              if (rect.width === 0) {
                continue;
              }

              top ??= rect.top;

              if (Math.abs(rect.top - top) > 2) {
                return count;
              }

              count += 1;
            }
          }

          return count;
        };

        const blocks = [...document.querySelectorAll("main > p")].filter((element) => element.textContent.trim().length > 200);
        const widest = blocks.sort((a, b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width)[0];
        const main = document.querySelector("main").getBoundingClientRect().width;

        return {
          chars: widest ? firstLineChars(widest) : 0,
          blockWidth: widest ? widest.getBoundingClientRect().width : 0,
          mainWidth: main,
        };
      });

      if (measure.chars > MAX_LINE_CHARS) {
        failures.push(`${width}px ${out}: ${measure.chars} characters on a line`);
      }
      // The container stays wide for tables and code, so the paragraph is the
      // narrower box and the difference is visible, not a rounding artifact.
      if (Math.round(measure.blockWidth) >= Math.round(measure.mainWidth)) {
        failures.push(`${width}px ${out}: paragraph fills the whole container`);
      }
    }

    await context.close();
  }

  expect(failures, "lines past a readable measure").toEqual([]);
});

test("the stylesheet is mobile first, so every media query adds width", async () => {
  const css = readFileSync(join(ROOT, "packages/docs/style.css"), "utf8");
  const narrowing = [...css.matchAll(/@media[^{]*max-width[^{]*\{/g)].map((match) => match[0].trim());

  expect(narrowing, "media queries that take width away instead of adding it").toEqual([]);
});
