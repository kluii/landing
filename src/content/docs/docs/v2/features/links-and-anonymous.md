---
title: 'Links, visibility and anonymous participation'
description: 'The wedge of the product, and the part with the most ways to go wrong.'
sidebar:
  order: 17
generated: true
app_version: '2.0.0'
---
# Links, visibility and anonymous participation

The wedge of the product, and the part with the most ways to go wrong. Three separate things must stay separate:

| | What it is | Secret? | Revocable? | Attributed? |
|---|---|---|---|---|
| Readable URL | `/will/retro-s2-k3f9` | No | No (rotating the suffix invalidates it) | No |
| Write link | `/l/<22+ base62>` | Yes | Yes | Label only, plus `last_used_at` |
| Account | Session | Yes | Yes | Yes |

**A readable slug grants reading. Never writing.** Any code that accepts a write authenticated by the readable URL is a defect.

---

## 1. Visibility

| Value | Read by | Indexed | Canonical URL |
|---|---|---|---|
| `private` (default) | members only | no | `/<username>/<slug>` |
| `link` | anyone with the URL | `noindex` | `/<username>/<slug>-<rand4>` |
| `public` | anyone | yes, listed on the owner profile | `/<username>/<slug>` |

- Suffix: 4 chars, lowercase base32 (`abcdefghijklmnopqrstuvwxyz234567` minus look-alikes), generated from a CSPRNG. 1 048 576 combinations per slug; the point is that enumeration is impossible in practice while the URL stays sayable.
- The suffix is regenerable from settings; the old URL answers `404` immediately (not a redirect — a redirect confirms the board exists).
- `private` forces `link_role: none` and `anon_write: off`. The API rejects the combination; the database has a check constraint.
- `public` boards appear on the owner's profile and in the sitemap; `link` boards never do.

## 2. Link roles

`read` (default) | `edit` | `none`, independent of visibility.

- `read`: read board, cards, comments, activity, members list (names only, no emails).
- `edit`: everything read does, plus create / update / move / complete cards. **No delete, no column structure, no export, no import, no member or link management.**
- `none`: members only; the board behaves as private for everyone else.

A link role is stored on the board (`link_role`), and `link_role: edit` means every holder of the readable URL can edit. That is the honest default for a small short project; an owner who wants a revocable write credential creates a **write link** instead and sets `link_role: read`.

## 3. Write links

- `POST /boards/:id/links` → `{id, role, label?, url, token}`. The token is `<22+ base62>`, returned **once**.
- Stored as `sha256(token)` (with `KLUI_TOKEN_PEPPER`), never in clear, never in a log, never in an event payload.
- `/l/<token>` resolves the link, sets a scoped cookie (`klui_link_<boardId>`, `httpOnly`, `SameSite=Lax`, `noindex`), and redirects to the board with a `link` actor active. The token disappears from the URL bar; a later request authenticated by the cookie does not carry it.
- Revoking sets `revoked_at`; the next request answers `404`. `last_used_at` updates at most once a minute (a write per request is a free amplification vector).
- Rotation = create a new link + revoke the old one. There is no "same token, new secret".
- The settings UI shows metadata forever and the token never again: "created 2026-11-26 · last used 3 min ago · revoke".

## 4. Anonymous participation

Requirements: a display name, 2–32 characters, chosen client-side, stored per event and per card as `actor_label`. It is not an account: it grants nothing, is not unique, cannot be reused on another board, and cannot be used to sign in.

- **Session:** a signed cookie `klui_anon` (12 h) containing `{boardId, label, anonId}`. `anonId` is 16 random bytes, stored on the cards the actor creates (`cards.anon_actor_id`). It is the only thing that makes "edit the card I just created" enforceable without an account.
- **Can:** create a card, edit a card they created in the same session, mark their own card done.
- **Cannot:** comment, attach (no attachments in 2.0), delete, move a card to another column, change settings, export, or see anything a link `read` holder cannot see.
- `off`: no write affordance at all. `open`: direct write. `moderated`: writes create `PendingCard` rows, invisible to everyone but owner/admin.
- A name collision between two anons is allowed and expected. Attribution is "someone calling themselves X", and the UI says so on hover.

## 5. Moderation

- The queue lists pending cards with board, column, title, description, author label, age. Owner/admin can approve (→ real card, anon label preserved, `pending.approved` event with the approver) or reject (`pending.rejected`, nothing created).
- 7-day expiry, purged by the sweeper; the author is not notified (they have no account).
- A moderation banner on the board for owner/admin: "3 cards waiting".
- Approving is the only path that creates a card from a pending row; there is no auto-approve after N minutes.

## 6. Abuse

- Per-board anonymous write cap (30/hour default) — the cap, not a captcha, is what makes an open board survivable.
- Per-IP and per-session buckets; a ban blocks the next request.
- Cap captcha is optional, off by default, triggered past a threshold, and explicitly **not** a security control.
- Every anonymous event carries `actor_kind: anon`, so the activity feed can be filtered and a raid is visible in one view.
- The owner can switch `anon_write` to `moderated` or `off` at any time; the change takes effect on the next request (no cache).

## 7. URL and SEO rules

- `link` boards, `/l/*`, RSS, OG images of link boards: `noindex` meta + `X-Robots-Tag: noindex`.
- OG cards are generated server-side from the board's real name and counts; they contain no card titles (a preview must not leak content into a chat unfurl beyond what the board itself shows).
- A bot that fetches `/b/<token>` style URLs must receive a real HTML document with OG tags, because unfurlers do not run JavaScript. That route is served by the server, not the SPA.
- Guessed URLs answer the standard 404 page, with the same timing shape as a real 404.

## 8. Acceptance

- A `link` board with a wrong suffix answers `404`, and so does the old suffix after rotation.
- A link `read` holder sees no edit affordance (not a disabled one) and the API answers `403` for a write.
- A link `edit` holder can move a card and cannot delete it.
- An anon can create a card, mark it done, and edit it in the same session; a second anon cannot edit it.
- An anon cannot comment, delete, or move across columns — the affordances do not exist and the API refuses.
- A moderated write creates no live card and no public event; approval creates it with the label preserved.
- The raw link token appears in exactly one response, ever (grep the database and the logs).
