// SPDX-License-Identifier: AGPL-3.0-only
// The responsive guard (L5 §2): at 390, 768 and 1440 px on all four landing routes and
// one docs page, the document must not scroll sideways (scrollWidth === clientWidth) and
// no element may extend past the viewport unless an ancestor is a horizontal scroll
// container. The old DOM-static gate could not see geometry — that is how the 485 px
// install grid shipped.
import { test, expect } from '@playwright/test';

const ROUTES = ['/', '/selfhosted', '/fr', '/fr/selfhosted', '/docs/v2/quickstart'];
const WIDTHS = [390, 768, 1440];

for (const route of ROUTES) {
  for (const width of WIDTHS) {
    test(`${route} at ${width}px: no horizontal overflow`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(route, { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);
      const result = await page.evaluate(() => {
        const doc = document.documentElement;
        const vw = doc.clientWidth;
        const overflowing = [];
        for (const el of document.querySelectorAll('*')) {
          const r = el.getBoundingClientRect();
          if (r.right > vw + 0.5) {
            // An element cannot make the page scroll sideways when it is itself a
            // scroll/clipping container, when an ancestor is one, or when it is
            // fixed-positioned (out of the document flow).
            let a = el;
            let contained = false;
            while (a) {
              const s = getComputedStyle(a);
              if (/(auto|scroll|hidden|clip)/.test(s.overflowX) || s.position === 'fixed') {
                contained = true;
                break;
              }
              a = a.parentElement;
            }
            if (!contained) {
              const cls =
                typeof el.className === 'string' ? el.className.split(' ')[0] : el.tagName;
              overflowing.push(`${el.tagName.toLowerCase()}.${cls} right=${Math.round(r.right)}`);
            }
          }
        }
        return {
          scrollWidth: doc.scrollWidth,
          clientWidth: vw,
          overflowing: overflowing.slice(0, 5),
        };
      });
      expect(
        result.scrollWidth,
        `document scrolls sideways: scrollWidth ${result.scrollWidth} != clientWidth ${result.clientWidth}`,
      ).toBe(result.clientWidth);
      expect(
        result.overflowing,
        `elements past the ${width}px viewport: ${result.overflowing.join(' | ')}`,
      ).toEqual([]);
    });
  }
}
