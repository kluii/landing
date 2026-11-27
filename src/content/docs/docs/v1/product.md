---
title: '01 — Product & UX'
description: 'Everything a designer or front-end builder needs to build Klui''s interface without asking further product questions.'
sidebar:
  order: 50
generated: false
frozen: true
---
# 01 — Product & UX

Everything a designer or front-end builder needs to build Klui's interface without asking further product questions.

---

## 1. Actors

| Actor                     | Has                                                         | Can                                                                                                                                                              |
| ------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Account holder**        | Klui account (username + email + password, or GitHub OAuth) | Anonymous participation PLUS one account API key → REST/MCP access to **every board connected to their account**; Boards home; account panel with key management |
| **Creator**               | An account owning boards                                    | Account powers on their boards + lifecycle controls: share link & mode, Board settings (members, archive, connections, delete), restore, exports for all         |
| **Anonymous participant** | The share link, nothing else                                | Read always; write (cards, moves, columns) iff link mode is `rw`. **No API/MCP access**                                                                          |
| **Instance admin**        | The FIRST registered account                                | User list, password reset — board content stays untouchable to them                                                                                              |

Casual members keep working anonymously via the link. **An account exists to (a) own boards, (b) plug an agent**: one account = one API key = all connected boards — **no per-board API keys**. (Will)

## 2. Board lifecycle

```
ACTIVE ──(archive date reached)──► ARCHIVED ──(+30 days)──► PURGED
   ▲                                   │
   └──────────── (restore) ◄───────────┘        (creator "Delete now" in Board settings)
```

- **Archive after** at creation: `10 / 20 / 30 days / Never / Custom` (Custom = date-picker). (Will)
- **ARCHIVED = read-only.** Banner + purge countdown on board and Boards pages; exports still available to anyone with the link. (Hermes, veto-able)
- Archive dates stored as **absolute UTC instants** (`archive_at`): presets compute `now + Nd` at set time; Custom = chosen date at 23:59:59 UTC.
- **Restore** (grace) → ACTIVE; the creator re-picks `Archive after` via the same control, pre-filled with the original. (Hermes, veto-able)
- **Purge** silently hard-deletes board + columns + cards + members + connections + events. No trash bin, no second grace. Anti-goal: lingering.
- **Delete now** (creator) purges immediately after a native confirm.
- Countdown chip while ACTIVE: _"Archives in 4 days"_. (Hermes, veto-able)

## 3. Board creation

Creator only (account required). The **only** form of the product:

| Field         | Required | Notes                                                                 |
| ------------- | -------- | --------------------------------------------------------------------- |
| Project name  | ✅       | Free text, becomes board title + slug                                 |
| Group members | ✅       | Names (chips or comma-separated) — the **only** valid assignees (4.2) |
| Archive after | ✅       | `10 / 20 / 30 days / Never / Custom`                                  |

Default columns: `To Do`, `In Progress`, `Done` — renamable, deletable, custom columns by `rw` participants (drag-ordered).
Board URL: `/b/<share_token>` — one link, mode `ro`/`rw`, changed live by the creator.

## 4. Feature spec

### 4.1 Columns

- Create / rename / delete / reorder (RW). Delete-with-cards needs a native confirm stating how many cards die.
- Names unique per board (UI block + API conflict with `hint`) — by-name addressing must stay unambiguous for agents.

### 4.2 Cards — exactly four fields (Will)

1. `title` — required. **The card is readable without opening it.**
2. `description` — optional, plain multiline text, no rich editor.
3. `assignee` — optional, **strict picker over the board's member names** (creator's list; no free text). (Will)
4. `tags` — optional, **multiple tags per card** (type-ahead over the board's tag list; new names created on first use). Each tag belongs to the board; its chip color is **editable by the creator** (color picker in board settings / tag chip long-press). Tags are board-scoped: same name = same color across the board. (Round-1 review)
5. `due at` — optional **deadline**: a plain calendar date, shown as a small mono chip (highlighted when due within 48 h, styled over when overdue). (Round-1 review)

Card body: title, tag chips (one per tag, in its board color), assignee chip (initials), deadline chip when set, description collapsed when present. No badge zoo.

### 4.3 Card interactions

- Inline composer per column, light edit modal, **drag & drop between columns** with snap-to-slot feel (§7), delete (confirm), assign, tags, deadline.
- **Drop semantics (Will, round-1): NO intra-column reorder.** A drop in any column — including the card's own — always appends the card to the **end** of that column. The last card stays last; to requeue something you pass it through another ("transition") column. dnd-kit sorting within a column is disabled; handlers stay simple (no position math on the client).
- **Quick fill:** hidden behind a board-level **button that opens a modal** — one non-empty line = one card into the chosen column. Same behavior, less chrome on the board.
- No bulk edits. No checklists, no recurring tasks, no attachments. **Due dates and multiple tags shipped in round 1; lightweight card comments shipped in w14.**

### 4.4 Members (the assignee list)

- **Creator-managed**: filled at board creation, edited thereafter in **Board settings**. (Will)
- RW participants assign cards among existing names; they cannot add/remove names.
- Renaming a member doesn't retro-edit cards. Removing a member still referenced on cards keeps the string (orphaned label acceptable — confirm states it).

### 4.5 Share & permissions

- **One share link per board**, mode set live by the creator: `Read Only` / `Read & Write`. (Will)
- Creator can **regenerate** the link (old link dies).
- First open on an RW link: anonymous visitors **join instantly** — no prompts, no names asked. (Round-1: display-name prompt removed with the presence list.)
- Logged-in users opening a board link are **connected to the board** automatically (4.7).

### 4.6 Exports

- `GET /export.md` / `GET /export.json` — any participant (RO included) while the board is visible.
- Markdown: `# Project` → `## Column` → `- **tag1, tag2** Title — @[member] — due 2026-11-02` with description indented. Tags and due dates included since round-1.
- Export links surfaced prominently at archive time. (Hermes, veto-able: generated on demand)

### 4.7 Accounts, key & connections (the agent story) (Will)

- Account = **username + email + password**, or **GitHub OAuth** (env-gated, 05 §4). Email stored (unique), **not verified in v1**, no email ever sent.
- **One API key per account** — shown once, regenerable (old key dies instantly), self-served from the account panel. It grants REST + MCP access to **every board connected to the account** — no per-board keys. (Will)
- **Connection** = account ↔ board row, created when a logged-in user opens a board link. Level captured from the link mode at join time. The **creator can change any connection's level (ro/rw) or revoke it** in Board settings — a revoked connection drops the user back to plain anonymous link access. (Hermes, veto-able)
- Level resolution per board, server-side: **owner → creator powers**; otherwise the **connection level**. One credential, no PAT concept.
- Anonymous participants have **no API/MCP access** — the board header shows them the "log in / sign up to connect your agent" CTA. (Will)

### 4.8 Realtime

- All changes propagate live via SSE (02 §4). Optimistic UI, reconcile on echo. **No typing indicator.**
- **Presence indicator removed** (Will, round-1: broken, not worth fixing): no viewer chips, no display names, no Anonymous counters anywhere in the UI. SSE stays for board state only.

## 5. Screens (all of them)

1. **Landing** — logo, tagline, _Sign in_ / _Create board_. Instance name from `KLUI_INSTANCE_NAME`.
2. **Sign up / Sign in** — username + email + password; **"Sign in with GitHub"** when OAuth is configured; first registered account = instance admin. `KLUI_SIGNUPS=open|invited` gate.
3. **Boards (account home)** — _My boards_ (owned: name, status chip, member count, copy link, Delete now) and _Connected boards_ (name + my level chip ro/rw). New board button.
4. **Account panel** — profile fields, **API key** section (reveal-once rules, regenerate + confirm), and the **agent onboarding block**: account-wide MCP config JSON + copy-paste prompt (§6) + 3-curl quickstart. Centerpiece — designed copy blocks, not code dumps.
5. **Board** — the product: header (project name, **link-mode chip for link viewers — "Read-only link" / "You can edit" —**, archive countdown, Share entry for creator) and a **Connect an agent entry for anonymous viewers — a ghost button in the header, not an inline hyperlink in the copy** (round-1); secondary actions (exports, settings) fold into a **More** menu below `md`; columns + cards, add-column stub.
6. **Board settings (creator)** — one panel: link (URL+copy, mode toggle, regenerate), members editor, archive date (Never boards: changeable), **connections table** (username, level, joined at; change level; revoke), Delete now, Restore (archived).
7. **Instance admin (first account only)** — users list, password reset. Instance config stays in env.
8. **404/expired link** — friendly empty state: _This board doesn't exist (or got purged — Klui makes boards disposable)._

No participant settings page. No notification center.

## 6. The copy-paste agent prompt (account-wide, in account panel)

```text
You are connected to my Klui instance at {{BASE_URL}}.
Use the Klui MCP server (HTTP streamable, URL: {{BASE_URL}}/mcp, header
"Authorization: Bearer {{KEY}}") for all board operations.

Call list_boards first; every tool takes the target board as its first
argument.

Rules:
- Read a board (get_board) before acting on it.
- Cards have: short self-explanatory title, optional description,
  optional assignee (strictly one of that board's member names),
  one or more tags, optional deadline date.
- Keep columns meaningful (To Do / In Progress / Done) unless told otherwise.
- Confirm every change with one short line.
```

Plus the MCP config JSON (04 §2) and the quickstart:

```bash
curl -s -X POST {{BASE_URL}}/api/v1/boards/$ID/cards \
  -H "Authorization: Bearer {{KEY}}" -H "Content-Type: application/json" \
  -d '{"title":"Set up repo","column":"To Do"}'
```

## 7. Style guide (Will: dark, monochrome, shadcn/ui, snap DnD)

- **Dark-first** (dark default; light toggle via shadcn theme tokens, low priority). **shadcn/ui** over Tailwind for buttons, dialogs, tooltips, popovers, selects — no second component library.
- **Monochrome base (round-1: Dovetail system):** carbon canvas `#0a0a0a`, graphite cards `#141414`, iron elevations `#1e1e1e`, borders `#313131`/`#454545`, text bone `#ffffff` / secondary `#a7a7a7`, disabled `#7c7c7c`. Depth = luminance stepping, no drop shadows. **Colors:** tag chips (creator-edited) + one functional indigo accent `#6798ff` (focus rings, links, stat marks) + data-viz series inside real charts. Nothing else.
- **Snap drag & drop with real feel** (dnd-kit): PointerSensor activation ~8px (clicks stay clicks); dragged card becomes a drag-overlay ghost at 1.02 scale + shadow; drop targets highlight as **slots** (2px inset outline); settle animation ~150ms transform-only spring; reorder 120ms; `prefers-reduced-motion` respected; keyboard DnD (Space lift, arrows, S drop). 60fps target on a 200-card board.
- Sober & functional: system font stack, 4px grid, 1px borders, no decorative shadows beyond the drag ghost. First paint < 1s on LAN, no layout shift.
- Countdowns and empty states get real design attention. Fonts: Inter (UI) + JetBrains Mono (metadata stamps), self-hosted.
- **Landing (round-1): shows REAL app visuals** — actual captures of the running product (board, dashboard figures), not hand-drawn look-alike fragments. Sales argument order: **one-link collaboration and agent-friendliness first; the disposable/expiring-board concept is a supporting detail, not the headline.**
- Footer on **every** page: `Made with <3 by Wyliam` → https://wyliam.dev — **mandatory in every project** (Will's standing rule).
- i18n: EN + FR, English copy as source of truth.
- Mobile (<768px): horizontally swipeable single-column board; drag = long-press from handle; card modal full-screen.

## 8. Explicitly missing (recap, so nobody "helpfully" adds)

No checklists, no recurring tasks, no attachments, no email verification/notifications, no avatar uploads, no reactions, no theme engine, no per-board API keys. **Shipped since v0.1.0 (round 1): multiple tags with editable colors, card deadlines, quick-fill modal, no intra-column reorder, presence removed. Shipped in w14: lightweight card comments (human + agent).**
