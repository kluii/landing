// SPDX-License-Identifier: AGPL-3.0-only
// The claims manifest. Every number printed on the site comes from here, with a source
// in the application repository and the app version it was verified against.
// A release build (NODE_ENV=production) fails when a claim is unverified (docs/content.md §6).

export interface Claim<T> {
  value: T;
  /** Path in the app repository plus the expression or section, checkable in one minute. */
  source: string;
  /** Synced artifact in src/generated/ that `npm run test:claims` compares against. */
  artifact: string;
  /** App version the value was verified against. Must equal the documented app version. */
  verifiedAt: string;
  /** True while the app has not published the artifact yet; fails production builds only. */
  pending?: boolean;
}

export const CLAIMS = {
  appVersion: {
    value: '2.0.0',
    source: 'klui/package.json (version); pre-release: the --tag passed to scripts/sync-docs.mjs',
    artifact: 'app-version.txt',
    verifiedAt: '2.0.0',
  },
  tools: {
    value: 21,
    source:
      'klui/docs/mcp.md §3 tool table (21 rows); release: klui/server/src/mcp/tools/index.ts TOOLS.length',
    artifact: 'tools.json',
    verifiedAt: '2.0.0',
  },
  retentionDays: {
    value: 365,
    source: 'klui/docs/deployment.md env table, KLUI_RETENTION_EVENTS_DAYS default',
    artifact: 'env.json',
    verifiedAt: '2.0.0',
  },
  installMinutes: {
    value: 5,
    source:
      'klui/docs/deployment.md §1 Quickstart — human measurement on the pilot LXC, not yet recorded',
    artifact: 'install-time.txt',
    verifiedAt: '2.0.0',
    pending: true,
  },
  installInstance: {
    value: '2 vCPU / 2 GB',
    source:
      'klui/docs/deployment.md §1 Quickstart — instance the pilot measurement ran on, not yet recorded',
    artifact: 'install-time.txt',
    verifiedAt: '2.0.0',
    pending: true,
  },
  limits: {
    value: [
      'No attachments. Cards hold text, tags, an assignee and a date.',
      'No calendar or timeline view. The board is the board.',
      'No mobile app. The web UI works at 390 px; there is nothing to install.',
      'No presence or live cursors. You see changes, not people.',
    ],
    source: 'docs/content.md §8 — must be true for CLAIMS.appVersion',
    artifact: 'app-version.txt',
    verifiedAt: '2.0.0',
  },
} as const satisfies Record<string, Claim<unknown>>;

export type ClaimKey = keyof typeof CLAIMS;
