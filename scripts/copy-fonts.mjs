// SPDX-License-Identifier: AGPL-3.0-only
// Copies the self-hosted woff2 subsets from the @fontsource packages into public/fonts/.
// Run after `npm ci` when the font packages change: `node scripts/copy-fonts.mjs`
import { copyFileSync, mkdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public', 'fonts');
mkdirSync(outDir, { recursive: true });

// latin subset covers French: U+0152/0153 (oe), U+2019 (apostrophe), U+00AB/BB (guillemets),
// U+2000-206F general punctuation are all inside the fontsource "latin" unicode-range.
const FILES = [
  [
    '@fontsource-variable/newsreader/files/newsreader-latin-wght-normal.woff2',
    'newsreader-var-latin.woff2',
  ],
  ['@fontsource/inter/files/inter-latin-400-normal.woff2', 'inter-400-latin.woff2'],
  ['@fontsource/inter/files/inter-latin-500-normal.woff2', 'inter-500-latin.woff2'],
  [
    '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2',
    'jetbrains-mono-400-latin.woff2',
  ],
];

let total = 0;
for (const [src, dest] of FILES) {
  const from = join(root, 'node_modules', src);
  const to = join(outDir, dest);
  copyFileSync(from, to);
  const bytes = statSync(to).size;
  total += bytes;
  console.log(`copied ${dest} (${bytes} bytes)`);
}
console.log(`font payload: ${total} bytes (budget 153600)`);
if (total > 153600) {
  console.error('font payload exceeds the 150 KB budget');
  process.exit(1);
}
