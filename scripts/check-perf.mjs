// SPDX-License-Identifier: AGPL-3.0-only
// Budget gate on dist/ (docs/testing.md §5): JS and CSS transferred on the landing,
// font payload. LCP/CLS/Lighthouse are measured by the CI Lighthouse job on the served
// build — this gate fails on size budgets only, and never on an unmeasured number.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(import.meta.url), '..', '..');
const DIST = join(ROOT, 'dist');

if (!existsSync(DIST)) {
  console.error('check-perf: dist/ missing — run npm run build first');
  process.exit(1);
}

const JS_BUDGET = 15 * 1024;
const CSS_BUDGET = 20 * 1024;
const FONT_BUDGET = 150 * 1024;

function transferred(path) {
  return gzipSync(readFileSync(path)).length;
}

// Both landing routes carry the budget: / (cloud) and /selfhosted (ADR-0015).
const landingPages = ['index.html', 'selfhosted/index.html'];
const budgets = {};
for (const rel of landingPages) {
  const page = join(DIST, rel);
  if (!existsSync(page)) {
    console.error(`check-perf: dist/${rel} missing — run npm run build first`);
    process.exit(1);
  }
  const html = readFileSync(page, 'utf8');

  let js = 0;
  let jsFiles = 0;
  for (const m of html.matchAll(/<script[^>]+src="([^"]+)"/g)) {
    const p = join(DIST, m[1].replace(/^\//, ''));
    if (existsSync(p)) {
      js += transferred(p);
      jsFiles += 1;
    }
  }
  // Inline module scripts count too: the budget is transferred JS, not just files.
  for (const m of html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)) {
    const body = m[1].trim();
    if (body !== '') js += gzipSync(Buffer.from(body)).length;
  }

  let css = 0;
  let cssFiles = 0;
  for (const m of html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g)) {
    const p = join(DIST, m[1].replace(/^\//, ''));
    if (existsSync(p)) {
      css += transferred(p);
      cssFiles += 1;
    }
  }
  budgets[rel] = { js, jsFiles, css, cssFiles };
}

let fonts = 0;
const fontsDir = join(ROOT, 'public', 'fonts');
if (existsSync(fontsDir)) {
  for (const name of readdirSync(fontsDir)) fonts += statSync(join(fontsDir, name)).size;
}

const failures = [];
for (const [rel, b] of Object.entries(budgets)) {
  if (b.js > JS_BUDGET) failures.push(`${rel}: landing JS ${b.js} B > ${JS_BUDGET} B budget`);
  if (b.css > CSS_BUDGET) failures.push(`${rel}: landing CSS ${b.css} B > ${CSS_BUDGET} B budget`);
}
if (fonts > FONT_BUDGET) failures.push(`font payload ${fonts} B > ${FONT_BUDGET} B budget`);

for (const [rel, b] of Object.entries(budgets)) {
  console.log(
    `check-perf: /${rel === 'index.html' ? '' : rel.replace('/index.html', '')} JS ${b.js} B transferred (${b.jsFiles} external files + inline, budget ${JS_BUDGET}) · CSS ${b.css} B (${b.cssFiles} files, budget ${CSS_BUDGET})`,
  );
}
console.log(`check-perf: fonts ${fonts} B (budget ${FONT_BUDGET})`);
if (failures.length > 0) {
  for (const f of failures) console.error(`check-perf: FAIL ${f}`);
  process.exit(1);
}
console.log(
  'check-perf: budgets ok (LCP/CLS/Lighthouse asserted by the CI Lighthouse job, not here)',
);
