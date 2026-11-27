---
title: 'Quickstart'
description: 'One compose file to a working board: clone the repository, set one variable, run docker compose up.'
sidebar:
  order: 1
generated: false
---

# Quickstart

Three commands, one container. Postgres 16 is included in the compose file; nothing
else is required, and nothing sits behind a licence key.

```bash
git clone https://github.com/kluii/app.git klui
cd klui && cp .env.example .env
docker compose up -d
```

Then the board answers on <http://localhost:8080>. Cold start to a working board takes under 5 minutes on a 2 vCPU / 2 GB instance.

## 1. Set the public URL

Open `.env` and set the one variable that is required in production:

```bash
# .env — the absolute https URL the instance is reachable at
KLUI_PUBLIC_URL=https://klui.example.com
```

`KLUI_PORT` defaults to `8080` and is only used on the host side of the port mapping.
The secrets (`KLUI_SESSION_SECRET`, `KLUI_TOKEN_PEPPER`, `KLUI_ENCRYPTION_KEY`) are
generated on first boot into the `secrets` volume if you do not set them; set them
yourself if you prefer to keep them outside the data directory. See
[deployment](/docs/v2/deployment) for the full environment variable reference.

## 2. Start it

```bash
docker compose up -d
```

## 3. Create the first account

First load redirects to `/signup`. The first account created becomes the instance
admin. Registration can be closed afterwards with `KLUI_REGISTRATION_OPEN=false`.

## Stopping and keeping data

`docker compose down` keeps the data volume. `docker compose down -v` deletes it.

## Next

- [Deployment](/docs/v2/deployment) — Caddy and Traefik configs, backup and restore drill, upgrade and rollback
- [MCP reference](/docs/v2/mcp) — the 21 tools, per-board agent keys
- [Permissions](/docs/v2/permissions) — who can read, write, close, export
- [Limits](/docs/v2/limits) — what 2.0 does not do
