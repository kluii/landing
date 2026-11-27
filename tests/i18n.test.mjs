// SPDX-License-Identifier: AGPL-3.0-only
// L3-04 + ADR-0015: every EN page has an FR twin (except the generated app docs,
// documented exception), both landing variants exist as route pairs, the hreflang
// mapping is total, and the copy dictionary has the same shape in EN and FR for each
// variant — a key present in one language only fails here.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LANDING, NAV, FOOTER } from '../src/data/copy.ts';
import { VARIANT_ROUTES, VARIANTS, landingPaths } from '../src/data/variants.ts';

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
    exists('pages', 'selfhosted.astro') && exists('pages', 'fr', 'selfhosted.astro'),
    'self-hosted landing pair',
  );
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

test('both landing variants exist as en/fr route pairs with a total hreflang mapping', () => {
  for (const lang of ['en', 'fr']) {
    for (const variant of VARIANTS) {
      const route = VARIANT_ROUTES[lang][variant];
      const file = join(
        ROOT,
        'src',
        'pages',
        ...(lang === 'fr' ? ['fr'] : []),
        ...(variant === 'selfhosted' ? ['selfhosted.astro'] : ['index.astro']),
      );
      assert.ok(existsSync(file), `missing route file for ${lang}/${variant}: ${file}`);
      const { path, frPath, enPath } = landingPaths(lang, variant);
      assert.equal(path, route, `landingPaths(${lang}, ${variant}).path`);
      // every landing route declares exactly one twin of the other language
      assert.ok(
        lang === 'en'
          ? frPath === VARIANT_ROUTES.fr[variant]
          : enPath === VARIANT_ROUTES.en[variant],
      );
      assert.ok(
        !(lang === 'en' && enPath) && !(lang === 'fr' && frPath),
        'no same-language alternate',
      );
    }
  }
});

test('the landing copy dictionary has identical key shape in EN and FR, per variant', () => {
  const keyPaths = (value, prefix = '') =>
    Object.entries(value).flatMap(([k, v]) => {
      const path = prefix === '' ? k : `${prefix}.${k}`;
      if (typeof v !== 'object' || v === null) return [path];
      if (Array.isArray(v))
        return v.flatMap((item, i) =>
          typeof item === 'object' && item !== null
            ? keyPaths(item, `${path}[${i}]`)
            : [`${path}[${i}]`],
        );
      return keyPaths(v, path);
    });
  for (const variant of VARIANTS) {
    const en = keyPaths(LANDING.en[variant]).sort();
    const fr = keyPaths(LANDING.fr[variant]).sort();
    assert.deepEqual(
      fr,
      en,
      `LANDING.fr.${variant} key shape differs from EN (a key present in one language only)`,
    );
  }
  for (const dict of [NAV, FOOTER]) {
    assert.deepEqual(
      keyPaths(dict.fr).sort(),
      keyPaths(dict.en).sort(),
      'chrome copy shape differs EN/FR',
    );
  }
});

test('FR pages set lang="fr" and the landing passes variant-aware hreflang paths', () => {
  const fr = readFileSync(src('pages', 'fr', 'index.astro'), 'utf8');
  assert.match(fr, /lang="fr"/);
  assert.match(fr, /variant="cloud"/);
  const landing = readFileSync(src('components', 'Landing.astro'), 'utf8');
  assert.match(landing, /landingPaths\(lang, variant\)/);
  assert.match(landing, /frPath=\{paths\.frPath\}/);
  assert.match(landing, /enPath=\{paths\.enPath\}/);
});
