// SPDX-License-Identifier: AGPL-3.0-only
// L0-01 exit: every .astro/.ts/.mjs starts with the SPDX line.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SPDX = 'SPDX-License-Identifier: AGPL-3.0-only';

function walk(dir, skip = []) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (skip.some((s) => p.endsWith(s))) continue;
      out.push(...walk(p, skip));
    } else if (/\.(astro|ts|mjs)$/.test(p)) out.push(p);
  }
  return out;
}

const files = [
  ...walk(join(ROOT, 'src'), ['src/generated', 'docs/v1', 'docs/v2']),
  ...walk(join(ROOT, 'scripts')),
  ...walk(join(ROOT, 'tests')),
  join(ROOT, 'astro.config.mjs'),
  join(ROOT, 'eslint.config.mjs'),
];

test('every source file carries the SPDX line (first line, or first line of the frontmatter for .astro)', () => {
  assert.ok(files.length >= 10, `expected source files, found ${files.length}`);
  for (const file of files) {
    const head = readFileSync(file, 'utf8').split('\n').slice(0, 3).join('\n');
    // .astro files may open with `---` (Starlight overrides require it); the SPDX line
    // then sits inside the frontmatter. .ts/.mjs must start with it.
    if (file.endsWith('.astro')) {
      assert.ok(
        head.includes(SPDX),
        `${file.slice(ROOT.length + 1)} carries no SPDX line in its first 3 lines`,
      );
    } else {
      const first = readFileSync(file, 'utf8').split('\n', 1)[0] ?? '';
      assert.ok(
        first.includes(SPDX),
        `${file.slice(ROOT.length + 1)} does not start with the SPDX line`,
      );
    }
  }
});
