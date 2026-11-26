// SPDX-License-Identifier: AGPL-3.0-only
// Post-build chrome patch, two fixes, both in Starlight/Astro chrome only:
// 1. Starlight renders a desktop and a mobile TOC nav whose accessible names are both
//    "On this page" (axe landmark-unique). The mobile one gets a distinct aria-label.
// 2. Astro's redirect stubs are not well-formed documents: no <html lang>, no <head>
//    wrapper, and the body link sits outside any landmark (axe html-has-lang + region).
//    Rebuild them as a minimal valid page that still meta-refreshes to the target.
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
const REDIRECT_STUB = /^<!doctype html>([\s\S]*?)<body>([\s\S]*?)<\/body>\s*$/;

function patchRedirectStub(html) {
  const m = html.match(REDIRECT_STUB);
  if (!m || !m[1].includes('http-equiv="refresh"')) return html;
  const head = m[1].trim();
  const body = m[2].trim();
  // The footer rule applies to every built page, redirect stubs included (PROMPT §14),
  // so the rebuilt stub carries the same footer line as any other page.
  const footer =
    '<footer><p><a href="https://wyliam.dev" rel="noopener">Made with &lt;3 by Wyliam</a></p></footer>';
  return (
    '<!doctype html><html lang="en"><head>' +
    head +
    '</head><body><main id="main">' +
    body +
    `</main>${footer}</body></html>`
  );
}

let patchedNav = 0;
let patchedRedirects = 0;
for (const file of walk(DIST)) {
  const html = readFileSync(file, 'utf8');
  // aria-labelledby would win over aria-label in the accessible-name computation, so the
  // patched nav carries only the distinct aria-label.
  let next = html.replace(MOBILE_TOC_NAV, '<nav aria-label="On this page, current section"$1>');
  if (next !== html) patchedNav += 1;
  const stub = patchRedirectStub(next);
  if (stub !== next) {
    next = stub;
    patchedRedirects += 1;
  }
  if (next !== html) writeFileSync(file, next);
}
console.log(
  `patch-docs-chrome: patched mobile TOC nav in ${patchedNav} pages, rebuilt ${patchedRedirects} redirect stub(s)`,
);
