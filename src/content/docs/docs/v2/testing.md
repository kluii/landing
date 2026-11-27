---
title: 'Testing'
description: 'Only external behaviour is tested.'
sidebar:
  order: 80
generated: true
app_version: '2.0.0'
---
# Testing

Only external behaviour is tested. Nothing asserts a private function's shape, a component's internals, or that a mock was called. If a test cannot fail for a reason a user would notice, it is not worth its runtime.

---

## 1. Seams

| Seam | What it proves | Where |
|---|---|---|
| **Authz matrix** | `can()` is exhaustive over visibility × link role × anon policy × role × actor kind, including every deny cell | `server/test/authz-matrix.test.ts` |
| **REST contract** | Golden request/response per endpoint, error shapes, 404-not-403 equality, `409` with `current` | `server/test/contract/*.test.ts` |
| **MCP parity** | Driven through a real MCP SDK client; same capability as REST; argument names stable | `server/test/mcp/*.test.ts` |
| **Ranks and moves** | No duplicate/out-of-order position under randomized orders; append on missing neighbours | `server/test/cards/move.test.ts` |
| **Events** | Every mutation writes exactly one event with the documented payload | `server/test/events.test.ts` |
| **Export round trip** | export → import → export byte-identical modulo timestamps; v1 fixture imports | `server/test/export/*.test.ts` |
| **Digest rules** | Golden output on a fixed event log; empty digest sends nothing | `server/test/digest/*.test.ts` |
| **Browser journeys** | signup → board → invite → drag middle of a column → reload → order persists; anonymous write; moderation approve; agent test connection | `e2e/*.spec.ts` |
| **A11y** | axe on every route, keyboard-only board and dialogs, reduced motion | `e2e/a11y.spec.ts` |
| **Contrast** | Per token, against the surface it actually renders on, in both themes | `web/test/contrast.test.ts` |
| **Boot gate** | Boot against a database containing data, run migrations, require identical row counts | `server/test/boot-gate.test.ts` |

## 2. Database isolation

- Each test file gets its own **schema** (`klui_test_<random>`) created in `globalSetup` and dropped in `globalTeardown`, or its own database. Not a shared one.
- Until that exists, `fileParallelism: false` in `server/vitest.config.ts`. Note that `maxConcurrency` and `pool: "forks"` limit tests *within* a file and do nothing about two files hitting one Postgres — which is how a suite "fails one run in three, passes alone".
- **Never seed demo data into the database the suite runs on.** The lifecycle sweeper computes a future `now` and purges seeded boards mid-run; the failure then looks like a routing bug.
- The e2e suite uses a separate database from the dev server, dropped and recreated per run.

## 3. Browser tests

- Run against the **built** server on its own port (`KLUI_E2E_BASE_URL=http://localhost:8123`), never the Vite dev server. Cross-origin cookies make every test fail for the wrong reason.
- `networkidle` never fires on a board: the SSE stream stays open. Wait for `domcontentloaded` plus a selector, or `expect(locator).toBeVisible()`.
- One browser context per spec file; sign-in is a helper, not a UI walk, except in the two specs that test sign-in itself.
- Screenshots on failure, traces on first retry. No screenshots in the assertions — measure the DOM.

## 4. The drag probe (the one that catches the real bug)

```
1. Seed a board with one column holding five cards (A B C D E).
2. Grab card E by its title with pointer events (mouse.down, stepped moves, mouse.up).
3. Drop it between B and C — the MIDDLE of the column, not above the first card.
4. Assert the DOM order is A B E C D.
5. Reload.
6. Assert the order is still A B E C D.
7. Assert GET /boards/:id/state returns the same order by position.
```

Rules that make this probe honest:

- Aim at the middle. A probe that drops above the first card cannot distinguish insert from append — that false pass is how the bug ships.
- Drag within the same column **and** across columns; a downward same-column move is the case where an off-by-one appears.
- Use Playwright's mouse, not CDP `Input.dispatchMouseEvent` (it times out under drag libraries).
- Assert the order after a reload, not just after the drop: an optimistic UI that never reached the server looks perfect until refresh.
- Run it three consecutive times in CI before a release. A single green run on a flaky interaction is not evidence.

## 5. Keyboard and accessibility

- Keyboard drag: `Space` lift, `ArrowRight` to the next column, `ArrowDown` twice, `Space` drop, reload, order persists. Some drag libraries attach keyboard listeners one tick late — allow ~350 ms between presses in the test; a human is slower than that anyway.
- axe runs on every route in both themes; zero violations, not "zero serious".
- A keyboard-only journey must reach every control: tab through the board, open a card, edit it, save, close, and get focus back on the card.
- Reduced motion: set `prefers-reduced-motion: reduce` and assert the spinner is a static frame with `aria-busy`.

## 6. Contrast

- The test **parses `tokens.css`**; it does not duplicate the values. Duplicated values are how a palette change passes the gate and ships wrong.
- Text tokens (`--ink`, `--ink-muted`, `--ink-subtle`, `--danger`, `--primary-foreground`) are measured against **every** surface they can sit on: `--canvas`, `--column`, `--card`, `--surface`, `--surface-2`, `--surface-muted`. Measuring only against the canvas is how a token passes at 4.7:1 and ships at 3.99:1 in the place it is used.
- `--control-border` is measured against `--canvas` and `--surface-2` at ≥ 3:1 (a boundary the user must perceive).
- Borders are measured against the surface they **separate** (a card border is the seam between card and column), not against their own fill. That comparison is decorative and has a lower bar (≥ 1.2).
- Both themes are measured. A test that only reads `:root` silently ships a broken light theme.

## 7. Contract and parity

- Golden files live next to the test, in `__golden__/`, and are updated deliberately (`UPDATE_GOLDEN=1`), never automatically in CI.
- The 404 equality test compares: status, body bytes, and the absence of headers that would vary (`X-Board-Id`, `ETag`, `Last-Modified`).
- MCP parity is driven through the real SDK client with a real key, over HTTP, against the built server. A hand-rolled JSON body tests your assumptions, not the protocol.
- The parity table is generated from `docs/mcp.md` at test time or asserted against it, so a tool added to the doc and not the server fails.

## 8. Boot gate

```
1. Load a database dump (or a seeded fixture) with rows in every table.
2. Record counts for users, boards, cards, comments, events, columns, sessions.
3. Boot the container / run the entrypoint (`prisma migrate deploy && node dist/server.js`).
4. Require: exit code 0, all migrations finished, counts identical, secret files' mtimes unchanged.
```

This is the only test that proves a deploy will not destroy data. It runs in CI with a dump that is committed as a fixture (anonymised), and again manually before any release that touches `schema.prisma`.

## 9. Performance

- A load test (`server/test/perf/`) seeds 20 columns / 500 cards and asserts the budgets in `docs/architecture.md` §9 with a 20 % tolerance, marked slow and excluded from the default run.
- The activity query is `EXPLAIN`-checked: it must use `events(board_id, created_at desc, id)`, not a sequential scan.

## 10. What not to test

- Private functions, internal module structure, "was this helper called".
- Snapshot tests of whole components (a snapshot that nobody reads fails on every style change and proves nothing).
- Mocked behaviour of a third-party library we do not control.
- Anything a type already guarantees (a shape test that duplicates a Zod schema).

## 11. False greens (the list to keep on the wall)

1. **A green gate that never ran.** A workflow that exists but has no run is not CI. Paste the log line.
2. **A piped exit code.** `cmd | tail && echo ALLGREEN` reports the tail's status. Use `set -o pipefail` or chain on the raw command.
3. **A helper that always reports failure** (`[ cond ] && say OK || say FAIL` fires FAIL when `say OK` itself returns 1). Use `if/else`, and make every helper end with `return 0`.
4. **A drag probe aimed at the top of a column.**
5. **A test count that did not move.** If the pre-task baseline was 42 and the report says 42 after adding tests, the tests were not written.
6. **A screenshot of a stale server.** A rebuild without a restart serves the old bundle; a blank page with a green build.
7. **A contrast test that only reads one theme** or one surface.
8. **A seeded demo board that the sweeper purges mid-run.**
9. **A Done line without a commit and a push.** Check `git status` and `git ls-remote` before trusting "done".

## 12. Commands

```bash
npm ci
npm run format:check
npm run typecheck
npm run lint
npm test                                     # vitest, both workspaces, serialized
npm run build
npm run test:e2e                             # builds, starts the built server on 8123, runs Playwright
npm run test:perf                            # slow, opt-in
```

`test:e2e` starts the server itself, waits for `/healthz` to report `db:"up"`, and kills it on exit — including on failure. A leftover process on 8123 means the next run tests a stale build.

## 13. Verification protocol

Every wave ends with `docs/verify/k<wave>.md`:

```md
## K2-04 — pragmatic drag and drop

### Exit: a card dropped into the middle of a populated column lands between the two cards

$ npx playwright test e2e/board-drag.spec.ts --reporter=line
Running 1 test using 1 worker
  ✓  1 e2e/board-drag.spec.ts:12:1 › drop between two cards, reload, order persists (4.2s)
1 passed (4.6s)

Verdict: PASS
```

Rules: the command, the real trimmed output, the verdict. No invented numbers. A red gate that is not fixed is reported as red and the wave stops. A deviation from the plan is written here with its reason — silent deviation is the one unrecoverable failure.
