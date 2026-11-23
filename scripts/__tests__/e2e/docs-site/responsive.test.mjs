/**
 * Responsive structure of the docs site on a phone, measured in Chromium.
 *
 * Two properties that only a rendered page can prove: the narrow layout is the
 * base, so a phone gets one readable column instead of two squeezed ones, and
 * the header stays a small share of a short screen.
 */

import { expect, test } from "@playwright/test";

import { installSite } from "./_site.mjs";

const site = installSite(test);

/** Phone widths, in CSS pixels, from the smallest screen still in use. */
const PHONES = [320, 360, 390, 430];

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
