# ADR-0001 — Stack: Astro + Starlight, static output, Pagefind

## Status
accepted · 2026-11-26 · Deciders: Wyliam

## Context
The site is a landing, versioned docs, a changelog and legal pages. It needs to load fast on a phone, cost nothing to host, and never run request-time code. A framework that renders on a server adds latency, a runtime and a failure mode for text that is known at build time.

## Decision
Astro with `output: 'static'`, Starlight for the docs, Pagefind for build-time search. `dist/` is the product. Exact pinned versions in `package.json`: astro 7.4.13, @astrojs/starlight 0.43.2, @astrojs/sitemap 3.7.6, @resvg/resvg-js 2.6.2, pagefind 1.6.0 (no `^`/`~` on these). No SSR adapter, no serverless function, no API route that does work at request time.

## Consequences
Hosting is a folder of files with headers (docs/deploy.md). Search is an index built at build time; no search backend exists to leak queries. Adding any dependency that ships to the browser needs a new ADR.

## Alternatives rejected
| Alternative | Why not |
|---|---|
| Next.js/Nuxt with SSR | Request-time rendering for static text; a runtime to operate; slower on 4G |
| Plain HTML hand-written | No content collections, no versioned docs, no sitemap/OG pipeline; the sync script would re-implement half a framework |
| Algolia/Typesense search | A vendor call per query leaks the query text; contradicts the privacy page |
