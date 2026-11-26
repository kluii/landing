// SPDX-License-Identifier: AGPL-3.0-only
// Data for the board mock illustration. Card titles are real work from the pilot;
// column names come from the app's `classic` template (To Do / Doing / Done);
// tag colours are the app's stored tag hexes (colour inside the illustration only).

export interface MockCard {
  title: string;
  tag?: { name: string; color: string };
  due?: string;
  initials?: string;
  done?: boolean;
}

export interface MockColumn {
  name: string;
  cards: MockCard[];
}

export const BOARD_MOCK: MockColumn[] = [
  {
    name: 'To Do',
    cards: [
      { title: 'Fix the drop index', tag: { name: 'api', color: '#8B5CF6' } },
      { title: 'Moderation queue', due: '2026-12-02' },
    ],
  },
  {
    name: 'Doing',
    cards: [
      { title: 'Wire the digest', initials: 'W' },
      { title: 'Export markdown', tag: { name: 'core', color: '#2563EB' } },
    ],
  },
  {
    name: 'Done',
    cards: [{ title: 'Ship the retro board', done: true }],
  },
];

export const PLATE_CAPTION = 'Plate 1 — a board from the pilot, five cards, one finished.';

// Rendered close-out summary example, from the app's docs/features/close-out.md §2.
export const CLOSE_OUT = {
  title: 'Retro S2 — closed 26 November 2026',
  outcome: '18 of 24 cards done in 46 days · 3 columns · 4 members · 2 agents',
  done: ['Wire the digest — Hermes — 14 Nov', 'Export markdown — Will — 21 Nov'],
  remaining: ['Doing: Moderation queue — unassigned'],
  people: 'Will 84 · Hermes (agent) 61 · "client" 4',
  rhythm: '████▆▃▂',
} as const;
