# SEO, metadata and machine readability

The site is small, so SEO is mostly honesty and completeness: one canonical URL per page, a title that says what the page is, a description that is not a slogan, and structured data that matches the visible content.

---

## 1. Titles and descriptions

- Title: `{Page} — Klui`, except the home page: `Klui — a kanban for projects that end`.
- Docs: `{Doc title} — Klui docs`. Blog: `{Post title} — Klui changelog`.
- Title ≤ 60 characters where possible; the build warns above 65.
- Description: one sentence, ≤ 155 characters, taken from frontmatter, never auto-truncated mid-word. A missing description fails the build (it also breaks `llms.txt`).

## 2. Canonicals and alternates

- One `<link rel="canonical">` per page, absolute, no query string, trailing slash policy `never`.
- `hreflang`: `en` → `/`, `fr` → `/fr/`, plus `x-default` → `/`.
- A page that exists only in English has no `fr` alternate (rather than pointing at a machine translation).
- Pagination (blog) uses `rel="prev"`/`rel="next"` and self-canonicalises.

## 3. Open Graph and Twitter

Per page: `og:type` (`website` for landing/legal, `article` for posts, `article` for docs with `article:section`), `og:title`, `og:description`, `og:url`, `og:image` (1200×630 PNG, absolute), `og:locale` (+ `og:locale:alternate` for FR), `twitter:card=summary_large_image`.

The OG image is generated at build:

- Canvas `#0B0B0C` (parsed from `tokens.css` at build), 1 px `--border` inset border at 24 px, wordmark top-left at 40 px.
- Title: Newsreader 400, 64 px, -0.02em, `--ink`, max 3 lines, bottom-anchored so a long title cannot overlap the footer.
- Section label in JetBrains Mono 20 px, `--ink-subtle`, top-right.
- Footer line: `klui.wyliam.dev` in mono, `--ink-subtle`.
- A small parchment plate strip (24 px, `--plate`) along the bottom edge, as the one link to the landing's plate device.
- Geometry is asserted in a test: the gap between the last title line and the footer is ≥ 40 px for one-, two- and three-line titles.

## 4. Structured data

- Landing: `SoftwareApplication` (`name`, `applicationCategory: "BusinessApplication"`, `operatingSystem: "Linux, macOS, Windows"`, `offers: {price: "0", priceCurrency: "EUR"}`, `license`, `url`, `codeRepository`). No `aggregateRating` — inventing a rating is the same lie as inventing a testimonial.
- Docs: `BreadcrumbList` + `TechArticle`.
- Blog post: `BlogPosting` with `datePublished`, `dateModified`, `author` (the organisation, not a fake person).
- `Organization` once, on the home page, with the same name and URL as the footer.
- JSON-LD is generated from the same data the page renders; a mismatch is a bug.

## 5. Crawling

`robots.txt`:

```
User-agent: *
Allow: /
Disallow: /_astro/
Sitemap: https://<host>/sitemap-index.xml
```

- The sitemap includes every HTML page with a real `lastmod` (content commit date, not build time). `.md` twins and OG images are excluded.
- `noindex` on `/404`, on draft posts that somehow reach production (they do not), and on any preview deployment (`X-Robots-Tag: noindex` on the preview host, so a preview never competes with production).
- No `meta keywords`, no `author` meta with a fake name, no hidden text.

## 6. URLs

- Lowercase, hyphenated, no dates in slugs except the blog (`/blog/2026-11-26-2-0-0`), no ids.
- The docs slug is the app doc's file name; renaming a doc is a redirect (`301`) plus keeping the old slug in `llms.txt` for one release.
- One origin serves the site; the demo instance and the app are separate origins and are never proxied under the marketing domain.

## 7. Performance as SEO

Core Web Vitals are part of the gate (`docs/testing.md` §5): LCP is the `h1` (text), CLS 0, INP is trivially low because there is almost no JS. A page that fails the budget is not released, regardless of its metadata.

## 8. Link hygiene

- Every external link that is not a first-party property gets `rel="noopener"`; commercial or untrusted destinations also get `rel="nofollow"`. No paid links, no affiliate links.
- Internal links are relative to the site root and checked by the link gate (including anchors, which are computed from heading slugs at build time).
- A link to the app or the demo carries the destination's real URL; no redirect chains, no link shorteners.

## 9. What we deliberately do not do

- No keyword stuffing, no doorway pages, no AI-generated SEO articles.
- No fake FAQ markup for questions the page does not answer on screen.
- No review schema, no rating, no price for a product that is free to self-host.
- No hreflang pointing at untranslated pages.
