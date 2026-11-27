// SPDX-License-Identifier: AGPL-3.0-only
/* eslint-disable no-misleading-character-class -- emoji detection needs combining marks (U+FE0F) inside a class */
// Content lint on the built output (docs/testing.md §4) and on src/content (L1-11, L3-05):
// emoji, banned words, CTA sentence case, uppercase eyebrows, legal placeholders and
// changelog TODO markers in production, the footer rule, and the limits section on the
// landing. The rule functions are exported so tests/content-rules.test.mjs can prove each
// one fails on a broken fixture.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

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

export function findEmoji(text) {
  return [...text.matchAll(new RegExp(EMOJI.source, 'gu'))].map(
    (m) => `U+${m[0].codePointAt(0).toString(16)}`,
  );
}

export function findBanned(text) {
  return BANNED.filter((word) =>
    new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text),
  );
}

export function hasPlaceholder(text) {
  return /\{\{[A-Z_]+\}\}/.test(text);
}

export function hasTodoMarker(text) {
  return text.includes('TODO(');
}

// Footer rule: every built page carries the line, linking to wyliam.dev.
export function hasFooter(html) {
  return html.includes('Made with &lt;3 by Wyliam') && html.includes('https://wyliam.dev');
}

// CTA labels are sentence case: one leading capital, not shouting, no trailing period,
// no title-cased words after the first (acronyms like MCP and the proper noun Klui excepted).
const CTA_PROPER_NOUNS = new Set(['Klui']);
export function ctaCaseOk(label) {
  const t = label.trim();
  if (!/^[A-ZÀ-ÖØ-Þ]/.test(t)) return false;
  if (/[.!?]$/.test(t)) return false;
  const words = t.split(/\s+/).filter(Boolean);
  if (words.every((w) => /^[A-ZÀ-ÖØ-Þ0-9'-]+$/.test(w))) return false;
  for (const w of words.slice(1)) {
    if (/^[A-ZÀ-ÖØ-Þ]{2,}/.test(w)) continue;
    if (/^[A-ZÀ-ÖØ-Þ][a-zà-öø-ÿ]/.test(w) && !CTA_PROPER_NOUNS.has(w)) return false;
  }
  return true;
}

export const LIMITS_HEADING = 'What it does not do';

export function lintText(label, text, failures) {
  for (const m of text.matchAll(new RegExp(EMOJI.source, 'gu'))) {
    failures.push(`${label}: emoji U+${m[0].codePointAt(0).toString(16)} (${m[0]})`);
  }
  for (const word of BANNED) {
    const re = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (re.test(text)) failures.push(`${label}: banned word "${word}"`);
  }
  if (PRODUCTION && hasPlaceholder(text)) {
    for (const m of text.matchAll(/\{\{[A-Z_]+\}\}/g)) {
      failures.push(`${label}: legal placeholder survived a production build: ${m[0]}`);
    }
  }
}

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

// CTA labels in the built pages (buttons, nav pill, hero ghost button), tag-stripped.
export function ctaLabels(html) {
  const out = [];
  for (const m of html.matchAll(
    /<(?:button|a)\b[^>]*class="[^"]*(?:copy-btn|btn-ghost|btn|nav-deploy)[^"]*"[^>]*>([\s\S]*?)<\/(?:button|a)>/g,
  )) {
    out.push(
      m[1]
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim(),
    );
  }
  return out.filter(Boolean);
}

function main() {
  const failures = [];
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
    lintText(rel, text, failures);
    for (const label of ctaLabels(text)) {
      if (!ctaCaseOk(label)) failures.push(`${rel}: CTA not sentence case: "${label}"`);
    }
  }
  for (const file of [
    ...walk(join(ROOT, 'src', 'site-docs'), '.md'),
    ...walk(join(ROOT, 'src', 'site-docs'), '.mdx'),
  ]) {
    lintText(file.slice(ROOT.length + 1), readFileSync(file, 'utf8'), failures);
  }

  // A generated release post keeps its TODO( markers until the human pass
  // (docs/features/changelog.md §2); a production build fails on them.
  if (PRODUCTION) {
    for (const ext of ['.md', '.mdx']) {
      for (const file of walk(join(ROOT, 'src', 'content', 'blog'), ext)) {
        if (hasTodoMarker(readFileSync(file, 'utf8'))) {
          failures.push(
            `${file.slice(ROOT.length + 1)}: TODO( marker survived a production build (changelog.md §2)`,
          );
        }
      }
    }
  }

  for (const file of htmlFiles) {
    const rel = file.slice(DIST.length + 1);
    const html = readFileSync(file, 'utf8');
    if (!hasFooter(html)) {
      failures.push(`${rel}: footer rule missing (Made with <3 by Wyliam -> https://wyliam.dev)`);
    }
  }

  // The limits section is mandatory on the landing (L1-08) and cannot be softened away.
  const home = join(DIST, 'index.html');
  if (existsSync(home)) {
    const html = readFileSync(home, 'utf8');
    if (html.includes('Copy the install command') && !html.includes(LIMITS_HEADING)) {
      failures.push(`index.html: mandatory limits section "${LIMITS_HEADING}" missing`);
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
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) main();
