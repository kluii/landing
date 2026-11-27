// SPDX-License-Identifier: AGPL-3.0-only
// The CTA case gate (scripts/content-lint.mjs): 'Cloud' is a proper noun in the CTA
// labels — the production build used to fail on 'Open Klui Cloud' because only 'Klui'
// was whitelisted. A genuinely title-cased word must still fail.
import test from 'node:test';
import assert from 'node:assert/strict';
import { ctaCaseOk } from '../scripts/content-lint.mjs';
import * as copy from '../src/data/copy.ts';

test('Open Klui Cloud is sentence case (the production-build regression)', () => {
  assert.ok(ctaCaseOk('Open Klui Cloud'));
  assert.ok(ctaCaseOk('Ouvrir Klui Cloud'));
});

test('title-cased and broken labels still fail', () => {
  assert.ok(!ctaCaseOk('Copy The Install Command'));
  assert.ok(!ctaCaseOk('Open Klui Cloud.'));
  assert.ok(!ctaCaseOk('open klui cloud'));
});

test('every CTA label in copy.ts passes the sentence-case rule', () => {
  const labels = [];
  const visit = (node) => {
    if (Array.isArray(node)) {
      for (const v of node) visit(v);
      return;
    }
    if (node && typeof node === 'object') {
      for (const [k, v] of Object.entries(node)) {
        if (k === 'heroPrimary' || k === 'installCta' || k === 'cloudCta') labels.push(v);
        else if (typeof v === 'object' && v !== null) visit(v);
      }
    }
  };
  visit(copy);
  // The walk must have actually found the CTA labels, or the test proves nothing.
  assert.ok(labels.length >= 4, 'expected CTA labels in copy.ts, found none');
  for (const label of labels) {
    assert.ok(ctaCaseOk(label), `CTA label not sentence case: "${label}"`);
  }
});
