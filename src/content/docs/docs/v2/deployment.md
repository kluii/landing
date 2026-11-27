---
title: 'Deployment'
description: 'One image, one compose file, docker compose up -d.'
sidebar:
  order: 2
generated: true
app_version: '2.0.0'
---
# Deployment

One image, one compose file, `docker compose up -d`. Nothing else is required, and nothing behind a licence key.

---

## 1. Quickstart

```bash
git clone https://github.com/<owner>/klui.git
cd klui
cp .env.example .env
# generate the three secrets (or let the container generate them on first boot in a writable volume)
docker compose up -d
# → http://localhost:8080
```

First load redirects to `/signup`. The first account created becomes the instance admin.

`docker compose down` keeps the data volume. `docker compose down -v` deletes it — the command is not documented in the quickstart on purpose.

## 2. compose.yaml (shape, not final content)

```yaml
services:
  app:
    image: ghcr.io/<owner>/klui:2.0.0
    restart: unless-stopped
    depends_on:
      db: { condition: service_healthy }
    ports: ["${KLUI_PORT:-8080}:8080"]
    environment:
      KLUI_ENV: production
      DATABASE_URL: postgres://klui:${POSTGRES_PASSWORD}@db:5432/klui
      KLUI_PUBLIC_URL: ${KLUI_PUBLIC_URL}
      KLUI_SECRETS_DIR: /data/secrets
      KLUI_TRUSTED_PROXY_HOPS: ${KLUI_TRUSTED_PROXY_HOPS:-0}
    volumes:
      - klui_secrets:/data/secrets
    healthcheck:
      test: ["CMD", "node", "-e", "fetch('http://127.0.0.1:8080/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
      interval: 15s
      timeout: 3s
      retries: 5
      start_period: 30s

  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: klui
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: klui
    volumes:
      - klui_pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U klui -d klui"]
      interval: 10s
      timeout: 3s
      retries: 5

volumes:
  klui_pgdata:   # NEVER rename: a new name silently initialises an empty database
  klui_secrets:
```

Two non-negotiables in this file:

- **Healthchecks use `127.0.0.1`, never `localhost`.** A container that resolves `localhost` to `::1` on an IPv4-only server is marked unhealthy forever while serving perfectly.
- **The volume is named `klui_pgdata`.** Renaming it initialises a fresh database on the next `up`, and the operator reports "all my boards are gone".

## 3. Environment variables

Names are a contract: compose files, docs and the site depend on them.

| Variable | Default | Notes |
|---|---|---|
| `KLUI_ENV` | `production` in the image | `production` enables HSTS, secure cookies, and fail-closed secrets |
| `KLUI_PORT` | `8080` | Inside the container; publish with `KLUI_PORT` on the host side |
| `KLUI_PUBLIC_URL` | — | Required in production; absolute https URL used for links, OG, OIDC redirects |
| `DATABASE_URL` | — | `postgres://user:pass@host:5432/db` |
| `KLUI_SESSION_SECRET` | generated | ≥ 32 bytes; rotating logs everyone out |
| `KLUI_TOKEN_PEPPER` | generated | Extra pepper for hashed tokens |
| `KLUI_ENCRYPTION_KEY` | generated | 32 bytes base64; encrypts TOTP and OIDC secrets |
| `KLUI_SECRETS_DIR` | `/data/secrets` | Where generated secrets are written (0600) |
| `KLUI_TRUSTED_PROXY_HOPS` | `0` | Number of proxies in front; `1` for Caddy/Traefik on the same host |
| `KLUI_REGISTRATION_OPEN` | `true` | Admin can override at runtime in settings |
| `KLUI_TOTP_POLICY` | `available` | `available` / `required` / `disabled` |
| `KLUI_SMTP_HOST` / `_PORT` / `_USER` / `_PASS` / `_FROM` | unset | Unset → email features fail closed with `503` |
| `KLUI_ANALYTICS_URL` | unset | Unset → no script tag, no outbound request (asserted by test) |
| `KLUI_METRICS_ENABLED` | `false` | When true, bind to loopback or require a token |
| `KLUI_METRICS_TOKEN` | unset | Bearer token for `/metrics` |
| `KLUI_CAPTCHA_ENABLED` | `false` | Cap, self-hosted |
| `KLUI_CAPTCHA_URL` | unset | Cap instance URL |
| `KLUI_OIDC_DISCORD_CLIENT_ID` / `_SECRET` | unset | Provider flags default off |
| `KLUI_OIDC_GITHUB_CLIENT_ID` / `_SECRET` | unset | |
| `KLUI_OIDC_GENERIC_{NAME}_ISSUER` / `_CLIENT_ID` / `_SECRET` | unset | `{NAME}` uppercased, e.g. `KLUI_OIDC_GENERIC_AUTHENTIK_ISSUER` |
| `KLUI_DIGEST_LLM_URL` / `_KEY` | unset | Unset → deterministic digest only, nothing leaves the instance |
| `KLUI_RETENTION_EVENTS_DAYS` | `365` | Event retention |
| `KLUI_OPENAPI` | `false` in production | Serve `GET /api/v1/openapi.json` |
| `KLUI_DEMO_RESET` | `false` | Nightly demo-board reset (hosted demo only) |

`server/src/env.ts` validates all of them at boot and prints **one** message listing every problem: variable, expected shape, one example. A missing secret in production is fatal, never silently generated.

## 4. Reverse proxy

**Caddy**

```
app.example.com {
  encode zstd gzip
  reverse_proxy 127.0.0.1:8080 {
    header_up X-Forwarded-For {remote_host}
  }
  header {
    Strict-Transport-Security "max-age=31536000; includeSubDomains"
  }
}
```

**Traefik**

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.klui.rule=Host(`app.example.com`)"
  - "traefik.http.routers.klui.tls.certresolver=le"
  - "traefik.http.services.klui.loadbalancer.server.port=8080"
```

Set `KLUI_TRUSTED_PROXY_HOPS=1` behind exactly one proxy. Behind Cloudflare plus a proxy, it is 2. If `X-Forwarded-For` shows the proxy's IP in the logs, the hop count is wrong; if it shows the client's real IP but the count is 0, every request shares one rate-limit bucket.

**SSE through a proxy:** disable response buffering for `/api/v1/stream` (Caddy does this for `text/event-stream`; nginx needs `proxy_buffering off;`). A buffered stream looks like "the board only updates on reload".

## 5. Backup and restore

Backup:

```bash
docker compose exec -T db pg_dump -U klui -d klui --format=custom > klui-$(date +%F).dump
```

Keep the secrets volume too: a database restored without `KLUI_ENCRYPTION_KEY` cannot decrypt TOTP secrets, and every 2FA user is locked out.

Restore drill (run it, do not just read it):

```bash
docker compose down
docker volume rm klui_klui_pgdata          # full prefixed name, from `docker volume ls`
docker compose up -d db
cat klui-2026-11-26.dump | docker compose exec -T db pg_restore -U klui -d klui --clean --if-exists
docker compose up -d app
curl -s http://localhost:8080/healthz
```

Then sign in with a real account and open a real board. **A backup nobody restored is a hope.** The restore drill is part of the release checklist, and the result is recorded in the release notes with the date and the row counts.

## 6. Upgrade

```bash
docker compose pull
docker compose up -d
```

- The entrypoint runs `prisma migrate deploy` before the server starts. Migrations are append-only and replay cleanly on a database with data.
- Per-release note: which migrations run, whether they are additive, and the rollback path.
- **Rollback:** set the image tag back and `up -d`. Additive migrations are safe to leave in place (old code ignores new columns). A destructive migration is not allowed in a minor release; a major one documents the restore path from the pre-upgrade dump.
- **Deploy proof:** before the upgrade, record row counts for `users`, `boards`, `cards`, `columns`, `comments`, `events`. After: identical counts, every row in `_prisma_migrations` finished, secret files' mtimes unchanged. A regenerated secret logs everyone out and reads as "accounts are broken".

## 7. Health and observability

- `GET /healthz` → `{"status":"ok","version":"2.0.0","db":"up"}`. `503` with `db:"down"` when the database is unreachable. No auth, no detail beyond that.
- The version comes from `package.json`. A version bump is the only honest deploy proof; a container that still reports the old version did not deploy.
- `/metrics` is off by default. When enabled, expose it on loopback and scrape it from the host, or protect it with `KLUI_METRICS_TOKEN`.
- Logs are JSON, one line per request, with the request id. No bodies, no tokens, no emails. `docker compose logs -f app | jq` is the intended workflow.

## 8. Resource sizing

| Load | CPU | RAM | Disk |
|---|---|---|---|
| Personal / small team (< 20 boards, < 5 000 cards) | 1 vCPU | 512 MB | 1 GB + data |
| Team instance (100 boards, 50 000 cards, 10 agents) | 2 vCPU | 1 GB | 5 GB + data |
| Demo / public board with anonymous writes | 2 vCPU | 1 GB | 5 GB + data |

Postgres is the memory consumer; give it 1 GB and a `shared_buffers` of 256 MB for anything beyond a personal instance. The app itself is comfortable in 256 MB.

## 9. Hosted instance (same image)

The cloud instance runs the same image and the same compose file with different env: `KLUI_ANALYTICS_URL`, `KLUI_METRICS_ENABLED`, `KLUI_DEMO_RESET=true` for the landing demo board, backups on a timer, and a reverse proxy with a real certificate. It sells capacity and service. It enables no feature that a self-hosted instance cannot enable.

## 10. Troubleshooting

| Symptom | Likely cause | Check |
|---|---|---|
| Container `unhealthy` but the app answers | Healthcheck using `localhost` (IPv6) or wrong port | `docker inspect --format '{{json .State.Health}}'` |
| Blank page, no console error | Static asset list snapshotted at boot after a rebuild | Restart the app container; confirm the bundle hash in the served HTML |
| "Accounts are broken", everyone signed out | Session secret regenerated (secrets volume missing or not writable) | Compare `KLUI_SECRETS_DIR` mtime with the last deploy |
| All boards gone after `up` | Volume renamed | `docker volume ls` — the old `klui_pgdata` still exists |
| `503` on password reset | SMTP not configured (by design) | Set `KLUI_SMTP_*` or use the admin reset path |
| Board does not update until reload | SSE buffered by a proxy | `proxy_buffering off` for `/api/v1/stream` |
| Rate limits ban everyone | `KLUI_TRUSTED_PROXY_HOPS` wrong | Compare the logged client IP with the real one |
| Migrations fail at boot | Database user lacks DDL rights | `GRANT CREATE ON SCHEMA public` or use the owner role |
| 2FA users locked out after restore | Encryption key not restored | Restore the secrets volume, then retry |

## 11. Release checklist

1. Version bumped in `server/package.json` and `web/package.json`.
2. CHANGELOG entry with migrations, env changes and rollback notes.
3. Full gate green, recorded in `docs/verify/k5.md`.
4. Image published for `linux/amd64` and `linux/arm64`, tagged `2.0.0` and `latest`.
5. Pre-upgrade dump taken and its restore tested on a scratch database.
6. Row counts recorded before, compared after.
7. `/healthz` reports the new version.
8. One real user journey walked in the browser against the deployed instance.
