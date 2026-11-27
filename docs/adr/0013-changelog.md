# ADR-0013 — The changelog is generated from conventional commits plus a human paragraph, always draft first

## Status
accepted · 2026-11-26 · Deciders: Wyliam

## Context
An auto-published changelog reads like a git log and says nothing about why the release matters.

## Decision
`scripts/changelog.mjs --from <prev> --to <tag>` groups conventional commits (feat→Added, fix→Fixed, breaking→top), cleans subjects, and writes `src/content/blog/en/<version>.mdx` with `draft: true` and `TODO(hand-written)` markers. It never rewrites an existing post and never publishes. A `TODO(` marker fails a production build. Each post ends with the commit range in mono so the diff is auditable.

## Consequences
Release notes are a reading of the release, not a mirror of git log. The human pass (two paragraphs) happens in the release PR.

## Alternatives rejected
| Alternative | Why not |
|---|---|
| Fully automatic changelog | Reads like git log; no "why" |
| Hand-written only | Misses the fixes; drifts from the code |
