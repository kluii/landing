---
title: 'Locked decisions'
description: 'Every decision below is closed.'
sidebar:
  order: 81
generated: true
app_version: '2.0.0'
---
# Locked decisions

Every decision below is **closed**. Reopening one requires an ADR with the alternative, its cost, and a human ruling — not a code change and not a comment in a PR.

The register exists because this codebase will be read by agents that have no memory of the conversations that produced it. A decision that lives only in a chat log will be "cleaned up" by the third agent that touches the file.

Status legend: **locked** (decided, implement as written) · **open** (needs a human input before the wave that depends on it).

---

## Product and scope

| ID | Decision | Why | ADR |
|---|---|---|---|
| D-01 | The application repository contains no landing page, no docs site, no blog, no marketing route. `/` redirects to `/boards` or `/login`. | The site is a separate static build; a marketing route inside the SPA means the app ships claims it cannot keep and doubles the bundle. | ADR-0006 |
| D-02 | Licence is AGPL-3.0-only, DCO sign-off on every commit, no CLA. | Self-hosting is the promise; a CLA would let a future owner relicense. | ADR-0001 |
| D-03 | No feature is gated by a licence key, in any instance, ever: boards, cards, comments, agents/MCP, exports, SSO, 2FA, branding, API access. | The hosted tier sells capacity and service. A feature flag that only works in the cloud build would make the open-source promise false. | ADR-0001 |
| D-04 | The hosted tier sells capacity and service only. No paragraph of pricing exists in the repository. | Keeping pricing out of the code prevents the copy from drifting into the product. | — |
| D-05 | `klui.export/v2` is the canonical format; `klui.export/v1` and Trello JSON are import-only. | People are running v1. "We rewrote it" is not a reason to lose their work. | ADR-0007 |

## Identity and access

| ID | Decision | Why | ADR |
|---|---|---|---|
| D-06 | **An instance admin has no access to board content.** `is_instance_admin` grants user management, bans, instance settings and provider configuration — nothing else. | An ops role that can read every private board is a backdoor with a friendly name, and it makes the 404 promise a lie. | ADR-0002 |
| D-07 | **`viewer` is read-only, including comments.** Comments require `editor` or above. | A comment is a write; a read-only role that writes is not read-only. | ADR-0002 |
| D-08 | **Comments require a user actor.** Link holders and anonymous actors cannot comment. | Comments need attribution and an account to notify. Anonymous comments are the fastest route to an unusable board. | ADR-0002 |
| D-09 | **Link actors (`role: edit`) cannot delete.** They can create, edit, move and complete cards. No deletes of cards, columns or anything else. | A revocable token that can destroy work makes every shared link a risk the owner cannot audit. | ADR-0002 |
| D-10 | **Anonymous actors** may create a card, edit a card they created in the same session, and mark it done. Nothing else. | The wedge is participation, not administration. | ADR-0003 |
| D-11 | **An anonymous session is a signed cookie (12 h) carrying `anon_actor_id`.** Cards and events store that id (hashed in the cookie payload, opaque in the DB). | "Edit a card you just created" needs an identity that survives a reload without creating an account. A per-request random id cannot enforce it; an IP cannot be trusted. | ADR-0003 |
| D-12 | **The board's readable URL never grants write.** Writes by link use `/l/<token>`; the token is ≥ 22 base62 chars, stored as `sha256`, revocable, regenerable. | Three separate things: the address you can say out loud, the secret you can revoke, the account you can attribute to. | ADR-0003 |
| D-13 | **Username and slug renames reserve the old value for 90 days** and answer `301` to the new one. | A shared link that silently points at a stranger's board is worse than a redirect. | ADR-0004 |
| D-14 | **OIDC never auto-links by email.** An existing local account signs in locally and links explicitly. | Email collision is a security decision, not a UX one. | ADR-0008 |
| D-15 | **A break-glass local admin with a password always exists**, even when SSO is enforced. | One bad provider configuration must not lock an instance out of itself. | ADR-0008 |
| D-16 | **Sessions: 30 days absolute, rotated on privilege change** (password change, TOTP enable/disable, role change), revoked on password reset. | Long enough to be usable, short enough that a stolen cookie is not eternal, and a privilege change invalidates what was issued before it. | ADR-0009 |
| D-17 | **Passwords: argon2id, min 12 chars, breached-password check at signup, no user enumeration anywhere.** | Non-negotiable baseline; enumerated login is an account-harvesting API. | ADR-0009 |

## Board semantics

| ID | Decision | Why | ADR |
|---|---|---|---|
| D-18 | **`done` belongs to the card, never to the column.** A done card stays where it lives. | The column says where the work lives; the flag says it is finished. Moving it to "Done" invents a column the user did not create. | ADR-0010 |
| D-19 | **`position` is a fractional rank (Decimal), step 1024.** A move is "between these two neighbours"; renumber only when the gap is exhausted. | Index positions desync under concurrent edits and produce the "it always lands at the end" class of bug. | ADR-0010 |
| D-20 | **The move API takes `{column, before, after}` and never an index.** Missing neighbours mean append. | The client cannot know the stored order under a filter or a concurrent edit. | ADR-0010 |
| D-21 | **Tags carry a colour** (v1 behaviour, restored). The colour is stored per card-tag (`CardTag.color`) and can be changed from the card's tag editor; a board-level default (`BoardTagColor`) keeps the same tag consistent across cards. Precedence: card override → board default → neutral chip. Any hex is accepted; the chip tint is capped (18 % dark / 12 % light) and the label stays `--ink`, so contrast is safe for every hue (measured worst case 8.9:1 dark, 13.9:1 light). | Owners name their own colours (a client's brand, a priority), and v1 exports carry `tag_colors`; refusing colour would make the v1 import lose a visible property. A capped tint is how an arbitrary hue stays readable in both themes without a per-tag contrast audit. | ADR-0011 |
| D-22 | **Closing a board is irreversible in 2.0.** The dialog says so; the export is the escape hatch. | A reopen endpoint doubles the close-out state machine to serve a case nobody has asked for. Revisit with evidence. | ADR-0012 |
| D-23 | **Every mutation writes exactly one `Event`, through one helper.** | Activity, digest and close-out must agree; three sources of "what happened" will not. | ADR-0013 |
| D-24 | **Events are retained 365 days by default** (`KLUI_RETENTION_EVENTS_DAYS`), purged by the daily sweeper. | The close-out summary and the digest need history; unbounded growth is not free. | ADR-0013 |
| D-25 | **`pending_cards` expire after 7 days** and are purged by the sweeper. | An unmoderated queue that grows forever is a leak, not a feature. | ADR-0003 |

| D-53 | **No board expiry and no archive.** Boards are never auto-archived, auto-closed or auto-purged on a timer. A board ends when its owner closes it (irreversible, D-22) or deletes it. The lifecycle sweeper keeps only the pending-card, digest, retention and session jobs. | A scheduled death makes people avoid the product for the projects that matter, and it silently destroys work when nobody logs in. "Short project" is a way of working, not a timer. v1's `archive_after_days` / `archive_at` / `archived_at` are gone; the v1 importer ignores them and says so in the job result. | ADR-0012 |

## API and realtime

| ID | Decision | Why | ADR |
|---|---|---|---|
| D-26 | **Unreadable = `404`.** The body for "exists but you cannot read it" is identical to "does not exist". | `403` is an existence oracle. | ADR-0002 |
| D-27 | **Error envelope is always `{"error":{"code","message","hint"}}`.** `hint` may be null, never absent. | One shape for REST, MCP (with parameter detail) and the client. | ADR-0014 |
| D-28 | **Every writable resource accepts `expected_updated_at`**, mismatch answers `409` with the current row. | Silent last-write-wins loses a teammate's paragraph with no trace. | ADR-0014 |
| D-29 | **SSE is the only push channel.** One stream per session, `Last-Event-ID` replay from a 5-minute ring buffer, heartbeat every 25 s. | WebSockets buy nothing here; SSE survives proxies and reconnects with `EventSource`. | ADR-0015 |
| D-30 | **The client merges by server id on every path**, including the mutation's own response. | Echo-before-response is real and produces duplicated cards that look like a server bug. | ADR-0015 |
| D-31 | **OpenAPI 3.1 is generated from the Zod schemas**, and the web client is generated from that document. | A hand-written client is a second contract waiting to drift. | ADR-0014 |

## Agents and MCP

| ID | Decision | Why | ADR |
|---|---|---|---|
| D-32 | **21 MCP tools**, named and argument-named exactly as in `docs/mcp.md`. Renaming is a breaking change with a deprecation window. | Agent clients cache tool schemas; a renamed argument silently breaks every configured client. | ADR-0016 |
| D-33 | **Agent keys are `kb_` + 32 base62, stored `sha256`, shown once, scoped to one board or to the user's own boards, with an expiry (default 90 days).** | A key is a credential, not an identifier. | ADR-0016 |
| D-34 | **A board-scoped key can never exceed its scope, even when its owner is an instance admin.** | Scope is a hard boundary; privilege must not leak through the owner. | ADR-0016 |
| D-35 | **Every MCP tool has a REST equivalent and vice versa.** The parity table is a test. | Two surfaces that drift mean an agent can do something a human's UI cannot, or the reverse. | ADR-0016 |
| D-36 | **MCP writes are rate-limited per key**, `429` with `Retry-After`; agents batch with `bulk_create_cards`. | A loop of `create_card` is the default failure mode of every agent integration. | ADR-0016 |

## Notifications and digest

| ID | Decision | Why | ADR |
|---|---|---|---|
| D-37 | **The digest is deterministic and rule-based. The LLM layer only rewrites an already-computed payload, and is off by default.** | "Private when self-hosted" must be true with no configuration; an LLM that decides what matters is a different product with a different trust model. | ADR-0005 |
| D-38 | **An empty digest sends nothing.** | "You have nothing" is noise that trains people to unsubscribe. | ADR-0005 |
| D-39 | **Digest hour default 08:00 in the account's IANA timezone** (browser timezone at opt-in, `UTC` if unknown). Opt-in default `off`. | A daily mail at 03:00 local is a bug report. | ADR-0005 |
| D-40 | **RSS tokens are credentials**: per-account, revocable, hashed at rest, `noindex`. | A feed URL in a reader is a long-lived credential in a third-party app. | ADR-0005 |

## Operations

| ID | Decision | Why | ADR |
|---|---|---|---|
| D-41 | **Secrets are generated at first boot into `KLUI_SECRETS_DIR` (0600) or read from env; production fails closed if a required secret is missing.** Never rotate silently. | A regenerated session secret logs everyone out and reads as "accounts are broken". | ADR-0017 |
| D-42 | **`/healthz` reports the version from `package.json`.** | A version bump is the only honest deploy proof. | ADR-0017 |
| D-43 | **The compose volume is named `klui_pgdata` and is never renamed.** | Renaming it silently initialises an empty database on the next deploy. | ADR-0017 |
| D-44 | **`/metrics` is off by default**, then loopback-bound or bearer-protected. | A self-hoster's metrics endpoint on the public internet is an information leak, not a feature. | ADR-0017 |
| D-45 | **Analytics inject nothing when `KLUI_ANALYTICS_URL` is unset**, asserted by test. | "No request leaves the box" must be verifiable, not promised. | ADR-0017 |
| D-46 | **Captcha (Cap) is a bot filter, off by default, triggered only past an anonymous-write threshold.** It replaces none of the rate limits. | Calling a captcha a security control is how boards end up with no rate limits. | ADR-0018 |
| D-47 | **Trusted proxy hops are explicit** (`KLUI_TRUSTED_PROXY_HOPS`, default 0). `X-Forwarded-For` is parsed only from configured hops. | A wrong trust model either bans everyone or bans nobody. | ADR-0018 |

## Engineering

| ID | Decision | Why | ADR |
|---|---|---|---|
| D-48 | **TanStack DB is imported only from `web/src/data/`.** | Pre-1.0 dependency on the product's core: the upgrade must be a one-directory change. | ADR-0019 |
| D-49 | **`@tanstack/react-hotkeys` is imported only from `web/src/lib/hotkeys.ts`.** | Beta dependency, one wrapper, one place to swap it. | ADR-0019 |
| D-50 | **No SSR in the app.** Open Graph images are rendered server-side as SVG from a template (no headless browser). | The server owns REST, MCP, SSE and OG; a server-function framework damages exactly those surfaces. | ADR-0006 |
| D-51 | **`fileParallelism: false` in the server test suite** until every file has its own schema. | A shared Postgres produces random false reds and teaches everyone to ignore CI. | ADR-0020 |
| D-52 | **Tests run against the built server on its own port, never the dev server.** | Cross-origin cookies make every browser test fail for the wrong reason. | ADR-0020 |

---

## Open decisions (need a human before the dependent wave)

| ID | Question | Blocks | Default if unanswered |
|---|---|---|---|
| O-01 | A real `klui.export/v1` file to use as a fixture. The Appendix A shape is a description, not a sample. | K2-11 | Import per Appendix A, mark the importer "unverified against a real file" in the release notes. |
| O-02 | Hosting region and legal operator for the hosted instance. | K5 legal templates (site repo) | Not in this repository; no action. |
| O-03 | SMTP transport for the pilot instance. | K5-05 email channel | Email channel disabled; webhook and RSS ship. |
| O-04 | Which OIDC providers are enabled on the pilot. | K5-09 | Discord and GitHub scaffolded, generic provider documented, all flags off. |
| O-05 | Digest default hour for the pilot (08:00 assumed). | K5-05 | 08:00 account timezone. |
