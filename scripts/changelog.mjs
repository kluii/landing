// SPDX-License-Identifier: AGPL-3.0-only
// changelog.mjs — drafts a release post from conventional commits (docs/features/changelog.md §1).
// Usage: node scripts/changelog.mjs --repo ../klui --from v1.0.0 --to v1.1.0 [--dry-run] [--out dir]
// Exit 0: file written / already exists / nothing to write. Exit 1: bad repo or tag.
// The script never publishes: it always writes draft: true with TODO markers, and never
// rewrites an existing post.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--')
    ? process.argv[i + 1]
    : fallback;
}

const REPO = resolve(ROOT, arg('repo', '../klui'));
const FROM = arg('from');
const TO = arg('to');
const OUT = resolve(ROOT, arg('out', 'src/content/blog/en'));
const DRY = process.argv.includes('--dry-run');

function fail(message) {
  console.error(`changelog: ${message}`);
  process.exit(1);
}

function git(args) {
  return execFileSync('git', ['-C', REPO, ...args], { encoding: 'utf8' });
}

if (!FROM || !TO) fail('usage: --from <previous-tag> --to <tag> [--dry-run]');
const isRepo = (() => {
  try {
    return git(['rev-parse', '--is-inside-work-tree']).trim() === 'true';
  } catch {
    return false;
  }
})();
if (!isRepo) fail(`${REPO} is not a git checkout`);
for (const tag of [FROM, TO]) {
  const ok = (() => {
    try {
      return Boolean(git(['rev-parse', '--verify', '--quiet', `${tag}^{commit}`]).trim());
    } catch {
      return false;
    }
  })();
  if (!ok) fail(`unknown tag: ${tag}`);
}

const version = TO.replace(/^v/, '');
const outFile = join(OUT, `${version}.mdx`);
if (existsSync(outFile)) {
  console.log(`changelog: ${version}.mdx already exists — never rewriting`);
  process.exit(0);
}

const SECTIONS = [
  ['Breaking', 'Breaking'],
  ['Added', 'feat'],
  ['Changed', ['refactor', 'perf']],
  ['Fixed', 'fix'],
  ['Docs', 'doc'],
];
const LOCKFILE =
  /(package-lock\.json|yarn\.lock|pnpm-lock\.yaml|Cargo\.lock|composer\.lock|Gemfile\.lock)$/;
const PROPER_NOUNS = new Set([
  'Klui',
  'MCP',
  'API',
  'URL',
  'URI',
  'JSON',
  'HTML',
  'CSS',
  'OG',
  'RSS',
  'CLI',
  'LLM',
  'AGPL',
  'GDPR',
  'IP',
]);

const raw = git(['log', `${FROM}..${TO}`, '--no-merges', '--pretty=%H%x1f%s%x1f%b%x1e']);
const commits = raw
  .split('\x1e')
  .map((r) => r.trim())
  .filter(Boolean)
  .map((r) => {
    const [hash, subject, body] = r.split('\x1f');
    return { hash: hash.trim(), subject: (subject || '').trim(), body: (body || '').trim() };
  });

const filesRaw = git(['log', `${FROM}..${TO}`, '--no-merges', '--name-only', '--pretty=%x1e%H']);
const filesByHash = new Map();
for (const chunk of filesRaw.split('\x1e')) {
  const lines = chunk.trim().split('\n').filter(Boolean);
  if (!lines.length) continue;
  filesByHash.set(lines[0].trim(), lines.slice(1));
}

const reverted = new Set();
for (const c of commits) {
  const m = c.subject.match(/^Revert "(.*)"$/i);
  if (m) {
    const target = commits.find((o) => o.subject === m[1]);
    if (target) {
      reverted.add(c.hash);
      reverted.add(target.hash);
    }
  }
}

function cleanSubject(text) {
  let s = text.replace(/\.$/, '').trim();
  const firstWord = s.split(/\s+/)[0] || '';
  if (!/^[A-Z0-9]{2,}/.test(firstWord) && !PROPER_NOUNS.has(firstWord)) {
    s = s.charAt(0).toLowerCase() + s.slice(1);
  }
  return s;
}

const groups = { Breaking: [], Added: [], Changed: [], Fixed: [], Docs: [], Internal: [] };
let kept = 0;
for (const c of commits) {
  if (reverted.has(c.hash)) continue;
  if (/^wip\b/i.test(c.subject)) continue;
  const files = filesByHash.get(c.hash) ?? [];
  if (files.length > 0 && files.every((f) => LOCKFILE.test(f))) continue;
  const m = c.subject.match(/^([a-z]+)(\([^)]*\))?(!)?:\s*(.+)$/);
  if (!m) continue;
  const [, type, , bang, subject] = m;
  const bc = c.body.match(/BREAKING[ -]CHANGE:\s*([\s\S]+?)(?:\n\s*\n|$)/i);
  const breaking = bang === '!' || Boolean(bc);
  const line = breaking
    ? `- ${(bc ? bc[1].replace(/\s*\n\s*/g, ' ').trim() : cleanSubject(subject)).replace(/\.$/, '')}`
    : `- ${cleanSubject(subject)}`;
  if (breaking) groups.Breaking.push(line);
  else if (type === 'feat') groups.Added.push(line);
  else if (type === 'fix') groups.Fixed.push(line);
  else if (type === 'doc') groups.Docs.push(line);
  else if (type === 'refactor' || type === 'perf') groups.Changed.push(line);
  else groups.Internal.push(line);
  kept += 1;
}

if (kept === 0) {
  console.log(`changelog: nothing to write for ${FROM}..${TO}`);
  process.exit(0);
}

const date = git(['log', '-1', '--format=%cs', TO]).trim();
const fromShort = git(['rev-parse', '--short', FROM]).trim();
const toShort = git(['rev-parse', '--short', TO]).trim();

const body = [];
body.push('TODO(hand-written): two to four sentences on why this release exists.');
body.push('');
for (const [section] of SECTIONS) {
  const lines = groups[section];
  if (!lines.length) continue;
  body.push(`## ${section}`, '');
  body.push(...lines, '');
}
if (groups.Internal.length) {
  body.push('<details>', `<summary>Internal (${groups.Internal.length} commits)</summary>`, '');
  body.push(...groups.Internal, '', '</details>', '');
}
body.push(
  `<p className="mono-sm">{'Generated from commits \`${fromShort}..${toShort}\` on the app repository.'}</p>`,
);

const mdx = [
  '---',
  `title: '${version}'`,
  "description: 'TODO: one sentence, written by a human.'",
  `date: ${date}`,
  `version: '${version}'`,
  'draft: true',
  'lang: en',
  '---',
  '',
  ...body,
  '',
].join('\n');

if (DRY) {
  console.log(mdx);
  console.log(`changelog: dry run — would write ${outFile}`);
  process.exit(0);
}
mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, mdx);
console.log(`changelog: wrote ${outFile} (draft, from ${FROM}..${TO}, ${kept} commits)`);
