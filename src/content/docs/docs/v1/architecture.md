---
title: '02 — Architecture'
description: 'One app process + Postgres, boring-on-purpose where it counts.'
sidebar:
  order: 50
generated: false
frozen: true
---
# 02 — Architecture

One app process + Postgres, boring-on-purpose where it counts. (Stack updated per Will: PostgreSQL + Prisma, TypeScript end-to-end.)

---

## 1. Stack

| Layer                | Choice                                                                                            | Why / rejected alternatives                                                                                                                                                                                                                                                                                                                                             |
| -------------------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend              | **Node.js 22 + Fastify (TypeScript)**                                                             | Prisma-native; official MCP TypeScript SDK is the most complete; **one language front+back** (Will codes React/TS); auto **OpenAPI** via `@fastify/swagger` + zod schemas = agent-friendliness for free. Rejected Express (fine but untyped glue + manual swagger), NestJS (ceremony), FastAPI + Prisma Client Python (two ecosystems, bindings lag behind core Prisma) |
| Database             | **PostgreSQL 17** _(Will's explicit call — "SQLite is too light for this project")_               | One reliable store for rows + JSONB events; runs as a compose service; no managed dependency, no cloud                                                                                                                                                                                                                                                                  |
| ORM & migrations     | **Prisma** (`schema.prisma` = source of truth; `prisma migrate deploy` at boot)                   | Will's explicit stack pick; typed client shared with the whole backend                                                                                                                                                                                                                                                                                                  |
| Frontend             | **React + TypeScript + Vite + shadcn/ui (Tailwind)**                                              | Will's taste + shadcn quality baseline (01 §7); dnd-kit for the snap drag & drop                                                                                                                                                                                                                                                                                        |
| Realtime             | **SSE** (hand-rolled on the raw reply stream, or `@fastify/sse` — builder's choice)               | Enough for board updates + presence; trivially proxied; no sticky sessions, no Redis pubsub. WebSocket rejected: heavier, no added value                                                                                                                                                                                                                                |
| MCP                  | **`@modelcontextprotocol/sdk`** — streamable HTTP, mounted at `/mcp` in the same Fastify instance | One process, one port, key-auth via the same middleware                                                                                                                                                                                                                                                                                                                 |
| Serving              | **Fastify single instance** (serves the built SPA statically from the same app)                   | Scale-out is a non-goal                                                                                                                                                                                                                                                                                                                                                 |
| Passwords / sessions | **argon2id** (`@node-rs/argon2`); session = signed HTTP-only cookie, 30d                          | Origin check on cookie-authenticated calls                                                                                                                                                                                                                                                                                                                              |
| OAuth                | **GitHub OAuth** (env-gated; scopes `read:user user:email`; state parameter against CSRF)         | Account creation path optional per instance (05 §4)                                                                                                                                                                                                                                                                                                                     |
| Scheduler            | In-process hourly tick (archive → purge sweeps)                                                   | No Celery, no cron sidecar; purge idempotent                                                                                                                                                                                                                                                                                                                            |
| Rate limiting        | In-memory middleware per token+IP                                                                 | Reset on restart — acceptable; no Redis                                                                                                                                                                                                                                                                                                                                 |
| Tests                | Node test runner / vitest + supertest (API) + Playwright (3 smoke paths)                          | Stated expectations, builder-level detail                                                                                                                                                                                                                                                                                                                               |

Rejected on principle: Redis/Celery/job queues (ops burden without need at this scale); SaaS Postgres defaults (self-host keeps plain container Postgres).

## 2. Topology

```
                     ┌────────────────────────────────────────────┐
                     │              Klui container                │
 Browser ──HTTPS───► │  Static SPA build (served by Fastify)      │
 Agents ───────────► │  ┌──────────────────────────────────────┐  │      ┌──────────────────┐
 (REST / MCP)        │  │ Fastify app (TS)                     │  │      │  Postgres 17     │
                     │  │ ├─ /api/v1/*   REST + OpenAPI (/docs)│──┼─────►│  container       │
                     │  │ ├─ /mcp        MCP streamable HTTP   │  │      │  (compose svc)   │
                     │  │ ├─ /b/<token>  board SPA routes      │  │      │  volume: pgdata  │
                     │  │ ├─ /api/v1/…/events  SSE             │  │      └──────────────────┘
                     │  │ └─ event bus (in-process) │ sweeper  │  │
                     │  └──────────────────────────────────────┘  │
                     └────────────────────────────────────────────┘
```

Two containers in compose (app + Postgres), one `DATABASE_URL`. Reverse proxy (Pangolin/Caddy/nginx) terminates TLS. Single-writer scale is a non-goal; Prisma pools connections for the few concurrent SSE+agent needs.

## 3. Data model (Prisma schema shape)

```prisma
users        id UUID · username UNIQUE · email UNIQUE · password_hash NULL      // NULL = OAuth-only
             github_id INT NULL UNIQUE · is_instance_admin BOOL
             password_changed_at TIMESTAMPTZ NULL · created_at   // sessions older than this die
passwordResetTokens  id UUID · user_id → users · token_hash UNIQUE · expires_at · used_at NULL // one-shot email reset
boards       id UUID · name · owner_id → users · archive_after_days INT NULL    // NULL = Never
             archive_at TIMESTAMPTZ NULL · archived_at TIMESTAMPTZ NULL
             share_token_hash · share_mode ro|rw · share_version INT · created_at
memberName   board_id · name · position          // creator-managed assignee list (01 §4.4)
columns      id · board_id · name (UNIQUE per board) · position
cards        id UUID · board_id · column_id · title · description NULL
             assignee NULL (must match a memberName of the board — app-enforced)
             tag NULL · position INT · client_ref NULL (UNIQUE per board when set)
             created_at · updated_at
connections  user_id · board_id · level ro|rw · created_at   // UNIQUE (user,board); created at first link open while logged in
accountKeys  id · user_id · key_hash · created_at · last_used_at · revoked_at NULL
             // exactly ONE active (revoked_at IS NULL) per account — regenerate revokes the old
events       id · board_id · type · payload JSONB · created_at  // capped: keep last 1000/board
```

- **Rank strategy:** integer `position` with 1024 gaps; renumber a column on gap exhaustion (small N). Cross-column move = one transaction (column_id + position + updated_at).
- **Conflict policy: last-write-wins** per field, `updated_at` tiebreaker, returned so clients detect loss. UI optimistic; agents advised read-modify-write.
- `client_ref` idempotent card creation — same ref returns the existing card (`200`), no duplicate.
- All secrets hashed server-side (SHA-256); shown once at creation.
- Purge: sweeper computes `archived_at + 30d`; at purge time deletes all related rows in one transaction.
- `events` powers SSE replay (`Last-Event-ID`) and presence bookkeeping; capped at 1000/board.

## 4. Realtime (SSE) & presence

- `GET /api/v1/boards/{board_id}/events` (any valid credential, RO ok). Keepalive ping every 25s; `Last-Event-ID` replay honored.
- Server keeps in-memory subscriber registry per board — it powers **both** the event fan-out and the **presence list** (01 §4.8): on join/leave it emits a `presence` event with the current viewer list `{name, is_account}`.
- Event types: `card.created|updated|moved|deleted`, `comment.created|deleted`, `column.*`, `board.updated|archived|restored|purged`, `presence`, and `snapshot.required` (client refetches `/state` when bookkeeping drifts).
- State bootstrap: `GET /boards/{id}/state` returns the **entire board in one payload** — one call, then subscribe.

## 5. Security model

| Concern           | Treatment                                                                                                                                                                     |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Token enumeration | UUID v4 board ids; share tokens 22+ chars base62; account key `klui_` + 32 base62                                                                                             |
| Secret storage    | Hashes only; keys shown once; the share link is password-grade (UI states it)                                                                                                 |
| Sessions/CSRF     | Signed HTTP-only cookie, `SameSite=Lax`, TLS at proxy; Origin check on cookie-authenticated calls; participant API speaks Bearer                                              |
| SSE headers       | `EventSource` can't set headers → SPA uses fetch-streaming everywhere it needs Bearer                                                                                         |
| Passwords         | argon2id; signup gated by `KLUI_SIGNUPS` (open/invited)                                                                                                                       |
| OAuth             | GitHub client secret in env; `state` cookie vs CSRF; email from `user:email` scope (fallback: account still usable, email optional completion later)                          |
| Scope leakage     | Level + board resolved **server-side** per credential: account key → owner/connected boards only; `sl_` token → its one board. A credential for board A never touches board B |
| Rate abuse        | Per-credential middleware: writes 30/min, reads 120/min, `429 + Retry-After` documented in OpenAPI                                                                            |
| Link leak         | Creator regenerates link; logged-in connections keep their captured level (creator can adjust/revoke individually)                                                            |
| Key leak          | Regenerate in account panel (old key dies instantly); account password unaffected                                                                                             |
| Accidental loss   | Export before purge (on demand, pushed in UI at archive); restore during grace                                                                                                |
| Injection         | Prisma parameterizes everything; description rendered as text (no md parser v1)                                                                                               |

Threat acceptance (v1, honest): no 2FA, no audit log UI, no IP ban — out of scope, documented as such.

## 6. Performance budget & limits (Hermes, veto-able)

- First paint < 1s on LAN; `GET /state` < 100 ms typical.
- App image < 200 MB; steady RAM: app < 300 MB, Postgres < 512 MB; CPU idle ≈ 0.
- Hard caps per board: 5,000 cards, 30 columns, 200 member names, 500 connections — API refuses beyond, message states the disposable philosophy; caps visible in OpenAPI error hints.

## 7. Module map (post-refactor, 0.6.2+)

Dependency direction is one-way: **`routes → services → lib`**, never the reverse.
`contracts/` sits beside routes and is imported by both sides (types + zod only).

> Known exception (pre-existing): `setShare` lives in `routes/share.ts` and is
> imported by `mcp/tools/owner.ts`. It belongs in a service; moving it is a
> one-function extraction left to a dedicated refactor commit.

### server/src

| Module                  | Owns                                                                                                                                                            |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `contracts/`            | The frozen API contract: zod request/response schemas + the 53-route registry (`routes.ts`). Single source for validation AND OpenAPI                           |
| `routes/`               | Thin HTTP handlers: credential guards, call a service, shape the reply. No business logic                                                                       |
| `services/access.ts`    | THE per-board level resolver: owner→creator, connection→captured level, share→current link mode, board key→one board. Services call this before any board write |
| `services/cards/`       | `index.ts` CRUD + moves + bulk; `positions.ts` the rank plumbing around `lib/rank.ts`                                                                           |
| `services/imports/`     | Board imports: `shared.ts` (persist + loss log + coercion), `klui.ts` round-trip, `trello.ts` bounded Trello parse/preview/confirm                              |
| `services/digest/`      | Daily digest: `types.ts`, `build.ts` (pure, deterministic), `collect.ts` (queries), `format.ts` (text/HTML), `deliver.ts` (webhook/SMTP + hourly pass)          |
| `services/lifecycle.ts` | Archive → restore → purge + the hourly `runSweep`                                                                                                               |
| `services/boards.ts`    | Board create/list/meta + `CAPS` + `scheduleArchive`                                                                                                             |
| `services/` (rest)      | `columns`, `comments`, `connections`, `tags`, `users`, `keys`, `board-keys`, `state`, `export`, `webhooks`, `og`, `secrets` — one file each, same pattern       |
| `mcp/`                  | `context.ts` (request ctx + guards), `tools/*.ts` (18 tool handlers by domain), `index.ts`, `prompts.ts`                                                        |
| `realtime/bus.ts`       | In-process event bus → SSE fan-out + webhook dispatch + persisted events                                                                                        |
| `plugins/`              | `auth.ts` (credential resolution), `rate-limit.ts`, `bootstrap.ts` (hourly tick wiring)                                                                         |
| `lib/`                  | Prisma client, error shape (`{error, hint}`), rank math, serialization views, share-url/base-url helpers                                                        |

### web/src

| Module                                | Owns                                                                                                       |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `api/http.ts`                         | fetch funnel + `ApiError` (`{error, hint}`)                                                                |
| `api/sse.ts`                          | Board SSE stream: frame parsing, Last-Event-ID resume, jittered backoff                                    |
| `api/client.ts`                       | One `api` object, every endpoint; re-exports http + sse so imports stay flat                               |
| `hooks/live-board.ts` + `live-board/` | Board state hook; `reducer.ts` (pure SSE→state, merge by id), `dnd.ts` (drop planning → neighbour pairs)   |
| `hooks/useBoardDnd.ts`                | dnd-kit orchestration (sensors, drag lifecycle, optimistic move + rollback)                                |
| `hooks/useCommentHandlers.ts`         | Comment mutations onto the live state (merge by id)                                                        |
| `pages/`                              | One file per route; pages compose, they do not fetch raw — they go through `api` and hooks                 |
| `components/board/`                   | Board UI pieces; `components/ui/` = shadcn-style primitives; `components/settings/` = board settings cards |
| `lib/`                                | i18n (en/fr), theme, keyboard/collision dnd helpers, purge countdown, agent onboarding prompt text         |

## 8. Left to the Builder (historical)

- Repo layout, CI (Forgejo Actions: eslint/prettier + vitest + image build), exact SSE library usage inside Fastify.
- Frontend state store (TanStack Query + Zustand candidates) and event reconciliation details.
- Compose healthcheck polish.
- Pixel-level design within §01 §7 constraints (builder proposes mockups; Will reviews at implementation time).
