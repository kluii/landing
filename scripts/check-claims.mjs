// SPDX-License-Identifier: AGPL-3.0-only
// Claims gate (docs/testing.md §3): every claim in src/data/claims.ts must match its
// synced artifact in src/generated/, verifiedAt must equal the documented app version,
// and every claim must be referenced in src/. A release build (NODE_ENV=production)
// fails on any unverified claim; pre-release, pending claims are reported, not hidden.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CLAIMS } from '../src/data/claims.ts';

const ROOT = join(fileURLToPath(import.meta.url), '..', '..');
// Env-overridable so tests can point the gate at a fixture (L4-07: a bumped
// tools.json must fail with the claim named).
const GEN = process.env.CHECK_CLAIMS_GEN ?? join(ROOT, 'src', 'generated');
const PRODUCTION = process.env.NODE_ENV === 'production';
const failures = [];
const pending = [];

function readArtifact(name) {
  const p = join(GEN, name);
  return existsSync(p) ? readFileSync(p, 'utf8') : null;
}

const appVersionRaw = readArtifact(CLAIMS.appVersion.artifact);
if (appVersionRaw === null)
  failures.push(`appVersion: missing artifact ${CLAIMS.appVersion.artifact}`);
else if (appVersionRaw.trim() !== CLAIMS.appVersion.value)
  failures.push(`appVersion: claim ${CLAIMS.appVersion.value} != artifact ${appVersionRaw.trim()}`);

const documented = CLAIMS.appVersion.value;

for (const [key, claim] of Object.entries(CLAIMS)) {
  if (claim.verifiedAt !== documented) {
    failures.push(`${key}: verifiedAt ${claim.verifiedAt} != documented app version ${documented}`);
  }
  const raw = readArtifact(claim.artifact);
  if (raw === null) {
    if (claim.pending)
      pending.push(`${key}: artifact ${claim.artifact} not published yet (pending)`);
    else failures.push(`${key}: missing artifact ${claim.artifact}`);
    continue;
  }
  if (claim.artifact === 'app-version.txt') continue;
  if (claim.artifact === 'tools.json') {
    const parsed = JSON.parse(raw);
    if (parsed.count !== claim.value)
      failures.push(`tools: claim ${claim.value} != tools.json count ${parsed.count}`);
  }
  if (claim.artifact === 'env.json') {
    const parsed = JSON.parse(raw);
    const v = parsed.vars?.KLUI_RETENTION_EVENTS_DAYS;
    if (String(claim.value) !== v)
      failures.push(
        `retentionDays: claim ${claim.value} != env.json KLUI_RETENTION_EVENTS_DAYS ${v}`,
      );
  }
  if (claim.artifact === 'install-time.txt') {
    // installInstance shares the artifact with installMinutes: dispatch on the claim
    // key, not the artifact name, or the numeric parser eats the string claim.
    if (key === 'installMinutes') {
      const n = raw
        .split('\n')
        .map((l) => Number(l.trim()))
        .find((v) => Number.isFinite(v) && v > 0);
      if (n === undefined || n !== claim.value)
        failures.push(`installMinutes: claim ${claim.value} != install-time.txt ${raw.trim()}`);
    }
    if (key === 'installInstance' && !raw.split('\n').map((l) => l.trim()).includes(claim.value)) {
      failures.push(`installInstance: claim ${claim.value} != install-time.txt ${raw.trim()}`);
    }
  }
}

// A claim referenced nowhere in src/ is a stale claim.
function walk(dir, ext = /\.(astro|ts|mjs|mdx?)$/) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p, ext));
    else if (ext instanceof RegExp ? ext.test(p) : p.endsWith(ext)) out.push(p);
  }
  return out;
}
const srcFiles = [...walk(join(ROOT, 'src')), ...walk(join(ROOT, 'scripts'))].filter(
  (p) =>
    (!p.includes('src/generated') &&
      !p.includes('src/content/docs/v1') &&
      !p.includes('src/content/docs/v2/')) ||
    p.includes('_site'),
);
for (const key of Object.keys(CLAIMS)) {
  const re = new RegExp(`CLAIMS\\.${key}\\b|claims\\.${key}\\b|claim:${key}\\b`);
  if (!srcFiles.some((p) => re.test(readFileSync(p, 'utf8')))) {
    failures.push(`${key}: claim is referenced nowhere in src/ (stale claim)`);
  }
}

// Rendered numbers: the tool count printed in HTML must equal the manifest.
const DIST = process.env.CHECK_CLAIMS_DIST ?? join(ROOT, 'dist');
if (existsSync(DIST)) {
  for (const file of walk(DIST).filter((p) => p.endsWith('.html'))) {
    const html = readFileSync(file, 'utf8');
    for (const m of html.matchAll(/(\d+)\s+MCP tools/g)) {
      if (Number(m[1]) !== CLAIMS.tools.value) {
        failures.push(`${file}: prints "${m[1]} MCP tools", manifest says ${CLAIMS.tools.value}`);
      }
    }
  }
}

for (const line of pending) console.warn(`check-claims: pending ${line}`);
if (failures.length > 0 || (PRODUCTION && pending.length > 0)) {
  for (const line of failures) console.error(`check-claims: FAIL ${line}`);
  if (PRODUCTION && pending.length > 0)
    console.error('check-claims: FAIL production build with unverified (pending) claims');
  process.exit(1);
}
console.log(
  `check-claims: ${Object.keys(CLAIMS).length}/${Object.keys(CLAIMS).length} claims verified against src/generated (app ${documented})${pending.length ? `, ${pending.length} pending (pre-release)` : ''}`,
);
