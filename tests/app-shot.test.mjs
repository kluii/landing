// SPDX-License-Identifier: AGPL-3.0-only
// AppShot.astro contract (ADR-0015 / S-37): a <picture> with the 639 px breakpoint and
// explicit desktop/mobile dimensions; while no real capture ships, the placeholder flag
// is set and marked, and a NODE_ENV=production content-lint refuses the marker — a grey
// box must not reach production.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hasAppShotPlaceholder, hasCloudUnconfigured, lintText } from '../scripts/content-lint.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = readFileSync(join(ROOT, 'src', 'components', 'AppShot.astro'), 'utf8');

test('the capture files exist at the exact ratios Will will overwrite', () => {
  for (const [file, w, h] of [
    ['app-desktop.png', 1600, 1000],
    ['app-mobile.png', 390, 844],
  ]) {
    const p = join(ROOT, 'src', 'assets', file);
    assert.ok(existsSync(p), `src/assets/${file} missing`);
    const buf = readFileSync(p);
    assert.equal(buf.readUInt32BE(16), w, `${file} width`);
    assert.equal(buf.readUInt32BE(20), h, `${file} height`);
  }
});

test('the component renders a <picture> with the 639 px breakpoint and both dimensions', () => {
  assert.match(src, /<picture/);
  assert.match(src, /<source[\s\S]*?media=\{APP_SHOT_BREAKPOINT\}/);
  assert.match(src, /APP_SHOT_BREAKPOINT = '\(max-width: 639px\)'/);
  assert.match(src, /APP_SHOT_DESKTOP = \{ width: 1600, height: 1000 \}/);
  assert.match(src, /APP_SHOT_MOBILE = \{ width: 390, height: 844 \}/);
  assert.match(src, /width=\{APP_SHOT_DESKTOP\.width\}[\s\S]*?height=\{APP_SHOT_DESKTOP\.height\}/);
  assert.match(src, /width=\{APP_SHOT_MOBILE\.width\}[\s\S]*?height=\{APP_SHOT_MOBILE\.height\}/);
  assert.match(src, /loading="eager"/);
  assert.match(src, /fetchpriority="high"/);
  assert.match(src, /decoding="async"/);
  assert.match(src, /alt=\{copy\.plateAlt\}/);
});

test('the placeholder is a marked constant frame, not a fake UI', () => {
  assert.match(src, /export const APP_SHOT_PLACEHOLDER = true;/);
  assert.match(src, /data-app-shot="placeholder"/);
  assert.match(
    src,
    /<svg[\s\S]*?stroke="currentColor"/,
    'a stroke image glyph, no icon dependency',
  );
  assert.doesNotMatch(src, /linear-gradient|radial-gradient/, 'no gradient in the placeholder');
});

test('the placeholder marker fails a production lint and passes a dev lint', () => {
  const html = '<div data-app-shot="placeholder">App screenshot — desktop 1600×1000</div>';
  assert.ok(hasAppShotPlaceholder(html));
  assert.ok(!hasAppShotPlaceholder('<picture><img src="/app.png"></picture>'));
  // lintText itself only fails in production (module-level NODE_ENV), so assert the
  // predicate both ways through the exported rule functions.
  const failures = [];
  lintText('fixture.html', html, failures);
  assert.ok(
    !failures.some((f) => f.includes('app screenshot placeholder')),
    'the test process is not production: the placeholder must not fail here',
  );
  assert.ok(
    hasAppShotPlaceholder(html) &&
      hasCloudUnconfigured('<button data-cloud-unconfigured>x</button>'),
  );
});

test('the BoardMock is deleted and nothing imports it', () => {
  assert.ok(
    !existsSync(join(ROOT, 'src', 'components', 'BoardMock.astro')),
    'BoardMock.astro must be gone',
  );
  const walk = (dir) =>
    existsSync(dir)
      ? readdirSync(dir).flatMap((name) => {
          const p = join(dir, name);
          return statSync(p).isDirectory() ? walk(p) : /\.(astro|ts|mjs)$/.test(p) ? [p] : [];
        })
      : [];
  for (const file of [...walk(join(ROOT, 'src')), ...walk(join(ROOT, 'scripts'))]) {
    if (file.includes('generated')) continue;
    assert.doesNotMatch(
      readFileSync(file, 'utf8'),
      /BoardMock|BOARD_MOCK/,
      `${file} still references the mock`,
    );
  }
});
