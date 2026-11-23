/**
 * Responsive structure of the docs site, measured in Chromium.
 *
 * Three properties that only a rendered page can prove: the narrow layout is
 * the base and the wide one is an addition, a phone gets one readable column
 * instead of two squeezed ones, and prose keeps a reading measure when the
 * window grows past a laptop.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";

import { installSite, PROSE_PAGES, ROOT } from "./_site.mjs";

const site = installSite(test);

/** Phone widths, in CSS pixels, from the smallest screen still in use. */
const PHONES = [320, 360, 390, 430];

/** Viewports wide enough that an uncapped measure runs past a readable line. */
const WIDE = [1280, 1440, 1920];

/** Characters in the longest line a reader tracks, at the upper end. */
const MAX_LINE_CHARS = 80;

test("the home page stacks to one column on a phone", async ({ browser }) => {
  const failures = [];

  for (const width of PHONES) {
    const context = await browser.newContext({ viewport: { width, height: 800 } });
    const page = await context.newPage();
    await page.goto(site.url("index.html"));

    const layout = await page.evaluate(() => {
      const main = document.querySelector("main");
      const cards = document.querySelector('main section[data-part="cards"]');
      const articles = [...document.querySelectorAll('main section[data-part="cards"] > article')];
      const cardsWidth = cards ? cards.getBoundingClientRect().width : 0;

      return {
        // A named area the template does not declare opens an implicit track,
        // which is the two-column squeeze a phone saw at 320px.
        tracks: getComputedStyle(main)
          .gridTemplateColumns.split(" ")
          .filter((track) => track !== "").length,
        mainWidth: Math.round(main.getBoundingClientRect().width),
        cardWidths: articles.map((article) => Math.round(article.getBoundingClientRect().width)),
        cardsWidth: Math.round(cardsWidth),
        // A squeezed card wrapped its heading one character per line: 15
        // characters became a 356px column on a 320px screen.
        headings: articles.map((article) => {
          const heading = article.querySelector(":scope > h3");
          const link = article.querySelector(":scope > h3 a");

          if (!heading || !link) {
            return null;
          }

          const style = getComputedStyle(heading);
          const lineBox = Number.parseFloat(style.fontSize) * Number.parseFloat(style.lineHeight) || Number.parseFloat(style.fontSize) * 1.2;

          return {
            share: heading.getBoundingClientRect().width / article.getBoundingClientRect().width,
            lines: link.getBoundingClientRect().height / lineBox,
          };
        }),
      };
    });

    if (layout.tracks !== 1) {
      failures.push(`${width}px: main has ${layout.tracks} grid tracks`);
    }

    for (const cardWidth of layout.cardWidths) {
      if (cardWidth < layout.cardsWidth * 0.9) {
        failures.push(`${width}px: a card is ${cardWidth}px of ${layout.cardsWidth}px`);
      }
    }

    for (const [index, heading] of layout.headings.entries()) {
      if (heading === null) {
        continue;
      }

      if (heading.share < 0.7) {
        failures.push(`${width}px: card ${index} heading box takes ${Math.round(heading.share * 100)}% of its article`);
      }

      if (heading.lines > 3) {
        failures.push(`${width}px: card ${index} heading wraps over ${heading.lines.toFixed(1)} lines`);
      }
    }

    await context.close();
  }

  expect(failures, "squeezed columns on a phone").toEqual([]);
});

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

test("the header stays a small share of a short phone screen", async ({ browser }) => {
  const failures = [];

  for (const [width, height] of [
    [320, 568],
    [360, 640],
  ]) {
    const context = await browser.newContext({ viewport: { width, height } });
    const page = await context.newPage();
    await page.goto(site.url("index.html"));

    const share = await page.evaluate(() => {
      const header = document.querySelector("body > header").getBoundingClientRect().height;

      return header / window.innerHeight;
    });

    // A sticky header past a third of the screen leaves too little for text.
    if (share > 1 / 3) {
      failures.push(`${width}x${height}: header takes ${Math.round(share * 100)}% of the screen`);
    }

    await context.close();
  }

  expect(failures, "a header that eats the screen").toEqual([]);
});

test("the narrow layout adds no accessibility violation of its own", async ({ browser }) => {
  // The full suite scans every page at a desktop width. A one-column layout is
  // a different document, so the phone width is scanned here too.
  const context = await browser.newContext({ viewport: { width: 320, height: 800 } });
  const page = await context.newPage();

  for (const out of ["index.html", "docs/getting-started.html"]) {
    await test.step(`${out} at 320px`, async () => {
      await page.goto(site.url(out));
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();

      expect(results.violations).toEqual([]);
    });
  }

  await context.close();
});
