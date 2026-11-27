// SPDX-License-Identifier: AGPL-3.0-only
// Landing assertions on the built pages, both variants (ADR-0015). Runs after npm run build.
// `/` is the cloud landing, `/selfhosted` is the self-hosting landing (today's page,
// minus nothing): snippet, plate, locked h1, limits, glyph grid and demo-pill logic are
// asserted on /selfhosted; the split itself (no install block, no docs link in the cloud
// nav, cross-links, per-route canonical) on both.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CLAIMS } from '../src/data/claims.ts';
import { INSTALL_COMMANDS, MCP_CONFIG } from '../src/data/snippets.ts';
import { LINKS } from '../src/data/links.ts';
import { LANDING } from '../src/data/copy.ts';

const ROOT = join(fileURLToPath(import.meta.url), '..', '..');
const DIST = join(ROOT, 'dist');

function page(rel) {
  const p = join(DIST, rel);
  if (!existsSync(p)) {
    console.error(`check-landing: dist/${rel} missing — run npm run build first`);
    process.exit(1);
  }
  return readFileSync(p, 'utf8');
}

const cloud = page('index.html');
const self = page('selfhosted/index.html');
const failures = [];

function unescape(s) {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

function presOf(html) {
  return [
    ...html.matchAll(/<pre class="code-body"[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/g),
  ].map((m) => unescape(m[1]));
}

function h1sOf(html) {
  return [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)].map((m) => unescape(m[1]));
}

function navOf(html) {
  return html.match(/<header class="site-nav"[^>]*>[\s\S]*?<\/header>/)?.[0] ?? '';
}

// --- /selfhosted: everything that exists today, minus nothing ---------------------

// L1-05: the rendered snippet is byte-identical to snippets.ts.
const selfPres = presOf(self);
if (!selfPres.includes(INSTALL_COMMANDS)) {
  failures.push(
    'selfhosted: install snippet in the built page is not byte-identical to src/data/snippets.ts',
  );
}

// L1-07: the JSON config block parses and carries a placeholder key, never a token.
const jsonBlock = selfPres.find((p) => p.trimStart().startsWith('{'));
try {
  const parsed = JSON.parse(jsonBlock ?? '');
  if (parsed?.mcpServers?.klui?.headers?.Authorization !== 'Bearer kb_YOUR_KEY') {
    failures.push('selfhosted: MCP config block does not carry the kb_YOUR_KEY placeholder');
  }
} catch {
  failures.push('selfhosted: MCP config block does not parse as JSON');
}
if (/kb_[A-Za-z0-9]{8,}/.test(self))
  failures.push('selfhosted: a token-shaped literal appears in the built page');
if (MCP_CONFIG !== jsonBlock)
  failures.push('selfhosted: rendered MCP config differs from snippets.ts');

// The install block exists on /selfhosted only.
if (!self.includes('class="install-grid"')) failures.push('selfhosted: install block missing');

// L1-03: exactly one plate per landing page, never nested in a card.
for (const [name, html] of [
  ['/', cloud],
  ['/selfhosted', self],
]) {
  const plateCount = (html.match(/class="plate"/g) ?? []).length;
  if (plateCount !== 1) failures.push(`${name}: expected exactly one plate, found ${plateCount}`);
}

// L1-02: one h1 per page — the locked hero headline on /selfhosted, the cloud headline on /.
const selfH1 = h1sOf(self);
if (selfH1.length !== 1 || selfH1[0] !== LANDING.en.selfhosted.heroH1) {
  failures.push(`selfhosted: hero h1 wrong: ${JSON.stringify(selfH1)}`);
}
const cloudH1 = h1sOf(cloud);
if (cloudH1.length !== 1 || cloudH1[0] !== LANDING.en.cloud.heroH1) {
  failures.push(`/: hero h1 wrong: ${JSON.stringify(cloudH1)}`);
}
for (const [name, html] of [
  ['/', cloud],
  ['/selfhosted', self],
]) {
  const mainStart = html.indexOf('<main');
  const firstImg = html.indexOf('<img', mainStart);
  const firstH1 = html.indexOf('<h1');
  if (firstImg !== -1 && firstImg < firstH1)
    failures.push(`${name}: an image renders above the hero h1 (LCP would be a PNG)`);
}

// Spec line prints the claimed tool count on both pages; announcement pill links to the changelog.
for (const [name, html] of [
  ['/', cloud],
  ['/selfhosted', self],
]) {
  if (!html.includes(`${CLAIMS.tools.value} MCP tools`)) {
    failures.push(`${name}: spec line / pill does not print the claimed tool count`);
  }
  if (!html.includes('href="/blog"'))
    failures.push(`${name}: announcement pill does not link to the changelog`);
}

// L1-02/L4-06: the demo pill is absent (not dead) when PUBLIC_DEMO_URL is unset, on /selfhosted only.
if (LINKS.demo === '' && self.includes(LANDING.en.selfhosted.heroDemo)) {
  failures.push('selfhosted: demo pill rendered although PUBLIC_DEMO_URL is unset');
}
if (LINKS.demo !== '' && !self.includes(LANDING.en.selfhosted.heroDemo)) {
  failures.push('selfhosted: demo pill missing although PUBLIC_DEMO_URL is set');
}
if (cloud.includes(LANDING.en.selfhosted.heroDemo)) {
  failures.push('/: the demo pill must not render on the cloud landing');
}

// L1-08: the mandatory limits section renders with all four rows on both EN landing pages.
for (const [name, html] of [
  ['/', cloud],
  ['/selfhosted', self],
]) {
  if (!html.includes(LANDING.en.cloud.limitsTitle))
    failures.push(`${name}: limits section missing`);
  for (const limit of CLAIMS.limits.value) {
    if (!html.includes(limit.replace(/&/g, '&amp;')))
      failures.push(`${name}: limit row missing: ${limit}`);
  }
}

// L1-09: the glyph grid is present once per landing page, aria-hidden, behind the hero only.
for (const [name, html] of [
  ['/', cloud],
  ['/selfhosted', self],
]) {
  const glyphCount = (html.match(/class="glyph-grid"/g) ?? []).length;
  if (glyphCount !== 1) failures.push(`${name}: expected one glyph grid, found ${glyphCount}`);
  if (!/class="glyph-grid"[^>]*aria-hidden="true"/.test(html))
    failures.push(`${name}: glyph grid is not aria-hidden`);
}

// --- the split itself (ADR-0015) ---------------------------------------------------

// The cloud page has no install block and no docs link in its nav; it links to /selfhosted.
if (presOf(cloud).includes(INSTALL_COMMANDS))
  failures.push('/: the install snippet must not render on the cloud landing');
if (cloud.includes('class="install-grid"'))
  failures.push('/: install block rendered on the cloud landing');
const cloudNav = navOf(cloud);
if (/href="\/docs/.test(cloudNav)) failures.push('/: the cloud nav must not link to /docs');
if (!cloudNav.includes('href="/selfhosted"'))
  failures.push('/: the cloud nav must link to /selfhosted');

// The self-hosted page has both, and links back to the cloud landing.
const selfNav = navOf(self);
if (!/href="\/docs/.test(selfNav)) failures.push('/selfhosted: the nav must link to the docs');
if (!selfNav.includes('href="#install"'))
  failures.push('/selfhosted: the nav install CTA must anchor to #install');
if (!self.includes('href="/"')) failures.push('/selfhosted: no link back to the cloud landing');

// The cloud CTA is never a dead link: set → external https URL, unset → disabled marker.
if (LINKS.cloud === '') {
  if (!cloud.includes('data-cloud-unconfigured'))
    failures.push('/: PUBLIC_CLOUD_URL unset but the cloud CTA is not marked disabled');
  if (/href="#"/.test(cloud)) failures.push('/: a bare # href on the cloud landing');
} else {
  if (!new RegExp(`href="${LINKS.cloud.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`).test(cloud))
    failures.push(`/: cloud CTA does not link to PUBLIC_CLOUD_URL (${LINKS.cloud})`);
  if (cloud.includes('data-cloud-unconfigured'))
    failures.push('/: cloud CTA marked disabled although PUBLIC_CLOUD_URL is set');
}

if (failures.length > 0) {
  for (const f of failures) console.error(`check-landing: FAIL ${f}`);
  process.exit(1);
}
console.log(
  `check-landing: / cloud (no install block, no docs in nav, cross-link to /selfhosted, CTA ${LINKS.cloud === '' ? 'disabled (PUBLIC_CLOUD_URL unset)' : 'linked'}), /selfhosted (snippet byte-identical, MCP JSON parses with kb_YOUR_KEY, install + docs nav, 1 plate each, h1 per variant, limits ${CLAIMS.limits.value.length} rows on both, glyph grid ok)`,
);
