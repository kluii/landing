// SPDX-License-Identifier: AGPL-3.0-only
// Link gate: runs against dist/ after the build (docs/testing.md §2).
// Internal paths must resolve (trailingSlash: never + index.html mapping), anchors must
// exist on the target page, every docs HTML page needs a .md twin, every llms.txt entry
// must resolve. Fails on the first ten broken targets and prints the total.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(import.meta.url), '..', '..');
const DIST = join(ROOT, 'dist');

if (!existsSync(DIST)) {
  console.error('check-links: dist/ missing — run npm run build first');
  process.exit(1);
}

function walk(dir, ext) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p, ext));
    else if (p.endsWith(ext)) out.push(p);
  }
  return out;
}

const htmlFiles = walk(DIST, '.html');
if (htmlFiles.length === 0) {
  console.error('check-links: empty crawl — refusing to report 0 broken links');
  process.exit(1);
}

function resolveInternal(path) {
  const clean = normalize(path).replace(/^\/+/, '');
  const candidates = [
    join(DIST, clean),
    join(DIST, clean, 'index.html'),
    join(DIST, `${clean}.html`),
  ];
  return candidates.find((c) => existsSync(c) && statSync(c).isFile()) ?? null;
}

const idCache = new Map();
function idsOf(absFile) {
  if (idCache.has(absFile)) return idCache.get(absFile);
  const html = readFileSync(absFile, 'utf8');
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  idCache.set(absFile, ids);
  return ids;
}

const broken = [];
const seen = new Set();

for (const file of htmlFiles) {
  const rel = file.slice(DIST.length + 1);
  const html = readFileSync(file, 'utf8');
  for (const m of html.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
    const raw = m[1];
    if (raw.startsWith('mailto:') || raw.startsWith('tel:') || raw.startsWith('data:')) continue;
    if (/^https?:\/\//.test(raw)) {
      // http://localhost:8080 in docs prose is the app's own local URL in an instruction,
      // not a site link. Everywhere else, non-TLS and localhost links are broken.
      const isLocalInstruction =
        rel.startsWith('docs/') && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/.test(raw);
      if (!isLocalInstruction) {
        if (raw.startsWith('http://')) broken.push(`${rel}: non-TLS external URL ${raw}`);
        if (raw.includes('localhost')) broken.push(`${rel}: localhost URL ${raw}`);
      }
      continue;
    }
    if (raw.startsWith('#')) {
      if (raw === '#') broken.push(`${rel}: link to bare #`);
      else if (!idsOf(file).has(raw.slice(1))) broken.push(`${rel}: missing anchor ${raw}`);
      continue;
    }
    const [path, frag] = raw.split('#');
    const target = resolveInternal(path === '' ? '/' : path);
    if (!target) {
      const key = `${rel} -> ${raw}`;
      if (!seen.has(key)) {
        seen.add(key);
        broken.push(`${rel}: broken internal ${raw}`);
      }
      continue;
    }
    if (frag && !idsOf(target).has(frag)) {
      broken.push(`${rel}: missing anchor ${raw} (in ${target.slice(DIST.length + 1)})`);
    }
  }
}

// Every docs HTML page must have a .md twin.
for (const file of htmlFiles) {
  const rel = file.slice(DIST.length + 1);
  if (rel.startsWith('docs/') && rel.endsWith('.html')) {
    const mdRel = rel.replace(/\/index\.html$/, '.md').replace(/\.html$/, '.md');
    const md = join(DIST, mdRel);
    if (!existsSync(md)) broken.push(`twin missing: ${rel} -> ${mdRel}`);
  }
}

// Every llms.txt entry must resolve to a .md file and to its HTML page.
const llmsPath = join(DIST, 'llms.txt');
if (existsSync(llmsPath)) {
  for (const m of readFileSync(llmsPath, 'utf8').matchAll(/\]\((https?:\/\/[^)]+)\)/g)) {
    const url = m[1];
    const path = new URL(url).pathname;
    const md = resolveInternal(path);
    const html = resolveInternal(path.replace(/\.md$/, ''));
    if (!md) broken.push(`llms.txt: entry does not resolve: ${url}`);
    else if (!html) broken.push(`llms.txt: no HTML page for: ${url}`);
  }
} else {
  broken.push('llms.txt missing from dist/');
}

if (broken.length > 0) {
  console.error(
    `check-links: ${broken.length} broken target(s), first ${Math.min(10, broken.length)}:`,
  );
  for (const line of broken.slice(0, 10)) console.error(`  ${line}`);
  process.exit(1);
}
console.log(
  `check-links: ${htmlFiles.length} pages crawled, 0 broken links, 0 broken anchors, twins + llms.txt ok`,
);
