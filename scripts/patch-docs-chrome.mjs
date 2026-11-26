// SPDX-License-Identifier: AGPL-3.0-only
// Post-build chrome patch: Starlight renders a desktop and a mobile TOC nav whose
// accessible names are both "On this page" (axe landmark-unique). Give the mobile one
// a distinct aria-label. This touches Starlight chrome only, never markdown content.
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(import.meta.url), '..', '..');
const DIST = join(ROOT, 'dist');

if (!statSync(DIST, { throwIfNoEntry: false })?.isDirectory()) {
  console.error('patch-docs-chrome: dist/ missing — run npm run build first');
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

const MOBILE_TOC_NAV = /<nav aria-labelledby="starlight__on-this-page--mobile"([^>]*)>/g;

let patched = 0;
for (const file of walk(DIST)) {
  const html = readFileSync(file, 'utf8');
  // aria-labelledby would win over aria-label in the accessible-name computation, so the
  // patched nav carries only the distinct aria-label.
  const next = html.replace(MOBILE_TOC_NAV, '<nav aria-label="On this page, current section"$1>');
  if (next !== html) {
    writeFileSync(file, next);
    patched += 1;
  }
}
console.log(`patch-docs-chrome: patched mobile TOC nav in ${patched} pages`);
