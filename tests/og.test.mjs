// SPDX-License-Identifier: AGPL-3.0-only
// OG geometry (docs/testing.md §7): for one-, two- and three-line titles the last title
// baseline is at least 40 px above the footer baseline, and the title block never
// overlaps the wordmark baseline.
import test from 'node:test';
import assert from 'node:assert/strict';
import { layoutTitle, wrapTitle, OG_H } from '../scripts/og-images.mjs';

const TITLES = {
  one: 'Klui — a kanban for projects that end',
  two: 'Quickstart — one compose file to a working board in under five minutes',
  three:
    'MCP reference — the 21 tools, their arguments, per-board keys, and the JSON-RPC 2.0 error codes',
};

test('titles wrap to at most three lines', () => {
  for (const t of Object.values(TITLES)) {
    assert.ok(wrapTitle(t).length <= 3, `wrapped to ${wrapTitle(t).length} lines: ${t}`);
  }
});

test('last title baseline is at least 40 px above the footer baseline', () => {
  for (const [name, t] of Object.entries(TITLES)) {
    const { baselines, footerBaseline } = layoutTitle(t);
    const last = baselines[baselines.length - 1];
    assert.ok(
      footerBaseline - last >= 40,
      `${name}: gap ${footerBaseline - last} px < 40 px (title may overlap the footer)`,
    );
  }
});

test('title block starts below the wordmark and stays on the canvas', () => {
  for (const [name, t] of Object.entries(TITLES)) {
    const { baselines, wordmarkBaseline } = layoutTitle(t);
    assert.ok(baselines[0] > wordmarkBaseline, `${name}: title overlaps the wordmark`);
    assert.ok(baselines[baselines.length - 1] < OG_H, `${name}: title runs off the canvas`);
  }
});
