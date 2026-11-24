/**
 * One hover vocabulary and one radius scale, on every control the site draws.
 *
 * The review this covers: the preference trigger was the only pill in the
 * header, a nav link tinted one way and a preference row another, and the call
 * to action answered with an outline that no other control used. A kind of
 * control now answers the same way wherever it appears:
 *
 * - a quiet control tints its background and takes the accent label,
 * - a filled control lifts its fill,
 * - an inline link colors itself and underlines,
 * - an outline belongs to `:focus-visible`, never to hover.
 *
 * Measured on the rendered page: the values below come from `getComputedStyle`
 * with the pointer on the element, so a rule that stops applying fails here.
 */

import { expect, test } from "@playwright/test";

import { installSite } from "./_site.mjs";

const site = installSite(test);

/** The properties under test, read off one element. */
const READ = (element) => {
  const style = getComputedStyle(element);

  return {
    background: style.backgroundColor,
    color: style.color,
    borderColor: style.borderTopColor,
    radius: style.borderTopLeftRadius,
    outlineStyle: style.outlineStyle,
    textDecoration: style.textDecorationLine,
  };
};

/**
 * Read a control with the pointer parked where no rule reacts: the footer band
 * carries no link, so the corner cannot leave a hover state behind.
 */
async function restStyle(page, locator) {
  const viewport = page.viewportSize();

  await page.mouse.move(1, viewport.height - 1);

  return locator.evaluate(READ);
}

/** Read a control with the pointer on it, without moving the page afterwards. */
async function hoveredStyle(locator) {
  await locator.hover();

  return locator.evaluate(READ);
}

test("every quiet control tints the same way", async ({ page }) => {
  await page.goto(site.url("docs/architecture.html"));

  const nav = page.locator('body > nav[aria-label="Reference"] a').first();
  const navHover = await hoveredStyle(nav);

  expect(navHover.outlineStyle).toBe("none");
  expect(navHover.background).not.toBe("rgba(0, 0, 0, 0)");

  // The preference row is the same kind of control in another band.
  await page.locator('details[data-part="prefs"] summary').click();

  const row = page.locator('details[data-part="prefs"] label').first();
  const rowHover = await hoveredStyle(row);

  expect(rowHover.background).toBe(navHover.background);
  expect(rowHover.outlineStyle).toBe("none");
});

test("the preference trigger is a control, not a pill, and tints like the rest", async ({ page }) => {
  await page.goto(site.url("docs/architecture.html"));

  const summary = page.locator('details[data-part="prefs"] summary');
  const nav = page.locator("body > header nav a").first();
  const rest = await restStyle(page, summary);
  const navRest = await restStyle(page, nav);

  // A pill beside a square control is the shape the review flagged.
  expect(rest.radius).toBe(navRest.radius);
  expect(rest.radius).not.toBe("999px");

  const hovered = await hoveredStyle(summary);

  expect(hovered.background).not.toBe(rest.background);
  expect(hovered.borderColor).not.toBe(rest.borderColor);
  expect(hovered.outlineStyle).toBe("none");
});

test("the calls to action answer like a control, with no outline", async ({ page }) => {
  await page.goto(site.url("index.html"));

  const links = page.locator('p[data-part="cta"] a');
  const count = await links.count();

  expect(count).toBeGreaterThan(1);

  for (let index = 0; index < count; index += 1) {
    const link = links.nth(index);
    const rest = await restStyle(page, link);
    const hovered = await hoveredStyle(link);

    expect(hovered.outlineStyle, `call to action ${index + 1} uses no hover outline`).toBe("none");
    expect(hovered.background, `call to action ${index + 1} changes its background`).not.toBe(rest.background);
    expect(hovered.radius, `call to action ${index + 1} keeps the control radius`).toBe(rest.radius);
  }
});

test("a panel and a card share the surface radius", async ({ page }) => {
  await page.goto(site.url("index.html"));

  const hero = await restStyle(page, page.locator('section[data-part="hero"]'));

  // The preference panel is the other surface: one scale means they agree.
  await page.locator('details[data-part="prefs"] summary').click();

  const panel = await restStyle(page, page.locator('details[data-part="prefs"] summary + menu'));

  expect(hero.radius).toBe(panel.radius);
  expect(hero.radius).not.toBe("0px");
});
