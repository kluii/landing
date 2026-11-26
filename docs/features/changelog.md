# Changelog and release notes

A changelog is a reading of a release, not a mirror of `git log`. The script does the sorting; a human writes the two paragraphs that say why the release exists.

---

## 1. Generation

```
node scripts/changelog.mjs --from <previous-tag> --to <tag> [--dry-run]
```

1. `git log <from>..<to> --no-merges --pretty=%s%x00%b` in the app repository.
2. Parse conventional commits: `type(scope): subject`. Types map:

| Type | Section |
|---|---|
| `feat` | Added |
| `fix` | Fixed |
| `doc` | Docs |
| `refactor`, `perf` | Changed |
| `chore`, `build`, `ci`, `test` | Internal (included, at the end, collapsed) |
| `BREAKING CHANGE:` in the body, or `!` after the type | Breaking (top, never collapsed) |

3. Drop noise: merge commits, `wip:` commits, commits that only touch lockfiles, and revert pairs (a commit and its revert cancel out).
4. Clean the subject: strip the `type(scope):` prefix, lowercase the first letter unless it starts with a proper noun, remove trailing period.
5. Write `src/content/blog/en/<version>.mdx`:

```mdx
---
title: '2.0.0 — the board gets an end'
description: 'TODO: one sentence, written by a human.'
date: 2026-11-26
version: '2.0.0'
draft: true
lang: en
---

TODO(hand-written): two to four sentences on why this release exists.

## Breaking

- `POST /cards/:id/move` now takes `{column, before, after}`; the index field is rejected.

## Added
- Close-out summary generated from the event log
- 21 MCP tools with per-board keys

## Fixed
- A drop between two cards no longer lands at the end of the column

## Internal
- …collapsed list…
```

6. Exit codes: `0` written or nothing to write; `1` a tag that does not exist or a repo that is not a git checkout. Never rewrite an existing file — if `<version>.mdx` exists, exit 0 with `already exists`.

## 2. The human pass

- Replace both TODOs: the description and the opening paragraph.
- Delete any generated line that is internal noise for a reader (`bump deps`, `fix typo`).
- Anything user-visible under Breaking gets a migration sentence and a link to `docs/v2/migrate-from-v1` when relevant.
- Flip `draft: false` in the release PR, never before.

The script cannot publish. A post with a `TODO(` marker in it fails the build in production — a release note that says "TODO" is worse than no release note.

## 3. Blog index and feed

- `/blog` lists posts newest first: version in mono, date, title, one-sentence description. Draft posts are excluded in production.
- `/blog/rss.xml` is generated from the collection (title, link, date, description, full text). One feed, no per-tag feeds.
- Each post links to the previous version's post and to the app tag on the repository.
- A "generated from commits `a1b2c3d..e4f5g6h`" line at the bottom, in `mono-sm`, so a reader can audit the diff.

## 4. What goes in a release note

- Why: the problem this release solves, in plain language.
- What changed for a user of the product: new capability, changed behaviour, fixed bug.
- What changed for an operator: env vars, migrations, upgrade notes, backup advice.
- What broke, if anything: breaking changes first, with the migration step.
- What is still missing: one line, linking to the limits page. Honesty compounds.

What does not go in: a list of every commit, a thank-you to contributors who do not exist, "various improvements", "performance improvements" without a measurement.

## 5. Cadence

- One post per release, published with the release, not before.
- A patch release gets a short post (a paragraph and a Fixed list); a minor gets the full treatment.
- No "scheduled" posts: if the release slips, the post moves with it.

## 6. Acceptance

- A dry run against a fixture repository produces the expected groups and the right frontmatter.
- A tag with only `chore:` commits produces a post whose Internal section is collapsed and whose Added section is absent (not an empty heading).
- A post with `draft: true` is absent from `dist/`.
- A post with a `TODO(` marker fails a production build.
- The RSS feed lists the same posts as the index, same order.
