---
title: '05 — Deployment'
description: 'Three install paths.'
sidebar:
  order: 50
generated: false
frozen: true
---
# 05 — Deployment

Three install paths. Two containers (app + Postgres), one `DATABASE_URL`, nothing else. (Will: PostgreSQL + Prisma; registry/domain decision deferred)

---

## 1. Docker Compose (recommended)

```yaml
services:
  app:
    image: <registry>/klui:latest # registry TBD at deployment time (Will defers domain/registry choice)
    restart: unless-stopped
    depends_on: [db]
    ports: ['8080:8080']
    environment:
      DATABASE_URL: 'postgres://klui:${DB_PASSWORD:?needed}@db:5432/klui'
      KLUI_BASE_URL: 'https://klui.example.com' # copy-paste blocks, links, MCP config
      KLUI_INSTANCE_NAME: 'Klui'
      KLUI_SIGNUPS: 'open' # open | invited
      KLUI_INVITED: '' # comma usernames when invited
      KLUI_SESSION_DAYS: '30'
      KLUI_SESSION_SECRET: '${KLUI_SESSION_SECRET:?needed}' # 16+ chars required in production (fail-closed)
      KLUI_SHARE_SECRET: '${KLUI_SHARE_SECRET:-}' # optional: empty = derived from the session secret
      # GitHub OAuth (optional — button appears only when set):
      # KLUI_GITHUB_CLIENT_ID: ""
      # KLUI_GITHUB_CLIENT_SECRET: ""
  db:
    image: postgres:17-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: klui
      POSTGRES_PASSWORD: ${DB_PASSWORD:?needed}
      POSTGRES_DB: klui
    volumes: ['pgdata:/var/lib/postgresql/data']
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U klui']
volumes:
  pgdata:
```

App runs `prisma migrate deploy` at boot. That is the **entire** compose file (one secret: `DB_PASSWORD`).

## 2. Docker Run (one-liner) — not recommended for v1

Postgres as a sidecar makes a pure `docker run` path awkward; the one-liner is kept for completeness via the embedded-Postgres-free route: it boots the **app** only and expects an existing `DATABASE_URL`. (Hermes, veto-able: docs steer to Compose; `docker run` users get it from the same install script)

## 3. curl|bash (wraps Compose)

```bash
curl -fsSL https://klui.dev/install.sh | bash
```

(URL is a **placeholder** — hosting decision deferred to deployment time; fallback: raw script from the repo.)

Script behavior: check docker → write compose file + generated `.env` (`DB_PASSWORD` via `openssl rand`) → `docker compose up -d` → wait `/healthz` → print URL + "first user = instance admin" hint. Flags: `--port`, `--url`, `--update` (recreate keeping `pgdata`). (Hermes, veto-able)

## 4. Environment (app)

| Var                                                   | Default                | Meaning                                                                                                                   |
| ----------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                                        | **required**           | Postgres connection string                                                                                                |
| `KLUI_BASE_URL`                                       | auto-detect host       | share links, copy blocks, MCP config                                                                                      |
| `KLUI_INSTANCE_NAME`                                  | Klui                   | landing & tab label                                                                                                       |
| `KLUI_PORT`                                           | 8080                   | app container port                                                                                                        |
| `KLUI_SIGNUPS`                                        | open                   | open / invited                                                                                                            |
| `KLUI_INVITED`                                        | —                      | username allowlist (invited mode)                                                                                         |
| `KLUI_SESSION_DAYS`                                   | 30                     | session cookie lifetime                                                                                                   |
| `KLUI_SESSION_SECRET`                                 | **required in prod**   | HS256 signing material for sessions AND share-link derivation; the server refuses to boot without 16+ chars in production |
| `KLUI_SHARE_SECRET`                                   | empty = session secret | separate HMAC for derived share tokens; an empty/whitespace value counts as UNSET (never as a weak secret)                |
| `KLUI_GITHUB_CLIENT_ID` / `KLUI_GITHUB_CLIENT_SECRET` | —                      | GitHub OAuth ON/OFF (button shown only when set)                                                                          |
| `KLUI_SMTP_HOST` / `PORT` / `USER` / `PASS` / `FROM`  | —                      | daily-digest email; ALL five required (fail-closed). Absent = email off, webhook-only digest still works                  |

**Secret rotation:** restart with a regenerated `KLUI_SESSION_SECRET` kills all
sessions and invalidates every share URL derived from it — hand out new links
from board settings (the per-board "regenerate" button re-derives + re-hashes a
link atomically). `KLUI_SHARE_SECRET` rotates the share material only. Existing
board URLs stay valid ONLY while their derivation material is unchanged.

## 5. Healthcheck & logs

- `GET /healthz` → 200 `{version, db: "up"}` when the DB answers; **503 `{db: "down"}` otherwise** so image HEALTHCHECK / install probes fail closed instead of reporting healthy storage (round-3).
- Logs: human one-liners on stdout; no log files in container.

## 6. Backup & restore

- Backup: `docker compose exec db pg_dump -U klui klui | gzip > klui-$(date +%F).sql.gz` (one-line recipe documented; cron at the user's infra).
- Restore: stop app, `gunzip -c <dump> | docker compose exec -T db psql -U klui -d klui`, start app, `prisma migrate deploy` runs at boot.
- Product-level backup = the exports (md/json) — that's the point of the lifecycle.

## 7. Reverse proxy & TLS

- Doc shows Caddy 6-liner + nginx block; Pangolin note for Will's own instance (`klui.wyligr.fr`). (Will's infra)
- Proxy must allow streaming (SSE) — explicit note per snippet (`proxy_buffering off;` / Caddy: nothing needed).
- `X-Forwarded-Proto` respected for absolute URL generation fallback.

## 8. Upgrades

- `pull image → recreate app` (Postgres stays). Prisma migrations forward-only at boot, backup reminder printed. Downgrade unsupported after a schema migration (documented honestly).

## 9. First-boot walkthrough (acceptance)

`docker compose up -d` → open port → landing → sign up (first account = instance admin) → create board → board URL live. Target: **< 5 minutes including reading**.
