// SPDX-License-Identifier: AGPL-3.0-only
// Landing assertions on the built page (L1 wave exits). Runs after npm run build.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CLAIMS } from '../src/data/claims.ts';
import { INSTALL_COMMANDS, MCP_CONFIG } from '../src/data/snippets.ts';
import { LINKS } from '../src/data/links.ts';

const ROOT = join(fileURLToPath(import.meta.url), '..', '..');
const home = join(ROOT, 'dist', 'index.html');
if (!existsSync(home)) {
  console.error('check-landing: dist/index.html missing — run npm run build first');
  process.exit(1);
}
const html = readFileSync(home, 'utf8');
const failures = [];

function unescape(s) {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

// L1-05: the rendered snippet is byte-identical to snippets.ts.
const pres = [
  ...html.matchAll(/<pre class="code-body"[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/g),
].map((m) => unescape(m[1]));
if (!pres.includes(INSTALL_COMMANDS)) {
  failures.push('install snippet in the built page is not byte-identical to src/data/snippets.ts');
}

// L1-07: the JSON config block parses and carries a placeholder key, never a token.
const jsonBlock = pres.find((p) => p.trimStart().startsWith('{'));
try {
  const parsed = JSON.parse(jsonBlock ?? '');
  if (parsed?.mcpServers?.klui?.headers?.Authorization !== 'Bearer kb_YOUR_KEY') {
    failures.push('MCP config block does not carry the kb_YOUR_KEY placeholder');
  }
} catch {
  failures.push('MCP config block does not parse as JSON');
}
if (/kb_[A-Za-z0-9]{8,}/.test(html))
  failures.push('a token-shaped literal appears in the built page');
if (MCP_CONFIG !== jsonBlock) failures.push('rendered MCP config differs from snippets.ts');

// L1-03: exactly one plate on the page, never nested in a card.
const plateCount = (html.match(/class="plate"/g) ?? []).length;
if (plateCount !== 1) failures.push(`expected exactly one plate, found ${plateCount}`);

// L1-02: one h1, and it is the locked hero headline; no image above the fold (LCP is text).
const h1s = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)].map((m) => unescape(m[1]));
if (h1s.length !== 1 || h1s[0] !== 'A kanban for projects that end.') {
  failures.push(`hero h1 wrong: ${JSON.stringify(h1s)}`);
}
const mainStart = html.indexOf('<main');
const firstImg = html.indexOf('<img', mainStart);
const firstH1 = html.indexOf('<h1');
if (firstImg !== -1 && firstImg < firstH1)
  failures.push('an image renders above the hero h1 (LCP would be a PNG)');

// Spec line prints the claimed tool count; announcement pill links to the changelog.
if (!html.includes(`${CLAIMS.tools.value} MCP tools`)) {
  failures.push('spec line / pill does not print the claimed tool count');
}
if (!html.includes('href="/blog"'))
  failures.push('announcement pill does not link to the changelog');

// L1-02/L4-06: the demo pill is absent (not dead) when PUBLIC_DEMO_URL is unset.
if (LINKS.demo === '' && html.includes('Open the live demo board')) {
  failures.push('demo pill rendered although PUBLIC_DEMO_URL is unset');
}
if (LINKS.demo !== '' && !html.includes('Open the live demo board')) {
  failures.push('demo pill missing although PUBLIC_DEMO_URL is set');
}

// L1-08: the mandatory limits section renders with all four rows.
if (!html.includes('What it does not do')) failures.push('limits section missing');
for (const limit of CLAIMS.limits.value) {
  if (!html.includes(limit.replace(/&/g, '&amp;'))) failures.push(`limit row missing: ${limit}`);
}

// L1-09: the glyph grid is present once, aria-hidden, behind the hero only.
const glyphCount = (html.match(/class="glyph-grid"/g) ?? []).length;
if (glyphCount !== 1) failures.push(`expected one glyph grid, found ${glyphCount}`);
if (!/class="glyph-grid"[^>]*aria-hidden="true"/.test(html))
  failures.push('glyph grid is not aria-hidden');

if (failures.length > 0) {
  for (const f of failures) console.error(`check-landing: FAIL ${f}`);
  process.exit(1);
}
console.log(
  `check-landing: snippet byte-identical, MCP JSON parses with kb_YOUR_KEY, 1 plate, h1 is the LCP text, demo ${LINKS.demo === '' ? 'omitted (unset)' : 'linked'}, limits ${CLAIMS.limits.value.length} rows, glyph grid ok`,
);
