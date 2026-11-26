// SPDX-License-Identifier: AGPL-3.0-only
// L3-04 exit: every EN page has an FR twin, except the generated app docs
// (documented exception — the app repository owns those translations).
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = (...p) => join(ROOT, 'src', ...p);
const exists = (...p) => existsSync(src(...p));

function walk(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

test('landing, blog and legal EN pages have FR twins', () => {
  assert.ok(exists('pages', 'index.astro') && exists('pages', 'fr', 'index.astro'), 'landing');
  assert.ok(
    exists('pages', 'blog', 'index.astro') && exists('pages', 'fr', 'blog', 'index.astro'),
    'blog index',
  );
  assert.ok(
    exists('pages', 'legal', 'privacy.astro') && exists('pages', 'legal', 'confidentialite.astro'),
    'privacy EN/FR',
  );
  // /legal/notices is FR-only by design (mentions légales are a French legal page)
  assert.ok(exists('pages', 'legal', 'notices.astro'), 'notices FR-only');
});

test('every site-only EN doc has a FR twin and vice versa', () => {
  const en = walk(src('site-docs')).filter((f) => !f.includes(`${join('site-docs', 'fr')}`));
  const fr = walk(src('site-docs', 'fr'));
  const base = (f) =>
    f
      .split('/')
      .pop()
      .replace(/\.mdx?$/, '');
  const enNames = new Set(en.map(base));
  const frNames = new Set(fr.map(base));
  for (const name of enNames) assert.ok(frNames.has(name), `missing FR twin for site-docs/${name}`);
  for (const name of frNames) assert.ok(enNames.has(name), `FR twin without EN source: ${name}`);
});

test('generated app docs stay EN-only (documented exception)', () => {
  const generated = walk(src('content', 'docs', 'docs', 'v2')).filter((f) =>
    readFileSync(f, 'utf8').includes('generated: true'),
  );
  assert.ok(generated.length > 0, 'expected generated v2 docs');
  const frNames = new Set(
    walk(src('site-docs', 'fr')).map((f) =>
      f
        .split('/')
        .pop()
        .replace(/\.mdx?$/, ''),
    ),
  );
  for (const f of generated) {
    const name = f
      .split('/')
      .pop()
      .replace(/\.mdx?$/, '');
    assert.ok(!frNames.has(name), `generated app doc must not have a site FR twin: ${name}`);
  }
});

test('FR pages set lang="fr" and declare an EN alternate where a twin exists', () => {
  const fr = readFileSync(src('pages', 'fr', 'index.astro'), 'utf8');
  assert.match(fr, /lang="fr"/);
  const landing = readFileSync(src('components', 'Landing.astro'), 'utf8');
  assert.match(landing, /frPath=\{lang === 'en' \? '\/fr\/' : undefined\}/);
  assert.match(landing, /enPath=\{lang === 'fr' \? '\/' : undefined\}/);
});
