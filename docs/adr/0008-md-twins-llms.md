# ADR-0008 — Every docs page has a .md twin and appears in llms.txt

## Status
accepted · 2026-11-26 · Deciders: Wyliam

## Context
Agents read documentation too, and a raw markdown URL is how they do it well. A docs page without a machine-readable twin is half a page.

## Decision
At build time every docs page emits `/docs/<slug>.md` (body only, root-relative links made absolute, `# Title` on top) from the same collection entry as the HTML, and `/llms.txt` lists every page once with its frontmatter description. Both are `text/markdown`, allowed by robots.txt, excluded from the sitemap. A page without a description fails the build.

## Consequences
The link gate asserts a twin per HTML docs page and that every llms.txt entry resolves to both its .md and its HTML. MDX pages with components get a component-free twin via the merge markers, not raw JSX.

## Alternatives rejected
| Alternative | Why not |
|---|---|
| llms.txt only | Agents want the page, not a list |
| Hand-written twins | Drift; trap #4 |
