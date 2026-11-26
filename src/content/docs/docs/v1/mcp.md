---
title: '04 — MCP Server (per account)'
description: 'Model Context Protocol endpoint so any MCP client (Claude Desktop, Claude Code, ChatGPT with MCP, Ollama-based Hermes agents, custom clients) manages every b...'
sidebar:
  order: 50
generated: false
frozen: true
---
# 04 — MCP Server (per account)

Model Context Protocol endpoint so any MCP client (Claude Desktop, Claude Code, ChatGPT with MCP, Ollama-based Hermes agents, custom clients) manages **every board connected to the account** — one config, all boards. (Will: API/MCP par compte)

---

## 1. Endpoint & transport

- URL: `{BASE}/mcp` — **streamable HTTP** transport (`@modelcontextprotocol/sdk`).
- Auth: `Authorization: Bearer klui_<account key>` only. **Anonymous share tokens are not accepted on MCP** — accounts exist to make agents possible (01 §4.7).
- Boards resolvable server-side: `list_boards` → owned (creator powers) + connected (captured level). A board the account isn't connected to simply doesn't exist for that session.
- Server capabilities: `tools`, `resources`, `prompts`. No sampling.
- Client support note: acceptance targets are clients with native remote streamable-HTTP + header auth (Claude Code, chat agents such as Hermes, ChatGPT-connect mode). Claude Desktop-style local clients get a documented `mcp-remote` bridge recipe — supported path, not a blocking target.

## 2. Client config (printed in the account panel)

```json
{
  "mcpServers": {
    "klui": {
      "url": "{{BASE_URL}}/mcp",
      "headers": { "Authorization": "Bearer {{KEY}}" }
    }
  }
}
```

Copy button injects the freshly generated key. Claude Desktop-style `mcp.json` compatible.

## 3. Tools (15 participant + 3 owner-gated)

Every board-scoped tool takes `board` first — **name or id**, as listed by `list_boards`:

| Tool                | Input                                                                                                                              | Returns                                                                                           |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `list_boards`       | —                                                                                                                                  | All boards the account can reach: `{id, name, role: creator                                       | rw                                                                                                                                    | ro, archived?, archive_at?, member_count?, share_url? (owned only)}` |
| `create_board`      | `{name, members[] (1..200), archive_after_days? OR archive_on?, template?: "classic"                                               | "review"}`                                                                                        | board detail (columns + member names) owned by the key's account; `review` seeds To Do / In Progress / Review / Done + a `review` tag |
| `get_board`         | `{board}`                                                                                                                          | Full state (columns, cards, member names, archive info, + creator-only `share_url`/`share_mode`)  |
| `list_cards`        | `{board, column?, assignee?, tag?, text?}`                                                                                         | Filtered card list (concise, ids included)                                                        |
| `create_card`       | `{board, title, description?, assignee? (member name), tags? (max 8), due_at? (YYYY-MM-DD), column? (default first), client_ref?}` | card                                                                                              |
| `bulk_create_cards` | `{board, column? (default first), items: [{title, description?, tags? (≤8), due_at?, assignee?}] (max 100)}`                       | `{cards: [card…]}` — same service as REST quick fill, order preserved                             |
| `update_card`       | `{board, card_id, title?, description?, assignee?, tags? (replaces, max 8), due_at?, expected_updated_at?}`                        | card. A stale `expected_updated_at` returns `conflict` + re-fetch hint (absent = last-write-wins) |
| `list_comments`     | `{board, card_id}`                                                                                                                 | comment stream, `created_at asc, id asc`                                                          |
| `add_comment`       | `{board, card_id, body, author_label?}`                                                                                            | comment — always `author_type: "agent"`; label defaults to the key owner's username; cap 100/card |
| `move_card`         | `{board, card_id, column}`                                                                                                         | card — append-to-end only, no `position` input                                                    |
| `delete_card`       | `{board, card_id}`                                                                                                                 | confirmation                                                                                      |
| `add_column`        | `{board, name, position?}`                                                                                                         | column (rw)                                                                                       |
| `rename_column`     | `{board, column (name or id), name}`                                                                                               | column — names stay unique per board                                                              |
| `delete_column`     | `{board, column (name or id)}`                                                                                                     | confirmation — the last column is refused with `conflict`                                         |
| `list_members`      | `{board}`                                                                                                                          | member names (the valid assignees)                                                                |

Owner-gated (without ownership → `forbidden` + hint): `archive_board`, `restore_board`, `set_share_mode` — active only when the session's key belongs to the board's **owner**. **`delete_board` is deliberately ABSENT** (round-3, Will's ruling): a board-deleting agent call invites accidents; permanent deletion lives in the app UI behind a type-the-name confirmation. Trello made the same call on its MCP.

Tool descriptions in the manifest are **the API docs for agents** — they must state behaviors (LWW, idempotent `client_ref`, member-name-strict assignee, column default), not just schemas.

## 4. Resources & Prompts

- Resource `klui://boards` — JSON list of reachable boards (id, name, role).
- Resource `klui://boards/{id}/state` — full board state, update notifications on change (subscribe-friendly).
- Resource `klui://boards/{id}/export.md` — current markdown export.
- Prompt `summarize_board(board)` — status summary (per member, per column, next moves).
- Prompt `seed_from_plan(board)` — instructions for an agent holding a plan/spec text to emit a `create_card` batch (column mapping, short imperative titles, one tag when obvious, assignee when a member name is mentioned). **This is the "board filled in seconds" moment.** (Hermes, veto-able)

## 5. Error behavior

Same `{error, hint}` JSON bodies, status-mapped MCP errors; rate limits shared with REST; `ro`-level writes get `forbidden` + hint ("connection is read-only — ask the creator"); unknown board → `not_found` + hint ("check list_boards"); a stale `expected_updated_at` on `update_card` → `conflict` + "re-fetch GET /state and re-apply your edit".

## 6. The 60-second agent onboarding (acceptance script)

1. Sign up (or log in) — 30 seconds, password or GitHub OAuth.
2. Open a board link → connected automatically. Open the **account panel** → copy MCP config + prompt.
3. Paste into the agent's MCP config / chat agent.
4. Agent calls `list_boards` then `get_board` and greets the board state.

That's the whole manual. If a member cannot reach step 4 with their agent and this doc alone, the manifest text ships broken — fix before release.
