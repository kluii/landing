// SPDX-License-Identifier: AGPL-3.0-only
/* eslint-disable no-misleading-character-class -- emoji detection needs combining marks (U+FE0F) inside a class */
// Content lint on the built output (docs/testing.md §4) and on src/content (L1-11):
// emoji, banned words, uppercase eyebrows, legal placeholders in production,
// the footer rule, and the limits section on the landing.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(import.meta.url), '..', '..');
const DIST = join(ROOT, 'dist');
const PRODUCTION = process.env.NODE_ENV === 'production';

// docs/content.md §4 — banned words and patterns.
const BANNED = [
  'powerful',
  'seamless',
  'seamlessly',
  'supercharge',
  'revolutionary',
  'game-changing',
  'next-generation',
  'ai-powered',
  'blazing fast',
  'effortless',
  'effortlessly',
  'unleash',
  '10x',
  'synergy',
  'unhackable',
  'bot-proof',
  'hacker-proof',
  'military-grade',
  'world-class',
  'best-in-class',
  'trusted by',
  'loved by',
  'join thousands',
];

// Emoji and pictographs. Typographic arrows (U+2190–U+21FF) are allowed: they are the
// site's icon voice, set in mono.
const EMOJI =
  /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{1F1E6}-\u{1F1FF}\u{2700}-\u{27BF}]/u;

const failures = [];

function walk(dir, ext) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p, ext));
    else if (p.endsWith(ext)) out.push(p);
  }
  return out;
}

function lintText(label, text) {
  for (const m of text.matchAll(new RegExp(EMOJI.source, 'gu'))) {
    failures.push(`${label}: emoji U+${m[0].codePointAt(0).toString(16)} (${m[0]})`);
  }
  for (const word of BANNED) {
    const re = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (re.test(text)) failures.push(`${label}: banned word "${word}"`);
  }
  if (PRODUCTION) {
    for (const m of text.matchAll(/\{\{[A-Z_]+\}\}/g)) {
      failures.push(`${label}: legal placeholder survived a production build: ${m[0]}`);
    }
  }
}

const htmlFiles = walk(DIST, '.html');
const notes = [];
for (const file of htmlFiles) {
  const rel = file.slice(DIST.length + 1);
  const text = readFileSync(file, 'utf8');
  if (rel.startsWith('docs/')) {
    // Synced app docs are owned by the app repository (kluii/app) and are never edited
    // here; hits in them are reported as notes for the app repo, not silently passed.
    for (const m of text.matchAll(new RegExp(EMOJI.source, 'gu'))) {
      notes.push(
        `${rel}: emoji U+${m[0].codePointAt(0).toString(16)} in synced app docs (owned by kluii/app)`,
      );
    }
    for (const word of BANNED) {
      if (new RegExp(`\\b${word}\\b`, 'i').test(text)) {
        notes.push(`${rel}: "${word}" in synced app docs (owned by kluii/app)`);
      }
    }
    continue;
  }
  lintText(rel, text);
}
for (const file of [
  ...walk(join(ROOT, 'src', 'site-docs'), '.md'),
  ...walk(join(ROOT, 'src', 'site-docs'), '.mdx'),
]) {
  lintText(file.slice(ROOT.length + 1), readFileSync(file, 'utf8'));
}

// Footer rule: every built page carries the line, linking to wyliam.dev.
for (const file of htmlFiles) {
  const rel = file.slice(DIST.length + 1);
  const html = readFileSync(file, 'utf8');
  if (!html.includes('Made with &lt;3 by Wyliam') || !html.includes('https://wyliam.dev')) {
    failures.push(`${rel}: footer rule missing (Made with <3 by Wyliam -> https://wyliam.dev)`);
  }
}

// The limits section is mandatory on the landing (L1-08) and cannot be softened away.
// Asserted once the real landing ships (it carries the hero copy action).
const home = join(DIST, 'index.html');
if (existsSync(home)) {
  const html = readFileSync(home, 'utf8');
  if (html.includes('Copy the install command') && !html.includes('What it does not do')) {
    failures.push('index.html: mandatory limits section "What it does not do" missing');
  }
}

// No uppercase eyebrow: text-transform: uppercase may not appear outside tokens.css.
for (const file of [...walk(join(ROOT, 'src'), '.css'), ...walk(join(ROOT, 'src'), '.astro')]) {
  const text = readFileSync(file, 'utf8');
  if (/text-transform:\s*uppercase/i.test(text)) {
    failures.push(`${file.slice(ROOT.length + 1)}: text-transform: uppercase (banned eyebrow)`);
  }
}

for (const line of notes) console.warn(`content-lint: note ${line}`);
if (failures.length > 0) {
  for (const line of failures) console.error(`content-lint: FAIL ${line}`);
  process.exit(1);
}
const placeholderNote = PRODUCTION ? '' : ' (placeholders allowed in non-production builds)';
console.log(
  `content-lint: ${htmlFiles.length} built pages scanned, 0 emoji / 0 banned words on site-owned pages, footer ok${placeholderNote}${notes.length ? `, ${notes.length} note(s) in synced app docs` : ''}`,
);
