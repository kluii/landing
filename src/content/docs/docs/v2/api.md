---
title: 'HTTP API'
description: 'Base path /api/v1.'
sidebar:
  order: 6
generated: true
app_version: '2.0.0'
---
# HTTP API

Base path `/api/v1`. OpenAPI 3.1 is generated from the Zod schemas in `server/src/contracts/`; the web client is generated from that document. If the document and the code disagree, the code is wrong and the document is the target.

---

## 1. Conventions

**Auth.** `Authorization: Bearer <session-token | kb_agent_key>` or the session cookie. A bearer credential wins over a cookie when both are present. Cookie-authenticated state-changing requests require the CSRF double-submit header (`X-Klui-CSRF`) matching the `klui_csrf` cookie.

**Content type.** `application/json; charset=utf-8` for every body. Import accepts `application/json` and `multipart/form-data` only in `POST /boards/:id/import` (a file field named `file`). Anything else → `415 unsupported_media_type`.

**Headers.**

| Header | Direction | Meaning |
|---|---|---|
| `X-Request-Id` | both | Accepted if `[A-Za-z0-9-]{8,64}`, else generated; echoed and logged. |
| `ETag` / `If-None-Match` | response / request | Only on `GET /boards/:id/state`; `304` when unchanged. |
| `Retry-After` | response | Seconds, on `429` and `503`. |
| `X-Klui-CSRF` | request | Double-submit token on cookie-auth writes. |

**Status codes.** `200` read/update, `201` create, `202` accepted (close-out generation, import), `204` delete, `304` not modified, `400` validation, `401` unauthenticated, `403` forbidden (readable board only), `404` not found **including unreadable**, `409` conflict, `413` payload too large, `415` media type, `429` rate limited, `500` internal, `503` dependency unavailable.

**Error body, always:**

```json
{"error":{"code":"validation_failed","message":"The request body is invalid.","hint":"Fix the fields listed in details.",
          "details":[{"path":"title","code":"too_small","message":"String must contain at least 1 character(s)"}]}}
```

`hint` is `null` when there is nothing useful to say; it is never absent. `details` exists only for `400` and `409`. Internal errors never include a stack trace; they carry the request id.

**Pagination.** Cursor only, never offset. `?limit=<1..100>&cursor=<opaque>`. The response is `{"items":[…],"next_cursor":"<opaque|null>"}`. Cursors are opaque base64url of `(created_at, id)` and must not be parsed by clients.

**Concurrency.** Every writable resource accepts `expected_updated_at` (ISO 8601, the value the client last saw). Mismatch → `409` with `{"error":{"code":"conflict","message":"…","hint":"Reload to see the current version.","current":{…}}}`. Omitting it means "last write wins", which is allowed only for actions that are inherently idempotent (`set_card_done`, `DELETE`).

**Idempotency.** `POST` create endpoints accept an optional `Idempotency-Key` header (max 64 chars, scoped per actor per route, 24 h). A replay returns the original response with `200` instead of `201`. Agents are expected to use it for retries.

**Rate limits.** Token bucket, `429` + `Retry-After`.

| Bucket | Limit |
|---|---|
| Anonymous writes per board | 30 / hour (configurable per instance) |
| Agent key writes | 60 / minute |
| Agent key reads | 600 / minute |
| Session writes | 120 / minute |
| Session reads | 600 / minute |
| Login attempts | 5 / 15 min per account, 20 / hour per IP |
| Signup | 5 / hour per IP |
| Import | 3 / hour per board |
| Export | 10 / hour per board |

**Versioning.** The path carries the major version. Additive fields are not a breaking change; removing or renaming one is, and requires a new path version plus a deprecation window documented in the changelog.

---

## 2. Objects

```jsonc
// Board
{ "id":"brd_…", "name":"Retro S2", "slug":"retro-s2", "visibility":"link",
  "link_role":"edit", "anon_write":"off", "link_suffix":"k3f9",
  "url":"https://host/will/retro-s2-k3f9",
  "owner":{"id":"usr_…","username":"will"},
  "closed_at":null,
  "created_at":"2026-11-26T09:00:00.000Z", "updated_at":"2026-11-26T09:00:00.000Z" }

// BoardState (one round trip paints the board)
{ "board": { … },
  "columns":[{"id":"col_…","name":"To Do","position":"1024"}],
  "cards":[{"id":"crd_…","column_id":"col_…","title":"Wire the digest","description":null,
            "assignee":{"id":"usr_…","username":"will"},"assignee_label":null,
            "due_at":null,"done":false,"position":"1024",
            "tags":[{"name":"api","color":"#8B5CF6"}],
            "created_at":"…","updated_at":"…"}],
  "members":[{"user_id":"usr_…","username":"will","role":"owner"}],
  "caller":{"actor_kind":"user","role":"owner","label":"will",
            "can_write":true,"can_manage":true,"can_moderate":false},
  "pending_count":0 }

// Event
{ "id":"evt_…","type":"card.moved","actor_kind":"user","actor_label":"will",
  "payload":{"card_id":"crd_…","from_column":"col_a","to_column":"col_b","before":null,"after":"crd_…"},
  "created_at":"…" }
```

Ids are prefixed opaque strings (`brd_`, `col_`, `crd_`, `cmt_`, `evt_`, `usr_`, `key_`), 26 chars total, URL-safe. They are not UUIDs and clients must treat them as opaque.

Positions are serialized as **strings** (`"1024"`, `"1536"`) because they are `Decimal`. A client that parses them as floats will eventually round two cards onto the same rank.

---

## 3. Accounts

| Method | Path | Notes |
|---|---|---|
| `POST` | `/auth/signup` | `{email, username, password, invite_token?}`. `201` + session cookie. `409` if the username is taken (case-insensitive) — the only endpoint allowed to reveal that a username exists, because the user chose it. |
| `POST` | `/auth/login` | `{email_or_username, password, totp?}`. Same body and timing for unknown account and wrong password. If TOTP is required and absent → `401 totp_required` with no other information. |
| `POST` | `/auth/logout` | Revokes the current session. `204`. |
| `POST` | `/auth/logout-all` | Revokes every session of the actor. `204`. |
| `POST` | `/auth/totp/enroll` | `201` `{secret, otpauth_url, recovery_codes[]}` — the **only** time these are returned. |
| `POST` | `/auth/totp/verify` | `{code}` confirms enrollment; `200` on success, `400 invalid_code`. |
| `POST` | `/auth/totp/disable` | `{password, code}`; invalidates remaining recovery codes. |
| `POST` | `/auth/recovery-codes` | `{password}` regenerates; returns the new set once and invalidates the old. |
| `POST` | `/auth/reset/request` | `{email}`. Always `202`, whether or not the account exists. `503 email_not_configured` when SMTP is unset (fail closed, never a fake success). |
| `POST` | `/auth/reset/confirm` | `{token, password}`. Single-use; revokes every session on success. |
| `GET` | `/auth/oidc/:provider/start` | `302` to the provider; `state` + PKCE in a signed cookie. |
| `GET` | `/auth/oidc/:provider/callback` | Creates or links, then `302` to `/boards`. Linking requires an authenticated local session. |
| `POST` | `/auth/oidc/:provider/link` | Explicit link for an already-signed-in user. |
| `GET` | `/me` | `{id, email, username, display_name, totp_enabled, is_instance_admin, created_at}`. |
| `PATCH` | `/me` | `{username?, display_name?, email?}`. Username change reserves the old value 90 days. |
| `GET` | `/me/sessions` | `[{id, ip, user_agent, created_at, last_seen_at, current:bool}]`. |
| `DELETE` | `/me/sessions/:id` | `204`; deleting the current session logs out immediately. |
| `DELETE` | `/me` | `{password, confirm:true}`. Documented cascade; anonymises authored comments. |

---

## 4. Boards

| Method | Path | Notes |
|---|---|---|
| `GET` | `/boards` | Boards the actor can read, `{items:[…]}`, newest activity first. Includes role. Closed boards are listed with `closed_at` set (there is no archive, D-53). |
| `POST` | `/boards` | `{name, visibility?, template?}`. `201` + Board. Default visibility `private`. A template seeds columns (`classic`: To Do / Doing / Done; `blank`: none). |
| `GET` | `/boards/:id` | Board without content. `404` if unreadable. |
| `PATCH` | `/boards/:id` | `{name?, slug?, visibility?, link_role?, anon_write?, expected_updated_at?}`. Changing to `private` forces `link_role:none` and `anon_write:off` in the same transaction. Changing to `link` generates a suffix if absent. |
| `DELETE` | `/boards/:id` | `{confirm:true}` in the body. `204`. Owner only. |
| `GET` | `/boards/:id/state` | `BoardState`. `ETag` supported. |
| `GET` | `/boards/:id/search` | `?q&assignee&tags=<csv>&done&column&limit&cursor`. Server-side equivalent of the filter panel and of the MCP `search_cards` tool; returns `{items:[Card], next_cursor, truncated}`. Same `can()` gate as `state`. |
| `GET` | `/boards/:id/activity` | `?limit&cursor&actor_kind=user|agent|anon&type=<csv>`. `{items:[Event],next_cursor}`. |
| `GET` | `/boards/:id/export.json` | `klui.export/v2`, `Content-Disposition: attachment`. |
| `GET` | `/boards/:id/export.md` | Markdown per `docs/features/import-export.md`. |
| `POST` | `/boards/:id/import` | `{format:"v2"|"v1"|"trello", data:<parsed json>}` or multipart `file`. `202` with `{job_id}`; progress over SSE (`import.progress`). Idempotent on `(board_id, source_hash)`. |
| `POST` | `/boards/:id/close` | `{confirm:true, note?}`. Generates the summary, sets `closed_at`. `409` if already closed. Irreversible. |
| `GET` | `/boards/:id/summary` | The stored close-out summary (JSON). `404` until closed. |
| `GET` | `/boards/:id/members` | `[{user_id, username, role, joined_at}]`. |
| `POST` | `/boards/:id/members` | `{username, role}`. `201`. Owner/admin. |
| `PATCH` | `/boards/:id/members/:userId` | `{role, expected_updated_at?}`. Cannot demote the last owner. |
| `DELETE` | `/boards/:id/members/:userId` | `204`. Cannot remove the owner; an admin cannot remove another admin. |
| `POST` | `/boards/:id/transfer` | `{user_id, confirm:true}`. Owner only; one transaction. |
| `GET` | `/boards/:id/tag-colors` | `{ "api": "#8B5CF6", "web": "#2563EB" }` — the board-level defaults. |
| `PUT` | `/boards/:id/tag-colors` | Replaces the map. Keys are normalised tag names; values are `#RRGGBB`. Owner/admin only (it is a board setting; an editor can still colour a tag on a card, which is a card write). |

**URL semantics.** `private` and `public` boards answer on `/<username>/<slug>`; `link` boards on `/<username>/<slug>-<suffix>`. The API is id-based, so a URL never grants anything by itself.

---

## 5. Links

| Method | Path | Notes |
|---|---|---|
| `GET` | `/boards/:id/links` | `[{id, role, label, created_at, last_used_at, revoked_at}]`. Never the token. |
| `POST` | `/boards/:id/links` | `{role:"read"|"edit", label?}`. `201` `{id, role, url:"https://host/l/<token>", token}` — token shown **once**, never retrievable again. |
| `DELETE` | `/boards/:id/links/:linkId` | `204`; the URL answers `404` immediately after. |
| `POST` | `/boards/:id/link-suffix/rotate` | `{confirm:true}` → new suffix, old URL `404`s. |

`/l/<token>` is a server-rendered route: it resolves the link, sets a scoped cookie for that board and role, and redirects to the board with the link actor active. It is `noindex` and never appears in a log with the token intact.

---

## 6. Columns and cards

| Method | Path | Notes |
|---|---|---|
| `POST` | `/boards/:id/columns` | `{name, position?}` where `position` is `{before?, after?}` (column ids) or omitted (append). |
| `PATCH` | `/columns/:id` | `{name?, position?, expected_updated_at?}`. |
| `DELETE` | `/columns/:id` | `409 column_not_empty` unless `{move_cards_to:"<column id>"}` or `{delete_cards:true}`. |
| `POST` | `/boards/:id/cards` | `{column, title, description?, assignee?, due_at?, tags?, done?}`. `column` is a column id, not a name. |
| `POST` | `/boards/:id/cards/bulk` | `{column, items:[…]}` max 200; one transaction; returns `{created:[Card]}`. Partial failure rolls back everything. |
| `GET` | `/cards/:id` | Card + `comments_count`. |
| `PATCH` | `/cards/:id` | Any of `{title, description, assignee, assignee_label, due_at, tags, done, expected_updated_at}`. |
| `DELETE` | `/cards/:id` | `204`. |
| `POST` | `/cards/:id/move` | See §6.1. |
| `GET` | `/cards/:id/comments` | `{items:[Comment],next_cursor}`. |
| `POST` | `/cards/:id/comments` | `{body}`. Users with `editor+` only. `403` for link/anon actors (never `404`: they can read the card). |
| `PATCH` | `/comments/:id` | `{body}`. Author only; sets `edited_at`. |
| `DELETE` | `/comments/:id` | Author, or owner/admin for moderation. |

**Card field rules.** `title` 1–200 chars, trimmed, no newline. `description` ≤ 10 000 chars, markdown subset (no raw HTML, no images). `tags` ≤ 8 entries, each `{name, color?}`; `name` is 1–24 chars `[a-z0-9-]`, normalised lowercase, deduplicated; `color` is `#RRGGBB` or omitted (omitted → the board default, else the neutral chip). A bare string in the `tags` array is accepted on input as shorthand for `{name}`; responses always emit objects. `due_at` ISO date or datetime, stored UTC. `assignee` is a member user id; `assignee_label` is a display name (v1 import, anonymous creation) — setting both is a `400`. `done` is a boolean on the card; toggling it records `card.completed` / `card.reopened`.

### 6.1 `POST /cards/:id/move`

```json
{ "column": "col_target", "before": "crd_above_or_null", "after": "crd_below_or_null",
  "expected_updated_at": "2026-11-26T09:00:00.000Z" }
```

- `before` / `after` are card ids **the client actually rendered**. Both may be `null` (empty column or empty space).
- The server resolves them **against the stored column**, not against any client list, ranks between their stored positions, renumbers the column when the gap is exhausted, and **appends** when a named neighbour no longer exists or is not in the target column.
- A body containing `index`, `position` or `order` is rejected with `400 unknown_field` and a hint naming the accepted shape. This rejection is deliberate: accepting it would reintroduce the bug.
- Response: `{card, column_id, position}`. The client uses the returned `position` to reconcile its optimistic placement.

### 6.2 Card state and realtime ordering

Every mutation response is also published to the board's SSE subscribers. **An echo can arrive before the HTTP response to the same mutation.** Clients merge by id, never append: a create handler that appends will duplicate the card under a slow link. The same rule applies to columns, comments and pending cards.

---

## 7. Agents and operations

| Method | Path | Notes |
|---|---|---|
| `POST` | `/agent-keys` | `{name, scope:"board"|"user", board_id?, expires_in_days?}`. `201` `{id, key, name, scope, board_id, expires_at}` — key shown once. |
| `GET` | `/agent-keys` | Metadata only, never the key. |
| `DELETE` | `/agent-keys/:id` | `204`; effective on the next request. |
| `POST` | `/agent-keys/:id/test` | Performs a real `whoami`-equivalent with the key and returns `{ok, board, role}` or the exact failure. |
| `GET` | `/me/digest` | `{enabled, hour, timezone, channels:{webhook,email,rss}, last_sent_at, rss_url?}`. `rss_url` is returned only immediately after rotation. |
| `PATCH` | `/me/digest` | `{enabled?, hour?, timezone?, webhook?, email?, rss?: "rotate"|"disable"}`. |
| `POST` | `/me/digest/test` | Builds the digest for real events and delivers to the configured channel; `{sent, sections, bytes}`. Empty digest → `{sent:false, reason:"empty"}`. |
| `GET` | `/healthz` | `{"status":"ok","version":"2.0.0","db":"up"}`; `503` with `db:"down"` otherwise. No auth. |
| `GET` | `/metrics` | Off by default (`404`). When enabled: loopback or `Authorization: Bearer $KLUI_METRICS_TOKEN`. |
| `POST` | `/mcp` | See `docs/mcp.md`. |
| `GET` | `/api/v1/stream` | SSE. `?board=<id>` (repeatable). Auth as usual. |
| `GET` | `/llms.txt` | Plain text; describes the MCP endpoint and the tool list. |

---

## 8. Events catalogue

`payload` keys are part of the contract: the digest, the activity feed and the close-out summary read them.

| Type | Payload |
|---|---|
| `board.created` | `{board_id, name, visibility}` |
| `board.updated` | `{board_id, changes:{field: [old, new]}}` |
| `board.closed` | `{board_id, summary_id}` |
| `member.added` | `{board_id, user_id, role}` |
| `member.updated` | `{board_id, user_id, from, to}` |
| `member.removed` | `{board_id, user_id}` |
| `column.created` / `column.updated` / `column.deleted` | `{board_id, column_id, name?, from?, to?}` |
| `card.created` | `{board_id, card_id, column_id, title}` |
| `card.updated` | `{board_id, card_id, column_id, changes:{field: [old, new]}}` |
| `card.moved` | `{board_id, card_id, from_column, to_column, before, after}` |
| `card.completed` / `card.reopened` | `{board_id, card_id, column_id}` |
| `card.deleted` | `{board_id, card_id, column_id, title}` |
| `comment.created` / `comment.updated` | `{board_id, card_id, comment_id, body_excerpt}` |
| `link.created` / `link.revoked` | `{board_id, link_id, role}` |
| `pending.created` | `{board_id, pending_id, title}` |
| `pending.approved` / `pending.rejected` | `{board_id, pending_id, card_id?}` |
| `agent_key.created` / `agent_key.revoked` | `{key_id, name, scope, board_id?}` |
| `import.completed` | `{board_id, format, columns, cards, comments}` |

`changes[field]` uses `[old, new]` with `null` for absence. `body_excerpt` is at most 120 characters and is the only place comment text is duplicated into the event log — it exists so the digest can say what happened without a join, and it is stripped on export.

---

## 9. OpenAPI generation

- One Zod schema per request and response, exported from `contracts/`. Routes reference them; no route declares an inline shape.
- `@fastify/swagger` generates the document at boot; `GET /api/v1/openapi.json` serves it (auth: any authenticated actor; `404` when `KLUI_ENV=production` and `KLUI_OPENAPI=false`).
- The web client (`web/src/api/client.ts`) is generated with `openapi-typescript` into a committed file; regenerating it is part of the build, and a CI step fails when the committed file is stale.
- A contract test asserts a golden request/response pair per endpoint, including every documented error shape. The 404-not-403 rule is one of them.
