// SPDX-License-Identifier: AGPL-3.0-only
/* eslint-disable no-misleading-character-class -- emoji detection needs combining marks (U+FE0F) inside a class */
// Source-level rules that do not need a parser (npm run lint runs eslint + this):
// SPDX header, no emoji, no hex outside tokens.css, letter-spacing only in tokens.css,
// no external URL literals in components (they belong in src/data/links.ts).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(import.meta.url), '..', '..');
const SPDX = 'SPDX-License-Identifier: AGPL-3.0-only';
const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u;
const HEX = /#[0-9a-fA-F]{3,8}\b/;
const URL_LITERAL = /https?:\/\/[^\s'"`)]+/;

const SCAN_DIRS = ['src', 'scripts', 'tests'];
const EXT = /\.(astro|ts|mjs|css)$/;
const failures = [];

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (name === 'generated' || name === 'v1' || (name === 'v2' && p.endsWith('docs/v2')))
        continue;
      out.push(...walk(p));
    } else if (EXT.test(p)) out.push(p);
  }
  return out;
}

const files = SCAN_DIRS.flatMap((d) => walk(join(ROOT, d)));
files.push(join(ROOT, 'astro.config.mjs'), join(ROOT, 'eslint.config.mjs'));

for (const file of files) {
  const rel = file.slice(ROOT.length + 1);
  const text = readFileSync(file, 'utf8');
  const head = text.split('\n').slice(0, 2).join('\n');
  if (/\.(ts|mjs|astro)$/.test(file) && !head.includes(SPDX)) {
    failures.push(
      `${rel}: missing SPDX header on the first line (or first frontmatter line for .astro)`,
    );
  }
  for (const m of text.matchAll(new RegExp(EMOJI.source, 'gu'))) {
    failures.push(`${rel}: emoji U+${m[0].codePointAt(0).toString(16)}`);
  }
  if (
    /\.css$/.test(file) &&
    !file.endsWith('tokens.css') &&
    !file.endsWith('print.css') &&
    HEX.test(text)
  ) {
    failures.push(`${rel}: hex colour outside src/styles/tokens.css`);
  }
  if (/\.(astro|css)$/.test(file) && !file.endsWith('tokens.css') && !file.endsWith('fonts.css')) {
    // A component may apply var(--tracking-*) but may not declare its own value.
    for (const d of text.match(/letter-spacing\s*:\s*[^;}]+/g) ?? []) {
      if (!/var\(--tracking-/.test(d)) {
        failures.push(
          `${rel}: letter-spacing with a literal (${d.trim()}) — only var(--tracking-*) is allowed`,
        );
      }
    }
  }
  if (/\.astro$/.test(file) && !rel.endsWith('links.ts') && URL_LITERAL.test(text)) {
    // links.ts is data; components must go through it. Allow the favicon-free svg? .svg not scanned.
    failures.push(`${rel}: external URL literal — use src/data/links.ts`);
  }
}

if (failures.length > 0) {
  for (const line of failures) console.error(`lint-source: FAIL ${line}`);
  process.exit(1);
}
console.log(
  `lint-source: ${files.length} source files scanned, SPDX/emoji/hex/tracking/URL rules ok`,
);
