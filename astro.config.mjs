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
    }),
    starlight({
      title: 'Klui',
      description:
        'Klui is a fast, self-hosted board where a link is the invite, agents read and write through MCP, and every project closes with a summary you can hand over.',
      logo: { src: './assets/light-logo.png', alt: '' },
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
        Footer: './src/components/starlight/Footer.astro',
        Sidebar: './src/components/starlight/Sidebar.astro',
        ThemeSelect: './src/components/starlight/ThemeSelect.astro',
      },
      head: [
        { tag: 'meta', attrs: { property: 'og:image', content: `${site}/og/home.png` } },
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
