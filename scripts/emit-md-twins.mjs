// SPDX-License-Identifier: AGPL-3.0-only
// Post-build: emits the raw-markdown twin of every docs page into dist/docs/<path>.md
// (docs-sync.md §4). The twin is the page's own source file (links already rewritten to
// site paths by the sync) with root-relative links made absolute and a `# Title` on top.
// Reading sources directly (not the Vite runner) keeps this runnable after astro:build:done.
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LINKS } from '../src/data/links.ts';

const ROOT = join(fileURLToPath(import.meta.url), '..', '..');
const DIST = join(ROOT, 'dist');
const DOCS = join(ROOT, 'src', 'content', 'docs');

if (!existsSync(DIST)) {
  console.error('emit-md-twins: dist/ missing — run npm run build first');
  process.exit(1);
}

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (name === '_site') continue;
      out.push(...walk(p));
    } else if (p.endsWith('.md') || p.endsWith('.mdx')) out.push(p);
  }
  return out;
}

let count = 0;
for (const file of walk(DOCS)) {
  const rel = file.slice(DOCS.length + 1);
  const raw = readFileSync(file, 'utf8');
  const fm = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  const title = fm?.[1].match(/^title:\s*'(.*)'$/m)?.[1] ?? rel;
  const body = fm ? raw.slice(fm[0].length) : raw;
  const absolute = body.replace(/\]\((\/[^)]*)\)/g, `](${LINKS.site}$1)`);
  const out = join(DIST, rel.replace(/\.mdx$/, '.md').replace(/\/index\.md$/, '.md'));
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, `# ${title}\n\n${absolute}`);
  count += 1;
}
console.log(`emit-md-twins: wrote ${count} .md twins into dist/docs/`);
