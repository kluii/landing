---
title: '00 — Klui Overview'
description: 'Klui — Stop spending time managing your tasks, complete them.'
sidebar:
  order: 50
generated: false
frozen: true
---
# 00 — Klui Overview

> **Klui** — Stop spending time managing your tasks, complete them.
> A disposable, agent-first, self-hostable kanban. Create a board, share the link, get it filled by agents, use it for the project, and it disappears behind you.

Provenance tags used across all docs:

- **(Will)** — decision made by Will during brainstorming. Do not change silently.
- **(Hermes, veto-able)** — my call, reasonable default, open to veto.
- **(Builder)** — left to the implementer's discretion, non-shaping.

---

## 1. Why

Three concrete failures drive this project:

1. **Trello pricing walls.** The free tier breaks as soon as you juggle several projects with different people.
2. **Trello is a machine à gaz.** Loud, slow, and full of features nobody uses — power-ups, templates, per-card ceremony. The noise is why boards go unread during a project.
3. **Trello is agent-hostile.** AI only via Claude/ChatGPT connectors, no clean simple API, endless steps to find an API token, incomplete documentation.

Kan.bn — tried as alternative — still failed on: anonymous visitors can read but **cannot write** (no RW share links), not agent-friendly, and self-hosting works but can be better. (Will)

**Where this comes from (reality check):** Epitech projects last 2 weeks to a month. A board is created, hangs on everyone's account, is too heavy/unappealing to keep anyone engaged, and afterwards it lingers — dozens of dead boards, and even deleting them makes Trello feel slow. (Will)

So boards live like the project they serve: **short-lived, disposable, dead on a known date**.

## 2. Positioning — one-line pitch

Klui is the kanban you throw away: one person with an account creates the board, everyone joins with a plain share link (read-only or read & write); anyone who wants an agent holds an account whose **single key/MCP reaches every board they're connected to**; and when the project is over the board archives itself and gets purged without anyone lifting a finger.

## 3. What success looks like

- A board exists from "idea" in **under 60 seconds**, and is filled with tasks **in seconds** through MCP/API (or hand-typed).
- Teammates open a link and are productive in **5 seconds** — no signup, no onboarding, no tour.
- During the 2-week sprint, members actually keep the board current (move To Do → Done, assign themselves), notably **via their agents**.
- After the project: archive date arrives, a Markdown/JSON export is one click away, then the board is silently purged. **The instance never accumulates debt.**
- Installing Klui on a homelab takes **one command and less than a minute** of attention. (Will)

## 4. Goals

1. **Disposable by design** — board lifecycle is a first-class feature: `Archive after` chosen at creation, self-serve archive, 30-day grace, automatic purge.
2. **Agent-first** — an account carries one API key and one MCP endpoint covering **every board connected to it** (plus REST with auto-generated OpenAPI and a copy-paste onboarding prompt). Connecting an agent: < 2 minutes and ≤ 3 steps (signup incl. GitHub OAuth → key). (Will: per-account API/MCP, not per-board)
3. **Zero-friction participation** — no accounts for members; write access is granted via the share link level, at the discretion of the creator.
4. **Light, in every axis** — tiny image, small memory, instant UI, sober feature set. A card has **exactly four fields** (Will).
5. **Self-hostable by anyone** — compose (app + Postgres) and curl-script install paths, one Postgres sidecar, nothing else.

## 5. Non-goals (explicitly not in v1)

- Email notifications, push notifications (email is account _data_, stored but never sent to — no SMTP; participant accounts & GitHub OAuth are **in scope** per Will's review — 01 §4.7).
- Checklists and attachments (card due dates, multiple tags and lightweight comments shipped in rounds 1/w14).
- Granular per-member permissions beyond what the share link grants.
- Orgs / teams / workspaces / multi-board dashboards for members.
- Calendar, timeline or Gantt views, reports, analytics.
- Offline mode / CRDT conflict-free sync.
- Marketplace of any kind, theming engine, automation builder.
- Metrics/telemetry of any kind — self-host stays quiet.

## 6. Anti-goals (failure even if it technically works)

- **Feels like Trello:** any screen standing between landing and a usable board; configuration ceremony before first use.
- **Agent friction:** an agent needs more than 3 steps, more than 2 minutes, or undocumented quirks to create a card.
- **Lingering boards:** anything a dead board can do to avoid its own purge without explicit restore is a design violation.
- **Install friction:** demanding anything beyond Docker + one port + one volume.
- **Weight:** heavy frontend framework ceremony, animation zoo, layout shift, slow first paint.
- **Secret sprawl:** anything requiring the server to send or store secrets in ways discoverable outside the owner's board context.

## 7. Constraints

- Targets small self-hosted instances (one homelab VM, a few teams in stride) — not a SaaS. Concurrency is small; correctness and speed at low scale matter, infinite scale does not. (Hermes, veto-able)
- Storage: **PostgreSQL 17 + Prisma** (Will's call, replacing an earlier SQLite draft). Processes: app container + Postgres container (compose).
- UI languages: English + French from day one (i18n scaffolding). (Hermes, veto-able)
- License: **MIT** default. (Hermes, veto-able)
- Git conventions: Forgejo for the project repo, conventional commits (`feat|fix|doc|wip|refactor`), PRs required to merge into dev→main. (Will)

## 8. Glossary

| Term             | Meaning                                                                                                        |
| ---------------- | -------------------------------------------------------------------------------------------------------------- |
| **Board**        | One project. The unit of Klui. Born from a form, dies on a date.                                               |
| **Creator**      | The account holder who owns the board.                                                                         |
| **Member**       | A name in the board's member list. No account, no email. Can be assigned to cards.                             |
| **Participant**  | Anyone using the board via the share link (humans, anonymously; agents arrive through accounts).               |
| **Share link**   | One link per board, permission level set by the creator: `ro` or `rw`.                                         |
| **Account key**  | The single API credential of an account (`klui_...`) — grants REST/MCP on every board connected to the account |
| **Connection**   | Account ↔ board link created when a logged-in user opens a share link; carries the captured level              |
| **Archive**      | Board becomes read-only; grace period starts (30 days).                                                        |
| **Purge**        | Hard, irreversible delete after the grace period.                                                              |
| **MCP endpoint** | One Model Context Protocol server (streamable HTTP) per account — tools address boards by name/id              |

## 9. What the other docs cover

- `01-product.md` — lifecycle, permissions, screen-by-screen UX, style guide, agent onboarding prompt.
- `02-architecture.md` — stack, components, data model, realtime, security.
- `03-api.md` — REST surface, auth, examples.
- `04-mcp.md` — MCP tools/resources/prompts, client config.
- `05-deployment.md` — compose / run / curl-script, env, backups, proxy notes.
- `06-roadmap.md` — v1 acceptance, later phases, the feature-junkyard rules.
