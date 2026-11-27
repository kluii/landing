---
title: 'Permissions'
description: 'The authorization spine.'
sidebar:
  order: 4
generated: true
app_version: '2.0.0'
---
# Permissions

The authorization spine. If this document and the code disagree, the code is wrong.

One function decides; everything else asks. `server/src/lib/authz.ts` is the only place a permission is computed, and it is the most tested file in the repository.

---

## 1. Actors

```ts
type Actor =
  | { kind: 'user';  userId: string }                                  // session or bearer session token
  | { kind: 'agent'; userId: string; scope: 'board' | 'user'; boardId?: string } // kb_ key
  | { kind: 'link';  boardId: string; role: 'read' | 'edit' }         // /l/<token> resolved
  | { kind: 'anon';  boardId: string; label: string; anonId: string } // signed cookie
```

Notes on the additions to the brief's union:

- **`agent`** is a `user` narrowed by a key. It exists as a distinct kind so that a board-scoped key can be *structurally* incapable of reading another board (D-34), instead of relying on a runtime check that a future refactor can drop. An agent actor never has `is_instance_admin` power.
- **`anon`** carries `anonId`, the opaque id stored on the cards it creates (D-11). It is what makes "edit the card I just created" expressible without an account.
- A request with no credential is not an actor. It is rejected at authentication (`401`) before `can()` is called.

`can()` signature:

```ts
function can(
  actor: Actor,
  action: Action,
  board: BoardRow,          // the already-loaded board, or a projection with id/owner/visibility/policy
  membership?: Membership,  // present only for a user/agent actor that is a member
): Decision                 // { allow: true } | { allow: false; reason: 'not_found' | 'forbidden' }
```

`reason: 'not_found'` means the caller must render a 404 with the standard body. `reason: 'forbidden'` means the actor can already read the board and is being refused a write — a `403`.

**Nothing else may decide.** A route that inspects `membership.role` to choose a status code, a service that filters by `board.owner_id` before calling `can()`, an MCP tool with its own `if (key.scope === 'board')` — each is a defect, because each is a second place where the matrix can be wrong.

---

## 2. Actions

Actions are a closed union. Adding one means adding a column to the matrix test in the same commit.

| Action | Covers |
|---|---|
| `board.read` | Board, columns, cards, members list, activity, comments read, state, OG image |
| `board.update` | Name, slug, visibility, link role, anon policy, suffix rotation |
| `board.delete` | Deleting the board and its content |
| `board.close` | Generating the close-out summary and freezing |
| `board.export` | JSON and markdown export |
| `board.import` | Importing into the board |
| `member.invite` / `member.update` / `member.remove` / `member.transfer` | Membership management |
| `link.list` / `link.create` / `link.revoke` | Write-link management (tokens) |
| `moderation.list` / `moderation.decide` | Pending-card queue |
| `column.create` / `column.update` / `column.delete` | Column structure |
| `card.create` / `card.update` / `card.move` / `card.complete` / `card.delete` | Card content |
| `comment.create` / `comment.update` / `comment.delete` | Comments |
| `agent_key.create` | Issuing a board-scoped key |
| `instance.*` | Separate namespace, instance admin only, never board content |

`comment.update` is `allow` only for the comment's author (or a board owner for a moderation edit that is logged as such). It is evaluated with an `isAuthor` flag passed by the service — the only action with an object-level condition, and it is tested for both outcomes.

---

## 3. Resolution order

1. **Credential → actor.** No credential → `401 unauthenticated`. An invalid/revoked/expired credential → `401 invalid_credential` (never `404`; the credential itself is the subject).
2. **Board scope.** An `agent` with `scope: 'board'` whose `boardId` differs from the target board is `not_found`. A `link`/`anon` actor carries its own `boardId`; a mismatch is `not_found`.
3. **Readability.** `private` board: only members. `link`/`public`: members, link actors with role `read`/`edit`, and anon actors (on `public`, or on `link` with an anon policy that requires write). A `link_role: none` board is members-only for reading. Not readable → `not_found`.
4. **Frozen state.** A closed board allows reads, `board.export` and `board.summary` only. Every write is `forbidden` — including for the owner. There is no archived state (D-53).
5. **Role.** Resolve the effective permission from the matrix below and intersect with the key scope when the actor is an agent.
6. **Anonymous write policy.** For `anon` actors, `off` denies everything; `open` allows the four actions in §4.3; `moderated` allows only `card.create`, and only into `pending_cards`.

The order matters: readability is decided before role, so a non-member never learns whether a board is closed, how many members it has, or whether their role would have allowed the action.

---

## 4. The matrix

`Y` allow · `—` deny with `forbidden` · `404` deny with `not_found` (board not readable).

### 4.1 Member roles

| Action | owner | admin | editor | viewer | non-member |
|---|---|---|---|---|---|
| `board.read` | Y | Y | Y | Y | 404 |
| `board.update` | Y | Y | — | — | 404 |
| `board.delete` | Y | — | — | — | 404 |
| `board.close` | Y | Y | — | — | 404 |
| `board.export` | Y | Y | Y | Y | 404 |
| `board.import` | Y | Y | — | — | 404 |
| `member.invite` | Y | Y | — | — | 404 |
| `member.update` | Y | Y | — | — | 404 |
| `member.remove` | Y | Y | — | — | 404 |
| `member.transfer` | Y | — | — | — | 404 |
| `link.list` / `link.create` / `link.revoke` | Y | Y | — | — | 404 |
| `moderation.list` / `moderation.decide` | Y | Y | — | — | 404 |
| `column.create` / `update` / `delete` | Y | Y | Y | — | 404 |
| `card.create` | Y | Y | Y | — | 404 |
| `card.update` | Y | Y | Y | — | 404 |
| `card.move` | Y | Y | Y | — | 404 |
| `card.complete` | Y | Y | Y | — | 404 |
| `card.delete` | Y | Y | Y | — | 404 |
| `comment.create` | Y | Y | Y | — | 404 |
| `comment.update` | own | own | own | — | 404 |
| `comment.delete` | Y | Y | own | — | 404 |
| `agent_key.create` | Y | Y | — | — | 404 |

Rules baked into the table:

- **Exactly one owner.** Transfer is owner-only, and the transfer is a single transaction that demotes the old owner to `admin`.
- **Admin cannot delete the board and cannot transfer it.** An admin can remove another admin; an admin cannot remove the owner.
- **Editor cannot touch structure, members, links or moderation.** Editors edit content.
- **Viewer writes nothing, including comments** (D-07). It can export, because everything in an export is already readable.
- **A non-member always gets `404`**, whatever their instance role.

### 4.2 Link actors (readable `link` or `public` board)

| Action | link `read` | link `edit` | link `none` |
|---|---|---|---|
| `board.read` (and activity, comments read) | Y | Y | 404 |
| `card.create` | — | Y | 404 |
| `card.update` | — | Y | 404 |
| `card.move` | — | Y | 404 |
| `card.complete` | — | Y | 404 |
| `card.delete` | — | — | 404 |
| `column.*` | — | — | 404 |
| `board.export` | — | — | 404 |
| `board.import` | — | — | 404 |
| `member.*`, `link.*`, `moderation.*` | — | — | 404 |
| `comment.create` | — | — | 404 |

A link holder is not anonymous (they hold a secret), but they are still unattributable beyond `last_used_at`. They may move work; they may not destroy it (D-09), reshape the board, or exfiltrate it in bulk.

### 4.3 Anonymous actors

| Action | `anon_write: off` | `open` | `moderated` |
|---|---|---|---|
| read (via `link`/`public` URL) | Y | Y | Y |
| `card.create` | — | Y (direct) | Y → `pending_cards` |
| `card.update` on a card with their `anon_actor_id` | — | Y | — |
| `card.complete` on their own card | — | Y | — |
| `card.update` on any other card | — | — | — |
| `card.move`, `card.delete` | — | — | — |
| `comment.create` | — | — | — |
| everything else | — | — | — |

`private` forces `link_role: none` and `anon_write: off`; the API rejects a PATCH that tries to set either.

Moderated writes produce a `PendingCard` and a `pending.created` event visible only to owner/admin. Approval creates the card with the anon label preserved and records `pending.approved` with the approver as actor.

### 4.4 Agents

An agent actor is evaluated as the **intersection** of its owner's membership and its key scope:

- `scope: 'user'` → the owner's role on every board they belong to.
- `scope: 'board'` → the owner's role on that one board, `not_found` on every other board, regardless of `is_instance_admin`.
- An agent never gets a role it does not have as a user. A viewer's key is a viewer's key.
- `agent_key.create` is denied to agents (a key cannot mint a key).

---

## 5. Non-existence is the default answer

| Situation | Status | Body |
|---|---|---|
| No credential on a protected route | `401` | `unauthenticated` |
| Invalid, expired or revoked credential | `401` | `invalid_credential` |
| Board does not exist | `404` | `board_not_found` |
| Board exists, actor cannot read it | `404` | `board_not_found` — **byte-identical** |
| Board exists under another account, guessed URL | `404` | `board_not_found` |
| Actor can read, lacks the role | `403` | `forbidden` + the action name |
| Banned actor | `403` | `banned` (before authorization; leaks nothing) |
| Closed board, write attempted | `403` | `board_closed` |
| Stale `expected_updated_at` | `409` | `conflict` + `current` row |
| Rate limited | `429` | `rate_limited` + `Retry-After` |

The 404 body must not vary by reason: same code, same message, same headers, same timing shape. A test compares the two responses field by field, including the absence of an `X-Board-Id`-style header.

For a `link` board with a wrong suffix, and for a rotated suffix, the answer is `404` — never "this link expired", which confirms the board exists.

---

## 6. Test plan (the most valuable test in the repository)

`server/test/authz-matrix.test.ts`

- The test builds the table **from this document's dimensions**, not from a hand-written list: visibility (3) × link role (3) × anon policy (3) × member role (5, including non-member) × actor kind (4) × action (32).
- Every cell is asserted, including every deny. A test that only asserts the allows is documentation, not a gate.
- Invalid combinations are asserted too: `private` + `link_role: edit` must be impossible to construct (the API rejects it, the DB constraint backs it up).
- A separate test walks **every route** and asserts it calls `can()`: a spy on `can()` plus a table of `(method, path, expected action)`; a new route without an entry fails the test.
- A third test asserts the **404 equality**: for each of five read actions, the response for "exists but unreadable" equals the response for "does not exist" (status, body, and the absence of varying headers).
- A fourth test asserts the **agent scope** invariant: a board-scoped key of an instance admin gets `404` on another board.
- Property test on the move endpoint: 200 randomised neighbour pairs never produce a `403` for an editor or a `200` for a viewer.

When a cell changes, this document changes in the same commit, and the commit message says which decision moved.
