// SPDX-License-Identifier: AGPL-3.0-only
// Post-build: writes dist/_headers from public/_headers, adding a sha256 hash for every
// inline <script> Astro/Starlight emitted (deploy.md §2: no 'unsafe-inline' for scripts).
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(import.meta.url), '..', '..');
const DIST = join(ROOT, 'dist');

if (!exists(DIST)) {
  console.error('write-headers: dist/ missing — run npm run build first');
  process.exit(1);
}
function exists(p) {
  try {
    statSync(p);
    return true;
  } catch {
    return false;
  }
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

const hashes = new Set();
for (const file of walk(DIST)) {
  const html = readFileSync(file, 'utf8');
  for (const m of html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)) {
    const body = m[1].trim();
    if (body !== '') hashes.add(`'sha256-${createHash('sha256').update(body).digest('base64')}'`);
  }
}

let template = readFileSync(join(ROOT, 'public', '_headers'), 'utf8');
for (const required of [
  'Content-Security-Policy',
  'Strict-Transport-Security',
  'X-Content-Type-Options',
  'Referrer-Policy',
  'Permissions-Policy',
  'frame-ancestors',
]) {
  if (!template.includes(required)) {
    console.error(`write-headers: public/_headers is missing ${required}`);
    process.exit(1);
  }
}
if (!template.includes("script-src 'self'")) {
  console.error("write-headers: CSP must keep script-src 'self' (no 'unsafe-inline' for scripts)");
  process.exit(1);
}

if (hashes.size > 0) {
  template = template.replace("script-src 'self'", `script-src 'self' ${[...hashes].join(' ')}`);
}

writeFileSync(join(DIST, '_headers'), template);
console.log(
  `write-headers: dist/_headers written (${hashes.size} inline script hash(es) in script-src)`,
);
