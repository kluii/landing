// SPDX-License-Identifier: AGPL-3.0-only
// axe on every built route, zero violations (docs/testing.md §6). Runs on dist/, not dev.
// axe is evaluated inside each jsdom window so its globals are the page's own.
// color-contrast is disabled in the jsdom run (no layout engine) and covered
// deterministically by tests/tokens.test.mjs against the real surfaces.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { JSDOM } from 'jsdom';

const require = createRequire(import.meta.url);
const ROOT = join(fileURLToPath(import.meta.url), '..', '..');
const DIST = join(ROOT, 'dist');
const AXE_SOURCE = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');

if (!statSync(DIST, { throwIfNoEntry: false })?.isDirectory()) {
  console.error('check-a11y: dist/ missing — run npm run build first');
  process.exit(1);
}

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (p.endsWith('.html')) out.push(p);
  }
  return out;
}

const files = walk(DIST);
let violations = 0;
let notes = 0;
let pages = 0;

for (const file of files) {
  const rel = file.slice(DIST.length + 1);
  const html = readFileSync(file, 'utf8');
  const dom = new JSDOM(html, {
    url: `https://klui.wyliam.dev/${rel}`,
    runScripts: 'outside-only',
  });
  dom.window.eval(AXE_SOURCE);
  const results = await dom.window.axe.run(dom.window.document, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] },
    disableRules: ['color-contrast'],
  });
  pages += 1;
  for (const v of results.violations) {
    const line = `axe: ${rel}: ${v.id} (${v.impact}) — ${v.help}`;
    if (rel.startsWith('docs/')) {
      // Synced app docs are owned by kluii/app; violations in them are reported, not edited here.
      notes += 1;
      console.warn(`check-a11y: note ${line}`);
    } else {
      violations += 1;
      console.error(line);
    }
    for (const node of v.nodes.slice(0, 3)) console.error(`    ${node.target.join(' ')}`);
  }
}

// Static a11y facts that need no browser (L4-04): every real page has a skip link to
// #main, and the built CSS carries the reduced-motion, focus-visible and forced-colors
// rules. The keyboard walk itself runs in the L4-04 manual pass (recorded in verify).
const cssText = readdirSync(join(DIST, '_astro'))
  .filter((f) => f.endsWith('.css'))
  .map((f) => readFileSync(join(DIST, '_astro', f), 'utf8'))
  .join('\n');
for (const file of files) {
  const rel = file.slice(DIST.length + 1);
  const html = readFileSync(file, 'utf8');
  if (html.includes('http-equiv="refresh"')) continue;
  if (!/class="[^"]*skip-link[^"]*"[^>]*href="#(main|_top)"/.test(html)) {
    console.error(`axe-static: ${rel}: no skip link to #main`);
    violations += 1;
  }
  // L5: exactly one h1 per page (the docs fix hides Starlight's title when the synced
  // markdown carries its own H1 — a double h1 on /docs/v2/ shipped in L4).
  const h1Count = (html.match(/<h1[\s>]/g) ?? []).length;
  if (h1Count !== 1) {
    console.error(`axe-static: ${rel}: ${h1Count} h1 elements (expected exactly 1)`);
    violations += 1;
  }
}
if (!/prefers-reduced-motion/.test(cssText)) {
  console.error('axe-static: no prefers-reduced-motion rule in built CSS');
  violations += 1;
}
if (!/:focus-visible/.test(cssText)) {
  console.error('axe-static: no :focus-visible rule in built CSS');
  violations += 1;
}
if (!/forced-colors/.test(cssText)) {
  console.error('axe-static: no forced-colors rule in built CSS');
  violations += 1;
}

if (violations > 0) {
  console.error(
    `check-a11y: ${violations} violation(s) on site-owned pages across ${pages} routes`,
  );
  process.exit(1);
}
console.log(
  `check-a11y: axe on ${pages} built routes, 0 violations on site-owned pages (color-contrast covered by tests/tokens.test.mjs)${notes ? `, ${notes} note(s) in synced app docs (owned by kluii/app)` : ''}`,
);
