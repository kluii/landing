---
title: 'The board: interaction contract'
description: 'The board is the product.'
sidebar:
  order: 12
generated: true
app_version: '2.0.0'
---
# The board: interaction contract

The board is the product. Everything here exists because the opposite shipped as a bug somewhere.

---

## 1. Drag and drop

Engine: `@atlaskit/pragmatic-drag-and-drop`. No other drag library in the tree.

### 1.1 The commit sequence

1. Pointer down on a card (anywhere on the card, not a handle), move ≥ 8 px → drag starts.
2. The source card becomes a **placeholder**: same footprint, `--surface-2`, 1 px dashed `--border`, no text.
3. A **ghost** follows the pointer: a fixed-width (272 px) copy at `--card`, 1 px `--border-strong`, radius 4, 2 % scale. The source element is never transformed — transforming it produces a stretched duplicate sliding under the pointer.
4. The pointer enters a card's upper half → insertion line above it; lower half → below it; empty column space → append. The **card is the drop target**; the line is only an affordance.
5. On drop, the card is committed **locally at the target index immediately**. No spinner, no reload.
6. The request carries the neighbours: `{column, before, after}` where both are ids of cards that were rendered.
7. The response returns the authoritative `position`; the client reconciles the rank quietly. The order does not jump.
8. One in-flight move per card. A second drag on the same card aborts the pending call and keeps the last intent.
9. A drop never opens the card modal: the click handler checks the dragging flag.

### 1.2 Registration rules

- A card is **both** draggable and droppable, with distinct ids: draggable `card.id`, droppable `card:<id>`. A draggable and a droppable cannot share an id.
- The dragged card is excluded from the hit list in both forms (`active.id` and `card:<active.id>`) — it travels with the pointer and is always the first hit.
- Gap indices are counted over the **rendered** column including the dragged card. Read neighbours as "the card above the gap" and "the card below the gap", so the dragged card is transparent instead of shifting the count. Indexing a list with the dragged card removed makes a downward move inside one column land exactly one slot early.
- The 8 px gaps are `pointer-events: none` visuals. They are never droppables: corner-based collision resolution cannot pick a hair-thin band.

### 1.3 Drop under an active filter

- The client sends the neighbours **it rendered**. The server resolves them against the **stored** column.
- If a neighbour is filtered out or gone, the server treats it as absent: one present neighbour is enough to place; both absent → append.
- Slot ids must name the neighbour ids, not their visual index (`slot:<col>:gap:<before|_>:<after|_>`). An index computed over the filtered render against a server plan computed over the stored column is the exact bug that made filtered drops land on the wrong card.

### 1.4 Failure

- A failed move patches only the touched card back to its last confirmed `{column_id, position}`. It never restores a whole-board snapshot — that discards a teammate's concurrent update that arrived over SSE.
- The toast says the move did not save, with a Retry action. The board stays usable.

### 1.5 Keyboard

- `Space` lifts the focused card, `Arrow` keys move it (left/right = column, up/down = index), `Space` drops, `Esc` cancels and restores the original position.
- A live region announces: "Card Wire the digest, moved to Doing, position 2 of 5." Announce on drop, not on every arrow.
- Focus returns to the card after the drop, not to the column.
- Dragging with the keyboard uses the same `{column, before, after}` request as the pointer.

### 1.6 Touch

- Long-press is not required; the drag starts after 8 px of movement, and the board rail scrolls horizontally with snap.
- The done tick stops propagation on `pointerdown`, otherwise pressing it arms a drag and the click never lands.

---

## 2. Cards

- Create: one modal, title focused, `Cmd/Ctrl+Enter` saves, `Esc` cancels, column preselected from the `+` affordance.
- Read: opening a card shows content first — title, description, tags, assignee, due date, comments, done tick. No inputs. One explicit "Edit" enters the editor.
- Edit: form with Save/Cancel. Unsaved changes prompt on close. `expected_updated_at` is sent; a `409` shows "This card changed while you were editing" with Reload and "Overwrite" (explicit, logged).
- Done: a checkbox-like tick on the card and in the read modal. It renders **only when done** (no empty checkbox on every card). Toggling is optimistic, one request, no reload. On a read-only board it is a static mark.
- Move: drag, or the card menu ("Move to…" with a column list) for keyboard and touch users.
- Delete: in the card menu, then a confirm dialog that names the card. Deletes are in the event log with the title, so an accidental delete is visible in activity.
- Assignment: members by username, plus a free-text display name for v1-imported cards. The UI distinguishes them: a member renders as a username chip, a label as plain muted text.

## 3. Columns

- Title wraps fully. Never clamp, never ellipsis. Max 64 chars by contract; verify `scrollWidth === clientWidth` and the measured height (3 lines ≈ 58 px at `body-sm`).
- Columns size to their content: the container uses `align-items: flex-start`. A sparse column must not stretch to its tallest sibling.
- Add column: a ghost column at the end with a single `+ Add column` button; the input appears inline in the header, `Enter` creates, `Esc` cancels.
- Column menu: Rename, Move left/right, Delete (with a destination for its cards, or a destructive confirm that says how many cards will be deleted).
- No card count in the header. The count is available in the filter panel as `{shown} of {total}`.

## 4. Filters

- One trigger in the header action row, aligned with the other buttons. It opens a labelled panel — never three unlabelled selects.
- Controls: **Assignee** (multi-select of members + labels), **Tags** (multi-select chips), **Text** (matches title and description, case-insensitive).
- Active filters render as removable chips under the header, so a filtered board never looks empty for no reason.
- The panel shows `{shown} of {total} cards`. An empty column under a filter says "No cards match the filters" — not "No cards".
- Filters are view state: in the URL query so a reload keeps them, never persisted server-side, never applied to a mutation.
- Clearing filters is one click, and `Esc` in the panel closes it without clearing.

## 5. Activity

- A projection of events, newest first, grouped by day, cursor paginated.
- Filter by actor kind: human / agent / anonymous label. An agent's actions are visibly attributed ("Hermes, agent key `backlog-bot`").
- Each row links to the card, and to the board state at the time is **not** offered — the event carries the label, not a snapshot.
- 10 000 events must remain usable: no client-side full load, no offset pagination, no `COUNT(*)` on every page.

## 6. Responsive

- ≥ 1024: board fills the viewport, columns in a row, horizontal scroll when they overflow.
- 768–1023: same, narrower gutters, header actions collapse into an overflow menu.
- < 768: horizontal snap rail, sticky column headers, modal becomes a bottom sheet, 40 px targets.
- 390 px is the reference phone: the drag journey must pass there, and no page scrolls horizontally outside the board rail.

## 7. Empty, loading, error

- Loading: ASCII board skeleton (three dim columns) after 200 ms, never before.
- Empty board: "No columns yet" + one action ("Add a column").
- Empty column: one muted line, no illustration.
- Error: inline banner at the top of the board with the real reason and a Retry; the board keeps its last confirmed state.
- Read-only: no edit affordances at all (not disabled ones), plus a role chip in the header.
