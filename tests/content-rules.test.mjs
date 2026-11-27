// SPDX-License-Identifier: AGPL-3.0-only
// L3-05 exit: every content rule fails on a broken fixture (docs/testing.md §4,
// ROADMAP L3-05). The fixtures are the strings below — each rule function from
// scripts/content-lint.mjs is asserted to flag its violation and to pass its
// compliant counterpart.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ctaCaseOk,
  ctaLabels,
  findBanned,
  findEmoji,
  hasFooter,
  hasPlaceholder,
  hasTodoMarker,
  lintText,
} from '../scripts/content-lint.mjs';

test('emoji rule flags an emoji and passes typographic arrows', () => {
  assert.deepEqual(findEmoji('Ship it \u{1F680} now'), ['U+1f680']);
  assert.deepEqual(findEmoji('next \u2192 then \u2190'), []);
});

test('banned-word rule flags marketing words, passes honest copy', () => {
  assert.ok(findBanned('The seamless experience').includes('seamless'));
  assert.ok(findBanned('unhackable security').includes('unhackable'));
  assert.deepEqual(findBanned('A fast, self-hosted board'), []);
});

test('placeholder rule flags {{OPERATOR}} style leftovers', () => {
  assert.ok(hasPlaceholder('Hosted in {{HOSTING_REGION}}'));
  assert.ok(!hasPlaceholder('Hosted in the EU'));
});

test('TODO( marker rule flags an unfinished generated post', () => {
  assert.ok(hasTodoMarker('TODO(hand-written): why this release exists'));
  assert.ok(!hasTodoMarker('Two sentences on why this release exists.'));
});

test('footer rule requires the Made with <3 line with its link', () => {
  assert.ok(hasFooter('<a href="https://wyliam.dev">Made with &lt;3 by Wyliam</a>'));
  assert.ok(!hasFooter('<p>Made with &lt;3 by Wyliam</p>'));
  assert.ok(!hasFooter('<footer>nothing here</footer>'));
});

test('CTA labels must be sentence case', () => {
  assert.ok(ctaCaseOk('Copy the install command'));
  assert.ok(ctaCaseOk('Deploy'));
  assert.ok(ctaCaseOk('MCP reference'));
  assert.ok(ctaCaseOk('Read the Klui permissions model'));
  assert.ok(!ctaCaseOk('COPY THE COMMAND'));
  assert.ok(!ctaCaseOk('DEPLOY'));
  assert.ok(!ctaCaseOk('Copy The Install Command Every Time'));
  assert.ok(!ctaCaseOk('Copy the install command.'));
  assert.ok(!ctaCaseOk('copy the install command'));
});

test('ctaLabels extracts button and pill labels from built HTML', () => {
  const html =
    '<button class="copy-btn">Copy the install command<span aria-hidden="true"></span></button>' +
    '<a class="btn-ghost" href="https://demo.example">Open the live demo board <span>\u2192</span></a>' +
    '<a class="nav-link" href="/docs">Docs</a>';
  assert.deepEqual(ctaLabels(html), [
    'Copy the install command',
    'Open the live demo board \u2192',
  ]);
});

test('lintText pushes a failure per violation', () => {
  const failures = [];
  lintText('fixture.html', 'seamless \u{1F525} {{CONTACT}}', failures);
  assert.ok(failures.some((f) => f.includes('emoji U+1f525')));
  assert.ok(failures.some((f) => f.includes('banned word "seamless"')));
  // placeholders only fail in production; the test process is not production
  assert.ok(!failures.some((f) => f.includes('placeholder')));
});
