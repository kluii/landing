---
title: 'MCP surface'
description: 'POST /mcp — stateless JSON-RPC 2.0 over HTTP.'
sidebar:
  order: 3
generated: true
app_version: '2.0.0'
---
# MCP surface

`POST /mcp` — stateless JSON-RPC 2.0 over HTTP. The tool names and argument names below are **frozen at 2.0**. Renaming one is a breaking change: agent clients cache the schema, and a renamed argument silently breaks every configured client.

Parity rule: every tool has an app equivalent and vice versa. The mapping is a test (`server/src/mcp/parity.ts`), not a promise.

---

## 1. Transport

- `POST /mcp`, `Content-Type: application/json`, `Accept: application/json, text/event-stream`.
- No session header. Every call carries its own credential: `Authorization: Bearer kb_…` (agent key) or a session token.
- A `GET /mcp` returns `405` with a hint pointing at `POST`. Server-initiated messages are not used in 2.0.
- Batch requests (JSON array) are accepted and answered in order.
- Notifications (`notifications/initialized`, `notifications/cancelled`) are accepted with `202 Accepted` and an empty body.

**Handshake**

```jsonc
// → {"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"claude","version":"…"}}}
// ← {"jsonrpc":"2.0","id":1,"result":{"protocolVersion":"2025-06-18",
//      "capabilities":{"tools":{"listChanged":false}},
//      "serverInfo":{"name":"klui","version":"2.0.0"}}}
```

`protocolVersion` is negotiated against the versions the server implements; an unknown version is answered with the server's newest supported version rather than an error (clients handle that better than a hard failure).

---

## 2. Errors

JSON-RPC error codes are used for the protocol layer; application errors ride in `error.data` with the same codes as REST.

```jsonc
{"jsonrpc":"2.0","id":7,"error":{
  "code":-32602,
  "message":"Invalid params for move_card: 'after' must be a string card id or null.",
  "data":{"parameter":"after","expected":"string | null","received":"undefined",
          "example":{"board":"brd_01J…","card":"crd_01J…","column":"col_01J…","before":"crd_01J…","after":null},
          "hint":"Pass the id of the card currently below the target position, or null."}}}
```

Rules:

- `-32600` invalid request · `-32601` unknown method/tool · `-32602` invalid params · `-32603` internal · `-32001` not found (also used for unreadable resources — MCP must not become an existence oracle) · `-32002` forbidden (readable board) · `-32003` conflict · `-32004` rate limited (with `retry_after_s` in `data`) · `-32005` board closed.
- A bad argument **always** names the parameter, its expected type, and one working example. `expected string, received undefined` alone is a puzzle, not an error message.
- Unknown tool names list the closest three by edit distance in `data.hint`. Agents guess names; make the guess cost one round trip, not five.

---

## 3. Tools (frozen)

`board` accepts a board id (`brd_…`). `card`, `column` accept their ids. Display names are never accepted where an id is expected, except in `create_card.assignee` (see below).

| Tool | Arguments |
|---|---|
| `list_boards` | `()` |
| `get_board` | `({board})` |
| `create_board` | `({name, visibility?})` |
| `update_board` | `({board, name?, visibility?, link_role?, anon_write?, slug?})` |
| `delete_board` | `({board, confirm: true})` |
| `create_column` | `({board, name, position?})` |
| `update_column` | `({board, column, name?, position?})` |
| `delete_column` | `({board, column})` |
| `create_card` | `({board, column, title, description?, assignee?, due_at?, tags?})` |
| `bulk_create_cards` | `({board, column, items:[{title, description?, assignee?, due_at?, tags?, done?}]})` |
| `get_card` | `({board, card})` |
| `update_card` | `({board, card, title?, description?, assignee?, due_at?, tags?, done?, expected_updated_at?})` |
| `move_card` | `({board, card, column, before?, after?})` |
| `set_card_done` | `({board, card, done})` |
| `delete_card` | `({board, card})` |
| `list_comments` | `({board, card})` |
| `create_comment` | `({board, card, body})` |
| `search_cards` | `({board, query?, assignee?, tags?, done?, column?})` |
| `get_activity` | `({board, since?, limit?})` |
| `export_board` | `({board, format:"json"|"md"})` |
| `whoami` | `()` |

### 3.1 Input schemas (abbreviated but normative)

```jsonc
list_boards      { "type":"object", "properties":{}, "additionalProperties":false }

get_board        { "board": { "type":"string", "description":"Board id (brd_…)" } }

create_board     { "name": {"type":"string","minLength":1,"maxLength":80},
                   "visibility": {"enum":["private","link","public"],"default":"private"} }

update_board     { "board": string,
                   "name": string?, "slug": string?,
                   "visibility": enum? , "link_role": enum["read","edit","none"]?,
                   "anon_write": enum["off","open","moderated"]? }

create_column    { "board": string, "name": {"type":"string","maxLength":64},
                   "position": { "before": string?, "after": string? }? }

create_card      { "board": string, "column": string,
                   "title": {"type":"string","minLength":1,"maxLength":200},
                   "description": string?, 
                   "assignee": {"type":"string","description":"Username, or a display name for a non-member"},
                   "due_at": {"type":"string","format":"date-time"}?,
                   "tags": {"type":"array","maxItems":8,"items":{
                     "oneOf":[{"type":"string","description":"shorthand for {name}"},
                              {"type":"object","properties":{
                                "name":{"type":"string","maxLength":24},
                                "color":{"type":"string","pattern":"^#[0-9A-Fa-f]{6}$"}},
                               "required":["name"],"additionalProperties":false}]}}? }

bulk_create_cards{ "board": string, "column": string,
                   "items": {"type":"array","maxItems":200,"items":{ /* create_card minus board/column */ }} }

update_card      { "board": string, "card": string,
                   "title": string?, "description": string?, "assignee": string?,
                   "due_at": string?, "tags": (string|{name,color?})[]?, "done": boolean?,
                   "expected_updated_at": string? }

move_card        { "board": string, "card": string, "column": string,
                   "before": {"type":["string","null"]}, "after": {"type":["string","null"]} }

set_card_done    { "board": string, "card": string, "done": boolean }

search_cards     { "board": string, "query": string?, "assignee": string?,
                   "tags": (string|{name,color?})[]?, "done": boolean?, "column": string? }

get_activity     { "board": string, "since": {"type":"string","format":"date-time"}?,
                   "limit": {"type":"integer","minimum":1,"maximum":200,"default":50} }

export_board     { "board": string, "format": {"enum":["json","md"]} }
```

Notes that matter in practice:

- `assignee` in `create_card` / `update_card` is the **username string** (or a display name for a non-member), because an agent reading a board sees `"assignee":"Hermes"`. The server resolves it to a member id when one matches and stores `assignee_label` otherwise. No other field accepts a name.
- `tags` accepts a bare string (`"api"`) or an object (`{"name":"api","color":"#8B5CF6"}`); a response always returns objects with the effective colour (card override, else board default, else `null`). A colour set through `create_card` / `update_card` applies to that card only; changing the board default is a REST call (`PUT /boards/:id/tag-colors`), deliberately not a tool, so an agent cannot silently repaint a board.
- `move_card` without `before`/`after` appends. Passing `index` or `position` is rejected with `-32602` naming the accepted shape.
- `expected_updated_at` is optional everywhere, but an agent that omits it on `update_card` will silently overwrite a human's paragraph. The setup skill tells agents to read before writing.
- `delete_board` requires `confirm: true`; without it the call is rejected, not implicitly confirmed.

---

## 4. Results

Tool results are MCP `content` blocks. Klui returns one `text` block containing JSON plus `structuredContent` with the same object (clients that understand structured output get the typed version).

```jsonc
{"jsonrpc":"2.0","id":9,"result":{
  "content":[{"type":"text","text":"{\"cards\":[…],\"next_cursor\":null}"}],
  "structuredContent":{"cards":[…],"next_cursor":null},
  "isError":false}}
```

- `get_board` returns `columns`, `cards`, `members` and `caller_role` in one call — an agent should never need a second call to paint a board.
- Lists are capped at 200 items; `next_cursor` is returned when truncated. `search_cards` caps at 50 and says so in `data.truncated`.
- `export_board` returns the document inline when ≤ 256 KB, otherwise an error naming the REST endpoint to download it from (`-32001`-style hint, not a silent truncation).
- A successful mutation returns the resulting entity (same shape as the REST response), so the agent does not need to re-read.

---

## 5. Rate limits and batching

- Writes: 60 per minute per key, burst 20. Reads: 600 per minute. Exceeded → `-32004` with `data.retry_after_s` and an HTTP `429` + `Retry-After`.
- `bulk_create_cards` counts as **one** write. An agent that loops `create_card` 40 times will be throttled; the error hint says "use bulk_create_cards for more than 5 cards".
- Idempotency: a `create_card` retried after a timeout may duplicate. The tool accepts an optional `idempotency_key` in `data` (same 24 h window as REST) — documented in the skill, optional in the schema.

---

## 6. Parity

| MCP tool | REST equivalent | App surface |
|---|---|---|
| `list_boards` | `GET /boards` | Boards index |
| `get_board` | `GET /boards/:id/state` | Board |
| `create_board` | `POST /boards` | Boards index → New |
| `update_board` | `PATCH /boards/:id` | Board settings |
| `delete_board` | `DELETE /boards/:id` | Board settings → Danger |
| `create_column` | `POST /boards/:id/columns` | Board → Add column |
| `update_column` | `PATCH /columns/:id` | Column menu → Rename |
| `delete_column` | `DELETE /columns/:id` | Column menu → Delete |
| `create_card` | `POST /boards/:id/cards` | New card modal |
| `bulk_create_cards` | `POST /boards/:id/cards/bulk` | Import / quick fill |
| `get_card` | `GET /cards/:id` | Card read modal |
| `update_card` | `PATCH /cards/:id` | Card edit modal |
| `move_card` | `POST /cards/:id/move` | Drag and drop |
| `set_card_done` | `PATCH /cards/:id {done}` | Done tick |
| `delete_card` | `DELETE /cards/:id` | Card menu → Delete |
| `list_comments` | `GET /cards/:id/comments` | Card read modal |
| `create_comment` | `POST /cards/:id/comments` | Card read modal |
| `search_cards` | `GET /boards/:id/state?query=…` (client-side) + `GET /boards/:id/search` | Filter panel |
| `get_activity` | `GET /boards/:id/activity` | Activity tab |
| `export_board` | `GET /boards/:id/export.json|.md` | Board settings → Export |
| `whoami` | `GET /me` | Account menu |

A tool without an app equivalent must not ship (an agent could do something a human cannot). An app action without a tool is allowed only when it is deliberately human-only (2FA enrolment, account deletion) and is listed in `docs/decisions.md` as such.

---

## 7. Client setup

The setup panel renders a config block per client from one template. The only variables are the instance base URL and the agent key.

```jsonc
// Claude Desktop / Claude Code style (mcpServers)
{"mcpServers":{"klui":{"type":"http","url":"https://app.example.com/mcp",
  "headers":{"Authorization":"Bearer kb_YOUR_KEY"}}}}

// ChatGPT / connectors: the URL above, with the same bearer header.
// Mistral / Gemini: same URL, same header, "streamable HTTP" transport.

// OpenCode / Pi / Hermes: a skill or prompt file, not a config block.
```

The **custom-skill** variant ships as text the human can paste into an agent:

```md
You have access to a Klui board through the MCP endpoint https://app.example.com/mcp
with the key in KLUI_AGENT_KEY. Tools: list_boards, get_board, create_card, bulk_create_cards,
update_card, move_card, set_card_done, search_cards, get_activity. Read get_board before
writing; pass expected_updated_at when you update a card you did not just create. Prefer
bulk_create_cards over looping create_card. Never invent a board id.
```

Panel requirements:

- "Test connection" performs a real `initialize` + `whoami` with the key and reports the board and role actually reached (not "looks good").
- The key is shown once at creation, with a copy button and a warning; the panel afterwards shows "created 2026-11-26, last used 3 minutes ago", never the key.
- A read-only key is offered alongside a write key, with plain-language scope copy: "This key can read and write one board. It cannot read any other board."

---

## 8. Versioning

- The tool surface is versioned with the product. `serverInfo.version` reports `2.0.0`.
- Additive optional arguments are not a breaking change. Renaming, removing, or tightening an argument is: it needs a deprecation window of at least one minor release, both names accepted during the window, and a changelog entry naming the old and the new.
- `/llms.txt` lists the tools and the endpoint, generated from the same registry so it cannot drift.
