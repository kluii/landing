// SPDX-License-Identifier: AGPL-3.0-only
// Metadata gate on the built output (L4-02 exit, docs/seo.md): exactly one canonical
// per page, a unique og:image that resolves to a file in dist/, parseable JSON-LD with
// SoftwareApplication + Organization site-wide and BreadcrumbList on /docs/ pages,
// /fr/ pages pointing at their EN twin via hreflang, sitemap entries carrying a
// priority. Runs after the build: node scripts/check-meta.mjs
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(import.meta.url), '..', '..');
const DIST = join(ROOT, 'dist');
const SITE = 'https://klui.wyliam.dev';

if (!existsSync(DIST)) {
  console.error('check-meta: dist/ missing — run npm run build first');
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

const broken = [];
const htmlFiles = walk(DIST, '.html');
const ogSeen = new Map();

for (const file of htmlFiles) {
  const rel = file.slice(DIST.length + 1);
  const html = readFileSync(file, 'utf8');
  if (html.includes('http-equiv="refresh"')) continue; // redirect stubs are not pages

  const canonicals = [...html.matchAll(/<link rel="canonical" href="([^"]+)"/g)].map((m) => m[1]);
  if (canonicals.length !== 1) broken.push(`${rel}: ${canonicals.length} canonicals`);
  else {
    let route = rel.replace(/\.html$/, '');
    if (route === 'index') route = '';
    else if (route.endsWith('/index')) route = route.slice(0, -'/index'.length);
    const expected = route === '' ? `${SITE}/` : `${SITE}/${route}`;
    if (canonicals[0] !== expected)
      broken.push(`${rel}: canonical ${canonicals[0]} != route ${expected}`);
  }

  const og = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1];
  if (!og) broken.push(`${rel}: no og:image`);
  else {
    const ogPath = new URL(og).pathname;
    if (!existsSync(join(DIST, ogPath))) broken.push(`${rel}: og:image ${og} not in dist/`);
    if (ogSeen.has(og)) broken.push(`${rel}: og:image ${og} shared with ${ogSeen.get(og)}`);
    else ogSeen.set(og, rel);
  }

  const lds = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  let graph = [];
  let hasBreadcrumb = false;
  for (const m of lds) {
    let data;
    try {
      data = JSON.parse(m[1]);
    } catch {
      broken.push(`${rel}: unparseable JSON-LD`);
      continue;
    }
    const items = data['@graph'] ?? [data];
    graph.push(...items);
    if (data['@type'] === 'BreadcrumbList') hasBreadcrumb = true;
  }
  if (!graph.some((i) => i['@type'] === 'SoftwareApplication'))
    broken.push(`${rel}: no SoftwareApplication JSON-LD`);
  if (!graph.some((i) => i['@type'] === 'Organization'))
    broken.push(`${rel}: no Organization JSON-LD`);
  if (rel.startsWith('docs/') && rel !== 'docs/index.html' && !hasBreadcrumb)
    broken.push(`${rel}: docs page without BreadcrumbList`);

  if (rel.startsWith('fr/')) {
    const enAlt = html.match(/<link rel="alternate" hreflang="en" href="([^"]+)"/)?.[1];
    if (!enAlt || enAlt.includes('/fr'))
      broken.push(`${rel}: no hreflang=en pointing at the EN twin`);
  }
}

for (const xml of walk(DIST, '.xml')) {
  if (!xml.includes('sitemap')) continue;
  const text = readFileSync(xml, 'utf8');
  const urls = text.match(/<url>/g) ?? [];
  const prios = text.match(/<priority>/g) ?? [];
  if (urls.length > 0 && urls.length !== prios.length)
    broken.push(
      `${xml.slice(DIST.length + 1)}: ${urls.length} urls but ${prios.length} priorities`,
    );
}

const robots = join(DIST, 'robots.txt');
if (!existsSync(robots)) broken.push('robots.txt missing from dist/');

if (broken.length > 0) {
  console.error(`check-meta: ${broken.length} problem(s), first 10:`);
  for (const line of broken.slice(0, 10)) console.error(`  ${line}`);
  process.exit(1);
}
console.log(
  `check-meta: ${htmlFiles.length} pages, 1 canonical each, ${ogSeen.size} unique og:image files resolving in dist/, JSON-LD ok, sitemap priorities ok`,
);
