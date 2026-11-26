---
title: 'Migrate from v1'
description: 'How to move a v1 board to v2: export from the old instance, import in the new one. The v1 docs are frozen at /docs/v1.'
sidebar:
  order: 93
generated: false
---

# Migrate from v1

The documentation for the previous line is frozen at [/docs/v1](/docs/v1) and is no
longer updated; it documents v1 as it was, which is what a migration needs.

## Moving a board

1. On the v1 instance, export the board to markdown (v1: board menu → export).
2. On the v2 instance, create a board and import the markdown file.
   See [import and export](/docs/v2/features/import-export) for the exact format and
   what is preserved (cards, columns, tags, comments; not attachments — v2 has none,
   see [limits](/docs/v2/limits)).
3. Recreate the links you want to share: in v2 the readable link only grants reading;
   set the link role to `edit` if link holders should write, or issue write links.
   See [links and anonymous participation](/docs/v2/features/links-and-anonymous).

## What changed in 2.0

- Agents are first-class: per-board keys over MCP ([MCP reference](/docs/v2/mcp)).
- Closing a board freezes it and writes a summary from the event log
  ([close-out](/docs/v2/features/close-out)).
- Anonymous participation is explicit: a link plus a display name, with the write
  scope stated on the board ([permissions](/docs/v2/permissions)).
