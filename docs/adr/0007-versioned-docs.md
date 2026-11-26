# ADR-0007 — Versioned docs: /docs/v2 current, /docs/v1 frozen

## Status
accepted · 2026-11-26 · Deciders: Wyliam

## Context
People migrating from v1 need the truth about v1, not a rewritten memory of it. A switcher that pretends v1 supports v2 features is a lie.

## Decision
`/docs/v2` is regenerated at every app release by the sync. `/docs/v1` is a frozen copy of the previous line's docs (from the legacy repository), committed once, carrying `frozen: true` and a banner. The switcher links to the same slug in the other version only when that page exists there, otherwise to the version index. v1 pages are never edited after publication.

## Consequences
The sidebar groups the versions; cross-version links go through the index. O-04 (where frozen v1 docs come from) is answered: the `kluii/legacy` repository.

## Alternatives rejected
| Alternative | Why not |
|---|---|
| Single docs set, "latest only" | Migrating users lose the v1 reference |
| Keep v1 docs in the app repo | The app repo moves on; the frozen copy must not |
