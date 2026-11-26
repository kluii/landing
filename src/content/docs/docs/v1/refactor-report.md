---
title: '09 — Refactor & hardening report (2026-11-17 → 2026-11-19)'
description: 'Full record of the Phase 0 → Phase 4 pass.'
sidebar:
  order: 50
generated: false
frozen: true
---
# 09 — Refactor & hardening report (2026-11-17 → 2026-11-19)

Full record of the Phase 0 → Phase 4 pass. Baseline: `a0dcc8b` (release 0.6.2),
tagged `refactor-baseline`. Everything was measured on real runs; nothing below is
recalled from the original brief.

## Branches (all pushed to origin, none merged)

Stack order — each branch builds on the previous:

| #   | Branch                      | Commits            | Head      |
| --- | --------------------------- | ------------------ | --------- |
| 1   | `docs/refactor-baseline`    | 1                  | `babcddd` |
| 2   | `style/apply-prettier`      | 2 (cumulative 3)   | `b846479` |
| 3   | `refactor/module-splits`    | 13 (cumulative 16) | `3da05d3` |
| 4   | `docs/phase-3`              | 4 (cumulative 20)  | `3060a1a` |
| 5   | `chore/stability-hardening` | 3 (cumulative 23)  | `60cb060` |
| 6   | `feat/password-reset`       | 3 (cumulative 26)  | `8c4383a` |

`git tag refactor-baseline a0dcc8b` marks the starting point.

## Phase 0 — baseline (measured, not copied from the brief)

| Gate                     | Result            | Numbers                                                                                                              |
| ------------------------ | ----------------- | -------------------------------------------------------------------------------------------------------------------- |
| A `npm run build`        | green             | web vite 1.45s, total wall 5.44s                                                                                     |
| B `npm run lint`         | green             | 0 errors                                                                                                             |
| B `npm run format:check` | **red**           | 207 files with style issues                                                                                          |
| C server                 | green + one flake | 205/27 files; `contract-e2e.test.ts` failed intermittently (root cause found in Phase 2, fixed in Phase 4 territory) |
| C web                    | green             | 166/28 files                                                                                                         |

Size: `server/src` 70 files / 8 359 lines · `web/src` 66 files / 8 015 lines · 12 migrations.
`npm audit`: 23 vulns (2 critical) — breaking upgrades only (zod 4, vitest 5), out of scope per the
no-upgrade rule. Recorded in `docs/08-refactor-baseline.md`.

Environment finding: host → docker-bridge TCP hangs on this machine (Prisma/psql P1001 from the
host while the container answers from its own network). All DB-touching commands ran inside a
`node:22` container attached to `klui_default`.

## Phase 1 — formatting (one commit, nothing else)

- `b846479 style: apply prettier to the repo` — 207 files, whitespace/line-wrapping only
  (`git diff -w` verified no logic moves).
- Caught by the suite: prettier rewrapped the multi-value font tokens in `web/src/index.css` and
  `web/src/pages/landing/landing.css`; `web/test/theme.test.ts` parses that file line-by-line and
  died. Fix inside the same commit: both CSS files restored verbatim and added to `.prettierignore`.
- `format:check` green for the first time at this commit.

## Phase 2 — refactor (13 commits, behaviour-preserving)

| File                                                   | Was       | Now                                                                                                                                                                         |
| ------------------------------------------------------ | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `server/src/services/imports.ts`                       | 983       | `imports/shared.ts` 272 · `imports/klui.ts` 167 · `imports/trello.ts` 591 · `imports/index.ts` 9                                                                            |
| `server/src/mcp/tools.ts`                              | 570       | `mcp/context.ts` 94 · `mcp/tools/{boards 93, cards 237, columns 78, comments 62, owner 87}.ts` · thin tools.ts 23                                                           |
| `server/src/services/cards.ts`                         | 415       | `cards/index.ts` 290 · `cards/positions.ts` 139                                                                                                                             |
| `server/src/services/digest.ts` + `digest-delivery.ts` | 384 + 304 | `digest/{types 71, build 245, collect 80, format 89, deliver 221, index 30}.ts`                                                                                             |
| `web/src/api/client.ts`                                | 424       | `api/http.ts` 88 (transport + ApiError) · `api/sse.ts` 126 (board stream, backoff, Last-Event-ID) · `client.ts` 236 (endpoint object + re-export hub — zero caller changes) |
| `web/src/hooks/live-board.ts`                          | 420       | `live-board/reducer.ts` 135 (pure SSE→state reducer) · `live-board/dnd.ts` 145 (drop planning) · hook 163 (path kept)                                                       |
| `web/src/pages/Account.tsx`                            | 403       | 162 + `components/account/{DigestCard 213, AgentSetupCard 66}.tsx`                                                                                                          |
| `web/src/components/board/CardDisplayModal.tsx`        | 379       | 197 + `CardComments.tsx` 183 + `CardDoneIndicator.tsx` 67                                                                                                                   |
| `web/src/pages/Board.tsx`                              | 704       | 399 + `hooks/useBoardDnd.ts` 151 + `hooks/useCommentHandlers.ts` + `components/board/{AddColumnForm 77, BoardNotices 105, BoardHeader ~100}.tsx` + `lib/purge.ts`           |

Small cleanups (`e3468e3`): stale scaffold/TODO comments in `plugins/auth.ts`, `plugins/bootstrap.ts`,
`routes/contract-stubs.ts` rewritten to describe the code as it is (the referenced task plan no longer
exists; the described TODO work was already implemented). `contract-stubs.ts` mechanism kept and
documented as the contract safety net: registry routes without an implementation answer a shaped 501.

Invariants held: 42 OpenAPI paths, `/healthz` shape, frozen env surface, zero `any`, zero
`@ts-ignore`, 18 MCP tool names unchanged, test counts never decreased.

## Phase 3 — documentation (4 commits on `docs/phase-3`)

- `98d9238` docs/03-api.md synced to live `/openapi.json`: card `move` `before`/`after` neighbours,
  `done` on card create/patch, added missing `POST /admin/users/{id}/password-reset`, added a
  per-section credential-mode bullet list.
- `7e926b6` docs/02: post-refactor module map (ownership table per directory, dependency direction
  `routes → services → lib`), with the one known exception recorded (`setShare` in `routes/share.ts`
  imported by `mcp/tools/owner.ts`).
- `dbc9138` CHANGELOG.md reconstructed from git log (0.1.0 → 0.6.2, Keep-a-Changelog, PR-linked).
- `3060a1a` root **AGENTS.md**: gates, frozen contract, forward-only migrations, frozen config,
  dev port 5433, repo traps, git discipline.

The four "comment the non-obvious" spots were verified to already carry the explanation (rank math in
`lib/rank.ts` + `cards/positions.ts`, merge-by-id in `live-board/reducer.ts`, `noindex` in
`routes/og.ts:227`, draggable+droppable card in `hooks/live-board/dnd.ts` + `CardCard.tsx`).

## Phase 4 — stability (6 commits)

| Item                        | State                                                         | Proof                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| --------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Test isolation              | fixed                                                         | root cause: vitest file forks ran in parallel against the shared dev DB while `lifecycle.test.ts` run future-dated `runSweep`s that archived contract-e2e's live board mid-assertion. `server/vitest.config.ts` already claimed "Sequential" but `maxConcurrency: 1` only serializes tests within a file. Fix `bd806fc`: `poolOptions.forks.singleFork: true`. 5+ consecutive green full runs                                                                            |
| SSE drain on shutdown       | **was a real product bug**                                    | `app.close()` blocked ~90s with any live board stream (hijacked reply never finishes; every deploy would be SIGKILLed after the stop timeout). Test red-first, then fix `d2885e4`: per-app set of open SSE sockets (`app.sseOpenStreams`) ended in a `preClose` hook (onClose fires too late), plus `forceCloseConnections: 'idle'` in app.ts. Test asserts close < 5s and clean client end-of-stream                                                                    |
| Boot-guard coverage         | covered, worked all along                                     | 4 spawn-based tests (`60cb060`) against the real entrypoint: missing/short `KLUI_SESSION_SECRET`, weak `KLUI_SHARE_SECRET` → exit 78 naming the variable; dev unaffected. Side finding: Prisma's generated client embeds `schemaEnvPath: ../../../server/.env` and injects it at import time, so a local dev `server/.env` silently masks the guard in ad-hoc local boots — production images carry no `.env`, so the guard is live there. Documented in the test header |
| CI                          | added                                                         | `.forgejo/workflows/ci.yml` (`a9b1d72`): gates A/B/C on push (main/dev) + PRs, Postgres 17 service container for the server suite                                                                                                                                                                                                                                                                                                                                        |
| Self-service password reset | shipped (new feature, the only contract addition of the pass) | below                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |

### Self-service password reset (`feat/password-reset`, 3 commits)

- API: `POST /api/v1/auth/password-reset/request {email}` — identical 200 whether or not the email is
  registered; **503 `email_unavailable`** when the instance has no SMTP (refuses before touching
  anything). `POST /api/v1/auth/password-reset/confirm {token, password}` — 200 or 400
  `invalid_token` (unknown/expired/used). Single-use, 1-hour expiry; plaintext by email only, SHA-256
  hash at rest.
- **Session invalidation**: success sets `users.password_changed_at`; `verifySession` now reads the
  user row and rejects any JWT issued at/before that instant (`<=`, because JWT iat has second
  granularity — same-second resets still kill the old session). Proven in tests: pre-reset cookie
  401s after confirm; old password 401s, new password 200s; token replay 400s.
- Rate limiting: both routes join the public-auth IP bucket (request keyed by the probed email).
- Contract: `contracts/auth.ts` +2 routes, `routes/implemented.ts` +2, count test 53 → 55; OpenAPI
  42 → 44 paths. Registry and implementation kept in sync per the frozen-contract rule.
- UI: `?reset=<token>` link lands a confirm form on Auth (never bounced by the session check);
  "Forgot password?" under the login tab opens the request form; en+fr i18n; 3 web tests.
- Migration `20261119040000_password_reset` (additive only):

```sql
ALTER TABLE "users" ADD COLUMN "password_changed_at" TIMESTAMP(3);
CREATE TABLE "password_reset_tokens" (
  "id" TEXT PRIMARY KEY, "user_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "token_hash" TEXT NOT NULL UNIQUE, "expires_at" TIMESTAMP(3) NOT NULL,
  "used_at" TIMESTAMP(3), "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX ON "password_reset_tokens"("user_id");
```

## Gate D — production-shape dry run (the one that matters)

Against a copy of the loaded dev DB (deliberately heavy: years of accumulated test fixtures):

- before: `users=4716 boards=2989 cards=133147 events=5344 comments=3069`
- `prisma migrate deploy` replayed `20261119040000_password_reset` on the rewinded copy
- after: **identical counts**; `password_reset_tokens` empty; `password_changed_at` NULL everywhere
- booted the production entrypoint against the copy:
  `GET /healthz` → `{"version":"0.6.2","db":"up"}`; signup works; all 2989 boards still served.

## Final gate state (entire stack, at `8c4383a`)

- A build: green (host) · B lint: green · B format:check: green
- C server: **213 passed / 30 files** (205 → 213; twice consecutively) · C web: **169 / 29** (166 → 169)
- OpenAPI: 44 paths. `any`/`@ts-ignore`: still zero.

## Deliberately not done

1. Per-schema test databases (the full form of test isolation): sequencing already removed the race
   deterministically; schemas would add infra for no observed gain. Revisit only if forks are ever
   re-parallelized.
2. No dependency upgrades (23 audit findings need breaking upgrades: zod 4, vitest 5), no package
   manager change, no React/Fastify/Prisma/Node major moves — per the invariance contract.
3. No version bump: 0.6.2 still in both package.jsons; the release is the maintainer's call (bump
   BOTH when cutting).
4. No PRs opened: branches wait for review; merge bottom-up.
5. `imports/trello.ts` stays 591 lines (one cohesive parser) and `Board.tsx` 399 (pure composition) —
   further splitting was not justified.
6. `server/src/services/imports/trello.ts`-scale reworks elsewhere, the `setShare` route→service move,
   and SSE client-side reconnect UX are documented, not changed.

## Deploy sequence

```bash
# merge bottom-up via PRs: docs/refactor-baseline → style/apply-prettier → refactor/module-splits
#   → docs/phase-3 → chore/stability-hardening → feat/password-reset (into dev, then dev→main)
docker compose build
docker compose up -d            # entrypoint: prisma migrate deploy && node server/dist/server.js
```

Proof of life after deploy:

- `GET /healthz` → `{"version":"<bumped version>","db":"up"}`
- `_prisma_migrations` contains `20261119040000_password_reset`
- `POST /api/v1/auth/password-reset/request` → 503 `email_unavailable` without SMTP, or mail sent with it
- CI runs gates A/B/C on the next push once the workflow file is on a default-branch path.
