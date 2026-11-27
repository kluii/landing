// SPDX-License-Identifier: AGPL-3.0-only
// The landing split (ADR-0015): `/` sells the cloud, `/selfhosted` sells self-hosting,
// each nav links to the other landing with a real label, and each route has its own
// canonical. Runs against the built dist/ served by `astro preview`.
import { test, expect } from '@playwright/test';
import { LANDING, NAV } from '../src/data/copy';
import { VARIANT_ROUTES } from '../src/data/variants';
import { LINKS } from '../src/data/links';

const LANDING_ROUTES = ['/', '/selfhosted', '/fr', '/fr/selfhosted'] as const;

test.describe('landing split', () => {
  test('/ is the cloud landing: no install block, no docs link in its nav', async ({ page }) => {
    await page.goto('/');
    const nav = page.locator('header.site-nav .nav-inner');
    await expect(nav.locator('a[href^="/docs"]')).toHaveCount(0);
    await expect(page.locator('.install-grid')).toHaveCount(0);
    await expect(page.locator('pre.code-body')).toHaveCount(0);
    await expect(nav.getByRole('link', { name: NAV.en.selfhosted })).toHaveAttribute(
      'href',
      '/selfhosted',
    );
    await expect(page.locator('h1')).toHaveText(LANDING.en.cloud.heroH1);
  });

  test('/selfhosted has the install block and a docs link in its nav', async ({ page }) => {
    await page.goto('/selfhosted');
    await expect(page.locator('.install-grid')).toHaveCount(1);
    await expect(page.locator('pre.code-body')).toHaveCount(2); // install + MCP config
    const nav = page.locator('header.site-nav .nav-inner');
    await expect(nav.locator('a[href^="/docs"]')).toHaveCount(1);
    await expect(nav.getByRole('link', { name: NAV.en.cloud })).toHaveAttribute('href', '/');
    await expect(page.locator('h1')).toHaveText(LANDING.en.selfhosted.heroH1);
  });

  test('/fr/ mirrors the cloud split in French', async ({ page }) => {
    await page.goto('/fr');
    const nav = page.locator('header.site-nav .nav-inner');
    await expect(nav.locator('a[href^="/fr/docs"]')).toHaveCount(0);
    await expect(nav.getByRole('link', { name: NAV.fr.selfhosted })).toHaveAttribute(
      'href',
      '/fr/selfhosted',
    );
    await expect(page.locator('h1')).toHaveText(LANDING.fr.cloud.heroH1);
  });

  test('/fr/selfhosted mirrors the self-hosted split in French', async ({ page }) => {
    await page.goto('/fr/selfhosted');
    await expect(page.locator('.install-grid')).toHaveCount(1);
    const nav = page.locator('header.site-nav .nav-inner');
    await expect(nav.locator('a[href^="/fr/docs"]')).toHaveCount(1);
    await expect(nav.getByRole('link', { name: NAV.fr.cloud })).toHaveAttribute(
      'href',
      VARIANT_ROUTES.fr.cloud,
    );
  });

  test('the cross-links land on the right page', async ({ page }) => {
    await page.goto('/');
    const origin = new URL(page.url()).origin;
    await page
      .locator('header.site-nav .nav-inner')
      .getByRole('link', { name: NAV.en.selfhosted })
      .click();
    await expect(page).toHaveURL(`${origin}/selfhosted`);
    await page
      .locator('header.site-nav .nav-inner')
      .getByRole('link', { name: NAV.en.cloud })
      .click();
    await expect(page).toHaveURL(`${origin}/`);
    await page.goto('/fr');
    await page
      .locator('header.site-nav .nav-inner')
      .getByRole('link', { name: NAV.fr.selfhosted })
      .click();
    await expect(page).toHaveURL(`${origin}/fr/selfhosted`);
  });

  test('the cloud CTA is never a dead link', async ({ page }) => {
    await page.goto('/');
    const cta = page.locator('header.site-nav .nav-inner .nav-deploy');
    if (LINKS.cloud === '') {
      // dev/preview build without PUBLIC_CLOUD_URL: disabled, marked, no href
      await expect(cta).toBeDisabled();
      await expect(cta).toHaveAttribute('data-cloud-unconfigured', '');
    } else {
      await expect(cta).toHaveAttribute('href', LINKS.cloud);
    }
  });

  for (const route of LANDING_ROUTES) {
    test(`canonical and hreflang pair on ${route}`, async ({ page }) => {
      await page.goto(route);
      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      const expected = `${LINKS.site}${route === '/' ? '/' : route.replace(/\/$/, '')}`;
      expect(canonical).toBe(expected);
      const alternates = await page
        .locator('link[rel="alternate"][hreflang]')
        .evaluateAll((els) =>
          els.map((e) => ({ lang: e.getAttribute('hreflang'), href: e.getAttribute('href') })),
        );
      const langs = alternates.map((a) => a.lang).sort();
      expect(langs).toEqual(['en', 'fr', 'x-default']);
      for (const a of alternates) {
        if (a.lang === 'en')
          expect(a.href).toBe(
            `${LINKS.site}${VARIANT_ROUTES.en[route.includes('selfhosted') ? 'selfhosted' : 'cloud']}`,
          );
        if (a.lang === 'fr')
          expect(a.href).toBe(
            `${LINKS.site}${VARIANT_ROUTES.fr[route.includes('selfhosted') ? 'selfhosted' : 'cloud']}`,
          );
      }
    });
  }
});
