// SPDX-License-Identifier: AGPL-3.0-only
// The footer markup lives in one .ts module so both the site Footer and the Starlight
// Footer override render the same bytes (Starlight overrides cannot bundle .astro imports).
import { LINKS, HAS_FR_ROUTES } from '../data/links.ts';
import { FOOTER } from '../data/copy.ts';
import { CLAIMS } from '../data/claims.ts';
import pkg from '../../package.json';

const CSS = `
.site-footer { border-top: 1px solid var(--border); padding-top: var(--section-pad); margin-top: var(--section-pad); }
.footer-inner { max-width: var(--container); margin: 0 auto; padding: 0 24px 32px; display: grid; grid-template-columns: 1fr auto auto; gap: 32px; align-items: start; }
.footer-logo { height: 32px; width: auto; }
.footer-desc { margin-top: 12px; font-size: var(--text-body-sm); letter-spacing: var(--tracking-small); color: var(--ink-subtle); max-width: 34ch; }
.footer-links { display: flex; flex-direction: column; gap: 8px; }
.footer-links a { font-size: var(--text-label); font-weight: 500; letter-spacing: var(--tracking-label); color: var(--ink-muted); text-decoration: none; }
.footer-links a:hover { color: var(--ink); }
.footer-meta { text-align: right; }
.mono-line { font-family: var(--font-mono); font-size: var(--text-mono-sm); letter-spacing: var(--tracking-mono-sm); color: var(--ink-subtle); line-height: var(--lh-mono-sm); }
.mono-line + .mono-line { margin-top: 8px; }
.mono-line a { color: var(--ink-subtle); }
.mono-line a:hover { color: var(--ink); }
@media (max-width: 768px) { .footer-inner { grid-template-columns: 1fr; gap: 24px; padding: 0 20px 32px; } .footer-meta { text-align: left; } }
`;

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function footerHtml(lightLogo: string, lang: 'en' | 'fr'): string {
  const docsPath =
    lang === 'fr' && HAS_FR_ROUTES ? '/fr/docs/v2/quickstart' : '/docs/v2/quickstart';
  const changelogPath = lang === 'fr' && HAS_FR_ROUTES ? '/fr/blog' : '/blog';
  const privacyPath = lang === 'fr' ? '/legal/confidentialite' : '/legal/privacy';
  return `
<style>${CSS}</style>
<footer class="site-footer">
  <div class="footer-inner">
    <div class="footer-brand">
      <img src="${lightLogo}" alt="Klui" width="96" height="32" class="footer-logo" />
      <p class="footer-desc">A self-hosted kanban for projects that end.</p>
    </div>
    <nav class="footer-links" aria-label="Footer">
      <a href="${docsPath}">${FOOTER[lang].docs}</a>
      <a href="${changelogPath}">${FOOTER[lang].changelog}</a>
      <a href="${LINKS.github}" rel="noopener">${FOOTER[lang].github}</a>
      <a href="${LINKS.licence}" rel="noopener">${FOOTER[lang].licence}</a>
      <a href="${privacyPath}">${FOOTER[lang].privacy}</a>
    </nav>
    <div class="footer-meta">
      <p class="mono-line">Klui ${esc(CLAIMS.appVersion.value)} · site ${esc(pkg.version)}</p>
      <p class="mono-line"><a href="${LINKS.wyliam}" rel="noopener">Made with &lt;3 by Wyliam</a></p>
    </div>
  </div>
</footer>`;
}
