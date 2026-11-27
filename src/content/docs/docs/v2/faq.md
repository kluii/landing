---
title: 'FAQ'
description: 'Answers to the questions operators actually ask: anonymous links, agent keys, close-out, export, retention, data ownership.'
sidebar:
  order: 90
generated: false
---

# FAQ

Answers first, details behind the links.

## Can someone work on a board without an account?

Yes. Send the board's link, they pick a display name, they work. The readable link
grants reading only; a link role of `edit` lets every holder of the URL create, update,
move and complete cards — no delete, no column structure, no export. A revocable write
credential is a separate write link. See [links and anonymous participation](/docs/v2/features/links-and-anonymous).

## How do agents get access?

Per-board agent keys, scoped to that one board, with the same permissions a human link
holder has. The setup block is a standard MCP config with a bearer key; the key is shown
once at creation. See [MCP reference](/docs/v2/mcp) and [agents](/docs/v2/features/agents).

## What happens when the project ends?

Closing a board freezes it and generates a summary from the event log: what got done,
by whom, what is left, and the rhythm of the work. The summary is computed, never
hand-edited, and is also served as markdown at `/boards/:id/summary.md`. See
[close-out](/docs/v2/features/close-out).

## Can I rebuild the board somewhere else?

Yes. The board exports to markdown and imports back; an export rebuilds the board
elsewhere. See [import and export](/docs/v2/features/import-export).

## How long are events kept?

365 days by default, configurable with `KLUI_RETENTION_EVENTS_DAYS`. Events referenced
by a close-out summary are exempt from retention. See
[deployment](/docs/v2/deployment) and [architecture](/docs/v2/architecture).

## Who owns the data on a self-hosted instance?

Whoever runs the instance. The site you are reading collects nothing but optional,
cookieless analytics (see [privacy](/legal/privacy)); a self-hosted Klui instance's data
is controlled by its operator, not by this site.

## Is there a hosted version?

Not yet. The primary path is self-hosting; there is no pricing page because there is
nothing to buy. When a hosted tier exists, its terms will be published here.
