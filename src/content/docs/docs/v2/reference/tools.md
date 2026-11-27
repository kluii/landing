---
title: 'MCP tools'
description: 'The 21 MCP tools and their arguments, generated from the app registry at 2.0.0.'
sidebar:
  order: 83
generated: true
app_version: '2.0.0'
---
# MCP tools

21 tools, frozen at 2.0, generated from the application registry at 2.0.0.
See [MCP reference](/docs/v2/mcp) for the protocol.

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
| `export_board` | `({board, format:"json"\|"md"})` |
| `whoami` | `()` |
