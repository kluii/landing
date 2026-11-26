---
title: 'Architecture'
description: 'How the pieces fit, what each module owns, and which invariants the code must not break.'
sidebar:
  order: 7
generated: true
app_version: '2.0.0'
---
# Architecture

How the pieces fit, what each module owns, and which invariants the code must not break. Read with `docs/permissions.md` (the authorization spine) and `docs/api.md` (the contract).

---

## 1. Process model

One Node process serves everything:

```
                    ┌──────────────────────────────────────────┐
  browser  ────────►│ Fastify                                  │
  agent    ────────►│  /api/v1/*      REST (Zod → OpenAPI)     │
  unfurler ────────►│  /mcp           JSON-RPC 2.0             │
                    │  /api/v1/stream SSE                      │
                    │  /og/*.png      SVG → PNG (resvg)        │
                    │  /*             static SPA + index.html  │
                    └───────────────┬──────────────────────────┘
                                    │ Prisma
                              ┌─────▼─────┐
                              │ PostgreSQL │
                              └───────────┘
```

- No worker process in 2.0. Background work (lifecycle sweeper, pending expiry, digest, event retention) runs in-process on an interval, guarded by a Postgres advisory lock so two instances against one database cannot both run it.
- Graceful shutdown: stop accepting, drain in-flight requests, close the SSE hub (send `event: close`), disconnect Prisma, exit. A 15 s hard timeout then `process.exit(1)`.
- The SPA is served by `@fastify/static` from `web/dist` with a fallback to `index.html`. **The asset list is snapshotted at boot** — restart after every web build (trap 7 in `PROMPT.md`).
- `index.html` is sent with `Cache-Control: no-store`; hashed assets are immutable.
- `server.ts` boots in this order: env validation → secrets resolution (fail closed) → Prisma connect → plugin registration → sweeper start → listen. A failure at any step exits non-zero with one actionable message.

**Why no SSR:** the server owns versioned REST, an MCP JSON-RPC endpoint, a long-lived SSE stream, server-side OG rendering, per-key and per-IP rate limiting, and cookie/CSRF policy. Server-function frameworks reshape exactly those surfaces, and agent clients depend on them staying boring.

---

## 2. Module map

```
server/src/
  server.ts        bootstrap, plugins, graceful shutdown
  app.ts           route registration (thin: wiring only)
  env.ts           validated env, fail-closed, one error listing all problems
  db.ts            Prisma client singleton
  auth/            password, sessions, totp, recovery, oidc, reset
  boards/          routes + service + schema (create, read, update, delete, close)
  columns/         routes + service (create, update, delete, reorder)
  cards/           routes + service (CRUD, bulk, move planning)
  comments/        routes + service
  activity/        projection of events (read-only)
  agents/          key issuance, scopes, setup payloads
  mcp/             server.ts (JSON-RPC), tools/*.ts, parity.ts
  digest/          builder (deterministic), delivery (webhook, mail, rss), scheduler
  settings/        instance settings, branding, accent validation
  realtime/        hub.ts (subscribers, ring buffer), events.ts (envelope)
  lib/             errors, ids, ranks, secrets, rate-limit, logger, reserved, authz
  contracts/       Zod schemas shared by REST and MCP
```

**Dependency direction is inward:** `routes → service → contracts/lib`. A service never imports a route. `lib/` imports nothing from a domain. `contracts/` imports only Zod and `lib/errors`.

Enforced by lint (import boundaries), not by review:

- `web/src/data/` is the only directory allowed to import `@tanstack/db`.
- `web/src/lib/hotkeys.ts` is the only file allowed to import `@tanstack/react-hotkeys`.
- `server/src/lib/authz.ts` exports `can()`; no other module may compare a user id to an owner id. A lint rule greps for `.ownerId ===` outside `authz.ts` and fails.
- No file outside `web/src/styles/tokens.css` may contain a colour literal.

---

## 3. Data model

The Prisma sketch in the brief is the contract for names. Below are the field-level invariants and the **deliberate additions**; anything not listed here must be an ADR.

### 3.1 Entities

| Model | Invariants |
|---|---|
| `User` | `email` and `username` unique case-insensitively (enforced by a unique index on `lower(...)` or by normalising on write — pick one and test it). `is_instance_admin` is an ops flag, never a board permission. |
| `Session` | Stored as `sha256(id)`; rotating; `expires_at` absolute 30 days; `revoked_at` set on logout, reset, and privilege change. Visible in `GET /me/sessions`. |
| `TotpSecret` | `secret_enc` encrypted with the instance key; `confirmed_at` null until a first valid code. |
| `RecoveryCode` | `code_hash` argon2id or sha256 of a high-entropy code; `used_at` single-use. |
| `OAuthAccount` | `@@unique([provider, provider_account_id])`; linking is explicit, never by email. |
| `InstanceSettings` | Singleton row `id = 1`, created at boot. Holds branding, registration, TOTP policy, captcha, analytics, metrics. |
| `Board` | Exactly one owner (`owner_id`), enforced by unique membership of role `owner` at the service layer **and** a partial unique index. `visibility` default `private`. `link_suffix` present iff visibility is `link`. `closed_at` set when closed; a closed board is read-only. **No archive, no expiry** (D-53): there is no `archived_at`, no `archive_after_days`, no scheduled death. |
| `BoardMember` | `@@unique([board_id, user_id])`. Role in `owner/admin/editor/viewer`. Exactly one `owner` per board. |
| `BoardLink` | `token_hash = sha256(raw)`, `role` in `read/edit`, `revoked_at`, `last_used_at`. Raw token returned once. |
| `BoardTagColor` | `@@unique([board_id, tag])`, `color` `#RRGGBB`; the board-level default a card tag inherits (D-21). |
| `Column` | `position` Decimal, unique per board not required (ranks are ordered, not unique). Name ≤ 64 chars (contract cap so titles wrap). |
| `Card` | `position` Decimal; `done` bool; `assignee_id` (user) **or** `assignee_label` (display name from v1 import), never both required; `anon_actor_id` nullable. |
| `CardTag` | Composite PK `(card_id, name)`; name normalised lowercase; `color` nullable `#RRGGBB` (card-level override, D-21). |
| `Comment` | `author_id` required (users only); `edited_at` set on edit; body ≤ 10 000 chars. |
| `Event` | Append-only. `actor_kind` in `user/link/anon/agent/system`; `actor_user_id` nullable; `actor_label` for anon/link display names; `type` a closed enum; `payload` Json with a documented shape per type. |
| `PendingCard` | `expires_at = created_at + 7 days`; purged by the sweeper. |
| `AgentKey` | `key_hash`; `scope` in `board/user`; `board_id` required when scope is `board`; `expires_at` default +90 days; `revoked_at`. |
| `DigestPref` | One row per user; `enabled` default false; `hour` 0–23; `timezone` IANA; channel fields; `rss_token_hash`; `last_sent_at`. |
| `Notification` | Deduplicated by `(user_id, kind, payload->>'event_id')` unique, so an event never notifies twice. |

### 3.2 Additions beyond the brief's sketch

Required by the decisions register; each one is an ADR item, not an improvisation:

- `Card.anon_actor_id String?` — lets an anonymous session edit the card it created (D-11).
- `Event.actor_anon_id String?` — attribution for moderation and activity filtering.
- `Event.idempotency_key String?` — optional, unique per board; lets an agent retry a create without duplicating a card.
- `Board.closed_at DateTime?` and `Board.close_summary Json?` — the summary is generated once, stored, and never hand-edited (D-22).
- `User.email_verified_at DateTime?` — present, but verification is not required to use the product unless the instance enables it (SMTP-dependent).
- `Session.last_seen_at` — used to order the session list, not for security decisions.

### 3.3 Ordering: fractional ranks

- Every ordered collection (`Column.position`, `Card.position`) uses `Decimal` with step **1024**.
- Insert between `a` and `b`: `position = (a + b) / 2`. If `|a − b| < 1`, renumber the affected collection to `1024, 2048, …` inside the same transaction, then place.
- Append: `max(position) + 1024`. Prepend: `min(position) − 1024` (allowed to go negative; never renumber the head on every prepend).
- A move is always expressed as neighbours. The server resolves `before`/`after` against the **stored** column, never against a client-side list. If either named neighbour is gone, treat it as absent; if both are gone, append.
- Never trust a client-computed position, never accept an index, never use `COUNT(*)` as a position.

### 3.4 Events

- One helper, `recordEvent(tx, {boardId, actor, type, payload})`, called inside the same transaction as the mutation it describes. A mutation without an event is a defect; an event without a mutation is a lie.
- Closed enum of types: `board.created`, `board.updated`, `board.closed`, `member.added`, `member.updated`, `member.removed`, `column.created`, `column.updated`, `column.deleted`, `card.created`, `card.updated`, `card.moved`, `card.completed`, `card.reopened`, `card.deleted`, `comment.created`, `comment.updated`, `link.created`, `link.revoked`, `pending.approved`, `pending.rejected`, `agent_key.created`, `agent_key.revoked`, `import.completed`.
- `payload` shapes are documented in `docs/api.md` §Events and reused verbatim by the digest, the activity feed and the close-out summary. Adding a key is backward compatible; renaming one is a migration.
- Activity, digest and close-out **read events only**. They may join cards/columns for labels, but they may not reconstruct "what happened" from current state.

---

## 4. Request lifecycle

Order is fixed; a plugin inserted out of order changes security behaviour.

1. **Request id** — accept `X-Request-Id` only if it matches `[A-Za-z0-9-]{8,64}`, else generate. Echo it in the response and put it in every log line.
2. **Proxy trust** — resolve the client IP using `KLUI_TRUSTED_PROXY_HOPS` (default 0 = socket address only). Never read `X-Forwarded-For` when hops is 0.
3. **Security headers** — CSP with a nonce/hash for the theme bootstrap, HSTS (production only), `nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `frame-ancestors 'none'`.
4. **Body limits** — 1 MB JSON default; 5 MB on import; reject unknown content types.
5. **Rate limit** — token buckets keyed per IP, per session, per agent key, plus per-board anon bucket. `429` with `Retry-After`.
6. **Ban check** — application-level table with TTL; banned IP or user short-circuits with `403 banned` (this is the one place `403` is correct before authorization: the actor is not being told whether a resource exists).
7. **Authentication** — resolve `Authorization: Bearer` (session token or `kb_` agent key) or the session cookie. Produce an `Actor`.
8. **CSRF** — double-submit on state-changing methods when the credential is a cookie. Bearer requests are exempt (they cannot be forged cross-site).
9. **Authorization** — the route calls `can(actor, action, board, membership)` **before** loading any board-scoped data it will return. The 404 decision happens here.
10. **Handler** — validate with the shared Zod schema, run the service in a transaction, write the event, publish to the hub after commit.
11. **Response** — serialize with the same schema; set `ETag` where the resource is cacheable; never leak an entity the actor cannot read through an error message.
12. **Log** — method, path with ids redacted where sensitive, status, duration, request id. No bodies, no tokens, no emails.

**Publishing after commit, not inside it.** An SSE echo for a rolled-back transaction is a phantom card that the client will keep until reload.

---

## 5. Realtime

- `GET /api/v1/stream` (SSE). Auth by session cookie or bearer. The subscription is authorized with `can(actor, 'board.read', board)`; a client subscribes per board (one stream, many `board` filters).
- Envelope: `id: <monotonic>` · `event: <event type>` · `data: {"board_id","entity","action","payload","actor_label","at"}`.
- Ring buffer of the last 5 minutes / 1 000 events per board for `Last-Event-ID` replay. Beyond that, the client refetches state (a `resync` event tells it to).
- Heartbeat comment every 25 s; the client treats 60 s of silence as dead and reconnects with backoff (1 s → 30 s, jitter).
- On reconnect the client always refetches `GET /boards/:id/state` once, then applies replay. Replay alone is not trusted to close a gap.
- The hub holds no business logic: it receives an already-serialized event from the domain service, after commit.

---

## 6. Errors

```json
{"error":{"code":"board_not_found","message":"Board not found.","hint":null}}
```

- `AppError(code, status, message?, hint?)` is the only thrown type in services. Raw strings, `throw new Error('nope')` and Prisma errors escaping a route are defects.
- Status mapping: `400 validation_failed` (with `details[]` naming the fields) · `401 unauthenticated` · `403 forbidden` (readable board, insufficient role) · `404 *_not_found` (including unreadable resources) · `409 conflict` (with `current` row) · `422` unused · `429 rate_limited` · `500 internal` (message generic, request id attached) · `503 service_unavailable` (DB down, SMTP missing).
- MCP errors use the same codes inside JSON-RPC `error.data`, plus `parameter`, `expected`, `example`.

---

## 7. Background jobs

One sweeper, every 5 minutes, under a Postgres advisory lock:

| Job | Frequency | Effect |
|---|---|---|
| Pending expiry | 5 min | Delete `pending_cards` past `expires_at`; record `pending.expired`. |
| Digest due | 5 min | For each `DigestPref` due in its timezone and not sent today, build and deliver; empty result sends nothing. |
| Event retention | daily | Delete events older than `KLUI_RETENTION_EVENTS_DAYS` (default 365), except `board.closed` and `import.completed`. No board is ever archived or purged by a job (D-53). |
| Session cleanup | hourly | Delete expired/revoked sessions older than 7 days. |
| Demo reset (flag) | nightly | Only when `KLUI_DEMO_RESET=true`: reset the demo board. Off by default in self-host. |

Each job is idempotent, logs one line with counts, and never throws out of the loop.

---

## 8. Configuration

- `env.ts` validates every variable at boot with Zod, applies defaults, and on failure prints **one** message listing every problem with the variable name, the expected shape, and one example. It exits non-zero.
- Secrets resolve in this order: env → `KLUI_SECRETS_DIR/<name>` → generate and write (0600) in non-production; in production, a missing required secret is fatal.
- `KLUI_ENV=production` also enables: HSTS, secure cookies, refusal to boot with `KLUI_PUBLIC_URL` unset or non-https, and refusal of the default dev secret.
- The full variable list lives in `docs/deployment.md`; names are a contract (compose files and docs depend on them).

---

## 9. Performance budgets

Measured on a 4 vCPU / 2 GB instance with a 20-column board and 500 cards:

| Surface | Budget |
|---|---|
| `GET /boards/:id/state` (500 cards) | p95 < 120 ms, payload < 900 KB |
| Card move (round trip, LAN) | p95 < 80 ms |
| Board first paint (built bundle, cold cache, 4G) | < 1.8 s |
| Board interaction (drag → committed position) | perceived instant; server confirmation < 200 ms |
| SSE echo latency after commit | p95 < 50 ms |
| Activity page (10 000 events) | p95 < 150 ms with cursor index `(board_id, created_at desc, id)` |
| Digest build for 1 account / 500 events | < 300 ms |

Indexes required from day one: `events(board_id, created_at, id)`, `cards(board_id, column_id, position)`, `board_members(user_id)`, `sessions(user_id)`, `agent_keys(key_hash)`, `board_links(token_hash)`, `cards(anon_actor_id)`.

---

## 10. Failure modes and degradation

| Failure | Behaviour |
|---|---|
| Database down | `/healthz` `503` with `db:"down"`; API answers `503 service_unavailable`; the SPA shows a full-page state with a retry, never a blank screen. |
| SSE disconnected | Board stays usable; a subtle `--ink-subtle` line says "Reconnecting"; polling fallback every 15 s until connected. |
| SMTP missing | Email features answer `503 email_not_configured` at the API boundary and the UI hides the email channel with an explanation. Never a silent no-op. |
| OIDC provider down | Local login still works; the provider button shows the real error after the redirect. Break-glass admin is the documented escape. |
| Static bundle stale | Server restart required after build (trap in `PROMPT.md`); `/healthz` version identifies the running build. |
| Rate limit hit | `429` + `Retry-After`; the client shows a neutral toast with the wait time. |
| Migration fails at boot | Container exits non-zero; compose surfaces the log; the previous image can be restored without data loss because migrations are additive (see `docs/deployment.md` §Rollback). |

---

## 11. Invariants checklist (review this before every merge)

1. Every mutation writes an event, in the same transaction.
2. Every route calls `can()` before touching board-scoped data.
3. Every list query is scoped by an authorized board id — never filtered after the fact.
4. Every ordered write goes through the rank helper.
5. Every token is hashed at rest and never logged.
6. Every response passes the shared Zod serializer (no accidental field leaks).
7. The hub publishes after commit.
8. A 404 body for an unreadable resource is byte-identical to a 404 for a missing one.
