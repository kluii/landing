// SPDX-License-Identifier: AGPL-3.0-only
// JSON-LD for L4-02 (docs/seo.md): SoftwareApplication + Organization site-wide,
// BreadcrumbList on docs pages. No invented ratings or review counts.
import { LINKS } from './links.ts';
import { CLAIMS } from './claims.ts';
import pkg from '../../package.json';

export function siteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${LINKS.site}/#organization`,
        name: 'Klui',
        url: LINKS.site,
        logo: `${LINKS.site}/favicon.svg`,
      },
      {
        '@type': 'SoftwareApplication',
        '@id': `${LINKS.site}/#software`,
        name: 'Klui',
        applicationCategory: 'ProjectManagementApplication',
        operatingSystem: 'Docker (self-hosted)',
        softwareVersion: CLAIMS.appVersion.value,
        releaseNotes: `${LINKS.site}/blog`,
        license: LINKS.licence,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
        author: { '@id': `${LINKS.site}/#organization` },
      },
      {
        '@type': 'WebSite',
        '@id': `${LINKS.site}/#website`,
        url: LINKS.site,
        name: 'Klui',
        inLanguage: ['en', 'fr'],
        publisher: { '@id': `${LINKS.site}/#organization` },
      },
    ],
  };
}

// BreadcrumbList for /docs/... pages, from the URL path plus the entry title.
export function breadcrumbJsonLd(pathname: string, leafTitle: string) {
  const segments = pathname.split('/').filter(Boolean);
  const items = [{ '@type': 'ListItem', position: 1, name: 'Home', item: LINKS.site + '/' }];
  let acc = '';
  segments.forEach((seg, i) => {
    acc += `/${seg}`;
    const isLeaf = i === segments.length - 1;
    items.push({
      '@type': 'ListItem',
      position: i + 2,
      name: isLeaf ? leafTitle : seg,
      item: `${LINKS.site}${acc}`,
    });
  });
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items,
  };
}

export function siteVersion(): string {
  return pkg.version;
}
