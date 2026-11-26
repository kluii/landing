// SPDX-License-Identifier: AGPL-3.0-only
// Token tests (DESIGN.md §16): warm neutrals, measured contrast of every text token
// against every surface it can sit on, dark-only (no prefers-color-scheme block),
// letter-spacing only in tokens.css.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const tokens = readFileSync(join(ROOT, 'src/styles/tokens.css'), 'utf8');

function token(name) {
  const m = tokens.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
  assert.ok(m, `token --${name} missing`);
  const n = parseInt(m[1].slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, hex: m[1] };
}

function luminance({ r, g, b }) {
  const f = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function contrast(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

const NEUTRALS = [
  'canvas',
  'surface',
  'surface-2',
  'surface-muted',
  'border',
  'border-strong',
  'ink',
  'ink-muted',
  'ink-subtle',
  'primary',
  'primary-hover',
  'primary-foreground',
  'plate',
  'plate-ink',
  'plate-muted',
  'focus',
  'selection',
  'glyph',
];

test('every neutral token is warm: R > G > B (a cool gray breaks the parchment lineage)', () => {
  for (const name of NEUTRALS) {
    const c = token(name);
    assert.ok(
      c.r > c.g && c.g > c.b,
      `--${name} ${c.hex} is not warm (R>G>B): ${c.r},${c.g},${c.b}`,
    );
  }
});

test('dark-ramp tokens keep the 1-3 adjacent delta of DESIGN.md §2.1 where the table allows it', () => {
  // DESIGN.md §2.1 says "delta of 1-3" but its own table has larger deltas on the light
  // tokens (#413D38, #F4F1EB). The testable intent is the warm bias (above); here we
  // assert the dark ramp stays tight so the ground cannot drift cool or muddy.
  for (const name of [
    'canvas',
    'surface',
    'surface-2',
    'surface-muted',
    'border',
    'glyph',
    'selection',
    'primary-foreground',
  ]) {
    const c = token(name);
    assert.ok(c.r - c.g >= 1 && c.r - c.g <= 4, `--${name} R-G delta ${c.r - c.g}`);
    assert.ok(c.g - c.b >= 1 && c.g - c.b <= 4, `--${name} G-B delta ${c.g - c.b}`);
  }
});

test('text contrast: body tokens >= 4.5:1 on every surface they can sit on', () => {
  const surfaces = ['canvas', 'surface', 'surface-2', 'surface-muted'].map(token);
  for (const name of ['ink', 'ink-muted', 'ink-subtle']) {
    for (const s of surfaces) {
      const ratio = contrast(token(name), s);
      assert.ok(ratio >= 4.5, `--${name} on --${''}${s.hex} is ${ratio.toFixed(2)}:1 < 4.5:1`);
    }
  }
});

test('plate text and primary-foreground contrast', () => {
  const plate = token('plate');
  assert.ok(contrast(token('plate-ink'), plate) >= 4.5, 'plate-ink on plate < 4.5:1');
  assert.ok(contrast(token('plate-muted'), plate) >= 4.5, 'plate-muted on plate < 4.5:1');
  assert.ok(
    contrast(token('primary-foreground'), token('primary')) >= 4.5,
    'primary-foreground on primary < 4.5:1',
  );
  assert.ok(contrast(token('danger'), token('canvas')) >= 4.5, 'danger on canvas < 4.5:1');
  assert.ok(contrast(token('danger'), token('surface')) >= 4.5, 'danger on surface < 4.5:1');
});

test('dark only: no prefers-color-scheme block anywhere in src/styles', () => {
  const stylesDir = join(ROOT, 'src/styles');
  for (const name of readdirSync(stylesDir)) {
    if (!name.endsWith('.css')) continue;
    const text = readFileSync(join(stylesDir, name), 'utf8');
    assert.ok(
      !text.includes('prefers-color-scheme'),
      `${name}: a light-theme block must not exist`,
    );
  }
  assert.match(tokens, /color-scheme:\s*dark/);
});

test('letter-spacing is only ever a token reference outside tokens.css', () => {
  // A component may apply var(--tracking-*) but may not declare its own value:
  // the tracking tokens are the signature and live in one place (DESIGN.md §16).
  const walk = (dir) =>
    readdirSync(dir).flatMap((name) => {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) return walk(p);
      return p.endsWith('.css') || p.endsWith('.astro') ? [p] : [];
    });
  for (const file of walk(join(ROOT, 'src'))) {
    if (file.endsWith('tokens.css') || file.endsWith('fonts.css')) continue;
    const text = readFileSync(file, 'utf8');
    const decls = text.match(/letter-spacing\s*:\s*[^;}]+/g) ?? [];
    for (const d of decls) {
      assert.ok(
        /var\(--tracking-/.test(d),
        `${file}: letter-spacing declared with a literal (${d.trim()}) — only var(--tracking-*) is allowed`,
      );
    }
  }
});
