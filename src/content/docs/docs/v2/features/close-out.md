---
title: 'Close-out'
description: 'The feature Linear and Trello do not produce.'
sidebar:
  order: 13
generated: true
app_version: '2.0.0'
---
# Close-out

The feature Linear and Trello do not produce. A short project has an end; the product must be able to say what happened.

`POST /boards/:id/close` freezes the board and generates a **project summary** from the event log. Irreversible in 2.0 (D-22).

---

## 1. What closing does

1. `confirm: true` required in the body. The dialog names the board and says, in plain words, that the board becomes read-only and cannot be reopened.
2. In one transaction: set `closed_at`, generate the summary, store it in `board.close_summary`, write `board.closed`.
3. Every write action after that answers `403 board_closed` — including for the owner. Reads and export keep working.
4. The board renders with a "Closed" chip, the summary link, and no edit affordances at all.
5. `DELETE /boards/:id` still works for the owner (deleting a finished project is a legitimate act).

## 2. Summary content

Computed from `events` — never hand-edited, never re-generated on read.

| Section | Source | Example |
|---|---|---|
| Header | board name, owner, first and last event | `Retro S2 · will · 12 Oct → 26 Nov 2026` |
| Outcome | cards done / total, columns, members, span in days | `18 of 24 cards done in 46 days` |
| Done | `card.completed` + `card.created` (done without a completed event, e.g. imported) | `Wire the digest — Hermes — 14 Nov` |
| Remaining | open cards at close time, grouped by column | `Doing: Moderation queue — unassigned` |
| People | events per actor: humans, agents, anonymous labels | `Will 84 · Hermes (agent) 61 · "client" 4` |
| Rhythm | events per week, as ASCII bars | `████▆▃▂` |
| Note | optional free text from the owner at close | `Cut the export scope, shipped the rest.` |

Rules:

- "Done" and "Remaining" must partition the cards exactly: every card appears once, and the counts add up to the board's card count at close. A test asserts it.
- "People" counts distinct actor labels, with agents separated from humans. An anonymous label appears as `"client" (anonymous)` — never attributed to a user.
- "Rhythm" is optional when the span is under 7 days.
- The note is the only human-authored string, and it is quoted, not paraphrased.
- The summary is a document, not a dashboard: no charts beyond the ASCII rhythm line, no emoji, no "Great job".

## 3. Markdown export

`GET /boards/:id/summary.md` and the same content in the board's markdown export header.

```md
# Retro S2 — closed 26 November 2026

18 of 24 cards done in 46 days · 3 columns · 4 members · 2 agents

## Done
- Wire the digest — Hermes — 14 Nov
- Fix the drop index — Will — 18 Nov

## Remaining
### Doing
- Moderation queue — unassigned

## People
- Will — 84 events
- Hermes (agent `backlog-bot`) — 61 events
- "client" (anonymous) — 4 events

## Note
Cut the export scope, shipped the rest.
```

The markdown is byte-stable for a given board: same input, same output, no timestamps beyond the dates already in the data.

## 4. Rendering

- A dedicated page at `/<username>/<slug>/summary`, readable by anyone who can read the board (members, link holders; anonymous readers of a public board included).
- Typography per `DESIGN.md`: `display` for the board name, `mono` for counts and dates, `h2` for sections, no cards-in-cards.
- Print stylesheet: white background, black text, no chrome, one page for a board under 50 cards. A summary is something people paste into a report.
- Shareable: the page has its own OG image (same renderer as boards), `noindex` when the board is `link`.

## 5. Why it is generated, not written

- A hand-written summary is a second source of truth that drifts from the board the moment someone edits a card.
- The event log already contains who did what and when; re-deriving it from current state loses deletions and renames.
- The summary is stored once at close so the page does not change under the reader when the retention job trims old events. (Events referenced by a close-out are exempt from retention — see `docs/architecture.md` §7.)

## 6. Acceptance

- `POST /close` twice: the second answers `409 already_closed`.
- A write after close answers `403 board_closed` for the owner too.
- The Done + Remaining counts equal the card count at close (test with deleted cards in the history).
- The markdown export of the summary is identical across two reads.
- An anonymous participant appears in People with their label and the `(anonymous)` marker, not as a member.
- The page is readable by a link holder and by a member, and `404` for a stranger on a private board.
