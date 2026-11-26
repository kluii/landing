---
title: '06 — Roadmap & guardrails'
description: '1.'
sidebar:
  order: 50
generated: false
frozen: true
---
# 06 — Roadmap & guardrails

## v1 — the whole of MVP (acceptance = this list, verbatim testable)

1. Sign up/sign in (username, email, password; GitHub OAuth env-gated) — first account = instance admin; Boards home (_My boards_ + _Connected boards_).
2. Create board (name, members, Archive after incl. Never/Custom) → board live ≤ 5s.
3. Share link: copy, toggle RO/RW, regenerate. Restore re-picks `Archive after` (absolute-UTC `archive_at` stored). First-open display-name prompt (RW links). Logged-in link-opens auto-create a connection.
4. Board: 4-field cards, drag & drop moves, columns CRUD, member chips, tag chips w/ derived colors, client-side filters (assignee/tag), Quick fill paste-to-cards.
5. Accounts & access: one API key per account (reveal-once, regenerate); connection auto-created at link-open for logged users; Board settings — members (creator-managed, the only valid assignees), connections table (change level / revoke), share mode toggle.
6. API: full 03 surface incl. `/state`, `client_ref` idempotency, OpenAPI + `/docs` w/ hints.
7. MCP: per-account endpoint + 9 participant tools (board param) + 3 owner-gated (round-3/4: delete_board removed; = 12) + resources/prompts per 04; account panel prints config JSON + agent prompt. **Board-scoped REST keys (`klub_`)** round-4 for safer agent reach.
8. Realtime: SSE updates + optimistic UI + **presence list** (username / display name / Anonymous n); no typing indicator.
9. Lifecycle sweeper: auto-archive → read-only + banner + countdown chip → purge at +30d; restore & Delete now.
10. Exports: md + json, any participant.
11. i18n EN/FR; dark-first **monochrome** shadcn/ui; **snap DnD** (dnd-kit, keyboard-accessible); footer `Made with <3 by Wyliam` on every page; mobile single-column swipe.
12. Install: compose (app + Postgres 17) + curl script; docker run = documented secondary; healthz; pg_dump backup recipe.
13. Zero telemetry; MIT license; repo on Will's Forgejo (+ mirrored public read-only on GitHub, Will's account — his call). (Will)

**Definition of "the board filled in seconds":** creator logs in on a fresh board, pastes the agent onboarding prompt into their chat agent connected to its MCP, and asks "fill the board from this plan" — cards exist before the stopwatch hits 15s, without touching a single REST curl manually. (Hermes, veto-able)

## v1.1 — fast follow (all optional, judged against the anti-gaz rule)

- Board templates preset: _Dev sprint_ (adds a To Do / In Progress / Done + review tag hint) — only if people ask; the default 3 columns stay default. (Hermes, veto-able: skip the feature entirely if v1 testers never ask)
- CSV export; share QR code on the share panel (meetup-friendly, cheap).
- Read-only archived-board link for participants keeps working (it already does — verify claim, cheap).
- Activity strip (last 20 events, from the existing events table) — one component, no config.

## v1.2 — candidates

- **Comments on cards — shipped in w14.** Lightweight single text stream per card, no threads/mentions, agent-writable via REST (`/cards/{id}/comments`) and MCP (`add_comment`, `list_comments`), 100/card cap. (Hermes, veto-able)
- Webhooks (single URL per board, event push) — for agent frameworks without MCP.
- Purge reminders chip → optional creator email IF a relay is configured (env, absent = feature absent).

## v2 — only with evidence

- Horizontal scale (Postgres already in).
- 2FA for creators.

## ⛔ The junkyard (permanently rejected — contributors must be pointed here)

Due dates, checklists, attachments, integrations marketplace, automations/Zapier builder, theme engine, per-card cover images/emoji, timeline/Gantt/calendar, badges/reputation, notifications bus, presence cursors, mobile native apps, SSO, multi-tenant billing, "AI assistant built-in" (Klui ships capabilities; your agent supplies the intelligence), workspaces/org hierarchy.

**Rule for future contributors & Will's future self:** every feature must pass three checks or it lands in the junkyard:

1. _Disposable:_ does it still make sense on a board that dies in 2 weeks / zero setup retained?
2. _Agent-first:_ can an agent do/trigger it via a named tool or plain endpoint with one header?
3. _No extra step:_ does it add a screen, tab, or required decision between "open link" and "editing board"?

## Repository & workflow (Will's conventions)

- Repo: **`https://git.wyligr.fr/WyliGr/klui.git`** (created by Will); PRs only into `dev`, `dev`→`main` by PR; branches `feat/… fix/… docs/…` matching task names; commits: `feat: | fix: | doc: | wip: | refactor:`.
- Docs-first drop: committed on `docs/klui-design` as `doc: klui design docs` → PR.
- Image registry + install-script URL: decided at deployment time (Will defers domain/registry choice).
- Public mirror policy: Will's call at publish time (GitHub under Will's account).

## Round 1 review (2026-10-20, Will) — shipped in one pass

- Cards: multiple tags (board palette, creator-editable colors) + optional deadline dates.
- Board: Quick Fill hidden behind a button (modal), NO intra-column reorder (drops always append to the end — the "last card stays last" rule), presence indicator removed (broken; deletion decided), agent-connect CTA demoted from big inline hyperlink to a header ghost button.
- Landing: real app screenshots instead of hand-drawn fragments, stat row redesigned, expiring-boards demoted from the headline argument, Auth page reworked.
- Admin: GET /api/v1/admin/users shipped (closes the fixture gap of W7).
- Design system: Dovetail tokens across landing + app (docs/01 §7 updated accordingly).

## Round 3-4 (2026-10-20, Astra audit Gate-1 + Wave 1) — shipped and deployed

Trust & integrity fixes (audit P0): fail-closed secrets (empty share secret counts as unset; prod refuse-to-boot), truthful payloads (`share_url`/`archive_at`/`member_count` on boards; creator-only `share_url`/`share_mode` on state), admin password-reset route real, `/healthz` 503 on db-down, admin/boards UI consume the real values, participant auto-connect sends the share bearer and surfaces errors, anonymous column ops carry the token (index-based reorder + rollback), SSE reconnect/backoff + `Last-Event-ID` + honest stale/access-lost states + `snapshot.required`, `delete_board` REMOVED from MCP (permanent deletion is UI-only — Will's ruling), landing MCP count corrected to 12.

Wave 1 (P1): **board-scoped agent keys** (`klub_…`, one-board reach, ro|rw, TTL, revocation, cap 20, REST-only; MCP stays account-key), **card comments** (REST + MCP `add_comment`/`list_comments` + exports + UI + SSE events, 100/card), **board filters** (assignee/tag/text over loaded server state, no invented endpoints), **honest purge countdown** (archived_at + 30 d), **versioned Klui import** (round-trip semantic equality) and **Trello JSON import** (2-step preview→confirm, itemized loss reports, no silent drops, no auto-purge on imports), agent-keys + import UI in settings/boards.

Current capability truth table: `docs/07-capabilities.md` (decision → shipped → verified → limits). The v1 acceptance list above is the release target; the presence item (8) stands superseded by the round-1 removal, and MCP item (7) now reads **12 tools** (delete_board removed by round-3 ruling).

## Wave 2 (2026-10-20) — P2 server half

- **MCP parity:** `create_board` (any account key, classic|review template), `bulk_create_cards` (≤100 rich items, same service as REST quick fill), `rename_column`, `delete_column` (last-column guard). Surface = 18 tools; owner-gated stays `archive_board` / `restore_board` / `set_share_mode`, `delete_board` still absent.
- **Conflict-safe updates:** optional `expected_updated_at` on `PATCH /cards/{id}` and MCP `update_card`; mismatch → 409 conflict + re-fetch hint. Absent keeps last-write-wins.
- **Board templates:** `POST /boards {template: "classic"|"review"}`; review seeds To Do / In Progress / Review / Done + the `review` tag. No other presets.
- **Outbound webhook:** exactly one per board (`PUT/GET/DELETE /boards/{id}/webhook`, creator-only, public https only). SSE bus dispatches persisted events asynchronously with a 5 s timeout + one retry on network/5xx; `last_status`/`last_delivery_at` expose failures. No delivery queue or filters.

## Wave 3 (2026-10-23) — daily digest server half

- **Event attribution:** every persisted board event records the credential actor — `actor_kind` (`human` | `agent`), `actor_label` (username, `board-key:<last4>`, `account-key:<last4>`, `anonymous`) and `actor_user_id` when an account exists. Legacy/system rows stay NULL. SSE payloads are unchanged; attribution is DB-side only.
- **Daily digest (per account, opt-in, OFF by default):** `GET/PATCH /me/digest` + `POST /me/digest/test`. Deterministic builder (no LLM): `agents_did` / `humans_did` grouped by actor + `your_priority` (overdue → today → tomorrow → recently assigned), scoped to owned + connected boards and the window `last_digest_at ?? now-24h`. The hourly sweeper runs the pass; matching server-local hour only, single-flight, failures never crash the sweep.
- **Delivery:** Discord-compatible webhook (`{type:"digest.daily", user_id, date, digest}`, `X-Klui-Event-Id`, 5 s timeout, one retry) and/or SMTP email (all five `KLUI_SMTP_*` vars required — fail-closed). Empty digest = nothing delivered. No public unsubscribe endpoint; opt-out lives in settings.
