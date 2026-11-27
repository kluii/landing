// SPDX-License-Identifier: AGPL-3.0-only
// sync-docs link rewriting: relative links that carry an anchor (#section) must keep
// the anchor on the emitted site path. The old code resolved `foo.md#section` as a
// filename, so every anchored relative link failed the expected-set check.
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { rewriteLinks } from '../scripts/sync-docs.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const expectedSet = new Set(['api.md', 'page.md', 'features/two.md']);

test('a relative link with an anchor keeps the anchor on the site path', () => {
  const out = rewriteLinks('[x](../api.md#tools)', 'features/two.md', expectedSet, 'v2');
  assert.equal(out, '[x](/docs/v2/api#tools)');
});

test('a ./ relative link with an anchor keeps the anchor', () => {
  const out = rewriteLinks('[y](./page.md#heading-two)', 'features/two.md', expectedSet, 'v2');
  assert.equal(out, '[y](/docs/v2/page#heading-two)');
});

test('an anchored link to an unknown file still fails', () => {
  // fail() calls process.exit(1), so the negative case runs in a subprocess.
  const code = spawnSync(
    process.execPath,
    ['--input-type=module', '-e', `
      import { rewriteLinks } from ${JSON.stringify(join(ROOT, 'scripts', 'sync-docs.mjs'))};
      rewriteLinks('[z](../missing.md#x)', 'features/two.md', new Set(['api.md']), 'v2');
    `],
    { encoding: 'utf8' },
  );
  assert.notEqual(code.status, 0);
  assert.match(code.stderr, /not in the expected set/);
});
