// SPDX-License-Identifier: AGPL-3.0-only
// Every external URL lives here. No URL is typed twice in a component.

// import.meta.env exists under Astro/Vite; plain Node (scripts, tests) sees undefined.
const env = (import.meta as { env?: Record<string, string | undefined> }).env ?? {};

// The FR routes shipped in L3-04 and are asserted by tests/i18n.test.mjs, so this is a
// constant now: the old existsSync probe ran on the bundled import.meta.url at build
// time (dist/_astro/...), evaluated to false, and silently linked the FR nav to the
// EN docs.
export const HAS_FR_ROUTES = true;

export const LINKS = {
  site: env.PUBLIC_SITE_URL ?? 'https://klui.wyliam.dev',
  github: env.PUBLIC_GITHUB_URL ?? 'https://github.com/kluii/app',
  demo: env.PUBLIC_DEMO_URL ?? '',
  // The Klui Cloud address. Never guessed, never '#': unset in dev the CTA renders
  // disabled; unset in a production build the gate fails (ADR-0015 / S-36, .env.example).
  cloud: env.PUBLIC_CLOUD_URL ?? '',
  wyliam: 'https://wyliam.dev',
  licence: 'https://www.gnu.org/licenses/agpl-3.0.html',
  cnil: 'https://www.cnil.fr',
} as const;
