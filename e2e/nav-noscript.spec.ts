// SPDX-License-Identifier: AGPL-3.0-only
// The no-JS navigation at 390 px: with JavaScript disabled the hamburger never
// opens, so the server-rendered fallback nav must be visible and must reach the
// other landing. Guards the mobile hide rule from swallowing the fallback.
import { test, expect } from '@playwright/test';

test.use({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });

test.describe('no-JS navigation at 390px', () => {
  test('the fallback nav is visible on the cloud landing and links to self-hosted', async ({
    page,
  }) => {
    await page.goto('/');
    const fallback = page.locator('header nav.nav-noscript');
    await expect(fallback).toBeVisible();
    const link = fallback.locator('a', { hasText: 'Self-hosted' });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', '/selfhosted');
  });

  test('the cross-linked landing is reachable with JS disabled', async ({ page }) => {
    await page.goto('/');
    const fallback = page.locator('header nav.nav-noscript');
    await fallback.locator('a', { hasText: 'Self-hosted' }).click();
    await expect(page).toHaveURL(/\/selfhosted$/);
    await expect(page.locator('header nav.nav-noscript')).toBeVisible();
  });
});
