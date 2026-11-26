// SPDX-License-Identifier: AGPL-3.0-only
// /llms.txt — every docs page exactly once, with its one-sentence description (docs-sync.md §4).
import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import type { APIContext } from 'astro';
import { LINKS } from '../data/links.ts';

type DocsEntry = CollectionEntry<'docs'>;

export async function GET(_context: APIContext) {
  const all = await getCollection('docs');
  const docs = all.filter((e: DocsEntry) => !e.data.draft && e.id !== '404');
  docs.sort((a: DocsEntry, b: DocsEntry) => {
    const oa = a.data.sidebar?.order ?? 999;
    const ob = b.data.sidebar?.order ?? 999;
    return oa === ob ? a.id.localeCompare(b.id) : oa - ob;
  });
  const lines = [
    '# Klui documentation',
    '',
    '> Klui is a self-hosted kanban where links are invites and agents work over MCP.',
    '',
    '## Docs',
    '',
  ];
  for (const entry of docs) {
    if (!entry.data.description) {
      throw new Error(`llms.txt: page without description: ${entry.id}`);
    }
    lines.push(
      `- [${entry.data.title}](${LINKS.site}/${entry.id.replace(/\/index$/, '')}.md): ${entry.data.description}`,
    );
  }
  return new Response(`${lines.join('\n')}\n`, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
}
