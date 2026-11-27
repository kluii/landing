---
title: '03 — REST API'
description: 'Base: /api/v1.'
sidebar:
  order: 50
generated: false
frozen: true
---
# 03 — REST API

Base: `/api/v1`.

## Credentials

```
Authorization: Bearer <credential>          // programmatic paths
Cookie: klui_session                        // SPA pages & SSE on those pages
```

- **`klui_...` — account key.** One per account (01 §4.7). Server-side resolution per board: the caller is **owner** → creator powers; otherwise the **connection level** (`ro`/`rw`). Grants REST + MCP across all connected boards.
- **`klub_<32b62>` — board key (round-4).** Issued per board by its creator: reaches **exactly one board** at ro|rw, optionally labelled and TTL-bound (1..365 days), revocable instantly. REST-only agents — MCP keeps requiring the account key. Mint/list/revoke at `/boards/{id}/keys`.
- **`sl_<token>` — share token** as Bearer (anonymous programmatic access). Binds to exactly one board at the level the server derives (the link's current mode). The board SPA reads the token from its URL and sends it as Bearer.
- **Session cookie** — signed, HTTP-only; serves the SPA pages (Boards, account panel, Board settings) and SSE on those pages. Never used for programmatic API calls.

Levels: `creator` (owner) · `rw` · `ro`. Instance admin never reaches board content.
Every response carries `X-Klui-Level: creator|rw|ro` — no second call needed to introspect capability.

**Which credential each section accepts** (verified against the live OpenAPI):

- Board-scoped routes (`/boards/{id}/…`, `/cards/…`, `/columns/…`, `/comments/…`): account key, board key, share token (at its derived level), or session cookie of a connected/owner account.
- Account routes (`/me`, `/me/key/*`, `/me/digest/*`, imports, `POST /boards`): session cookie or account key — they need an account. Board keys and share tokens are refused.
- `/admin/*`: session cookie of the instance admin only.
- Public: `/instance`, and the auth page routes (`/auth/signup`, `/auth/login`).

Errors always:

```json
{ "error": "forbidden", "hint": "this board connection is read-only; ask the creator for write access" }
```

`hint` required, human/agent-readable. Rate limits: writes 30/min, reads 120/min, `429 + Retry-After` (per credential).

Agent quickstart (3 lines):

```bash
# 0. who am I / what can I do
curl -s $BASE/api/v1/me -H "Authorization: Bearer klui_xxx"
# 1. all my boards, then full state of one
curl -s $BASE/api/v1/boards -H "Authorization: Bearer klui_xxx"
curl -s $BASE/api/v1/boards/$ID/state -H "Authorization: Bearer klui_xxx"
# 2. create a card
curl -s -X POST $BASE/api/v1/boards/$ID/cards -H "Authorization: Bearer klui_xxx" \
  -H "Content-Type: application/json" -d '{"title":"Set up repo","column":"To Do"}'
```

---

## Endpoints

### Auth (web pages, cookie sessions — not for agents)

| Method+Path                                                    | Notes                                                                                                                                                              |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `POST /auth/signup` · `POST /auth/login` · `POST /auth/logout` | username, email, password. GitHub OAuth at `GET /auth/github` (redirect) + `GET /auth/github/callback`; available iff env credentials configured                   |
| `POST /auth/password-reset/request`                            | `{email}` → always the same 200 (no account enumeration). Mails a single-use, one-hour token. **503 `email_unavailable`** when the instance has no SMTP configured |
| `POST /auth/password-reset/confirm`                            | `{token, password}` → sets the password and **invalidates every existing session** of the account; replayed/expired/unknown tokens → 400 `invalid_token`           |
| `GET /me`                                                      | `{username, email, is_instance_admin, key: {last4, created_at}}` — the "ping"                                                                                      |
| `PATCH /me`                                                    | account holder (auth page) — `{email}` unique + valid format (OAuth-null completion, docs/01 §4.7); no verification in v1                                          |

### Daily digest (account holder — session or account key)

| Method+Path            | Notes                                                                                                                                                                                                      |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /me/digest`       | `{enabled, hour, webhook_url, email_ready, last_digest_at}`. Opt-in, default OFF; `hour` is a server-local hour 0..23; `email_ready` is true only when the instance has all SMTP env vars set              |
| `PATCH /me/digest`     | Partial `{enabled?, hour? (0..23), webhook_url? (nullable)}`. A webhook URL uses the SAME validator as board webhooks: public `https://` only, private/localhost refused (env escape hatch only for tests) |
| `POST /me/digest/test` | Build the current digest and deliver it NOW to the configured webhook and/or email → `{delivered: ["webhook"                                                                                               | "email"], errors?: [{channel, message}]}`. Does NOT move `last_digest_at` |

The hourly sweeper builds one deterministic digest per enabled account (boards owned or connected; window `last_digest_at ?? now-24h`). Content: `agents_did` and `humans_did` grouped by actor label, plus `your_priority` (overdue → due today → tomorrow → recently assigned). Events carry server-side attribution (`actor_kind: human|agent`, `actor_label`, `actor_user_id`); the SSE payload shape is unchanged. Empty digests are never delivered — no empty mail, no empty webhook POST. Webhook payload: `{type:"digest.daily", user_id, date, digest}` with `X-Klui-Event-Id`; 5 s timeout, one retry on network/5xx. Email is sent only when `KLUI_SMTP_HOST`, `KLUI_SMTP_PORT`, `KLUI_SMTP_USER`, `KLUI_SMTP_PASS` and `KLUI_SMTP_FROM` are all set (fail-closed).

### Account key & boards

| Method+Path                                                                       | Who                            | Notes                                                                                                                                                                                           |
| --------------------------------------------------------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /instance`                                                                   | **public**                     | `{name}` from `KLUI_INSTANCE_NAME` (default `Klui`) — landing/tab label                                                                                                                         |
| `POST /boards/{id}/links/open`                                                    | session + current `sl_` Bearer | auto-connects the logged-in account (captures the link level at that moment); requires BOTH credentials                                                                                         |
| `POST /me/key/regenerate` · `DELETE /me/key`                                      | account holder (auth page)     | New key revealed once / revocation                                                                                                                                                              |
| `GET /boards`                                                                     | any credential                 | Boards accessible to the caller: `{id, name, role: creator                                                                                                                                      | rw                                                                          | ro, archived?}`                                                                                                                                                   |
| `POST /boards`                                                                    | account holder                 | Create (name, members, Archive after, optional `template: classic                                                                                                                               | review                                                                      | blank`) → 201 with **share_url**. `review`seeds To Do / In Progress / Review / Done + a`review`tag;`blank` seeds an empty board; classic is the default 3 columns |
| `GET /boards/{id}/state`                                                          | ro                             | Full board: columns, cards, member names, my level, archive info, **tag palette** (`{name, color}`) — presence snapshot removed (round-1)                                                       |
| `GET /boards/{id}/export.md` · `/export.json`                                     | ro                             | Per 01 §4.6 — includes tags, due dates and card comments (`comments` array in JSON)                                                                                                             |
| `GET /boards/{id}/tags`                                                           | ro                             | `{name, color}` per board tag                                                                                                                                                                   |
| `PUT /boards/{id}/tags`                                                           | creator                        | Upsert the palette: `{name: color}` — new names are pre-created, colors editable                                                                                                                |
| `GET /boards/{id}/events`                                                         | ro                             | SSE (02 §4)                                                                                                                                                                                     |
| `PUT /boards/{id}/meta`                                                           | creator                        | archive_after_days / archive_at (reschedule), rename                                                                                                                                            |
| `POST /boards/{id}/archive` · `POST /boards/{id}/restore` · `DELETE /boards/{id}` | creator                        | Lifecycle (01 §2)                                                                                                                                                                               |
| `POST /boards/{id}/keys`                                                          | creator                        | Issue a board-scoped agent key: `{level: ro                                                                                                                                                     | rw, label?, expires_in_days?}`→ **plaintext`klub_…` shown once** + metadata |
| `GET /boards/{id}/keys`                                                           | creator                        | Key metadata only: `{id, level, label, last4, created_at, last_used_at, expires_at, revoked_at}`                                                                                                |
| `DELETE /boards/{id}/keys/{key_id}`                                               | creator                        | Revoke instantly (next use refuses: revoked / expired)                                                                                                                                          |
| `PUT /boards/{id}/webhook`                                                        | creator                        | Set or replace the board's ONE outbound webhook: `{url}`. Public `https://` only — http/localhost/private hosts → 400 `bad_request`. Returns `{url, created_at, last_delivery_at, last_status}` |
| `GET /boards/{id}/webhook`                                                        | creator                        | Webhook metadata (same shape) or `{webhook: null}`; `last_status`/`last_delivery_at` expose delivery failures                                                                                   |
| `DELETE /boards/{id}/webhook`                                                     | creator                        | Revoke the webhook — deliveries stop immediately → `{revoked: true}`                                                                                                                            |

### Share & settings (creator)

| Method+Path                                           | Notes                                                               |
| ----------------------------------------------------- | ------------------------------------------------------------------- |
| `PUT /boards/{id}/share`                              | `{mode: ro                                                          | rw}`, `{regenerate: true}` |
| `PUT /boards/{id}/members`                            | replace member-name list (order = position; small data, idempotent) |
| `GET /boards/{id}/connections`                        | `{username, level, created_at}` per connected account               |
| `PUT /boards/{id}/connections/{user_id}` · `DELETE …` | change level ro/rw · revoke (falls back to anonymous link access)   |

### Content (rw)

| Method+Path                                                        | Notes                                                                                                                                                                                                                                                                                                                    |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `POST /boards/{id}/cards`                                          | `{title, description?, assignee? (member name), tags?: string[] (≤8, new/known), due_at?: "YYYY-MM-DD" \| null, done?: boolean, column (name or id), client_ref?}` → card. **Always appended to the end of the target column** (round-1: no client-chosen position)                                                      |
| `GET /boards/{id}/cards?assignee=&tag=&column=`                    | convenience list (`state` usually suffices)                                                                                                                                                                                                                                                                              |
| `PATCH /cards/{card_id}`                                           | subset of `{title, description, assignee, tags, due_at, done}` + optional `expected_updated_at` (ISO datetime). `done` checks a card off in place (the column stays). A mismatch with the stored card → 409 `{error:"conflict", hint:"…re-fetch GET /state and re-apply your edit"}`; absent = last-write-wins unchanged |
| `POST /cards/{card_id}/move`                                       | `{column (name or id)}` — append to the destination column's end (idempotent when the card is already last). **Round-3 drop point:** optional `before`/`after` (card ids as `GET /state` returns them) insert the card between those two neighbours; the server derives the rank from them, never from a client index    |
| `DELETE /cards/{card_id}`                                          | hard delete (no card archive — disposable spirit)                                                                                                                                                                                                                                                                        |
| `GET /cards/{card_id}/comments` · `POST /cards/{card_id}/comments` | comment stream (ro/rw), `created_at asc, id asc`; `{body (1..2000), author_label? (1..64)}` → 201; cap 100/card → 409. `author_type` is server-derived: key = `agent`, session/share = `human`                                                                                                                           |
| `DELETE /comments/{comment_id}`                                    | rw — the comment's author or the board creator may delete; emits `comment.deleted`                                                                                                                                                                                                                                       |
| `POST /boards/{id}/columns` · `PATCH/DELETE /columns/{id}`         | name (unique)/position; last-column guard                                                                                                                                                                                                                                                                                |
| `POST /boards/{id}/cards/bulk`                                     | `{column, lines: ["task 1", …]}` — Quick fill endpoint, UI (titles only). MCP `bulk_create_cards` reuses the same service with rich items (≤100)                                                                                                                                                                         |

### Imports (account holder — session or account key)

Uploaded content is data only: Klui never fetches URLs found in an import. Board keys (`klub_`) and share tokens (`sl_`) are refused — imports create boards owned by the caller.

| Method+Path                          | Notes                                                                                                                                                                                                                                                                                                                                                                                      |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `POST /boards/import/klui`           | `{data: <export.json>, board_name?, archive_after_days?}` → 201 `{board, imported, losses}`. Validates `data` against the same export schema; creates a NEW board owned by the caller with new ids. Column/card order and positions, member order, tags/palette, due dates, timestamps and comments are preserved. Absent `archive_after_days` means Never; operator defaults never apply. |
| `POST /boards/import/trello/preview` | `{data, board_name?}` → report + counts, creates NOTHING. Malformed Trello/Klui JSON → 400 with export guidance.                                                                                                                                                                                                                                                                           |
| `POST /boards/import/trello`         | Same body; creates the board and returns `{board, imported, losses, report}`. Lists → columns, labels → tag palette, members → member names, `commentCard` actions → comments. Closed lists/cards and unsupported Trello features are listed in `losses`; the report always notes the 1,000-action export limit and that shortLinks are not carried over.                                  |

All three routes accept at most 5 MB. Caps match the board caps (30 columns, 5,000 cards, 200 members, 8 tags/card, 100 comments/card); overflow becomes a loss entry, never a silent drop.

### Instance admin (first account only)

| Method+Path                             | Notes                                                                                                                                                                                                                                       |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /admin/users`                      | Admin-only user list: `{username, email, is_instance_admin, created_at}` (round-1)                                                                                                                                                          |
| `POST /admin/users/{id}/password-reset` | Admin sets a new password for a user directly (`{password}`). The user's existing sessions STAY valid — unlike the self-service reset completed flow, an admin reset does NOT bump `password_changed_at` (asymmetry documented as of 0.7.0) |

All instance-admin routes accept the **session cookie only** — no account key, no share token.

---

## Agent-friendliness contract (testable, part of acceptance)

1. OpenAPI at `/api/v1/openapi.json`, Swagger UI at `/docs` — every operation documented **including error hints**.
2. Every **programmatic** path works with exactly one header (`Authorization`) — no CSRF dance, no query-signature. Only web pages use the session cookie.
3. Columns referenced **by name or id** everywhere (`"column": "To Do"` works) — agents think in human names.
4. `client_ref` idempotency on card create; move idempotent when destination equals current state.
5. No pagination on board-scale reads — a board fits in one response (caps: 02 §6).
6. Errors `{error, hint}`, never stack traces; no billing confusion possible.
7. Mutating endpoints return the resulting entity — agents chain without re-reading.
8. One account key covers **all connected boards** — agents configure once, work everywhere. (Will)

## Non-goals here

Webhooks are deliberately narrow: **one outbound URL per board**, no filters/retries queue/delivery log beyond `last_status`. No per-agent quotas, no field-level permissions beyond creator/rw/ro, no GraphQL.
