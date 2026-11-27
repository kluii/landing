---
title: 'Agents: keys, scopes, setup'
description: 'An agent is a participant with a credential.'
sidebar:
  order: 10
generated: true
app_version: '2.0.0'
---
# Agents: keys, scopes, setup

An agent is a participant with a credential. It can do what its owner can do on the boards it is scoped to — and nothing more.

---

## 1. Key model

```
kb_<32 chars base62>
```

- Stored as `sha256(key + KLUI_TOKEN_PEPPER)`. Shown **once**, at creation, with a copy button and a warning. There is no "reveal" endpoint, no recovery, no re-download.
- `scope: 'board'` — `board_id` required. The key can read and write exactly that board, as its owner's role on that board. On any other board it gets `404`.
- `scope: 'user'` — the key acts as its owner on every board they belong to. Offered for personal automation; the panel says plainly that it is broader.
- `expires_at`: default 90 days, max 365, minimum 1. Expiry is checked before `can()`.
- `revoked_at`: revocation is immediate (the next request fails); no cache, no grace period.
- `last_used_at`: updated at most once a minute to avoid a write per call.
- A key can never mint another key (`agent_key.create` is denied to agent actors).

**Scope is structural, not a conditional.** The actor is `{kind:'agent', userId, scope, boardId}`; a board mismatch is rejected before any permission is computed. An instance admin's board-scoped key gets `404` on another board — the test that proves this is part of the authz suite.

## 2. Rate limits

| Bucket | Limit |
|---|---|
| Writes | 60 / minute, burst 20 |
| Reads | 600 / minute |
| `bulk_create_cards` | counts as one write (max 200 items) |
| Import | 3 / hour per board |

`429` with `Retry-After` and, in MCP, `-32004` with `data.retry_after_s`. The error hint for a single-card loop says: "use bulk_create_cards for more than 5 cards".

## 3. Issuance UI

Board settings → Agents:

- Name (free text, shown in the activity feed: "Hermes, agent key `backlog-bot`").
- Scope: this board (default) / all my boards (with a warning), and the role it inherits (read-only if the owner is a viewer).
- Expiry: 30 / 90 / 365 days.
- Created → a one-time panel with the key, the config block, and "test connection".

Account settings → Agent keys: the same list across boards, with last-used and revoke.

The list always shows: name, scope, board, role, created, last used, expires, status. Never the key.

## 4. Setup panel

The panel generates one block per client, from one template, with only the base URL and the key as variables. It must be copy-pasteable without editing.

```jsonc
// Claude Desktop / Claude Code (mcpServers)
{"mcpServers":{"klui":{"type":"http","url":"https://app.example.com/mcp",
  "headers":{"Authorization":"Bearer kb_YOUR_KEY"}}}}
```

- ChatGPT / connectors: the URL, with the same `Authorization` header.
- Mistral, Gemini: same URL, streamable HTTP transport, same header.
- OpenCode / Pi / Hermes and anything without a first-class MCP config: a **skill or prompt file** the human pastes:

```md
You have access to a Klui board at https://app.example.com/mcp with the key in KLUI_AGENT_KEY.
Call get_board before writing. Tools: list_boards, get_board, create_card, bulk_create_cards,
update_card, move_card, set_card_done, search_cards, get_activity, export_board.
Pass expected_updated_at on updates you did not just make. Prefer bulk_create_cards over
looping create_card. Never invent a board id. If a tool returns -32004, wait retry_after_s.
```

"Test connection" performs a real `initialize` + `whoami` and prints what it reached: the board name, the role, the key name. A green check that did not call the server is worse than no button.

## 5. Parity and the app

Every tool maps to a REST route and a UI affordance (`docs/mcp.md` §6). Two rules:

- A tool with no app equivalent must not ship.
- An app action with no tool is allowed only when it is deliberately human-only and recorded in `docs/decisions.md`.

The parity table is generated from the tool registry and asserted in CI, so a new route without a tool fails.

## 6. Attribution in the product

- Events carry `actor_kind: agent`, `actor_user_id` (the owner), and the key name in `payload.key_name`.
- The activity feed renders "Hermes (agent `backlog-bot`) moved card X".
- A card created by an agent looks identical to a human's card; the difference lives in the activity, which is the honest place for it.
- The board header shows a small count when more than one agent key has touched the board in the last 24 h — a signal, not a badge.

## 7. Security

- Keys are credentials: hashed at rest, never logged, never in an event payload, never in a URL.
- A key inherits its owner's role at request time, so a demotion applies immediately.
- Deleting a user revokes their keys.
- Rotating: create a new key, move the agent, revoke the old one. No in-place rotation, so there is never a window with an unknown key.
- An agent's requests are rate-limited per key, not per user: two agents on one account do not starve each other.
- The MCP endpoint answers `404` for a board outside scope, exactly like REST. Never a "forbidden" that confirms the board exists.

## 8. Acceptance

- A fresh agent given only the panel's config block reads a board and creates a card in under a minute, on two different clients.
- A board-scoped key of an instance admin gets `404` on another board.
- A revoked key fails on the next call with `401 invalid_credential`.
- 40 `create_card` calls in a loop hit `429`; the same 40 in one `bulk_create_cards` succeed.
- The key string appears in one HTTP response and nowhere else (grep the DB, the logs, the events).
