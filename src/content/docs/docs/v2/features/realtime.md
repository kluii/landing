---
title: 'Realtime'
description: 'One SSE stream per session, one rule for the client: merge by server id, never append blindly.'
sidebar:
  order: 18
generated: true
app_version: '2.0.0'
---
# Realtime

One SSE stream per session, one rule for the client: **merge by server id, never append blindly**.

---

## 1. Server

`GET /api/v1/stream?board=<id>` (repeatable). Auth: session cookie or bearer. Each requested board is authorized with `can(actor, 'board.read', board)`; an unauthorized board is silently omitted from the subscription (never an error that reveals it exists).

- `Content-Type: text/event-stream`, `Cache-Control: no-store`, `X-Accel-Buffering: no`.
- A comment line (`: ping`) every 25 s keeps proxies and load balancers from closing the connection.
- Events are published **after commit**, never inside the transaction.
- A single in-memory hub per process: `Map<boardId, Set<subscriber>>`. Each subscriber has a bounded queue (1 000 events); a slow consumer is disconnected rather than allowed to grow memory.

**Envelope**

```
id: 0000000000004207
event: card.moved
data: {"board_id":"brd_…","entity":"card","action":"updated","payload":{…},"actor_label":"will","at":"2026-11-26T10:00:00.000Z"}
```

`id` is monotonic per process (`Date.now()` padded + counter) and is what `Last-Event-ID` replays from.

**Replay**

- Ring buffer per board: last 1 000 events or 5 minutes, whichever is smaller.
- On reconnect with `Last-Event-ID`, replay everything newer. If the id is older than the buffer, emit `event: resync` with no payload; the client refetches state instead of guessing.
- The client **always** refetches `GET /boards/:id/state` once on reconnect, even after a successful replay. Replay closes small gaps; it is not a substitute for the truth.

**Other events on the same stream**

| Event | Meaning |
|---|---|
| `resync` | Drop local state, refetch. |
| `import.progress` | `{job_id, columns, cards, done}` for long imports. |
| `pending.created` | Owner/admin only; a new pending card awaits moderation. |
| `close` | Server is shutting down; the client reconnects with backoff. |
| `board.closed` | The board became read-only; the client flips to read-only without a reload. |

---

## 2. Client

### 2.1 The ordering problem

**An SSE echo can arrive before the HTTP response to the same mutation.** This is normal: the server publishes after commit, and the HTTP response travels a different path. The consequence is a duplicated entity if the handler appends.

Rules:

1. Every mutation handler merges by id (`mergeById`) — insert if absent, replace if present. Applies to cards, columns, comments, members, pending cards, and the digest counters.
2. Forms disable their submit while a mutation is in flight. A double click otherwise fires two real POSTs, which is indistinguishable from the race.
3. The mutation response itself goes through the same merge. It is not a special case.
4. An echo for an entity the client no longer has (deleted locally) is ignored, not resurrected.

### 2.2 Optimistic writes

- A move is optimistic (it must feel immediate); a create is optimistic only with a draft id, replaced on response.
- A failed write patches **only the touched entity** back to its last confirmed server value. Never restore a whole-state snapshot: it silently discards a teammate's update that arrived while the request was in flight.
- The checkbox and the move are the two paths with the most traffic and therefore the most rollback bugs; both keep a per-entity `lastConfirmed` value.

### 2.3 Connection lifecycle

- Open when a board mounts; close when it unmounts (one stream per session, not per board — boards are filters on the same connection).
- Backoff: 1 s, 2 s, 4 s, 8 s, 16 s, 30 s (cap), with ±20 % jitter. Reset on a successful open.
- While disconnected: a muted line "Reconnecting" in the board header, and a polling fallback every 15 s that fetches state and merges. The board stays usable.
- `document.visibilitychange` → reconnect immediately when the tab becomes visible; do not keep a dead stream in a background tab.

### 2.4 The regression test

`web/test/board-live-race.test.tsx`

1. Hold the SSE stream open with a `ReadableStream` controller.
2. Resolve `POST /api/v1/boards/b1/columns` with a deferred promise.
3. While the POST is pending, inject `event: column.created\ndata: {…}\n\n` with the same entity id.
4. Assert exactly one DOM node.
5. Resolve the POST. Assert again: still exactly one.

Two traps that make this test pass for the wrong reason:

- Passing a raw Promise as the mocked route value — the mock serialises it into an instant body and the race never happens. Pass a **function returning** the pending promise.
- Mocking `/columns` instead of the client's real path `/api/v1/boards/b1/columns` — an unmatched route 404s, the handler never runs, and the assertion passes because nothing was appended.

---

## 3. What is not realtime

- Typing indicators, presence, cursors: out of scope. A board with six avatars floating over it is a different product.
- Notifications: delivered in-app through a separate polled endpoint (15 s) in 2.0, not through the board stream. A notification is account-scoped; the board stream is board-scoped, and mixing them leaks board activity into unrelated pages.
- Digest: batch, never realtime.
