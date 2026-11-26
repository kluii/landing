// SPDX-License-Identifier: AGPL-3.0-only
// /blog/rss.xml — one feed, same posts as the index, same order (changelog.md §3).
import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import type { APIContext } from 'astro';
import { LINKS } from '../../data/links.ts';

export async function GET(_context: APIContext) {
  type Post = CollectionEntry<'blog'>;
  const posts = (await getCollection('blog'))
    .filter((p: Post) => !p.data.draft && p.data.lang === 'en')
    .sort((a: Post, b: Post) => b.data.date.getTime() - a.data.date.getTime());
  const items = posts
    .map(
      (p: Post) => `    <item>
      <title>${escapeXml(p.data.title)}</title>
      <link>${LINKS.site}/blog/${p.id}</link>
      <guid>${LINKS.site}/blog/${p.id}</guid>
      <pubDate>${p.data.date.toUTCString()}</pubDate>
      <description>${escapeXml(p.data.description)}</description>
    </item>`,
    )
    .join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Klui changelog</title>
    <link>${LINKS.site}/blog</link>
    <description>Release notes for Klui.</description>
    <language>en</language>
${items}
  </channel>
</rss>
`;
  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
