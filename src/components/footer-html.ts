// SPDX-License-Identifier: AGPL-3.0-only
// The footer markup lives in one .ts module so both the site Footer and the Starlight
// Footer override render the same bytes (Starlight overrides cannot bundle .astro imports).
//
// Shape: a designed close, not a sitemap. One field of raised tone (no hairline), the
// closing sentence on the left in the display face, three quiet link columns on the right,
// a base line with the copyright and the shipped version. No monospace outside code.
import { LINKS, HAS_FR_ROUTES } from '../data/links.ts';
import { FOOTER } from '../data/copy.ts';
import type { Lang, Variant } from '../data/copy.ts';
import { VARIANT_ROUTES } from '../data/variants.ts';
import { CLAIMS } from '../data/claims.ts';

const CSS = `
/* The footer carries its own tokens: it renders inside Starlight too, where the landing's
   design tokens do not exist. Always the dark close, so the light wordmark stays legible
   on both a dark landing and a light documentation page. */
.site-footer { --f-bg: #121213; --f-ink: #f5f5f5; --f-muted: #a3a3a3; --f-subtle: #919191;
  --f-serif: 'Newsreader', Georgia, 'Times New Roman', serif;
  --f-sans: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
  background: var(--f-bg); color: var(--f-ink); margin-top: var(--section-pad, 120px);
  font-family: var(--f-sans); text-align: left; }
.footer-inner { max-width: var(--container, 1200px); margin: 0 auto; padding: 88px 24px 0;
  display: grid; grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); gap: 64px; align-items: start; }
.footer-logo { display: block; height: 84px; width: auto; margin-left: -4px; }
.footer-close { margin: 8px 0 0; max-width: 24ch; font-family: var(--f-serif);
  font-size: clamp(24px, 2.3vw, 32px); line-height: 1.15; letter-spacing: -0.015em;
  color: var(--f-ink); text-wrap: balance; }
.footer-action { display: inline-flex; align-items: baseline; gap: 8px; margin-top: 22px;
  font-size: 14px; font-weight: 500; color: var(--f-ink); text-decoration: none; }
.footer-action:hover { text-decoration: underline; text-underline-offset: 4px; }
.footer-cols { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 32px; padding-top: 6px; }
.footer-col-title { margin: 0 0 12px; font-size: 13px; font-weight: 500; color: var(--f-subtle); }
.footer-col a { display: block; padding: 4px 0; font-size: 14px; color: var(--f-muted); text-decoration: none; }
.footer-col a:hover { color: var(--f-ink); }
.footer-col a[aria-current='page'] { color: var(--f-ink); }
.footer-col a.footer-col-title { margin: 0 0 12px; padding: 0; font-size: 13px; color: var(--f-subtle);
  transition: color 120ms ease; }
.footer-base { max-width: var(--container, 1200px); margin: 0 auto; padding: 56px 24px 36px;
  display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px 24px;
  font-size: 13px; color: var(--f-subtle); }
.footer-base a { color: inherit; text-decoration: none; }
.footer-base a:hover { color: var(--f-ink); }

/* Compact: the docs footer renders inside Starlight's content column, not across the page.
   Same words, one column: the close line, then the links on one wrapped row. */
.site-footer.is-compact { background: transparent; margin-top: 80px; }
.site-footer.is-compact .footer-inner { display: block; padding: 0; max-width: none; }
.site-footer.is-compact .footer-logo { height: 44px; margin-left: 0; }
.site-footer.is-compact .footer-close { margin-top: 20px; max-width: 34ch; font-size: 22px; }
.site-footer.is-compact .footer-action { margin-top: 16px; }
.site-footer.is-compact .footer-cols { display: flex; flex-wrap: wrap; gap: 0 22px; padding-top: 28px; }
.site-footer.is-compact .footer-col { display: contents; }
.site-footer.is-compact .footer-col-title { display: none; }
.site-footer.is-compact .footer-col a { padding: 2px 0; }
.site-footer.is-compact .footer-base { padding: 36px 0 0; max-width: none; }
@media (max-width: 860px) {
  .footer-inner { grid-template-columns: minmax(0, 1fr); gap: 44px; padding: 64px 20px 0; }
  .footer-cols { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 28px 24px; }
  .footer-base { padding: 40px 20px 28px; }
}
`;

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function footerHtml(
  lightLogo: string,
  lang: Lang,
  variant?: Variant,
  opts?: { compact?: boolean },
): string {
  const t = FOOTER[lang];
  const docsPath = lang === 'fr' && HAS_FR_ROUTES ? '/fr/docs/v2' : '/docs/v2';
  const quickstartPath =
    lang === 'fr' && HAS_FR_ROUTES ? '/fr/docs/v2/quickstart' : '/docs/v2/quickstart';
  const changelogPath = lang === 'fr' && HAS_FR_ROUTES ? '/fr/blog' : '/blog';
  const privacyPath = lang === 'fr' ? '/legal/confidentialite' : '/legal/privacy';

  // The FR documentation is a subset translated by docs-sync: the footer column only links
  // pages that exist in the page's language, so the link gate stays green in both locales.
  const docsItems: { href: string; label: string }[] =
    lang === 'fr'
      ? [
          { href: '/fr/docs/v2/quickstart', label: t.quickstart },
          { href: '/fr/docs/v2/limits', label: t.limits },
          { href: '/fr/docs/v2/faq', label: t.faq },
        ]
      : [
          { href: '/docs/v2/quickstart', label: t.quickstart },
          { href: '/docs/v2/mcp', label: t.mcp },
          { href: '/docs/v2/deployment', label: t.deployment },
        ];

  // Docs belong to the self-hosted product and to the documentation itself; the cloud
  // landing deliberately carries no documentation (ADR-0015).
  const showDocs = variant !== 'cloud';
  // Landing links with the active state, only on the landing pages themselves.
  const landings =
    variant === undefined
      ? ''
      : `<a href="${VARIANT_ROUTES[lang].cloud}"${variant === 'cloud' ? ' aria-current="page"' : ''}>${t.cloud}</a>
        <a href="${VARIANT_ROUTES[lang].selfhosted}"${variant === 'selfhosted' ? ' aria-current="page"' : ''}>${t.selfhosted}</a>`;

  const docsCol = showDocs
    ? `<div class="footer-col">
        <a class="footer-col-title footer-col-title-link" href="${docsPath}">${t.colDocs}</a>
        ${docsItems.map((i) => `<a href="${i.href}">${i.label}</a>`).join('\n        ')}
      </div>`
    : '';

  // The footer action is the same next step as the hero, minus the configuration state:
  // with no cloud address there is nothing to offer but the self-hosted path.
  const action =
    variant === 'selfhosted'
      ? { href: quickstartPath, label: t.actionSelfhosted }
      : LINKS.cloud !== ''
        ? { href: LINKS.cloud, label: t.actionCloud }
        : { href: VARIANT_ROUTES[lang].selfhosted, label: t.actionCloudFallback };

  return `
<style>${CSS}</style>
<footer class="site-footer${opts?.compact ? ' is-compact' : ''}">
  <div class="footer-inner">
    <div class="footer-brand">
      <img src="${lightLogo}" alt="Klui" width="84" height="84" class="footer-logo" />
      <p class="footer-close">${t.close}</p>
      <a class="footer-action" href="${action.href}"${action.href.startsWith('http') ? ' rel="noopener"' : ''}>${action.label}<span aria-hidden="true">→</span></a>
    </div>
    <nav class="footer-cols" aria-label="Footer">
      <div class="footer-col">
        <p class="footer-col-title">${t.colProduct}</p>
        ${
          landings ||
          `<a href="${VARIANT_ROUTES[lang].cloud}">${t.cloud}</a>
        <a href="${VARIANT_ROUTES[lang].selfhosted}">${t.selfhosted}</a>`
        }
        <a href="${changelogPath}">${t.changelog}</a>
      </div>
      ${docsCol}
      <div class="footer-col">
        <p class="footer-col-title">${t.colProject}</p>
        <a href="${LINKS.github}" rel="noopener">${t.github}</a>
        <a href="${LINKS.licence}" rel="noopener">${t.licence}</a>
        <a href="${privacyPath}">${t.privacy}</a>
      </div>
    </nav>
  </div>
  <div class="footer-base">
    <p><a href="${LINKS.wyliam}" rel="noopener">Made with &lt;3 by Wyliam</a></p>
    <p>Klui ${esc(CLAIMS.appVersion.value)}</p>
  </div>
</footer>`;
}
