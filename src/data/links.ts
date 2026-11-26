// SPDX-License-Identifier: AGPL-3.0-only
// Every external URL lives here. No URL is typed twice in a component.

// import.meta.env exists under Astro/Vite; plain Node (scripts, tests) sees undefined.
const env = (import.meta as { env?: Record<string, string | undefined> }).env ?? {};

export const LINKS = {
  site: env.PUBLIC_SITE_URL ?? 'https://klui.wyliam.dev',
  github: env.PUBLIC_GITHUB_URL ?? 'https://github.com/kluii/app',
  demo: env.PUBLIC_DEMO_URL ?? '',
  wyliam: 'https://wyliam.dev',
  licence: 'https://www.gnu.org/licenses/agpl-3.0.html',
  cnil: 'https://www.cnil.fr',
} as const;
