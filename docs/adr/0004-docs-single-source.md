# ADR-0004 — Docs single source of truth: the app repo owns technical docs

## Status
accepted · 2026-11-26 · Deciders: Wyliam

## Context
Two copies of a quickstart diverge within one release, and the wrong one is always the one indexed. The site must never document behaviour the app does not have.

## Decision
`scripts/sync-docs.mjs --from ../klui --tag <tag>` copies the app's `docs/*.md` and `docs/features/*.md` into `src/content/docs/v2/`, rewrites relative links, injects frontmatter, stamps `app_version`, and derives the claims artifacts into `src/generated/`. Site-only pages (quickstart intro, FAQ, limits, why-self-host, migration) live in `_site/` and are merged at sync time. `--check` in CI fails on any drift. The site and the app never import each other; the only coupling is this script reading a checkout and the claims manifest naming a version.

## Consequences
Generated pages are never edited in this repo; the fix goes to the app. The build is reproducible from a clean clone plus the app at the tag. Pre-release, when the app has no package.json/artifacts yet, the tag is the version and artifacts are derived from the app's docs (recorded in docs/verify).

## Alternatives rejected
| Alternative | Why not |
|---|---|
| Fork the docs into the site repo | Drift within one release; trap #4 |
| Symlink the app repo into the build | A checkout is not a build input; CI could not verify it |
| CMS | An auth surface on a site whose point is that it has none |
