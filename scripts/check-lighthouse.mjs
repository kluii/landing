// SPDX-License-Identifier: AGPL-3.0-only
// Asserts the Lighthouse budgets from docs/testing.md §5 on a report JSON file.
// Usage: node scripts/check-lighthouse.mjs <report.json>
import { readFileSync } from 'node:fs';

const report = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const cats = report.categories;
const budgets = {
  performance: 95,
  accessibility: 95,
  'best-practices': 95,
  seo: 95,
};

const failures = [];
for (const [name, min] of Object.entries(budgets)) {
  const score = Math.round((cats[name]?.score ?? 0) * 100);
  console.log(`lighthouse ${name}: ${score} (budget ${min})`);
  if (score < min) failures.push(`${name} ${score} < ${min}`);
}

const lcp = report.audits?.['largest-contentful-paint']?.numericValue;
const cls = report.audits?.['cumulative-layout-shift']?.numericValue;
if (lcp !== undefined) {
  console.log(`LCP: ${(lcp / 1000).toFixed(2)} s (budget < 1.2 s)`);
  if (lcp >= 1200) failures.push(`LCP ${lcp} ms >= 1200 ms`);
}
if (cls !== undefined) {
  console.log(`CLS: ${cls} (budget 0)`);
  if (cls > 0) failures.push(`CLS ${cls} > 0`);
}

if (failures.length > 0) {
  for (const f of failures) console.error(`check-lighthouse: FAIL ${f}`);
  process.exit(1);
}
console.log('check-lighthouse: all budgets met');
