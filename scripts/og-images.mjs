// SPDX-License-Identifier: AGPL-3.0-only
// Build-time OG images (docs/seo.md §3): one SVG template rendered to 1200x630 PNG per
// built page via @resvg/resvg-js. Geometry is asserted by tests/og.test.mjs.
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';

const ROOT = join(fileURLToPath(import.meta.url), '..', '..');
const DIST = join(ROOT, 'dist');
const SITE = process.env.PUBLIC_SITE_URL ?? 'https://klui.wyliam.dev';
const HOST = new URL(SITE).host;

export const OG_W = 1200;
export const OG_H = 630;
const MARGIN = 48;
const FOOTER_BASELINE = OG_H - 56;
const WORDMARK_BASELINE = 88;
const TITLE_TOP = 150;
const TITLE_SIZE = 64;
const TITLE_LH = 76;
const MAX_TITLE_LINES = 3;
const MAX_LINE_CHARS = 30;

// Approximate wrap: Newsreader at 64px averages ~0.46em per char.
export function wrapTitle(title) {
  const words = title.replace(/ — Klui$/, '').split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    const candidate = line === '' ? word : `${line} ${word}`;
    if (candidate.length > MAX_LINE_CHARS && line !== '') {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line !== '') lines.push(line);
  return lines.slice(0, MAX_TITLE_LINES);
}

// Geometry used both by the renderer and the test: returns baselines.
export function layoutTitle(title) {
  const lines = wrapTitle(title);
  const blockHeight = lines.length * TITLE_LH;
  const firstBaseline = Math.min(
    FOOTER_BASELINE - 40 - blockHeight + TITLE_LH,
    TITLE_TOP + TITLE_SIZE,
  );
  const baselines = lines.map((_, i) => firstBaseline + i * TITLE_LH);
  return { lines, baselines, footerBaseline: FOOTER_BASELINE, wordmarkBaseline: WORDMARK_BASELINE };
}

export function svgTemplate({ title, section }) {
  const { lines, baselines } = layoutTitle(title);
  const texts = lines
    .map(
      (line, i) =>
        `<text x="${MARGIN}" y="${baselines[i]}" class="title">${escapeXml(line)}</text>`,
    )
    .join('\n  ');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_W}" height="${OG_H}" viewBox="0 0 ${OG_W} ${OG_H}">
  <rect width="${OG_W}" height="${OG_H}" fill="#121110"/>
  <rect x="24" y="24" width="${OG_W - 48}" height="${OG_H - 48}" fill="none" stroke="#2C2A27"/>
  <text x="${MARGIN}" y="${WORDMARK_BASELINE}" class="wordmark">Klui</text>
  ${section ? `<text x="${OG_W - MARGIN}" y="${WORDMARK_BASELINE - 8}" class="section" text-anchor="end">${escapeXml(section)}</text>` : ''}
  ${texts}
  <text x="${MARGIN}" y="${FOOTER_BASELINE}" class="footer">${escapeXml(HOST)}</text>
  <rect x="0" y="${OG_H - 24}" width="${OG_W}" height="24" fill="#E9E5DD"/>
  <style>
    .wordmark { font-family: 'Newsreader', Georgia, serif; font-size: 40px; fill: #F4F1EB; }
    .title { font-family: 'Newsreader', Georgia, serif; font-size: ${TITLE_SIZE}px; fill: #F4F1EB; letter-spacing: -0.02em; }
    .section { font-family: 'JetBrains Mono', monospace; font-size: 20px; fill: #948E85; }
    .footer { font-family: 'JetBrains Mono', monospace; font-size: 20px; fill: #948E85; }
  </style>
</svg>`;
}

function escapeXml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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

function fontFiles() {
  const nm = join(ROOT, 'node_modules');
  const candidates = [
    '@fontsource-variable/newsreader/files/newsreader-latin-wght-normal.woff2',
    '@fontsource-variable/newsreader/files/newsreader-latin-wght-normal.woff',
    '@fontsource/inter/files/inter-latin-400-normal.woff2',
    '@fontsource/inter/files/inter-latin-400-normal.woff',
    '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2',
    '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff',
  ];
  return candidates.filter((c) => existsSync(join(nm, c))).map((c) => join(nm, c));
}

function pageInfo(html) {
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1] ?? 'Klui';
  const ogTitle = html.match(/property="og:title" content="([^"]+)"/)?.[1];
  const section = html.match(/property="og:section" content="([^"]+)"/)?.[1] ?? '';
  return { title: ogTitle ?? title, section };
}

export function renderPng(svg) {
  const resvg = new Resvg(svg, { font: { fontFiles: fontFiles(), loadSystemFonts: false } });
  return resvg.render().asPng();
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1] && existsSync(DIST)) {
  const outDir = join(DIST, 'og');
  mkdirSync(outDir, { recursive: true });
  let count = 0;
  for (const file of walk(DIST)) {
    const rel = file.slice(DIST.length + 1).replace(/\.html$/, '');
    const { title, section } = pageInfo(readFileSync(file, 'utf8'));
    const png = renderPng(svgTemplate({ title, section }));
    const name =
      rel === 'index' || rel === '404'
        ? `${rel === '404' ? '404' : 'home'}.png`
        : `${rel.replace(/\//g, '-')}.png`;
    writeFileSync(join(outDir, name), png);
    count += 1;
  }
  console.log(`og-images: rendered ${count} OG images into dist/og/`);
}
