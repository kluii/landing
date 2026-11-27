// SPDX-License-Identifier: AGPL-3.0-only
// Playwright e2e for the landing split and the responsive guard (docs/verify/l5.md).
// The webServer serves the built dist/ via `astro preview` on loopback only.
// E2E_CHROMIUM_PATH overrides the browser executable (sandbox chromium with its own
// runtime libs); CI uses the browser `npx playwright install chromium` provides.
import { defineConfig } from '@playwright/test';

const BASE = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:4321';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 4,
  reporter: [['list']],
  use: {
    baseURL: BASE,
    launchOptions: {
      ...(process.env.E2E_CHROMIUM_PATH ? { executablePath: process.env.E2E_CHROMIUM_PATH } : {}),
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    },
  },
  webServer: {
    command: 'npm run preview',
    url: BASE,
    stdout: 'pipe',
    stderr: 'pipe',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
