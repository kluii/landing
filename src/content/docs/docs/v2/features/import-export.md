---
title: 'Import and export'
description: 'The project has an end, and the data has an exit.'
sidebar:
  order: 16
generated: true
app_version: '2.0.0'
---
# Import and export

The project has an end, and the data has an exit. `klui.export/v2` is the canonical format; `v1` and Trello are import-only.

---

## 1. `klui.export/v2`

```jsonc
{
  "schema": "klui.export/v2",
  "exported_at": "2026-11-26T10:00:00.000Z",
  "board": { "name": "Retro S2", "visibility": "private", "link_role": "read", "anon_write": "off" },
  "columns": [{ "id": "col_…", "name": "To Do", "position": 1024 }],
  "cards": [{
    "id": "crd_…", "column_id": "col_…", "title": "Wire the digest",
    "description": null, "assignee": "Hermes",
    "tags": [{"name": "api", "color": "#8B5CF6"}],
    "due_at": null, "done": false, "position": 1024,
    "created_at": "2026-11-01T09:00:00.000Z", "updated_at": "2026-11-03T10:12:00.000Z"
  }],
  "comments": [{
    "card_id": "crd_…", "body": "…", "author_label": "Will",
    "author_type": "user", "created_at": "2026-11-02T08:00:00.000Z"
  }]
}
```

Rules:

- **Deterministic ordering.** Columns by `position` then `id`; cards by `column_id` then `position` then `id`; comments by `created_at` then `id`. Two exports of the same board are byte-identical except `exported_at`.
- **Stable ids** are the real ids of the exported instance. They are not rewritten, so an export is also a debugging artifact.
- `assignee` is a **display name** (`assignee_label` or the member's username), never an id: an export must survive an instance that has never seen those users.
- Tags are objects. A file that carries tags as bare strings (v1, or a hand-written v2) is accepted: the string becomes `{name}`, and the board default supplies the colour.
- No tokens: `share_url`, agent keys, RSS tokens, session ids never appear. An export is not a credential.
- No events. Activity is instance history, not board content; the close-out summary is the human-readable digest of it.
- `description` is markdown as stored, `null` when absent. `tags` are objects `{name, color}`, `name` lowercase, sorted by name; `color` is the effective colour of that tag on that card (card override, else the board default), or `null`.

## 2. Import

`POST /boards/:id/import` with `{format:"v2"|"v1"|"trello", data}` or a multipart `file`. Returns `202 {job_id}`; progress over SSE (`import.progress`), completion recorded as `import.completed` with counts.

- Import into an **existing** board: columns are matched by name (case-insensitive); unmatched columns are created; cards keep their relative order inside the matched column, appended after existing cards.
- Import into an **empty** board (the common case) reproduces the export exactly.
- **Idempotent on `(board_id, source_hash)`**: importing the same file twice does not duplicate content; the second call returns the first job's result.
- Limits: 5 MB, 5 000 cards, 200 columns, 20 000 comments. Over the limit → `413` with the limit named.
- Validation is all-or-nothing: one invalid card rolls back the whole import. A partial import that "mostly worked" is worse than a rejection.
- Every imported card gets `done` as given (v2) or `false` (Trello, v1 — see mapping).

### 2.1 `klui.export/v1` mapping

The importer accepts exactly the Appendix A shape; unknown fields are ignored, missing optional fields default.

| v1 | v2 |
|---|---|
| `name` | `board.name` |
| `level` (`creator` / `rw` / `ro`) | ignored for ownership: the importer becomes `owner`. `ro` adds a warning in the job result. |
| `archived`, `archived_at`, `archive_after_days`, `archive_at` | **ignored**: 2.0 has no archive and no expiry (D-53). The job result counts them as dropped fields so the user knows. |
| `columns[]` | `columns[]`, position preserved, renumbered to 1024 steps |
| `cards[]` | `cards[]`; `assignee` (display name) → `assignee_label`; `assignee_id` is never invented |
| `member_names[]` | not imported as accounts; they appear only through `assignee_label` |
| `tag_colors` | imported as board-level defaults (`BoardTagColor`), then applied to every imported card tag that has no card-level colour |
| `share_url`, `share_mode` | **never imported** — a token is not board content, and the new model hashes its own |
| `comments[].author_type` | `author_type` preserved verbatim (`user`/`agent`/`anon`) |
| `comments[].author_label` | `author_label` preserved; `author_id` null |
| `comments[].id` | dropped (ids are regenerated; the source id is kept in the job log) |

**Ask the human for one real v1 export file at the start of K2 and keep it as a fixture.** The appendix is a description; a real file is evidence. The importer is marked "verified against a real file" or "shaped from the appendix" in the release notes — never silently assumed.

### 2.2 Trello JSON mapping

| Trello | Klui |
|---|---|
| `lists[]` | `columns[]` in `pos` order; closed lists skipped |
| `cards[]` | `cards[]`; `closed: true` cards are skipped (Trello archives them out of the list; importing them as `done` would invent a state the source never showed) |
| `cards[].name` | `title` |
| `cards[].desc` | `description` (raw markdown/text) |
| `cards[].due` | `due_at` |
| `cards[].labels[]` | `tags` with `name` (normalised; a colour-only label becomes `label-<colour>`) and `color` mapped from Trello's colour name to the palette (`green` → `--tag-green`, `yellow` → `--tag-amber`, `orange` → `--tag-orange`, `red` → `--tag-red`, `purple` → `--tag-violet`, `blue` → `--tag-blue`, `sky` → `--tag-sky`, `lime` → `--tag-lime`, `pink` → `--tag-pink`, `black` → `--tag-gray`, `null` → no colour) |
| `cards[].idMembers` | `assignee_label` from the member's `fullName` — never a user account |
| `cards[].pos` | order within the list |
| `checklists`, attachments, `actions` | not imported; counted in the job result so the user knows what was left behind |

## 3. Markdown export

```md
# Retro S2

## To Do
- [ ] **api** Wire the digest — @Hermes — due 2026-12-02
  Description line, indented two spaces.
  Second line.
  > [Will/user, 2026-11-02] Comment body.

## Done
- [x] Fix the drop index — @Will
```

- `# Board`, `## Column`, `- [x| ] **tag** Title — @assignee — due YYYY-MM-DD`.
- Multiple tags render as `**api** **web**` in sorted order.
- Description indented two spaces per line, blank lines preserved as `  `.
- Comments under their card as blockquotes with `[author/type, date]`.
- Deterministic: same board, same bytes. Ends with a single newline.
- Markdown is for humans and for handing a project to someone; it is **not** re-importable. The JSON is the round-trip format.

## 4. The round-trip test

```
seed board (3 columns, 40 cards, tags, assignees, due dates, done, 12 comments)
export v2 → E1
create empty board → import E1 → export v2 → E2
normalise: drop exported_at, sort nothing (ordering is already deterministic)
assert E1 == E2 byte for byte
```

Plus: import a v1 fixture twice, assert one board's worth of content and no duplicates; import Trello JSON, assert columns/cards/tags and that `done` is false for all.

## 5. Edge cases that must not crash

| Case | Behaviour |
|---|---|
| Card references a missing column | `400` naming the card id and the column id; nothing imported. |
| Duplicate card ids in the file | `400 duplicate_id`. |
| `position` collision | renumbered, not rejected. |
| `due_at` invalid | `400` naming the card and the field (no silent drop). |
| Tag with uppercase or spaces | normalised to lowercase `[a-z0-9-]`; a tag that cannot be normalised to 1–24 chars is dropped and counted. |
| Description > 10 000 chars | truncated at 10 000 with a counted warning (import must not fail on legacy content). |
| 5 001 cards | `413`, nothing imported. |
| Empty file / wrong schema | `400 unsupported_schema` listing the accepted schemas. |
