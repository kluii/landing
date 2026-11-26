# Architecture

A static site, built from content, deployed as files. The interesting parts are the content pipeline, the build-time checks, and what deliberately does not exist.

---

## 1. Build model

```
app repo (checkout at tag)          site repo
  docs/*.md  ──┐
  tools.json ──┼── scripts/sync-docs.mjs ──► src/content/docs/en/v2/
  package.json─┘                                   │
                                                   ├── astro build ──► dist/
  src/content/{docs/_site,blog,legal} ─────────────┘        │
  scripts/og-images.mjs, changelog.mjs                      ├── /docs/<slug>.md twins
                                                            ├── /llms.txt
                                                            └── pagefind index
```

- `astro build` produces `dist/` with HTML, hashed assets, a sitemap, `.md` twins, an OG image per page, and the Pagefind index.
- No server code runs at request time. Hosting serves files; the only dynamic thing is the host's TLS and compression.
- The build is deterministic: same inputs, same output except timestamps inside OG images and the sitemap `lastmod` (both from `SOURCE_DATE_EPOCH` when set, so a release build is reproducible).

## 2. Routing

| Path | Source | Notes |
|---|---|---|
| `/` | `src/pages/index.astro` | English landing |
| `/fr/` | `src/pages/fr/index.astro` | French landing |
| `/docs/v2/...` | synced content | Current documentation |
| `/docs/v1/...` | frozen content | Never edited |
| `/docs/<slug>.md` | generated at build | Raw markdown twin |
| `/blog/...` | content collection | Changelog and announcements |
| `/legal/...` | content collection | Mentions légales, privacy |
| `/llms.txt` | `src/pages/llms.txt.ts` | Generated listing |
| `/404` | `src/pages/404.astro` | Static 404 |

`trailingSlash: 'never'`, one canonical form per page. A redirect map (`astro.config.mjs` → `redirects`) covers the old paths so a shared link from v1 keeps working.

## 3. Content collections

Three collections, all with a Zod schema:

- `docs` — Starlight's collection; frontmatter `title`, `description`, `sidebar.order`, `app_version` (generated pages), `frozen` (v1), `translation_status` (`human` | `machine` | `none`).
- `blog` — `title`, `description`, `date`, `version`, `draft`, `lang`.
- `legal` — `title`, `description`, `lang`, `updated`.

A build with a schema violation fails; there is no "unknown field" tolerance. `draft: true` posts and pages are excluded from production but reachable in dev.

## 4. Components

| Component | Responsibility |
|---|---|
| `Base.astro` | `<html lang>`, meta, fonts preload, skip link, no-JS fallback |
| `Nav.astro` | Wordmark, links, sheet under 768 px |
| `Footer.astro` | Footer rule, links, `Made with <3 by Wyliam`, version line |
| `Hero.astro` | H1, lead, actions, spec line |
| `BoardMock.astro` | The DOM board illustration |
| `GlyphGrid.astro` | The SVG texture |
| `Plate.astro` | The parchment mat around the board mock, plus its caption |
| `Section.astro` | `h2`, lead, rule, optional mono footnote |
| `CodeBlock.astro` | `<pre><code>`, language label, copy button |
| `CopyButton.astro` | The only island; clipboard + `aria-live` |
| `ArrowLink.astro` | Text link with a mono `→` |

Components take data, never fetch. There is no global store.

## 5. Islands

Exactly two:

1. `CopyButton` — 12 lines of JS, no framework, `navigator.clipboard` with a `document.execCommand` fallback, announces "Copied".
2. The nav sheet — 20 lines, toggles `aria-expanded`, traps focus with a `focusin` guard, closes on `Esc` and on link activation.

Starlight ships its own scripts for search and the sidebar; that is accepted and budgeted (`docs/testing.md` §5). Nothing else runs client-side.

## 6. Styling

- `tokens.css` (one `:root`, no light block, including the tracking tokens and the parchment plate), `base.css` (reset, the three type voices, focus, motion), `landing.css`, `docs.css`, `legal.css`, `starlight.css`, `print.css`.
- Fonts are three: Newsreader (variable, display only), Inter (body), JetBrains Mono (ledger). Self-hosted woff2, subset, serif and sans regular preloaded, budget 150 KB.
- Cascade layers: `@layer reset, tokens, base, components, pages`. A page style cannot accidentally beat a component without saying so.
- The only inline styles are custom properties set from data (glyph density) — a lint rule allows `style="--glyph-density: 6"` and nothing else.
- No Tailwind. Astro's scoped styles are used inside components; global files hold what several pages share.

## 7. Data modules

- `claims.ts` — the numbers (`docs/content.md` §6).
- `snippets.ts` — the install command, the compose file, the MCP config, exported once and imported by both the landing and the docs pages that render them.
- `links.ts` — every external URL in one place (GitHub, demo, licence, wyliam.dev). No URL is typed twice in a component.
- `legal.ts` — the operator identity and contact placeholders.

A URL or a number written directly in an `.astro` file is a review defect, and the lint rule catches both.

## 8. Build-time checks (fail the build, not the review)

1. `check-claims` — every claim matches its synced artifact and the documented version.
2. `check-links` — internal links, anchors, `.md` twins, `llms.txt` entries.
3. `content-lint` — banned words, emoji, uppercase eyebrows, placeholder values in production, `Made with <3` presence.
4. `astro check` — types and content schemas.
5. `og-images` — every page in the sitemap has an existing PNG; a missing one fails.
6. `sync-docs --check` — the synced content matches the app tag the site claims to document (a diff means someone edited generated content by hand).

## 9. What does not exist, on purpose

- No backend, no database, no forms that post anywhere.
- No authentication, no account, no personalisation.
- No cookie, no localStorage, no sessionStorage. Theme is not stored because there is no toggle.
- No CMS. Content is a file and a commit; a CMS would add an auth surface to a site whose whole point is that it has none.
- No A/B testing, no feature flags at runtime (build-time env only).
- No embedded app iframe: cookies, CSP, and a 2 MB payload for something the visitor can open in a tab.

## 10. Failure modes

| Failure | Behaviour |
|---|---|
| Sync source missing | Build fails with the expected path; no partial docs |
| Claims mismatch | Build fails naming the claim, the expected and the actual |
| Demo URL dead | The link is omitted; the build logs one warning |
| Legal placeholder in production | Build fails naming the field |
| OG render fails for one page | Build fails; a fallback image only exists for `/404` |
| Pagefind index empty | Build fails (search with no index is a broken UI shipped silently) |
