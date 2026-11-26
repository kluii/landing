---
title: '07 — Capability matrix (current state)'
description: 'One row per capability: the standing decision → what is implemented → how it is verified → known limits.'
sidebar:
  order: 50
generated: false
frozen: true
---
# 07 — Capability matrix (current state)

> One row per capability: the standing decision → what is implemented → how it is verified → known limits.
> This replaces stale roadmap/plan cross-references; `docs/superpowers/plans/*` are HISTORICAL context, not current evidence.
> Round-4 (2026-10-20) — audited externally before Gate 1; all P0 findings fixed and deployed.

## Core content

| Capability                           | Decision       | Status                                  | Verification                               | Limits                                                                                                   |
| ------------------------------------ | -------------- | --------------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| Boards / columns / cards (5 fields)  | docs/01 §4     | shipped                                 | server suite (content, lifecycle)          | caps: 30 col / 5000 cards / 200 members                                                                  |
| Multiple tags + palette              | round-1 ruling | shipped                                 | content/contract tests                     | 8 tags/card, 1 assignee                                                                                  |
| Deadlines                            | round-1 ruling | shipped                                 | content tests (calendar dates)             | UTC midnight granularity                                                                                 |
| Append-only card moves               | round-1 ruling | shipped                                 | rank tests                                 | no arbitrary intra-column order (revisit only with user evidence)                                        |
| Comments (human/agent)               | round-4        | shipped                                 | comments tests, MCP round-trip             | 100/card; author identity = display label, not audit-grade                                               |
| Board templates (`classic`/`review`) | wave 2         | shipped                                 | wave2 tests (REST + MCP)                   | exactly two presets; review adds a Review column + `review` tag                                          |
| Conflict-safe card updates           | wave 2         | shipped                                 | wave2 tests (REST + MCP)                   | opt-in `expected_updated_at`; absent keeps last-write-wins                                               |
| Event attribution                    | wave 3         | shipped                                 | digest tests (session / `klub_` / `klui_`) | DB-side only (`actor_kind`, `actor_label`, `actor_user_id`); SSE payload unchanged; NULL = legacy/system |
| Board filters                        | round-4        | shipped (client-side over server state) | board-filters tests                        | no server-side filter API for the SPA                                                                    |
| Quick fill                           | round-1        | shipped                                 | board tests; wave-2 MCP bulk test          | REST titles only; MCP `bulk_create_cards` accepts rich items (≤100, reuses the REST service)             |

## Credentials & sharing

| Capability                         | Decision   | Status                                 | Verification                                                                                               | Limits                                                                                             |
| ---------------------------------- | ---------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Session auth (+GitHub OAuth)       | docs/01 §1 | shipped                                | auth tests                                                                                                 | admin manual reset remains, PLUS self-service email reset (Phase 4)                                |
| **Self-service password reset**    | Phase 4    | shipped                                | password-reset tests (request 503-without-SMTP, enumeration-safe 200, single-use/expiry, old session dies) | needs all five KLUI_SMTP_* vars, else the API refuses with 503; token plaintext goes by email only |
| Share links (RO/RW, regenerate)    | docs/02 §5 | shipped, fail-closed secrets (round-3) | secrets tests, executable verify                                                                           | derived token = whole credential; regenerate kills old link                                        |
| Account keys (`klui_`)             | 01 §4.7    | shipped                                | keys tests                                                                                                 | ONE per account → every connected board                                                            |
| **Board keys (`klub_`)**           | round-4    | shipped                                | board-keys tests (reach, 404 leak test, TTL, revocation, cap 20)                                           | REST-only — MCP stays account-key                                                                  |
| Connections (auto-connect, levels) | 01 §4.7    | shipped, journey fixed round-3         | W13 e2e specs + unit tests                                                                                 | revoke ≠ ban while the link is valid                                                               |

## Agents (MCP)

| Capability                             | Decision  | Status                                                          | Verification                                | Limits                                                                                                          |
| -------------------------------------- | --------- | --------------------------------------------------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| MCP 18 tools + 3 resources + 2 prompts | docs/04   | shipped                                                         | mcp.test + wave2.test (SDK client)          | create_board / bulk_create_cards / column rename+delete added; no delete_board (safety ruling)                  |
| SSE live board                         | 02 §4     | shipped + reconnect w/ snapshot.required                        | realtime tests                              | state resource push is REST/SSE, not MCP subscriptions                                                          |
| Outbound webhook (one per board)       | wave 2    | shipped                                                         | wave2 tests (local receiver, retry, delete) | public https only; best-effort, 5 s timeout, one retry on network/5xx; visible via last_status/last_delivery_at |
| Agent-safe defaults                    | round-3/4 | delete removed from MCP; board-scoped keys; per-key rate bucket | audit + tests                               | prompt-injection handled by clients (board text is untrusted)                                                   |

## Lifecycle & trust

| Capability                                        | Decision              | Status                            | Verification                                                       | Limits                                                                                                             |
| ------------------------------------------------- | --------------------- | --------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| Archive / restore / purge (30 d grace)            | 01 §2                 | shipped + visible purge countdown | lifecycle tests, UI                                                | hourly sweeper; grace starts at archival tick                                                                      |
| Versioned export (klui v1)                        | round-4               | shipped (state + comments)        | export tests                                                       | export ≠ full account backup                                                                                       |
| Round-trip restore + Trello import (loss reports) | round-4               | shipped                           | imports tests (semantic equality)                                  | checklists/attachments unsupported → lost, itemized (max 500/kind); Trello actions capped 1,000 by Trello          |
| Health honesty                                    | round-3               | shipped (503 on db-down)          | healthz tests                                                      | sweep timing still hourly                                                                                          |
| Daily digest (per account, opt-in)                | wave 3                | shipped (deterministic, no LLM)   | digest tests (builder, webhook receiver, prefs API, sweeper clock) | OFF by default; one server-local hour; webhook and/or SMTP email (SMTP fail-closed); empty digest delivers nothing |
| Legal (FR templates) + robots/sitemap             | round-2               | shipped                           | legal tests                                                        | templates — operator fills {{instance_name}}/{{contact_email}}                                                     |
| Telemetry                                         | 00-overview anti-goal | absent by design                  | —                                                                  | consented observation only (pilots)                                                                                |

## Deployment

| Capability                      | Status                                                           | Limits                                               |
| ------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------- |
| Docker Compose (app + Postgres) | shipped, secrets fail-closed, health 503                         | registry image still placeholder (build-local)       |
| install.sh                      | shipped (generates DB+session+share secrets)                     | --update now health-verifies                         |
| e2e browser suite               | 4 real Playwright journeys (auth/board-dnd/board-journey/mobile) | run against isolated stack in round C; not yet in CI |

## Deliberately NOT built (standing anti-goals)

Presence · Gantt/calendar · SSO · native mobile · integration marketplace · built-in LLM · bidirectional sync · portfolio analytics · claim/lease (evidence-gated) · MCP import tools.

## Round-2 pilot feedback (v0.5.0)

- **Card done flag** — `cards.done` (default false). A card can be checked off in
  place from the card, the display modal, REST (`PATCH /cards/{id} {done}`) or MCP
  (`update_card done:true`); it keeps its column, tags and deadline. Markdown
  export renders it as a GFM task list (`- [x]`), and the JSON export/restore
  round-trips it.
- **Board link previews** — `GET /b/<token>` is served by the server with a
  board-specific `<title>`, description and `og:image`; `GET /og/b/<token>.png`
  renders the 1200x630 card from the board's real name and counts. `noindex` on
  board links (the token is a credential). `GET /og/default.png` is the product card.
- **Contrast pass** — every text token clears 4.5:1 on every surface it renders
  on, in both themes; borders clear their seam minimum. `web/test/theme.test.ts`
  measures both themes, per surface, so the regression cannot come back silently.

## UI shape (v0.5.0)

Two modals: `CardDisplayModal` (read) and `CardEditorModal` (write), reached from
Edit. The new-card composer asks for the title only, with the rest behind one
disclosure. Filters are a labelled panel with a result count and removable chips.
The theme control is its own header button, available without an account.
