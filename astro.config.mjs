// SPDX-License-Identifier: AGPL-3.0-only
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import starlight from '@astrojs/starlight';
import { LINKS } from './src/data/links.ts';

const site = import.meta.env.PUBLIC_SITE_URL ?? 'https://klui.wyliam.dev';

export default defineConfig({
  site,
  base: '/',
  trailingSlash: 'never',
  compressHTML: true,
  output: 'static',
  // fr joins the locale list when the reviewed French set ships (L3-04): with fr active,
  // Starlight emits /fr/docs/* fallbacks in English, which docs/seo.md forbids.
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
    prefixDefaultLocale: false,
  },
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/404'),
      serialize: (item) => {
        const p = new URL(item.url).pathname;
        let priority = 0.5;
        let changefreq = 'monthly';
        if (p === '/') {
          priority = 1;
          changefreq = 'weekly';
        } else if (p === '/selfhosted') {
          priority = 0.9;
          changefreq = 'weekly';
        } else if (p.startsWith('/docs/v2')) {
          priority = 0.8;
          changefreq = 'weekly';
        } else if (p.startsWith('/docs/v1')) {
          priority = 0.2;
          changefreq = 'yearly';
        } else if (p === '/blog' || p.startsWith('/blog/')) {
          priority = 0.7;
          changefreq = 'weekly';
        } else if (p.startsWith('/fr')) {
          priority = 0.6;
          changefreq = 'weekly';
        } else if (p.startsWith('/legal')) {
          priority = 0.2;
          changefreq = 'yearly';
        }
        return { ...item, priority, changefreq };
      },
    }),
    starlight({
      title: 'Klui',
      description:
        'Klui is a fast, self-hosted board where a link is the invite, agents read and write through MCP, and every project closes with a summary you can hand over.',
      // No logo in the Starlight config: it overlapped the version switcher in the
      // sidebar (L5). The wordmark stays in the site nav, the footer and the OG images.
      customCss: ['./src/styles/starlight.css', './src/styles/print.css'],
      social: [{ icon: 'github', label: 'GitHub', href: LINKS.github }],
      sidebar: [
        { label: 'v2 — current', items: [{ autogenerate: { directory: 'docs/v2' } }] },
        { label: 'v1 — frozen', items: [{ autogenerate: { directory: 'docs/v1' } }] },
      ],
      pagination: false,
      tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 3 },
      components: {
        Banner: './src/components/starlight/Banner.astro',
        Head: './src/components/starlight/Head.astro',
        Footer: './src/components/starlight/Footer.astro',
        Sidebar: './src/components/starlight/Sidebar.astro',
        ThemeSelect: './src/components/starlight/ThemeSelect.astro',
        PageTitle: './src/components/starlight/PageTitle.astro',
      },
      head: [
        // og:image is per-page, emitted by the Head override (L4-01: unique per page)
        { tag: 'meta', attrs: { name: 'twitter:card', content: 'summary_large_image' } },
      ],
    }),
  ],
  build: {
    format: 'directory',
  },
  redirects: {
    // Old paths keep working (L2-09): shared links from the v1 site era.
    '/quickstart': '/docs/v2/quickstart',
    '/docs': '/docs/v2',
    '/changelog': '/blog',
  },
});
