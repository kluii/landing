---
title: 'Notifications and the daily digest'
description: 'Two different jobs.'
sidebar:
  order: 14
generated: true
app_version: '2.0.0'
---
# Notifications and the daily digest

Two different jobs. Do not merge them.

- **Notifications** are event-driven and immediate: something happened that concerns you.
- **The digest** is batched and deterministic: here is what changed since yesterday, and what is next.

---

## 1. Notifications

| Trigger | Default | Channel |
|---|---|---|
| You are assigned a card | on | in-app, webhook |
| You are mentioned in a comment | on | in-app, webhook |
| A card you own is due within 24 h | on | in-app |
| A pending card awaits your approval | on (owner/admin) | in-app |
| You are invited to a board | on | in-app |
| A board you own is closed | on | in-app |

- In-app: bell with unread count, polled every 15 s in 2.0 (not the board SSE stream — notifications are account-scoped, board events are board-scoped).
- Webhook: Discord/Slack-compatible JSON (`{"content": "...", "username": "Klui"}` for Discord; `{"text": "..."}` for Slack). One delivery attempt plus two retries with backoff; a permanently failing webhook is disabled after 10 consecutive failures and the owner is told in-app.
- Deduplication: `Notification` has a unique `(user_id, kind, payload->>'event_id')`. The same event never notifies twice, even if the sweeper replays.
- Each type is individually mutable in account settings.
- No email notifications in 2.0 except the digest (and only when SMTP is configured).

## 2. The digest

Built from `events` since that account's **previous send** — not from a 24-hour snapshot diff. The event log already knows what happened; diffing states reconstructs information you can read directly and gets it wrong for deletes.

### 2.1 Sections, in this order

1. **Done** — cards marked done since the last send, with who did it.
2. **In progress** — cards moved into a column whose name matches `/doing|progress|en cours|wip/i`, or edited since the last send.
3. **Overdue** — `due_at` in the past and not done.
4. **Assigned to you** — open cards assigned to the account, not already listed.
5. **Next** — top 3 by earliest due date, then column position.

Rules:

- A card appears in at most one section; the first match wins in the order above.
- The "In progress" heuristic is documented in the UI ("columns named Doing, In progress, WIP"). If no column matches, the section is built from edits only.
- No section has an LLM deciding priority. Priority is due date, then column order, then position.

### 2.2 Empty means nothing is sent

If all five sections are empty, **no message, no email, no webhook, no RSS entry**. "You have nothing today" trains people to unsubscribe. The settings page shows "Last digest: nothing to report" instead.

### 2.3 Scheduling

- Per account: `hour` (0–23) and IANA `timezone`. Default 08:00 in the browser's timezone at opt-in, `UTC` if unknown.
- The sweeper runs every 5 minutes and sends when `local hour == pref.hour` and `last_sent_at` is not today in that timezone.
- A missed window (instance down) sends once on recovery if it is still the same local day; it does not backfill three days.
- Opt-in prompt appears after the account's first board activity. Default **off**.

### 2.4 Channels

**Webhook** (default): the same Discord/Slack-compatible JSON as notifications, with the digest rendered as markdown sections.

**Email** (when SMTP is configured): text + minimal HTML, the HTML built from the same markdown renderer as the app, no tracking pixel, no remote images. SMTP unset → the channel is hidden in the UI with the reason, and the API answers `503 email_not_configured`.

**RSS**: `GET /me/digest/rss/<token>` — per-account, token ≥ 32 chars, `sha256` at rest (with pepper), revocable, `noindex`, `X-Robots-Tag: noindex`, no auth cookie required. Rotating invalidates the old URL immediately. It is a credential and is treated as one.

Unsubscribe: a token in the footer, valid without signing in, one click, sets `enabled: false`. It never deletes the account and never requires a login to honour.

### 2.5 The optional LLM layer

- `KLUI_DIGEST_LLM_URL` + `KLUI_DIGEST_LLM_KEY`. Unset → nothing leaves the instance, the deterministic digest ships.
- Set → the model receives **only the computed payload** (titles, counts, names, dates) and rewrites the prose. It never chooses what matters, never invents a card, never sees descriptions or comments.
- Length-capped (≤ 400 words), 5 s timeout, one retry, and any failure (network, schema, empty response) silently falls back to the deterministic text.
- The setting is instance-wide, off by default, with a one-line explanation in the admin UI: "The digest is generated locally. This optional step only rewrites the summary; the board content is not sent."

### 2.6 Reference output

```
Klui · Retro S2 — Thursday 26 November

Done (3)
- Wire the digest — Hermes
- Fix the drop index — Will
- Export markdown — Hermes

In progress (2)
- Keyboard drag — Will (Doing)
- Moderation queue — unassigned (Doing)

Overdue (1)
- Close-out summary — due 24 Nov

Next
1. Moderation queue — no due date
2. Keyboard drag — 28 Nov
3. Board templates — 2 Dec
```

No emoji, no greeting, no "Good morning". The board name and the date are the header; the sections are the content.

## 3. Data and privacy

- The digest reads only boards the account can already read.
- The payload sent to an optional LLM contains no descriptions, no comments, no emails, no member ids — card titles and display names only. Documented in the admin UI.
- RSS tokens and unsubscribe tokens are credentials: hashed, revocable, `noindex`, never logged.
- `last_sent_at` is the only scheduling state; a failed delivery does not advance it (so a broken webhook retries rather than silently skipping a day), but a permanently failing channel is disabled after 10 failures.

## 4. Acceptance

- Golden test on a fixed event log: the digest body is byte-identical across runs.
- An empty event log sends nothing (assert zero deliveries, not "skipped=true").
- A card done today appears once, in Done, and not again in Next.
- Changing the timezone moves the send hour, not the content.
- With `KLUI_DIGEST_LLM_URL` unset, a test asserts zero outbound calls; with a fake endpoint returning garbage, the deterministic text is delivered.
- Revoking an RSS token makes the URL `404`.
