// SPDX-License-Identifier: AGPL-3.0-only
// Data for the rendered close-out summary example on the self-hosted landing,
// from the app's docs/features/close-out.md §2. The board mock is gone (ADR-0015):
// the hero plate now holds AppShot.astro, the real capture slot.

export const CLOSE_OUT = {
  title: 'Retro S2 — closed 26 November 2026',
  outcome: '18 of 24 cards done in 46 days · 3 columns · 4 members · 2 agents',
  done: ['Wire the digest — Hermes — 14 Nov', 'Export markdown — Will — 21 Nov'],
  remaining: ['Doing: Moderation queue — unassigned'],
  people: 'Will 84 · Hermes (agent) 61 · "client" 4',
  rhythm: '█▌▃▂',
} as const;
