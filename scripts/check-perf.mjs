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

const home = join(DIST, 'index.html');
const html = readFileSync(home, 'utf8');

let js = 0;
let jsFiles = 0;
for (const m of html.matchAll(/<script[^>]+src="([^"]+)"/g)) {
  const p = join(DIST, m[1].replace(/^\//, ''));
  if (existsSync(p)) {
    js += transferred(p);
    jsFiles += 1;
  }
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

let fonts = 0;
const fontsDir = join(ROOT, 'public', 'fonts');
if (existsSync(fontsDir)) {
  for (const name of readdirSync(fontsDir)) fonts += statSync(join(fontsDir, name)).size;
}

const failures = [];
if (js > JS_BUDGET) failures.push(`landing JS ${js} B > ${JS_BUDGET} B budget`);
if (css > CSS_BUDGET) failures.push(`landing CSS ${css} B > ${CSS_BUDGET} B budget`);
if (fonts > FONT_BUDGET) failures.push(`font payload ${fonts} B > ${FONT_BUDGET} B budget`);

console.log(
  `check-perf: landing JS ${js} B (${jsFiles} files, budget ${JS_BUDGET}) · CSS ${css} B (${cssFiles} files, budget ${CSS_BUDGET}) · fonts ${fonts} B (budget ${FONT_BUDGET})`,
);
if (failures.length > 0) {
  for (const f of failures) console.error(`check-perf: FAIL ${f}`);
  process.exit(1);
}
console.log(
  'check-perf: budgets ok (LCP/CLS/Lighthouse asserted by the CI Lighthouse job, not here)',
);
