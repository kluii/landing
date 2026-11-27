---
title: '08 — Refactor baseline (measured 2026-11-17)'
description: 'All numbers below come from a real run on this checkout, not copied from the brief.'
sidebar:
  order: 50
generated: false
frozen: true
---
# 08 — Refactor baseline (measured 2026-11-17)

All numbers below come from a real run on this checkout, not copied from the brief.
Baseline commit: `a0dcc8b` (release 0.6.2), tagged `refactor-baseline`.

## Environment used for the baseline

| Item             | Value                                                            |
| ---------------- | ---------------------------------------------------------------- |
| Host OS          | Arch Linux (Omarchy), Docker 29.9.2                              |
| Host Node / npm  | v26.13.1 / 11.20.0 (mise `latest`; engines ask `>=22`)           |
| Dev DB           | `postgres:17-alpine` via `docker-compose.dev.yml`, port 5433     |
| Test runner Node | `node:22` container on network `klui_default`, repo bind-mounted |

**Host networking trap (measured, not in the brief):** from the host, TCP connects
to `127.0.0.1:5433` and to the container IP succeed, but Postgres never answers —
the docker bridge forwarding path is blocked on this machine (`iptables`/`nft`
inspection needs sudo; not touched). psql, Prisma and `prisma migrate deploy` all
fail from the host with P1001 / timeouts. Workaround used for every DB-touching
command: run it in a `node:22` container attached to `klui_default` with
`DATABASE_URL=postgres://klui:<pw>@db:5432/klui` and
`PRISMA_QUERY_ENGINE_LIBRARY` pointing at the mounted `libquery_engine-debian-openssl-3.0.x.so.node`
(`node:22-slim` fails engine download detection; the full `node:22` image works).

## Gate results on the clean checkout

| Gate           | Command                  | Result              | Numbers                                                                                                                                                              |
| -------------- | ------------------------ | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A types+build  | `npm run build`          | green               | web vite build 1.45 s, total wall 5.44 s                                                                                                                             |
| B lint         | `npm run lint`           | green               | 0 errors                                                                                                                                                             |
| B format       | `npm run format:check`   | **red**             | 207 files with style issues (expected — Phase 1)                                                                                                                     |
| C server tests | `npm run test -w server` | green, with a flake | 205 passed / 27 files on re-run; one earlier full run failed 5 tests in `contract-e2e.test.ts` that pass in isolation → cross-test interference on the shared dev DB |
| C web tests    | `npm run test -w web`    | green               | 166 passed / 28 files, 5.29 s                                                                                                                                        |

## Code size

| Area                       | Files           | Lines |
| -------------------------- | --------------- | ----- |
| `server/src` (*.ts)        | 70              | 8 359 |
| `web/src` (*.ts + *.tsx)   | 66              | 8 015 |
| `server/test` (*.test.ts)  | 27              | —     |
| `web/test` (*.test.ts[x])  | 28              | —     |
| `server/prisma/migrations` | 12 forward-only | —     |

Matches the brief's figures exactly.

## Dependency health (npm audit at baseline)

23 vulnerabilities: 2 critical, 8 high, 13 moderate. Notable: `zod <4.6.6`
(high, memory exhaustion on oversized constrained collections) and `tinypool`
(prototype pollution gadget, via vitest). Fixes require **breaking** upgrades
(zod 4, vitest 5) — out of scope for this refactor pass per §2.8. Recorded, not fixed.

## Known flake to fix in Phase 4 (item 2, test isolation)

Full-suite run 1: `contract-e2e.test.ts` failed 5 assertions (markdown export
missing card lines) — suite passes when the file runs alone, and the next full
run passed 205/205. Root cause candidates: shared dev DB mutated by
`lifecycle.test.ts` purges or ordering between forked files. This is the exact
symptom Phase 4 item 2 exists to remove.
