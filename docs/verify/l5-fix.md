# Fix pass — CI blockers and review findings on `feat/two-landings`: verification

Environment: branch `feat/two-landings`, Node v22 (repo engines >= 22.18.0), date 2026-11-27. Scope: the PR #1 review findings and the two CI blockers. No copy changed, no dependency added, no gate weakened.

## What was red, and the fix

| Finding | Reproduction | Fix | Verify |
|---|---|---|---|
| `BoardMock.astro` outlived its data (typecheck + unit tests red) | `npm run typecheck` → `BoardMock.astro:6:10 Module has no exported member BOARD_MOCK`; `npm test` fails on the mock assertion | Deleted the orphaned component; nothing imported it | `npm run typecheck` → 0 errors; `npm test` → 42→58 passing |
| e2e webServer times out on IPv6-only bind | `npm run preview` printed `Local: http://localhost:4321/` but `ss -ltn` showed `[::1]:4321` while playwright polled `127.0.0.1:4321` | Pinned the preview host/port on both sides; playwright pipes webServer output; the lighthouse wait loop and URL match | `CI=1 npm run test:e2e` → 27 passed (was: timeout) |
| `${{ github.ref_name }}` interpolated into a shell command | Branch names with quotes break out of the quoting | Sanitize step passes the value through `env:` | `printf '%s' "$BRANCH"` path is quoted-only |
| Lighthouse budget gate could not fail | `continue-on-error: true` swallowed check-lighthouse failures | Removed; a failing budget fails the job | gate asserts on the same report as before |
| CTA proper noun | `Open Klui Cloud` failed the sentence-case gate when `PUBLIC_CLOUD_URL` was set | Added `Cloud` to the proper-noun set (rule stays strict) | `npm run lint:content` green; production-path proof below |
| `install-time.txt` numeric parse | `Number.parseInt` ran on the string claim's artifact | Each claim dispatches its own parser; the string claim validates its own artifact line | `npm run test:claims` green with the artifact published (below) |
| Dist HTML never scanned | The tool-count check walked `.astro/.ts/.mjs` extensions only | Walks built HTML; an empty scan fails loudly | `check-claims` now walks dist; fake-page case covered by the gate run |
| Anchored relative links | `resolve('foo.md#section')` glued the anchor to the filename | Anchor split before resolution, re-appended to the site path | `[x](../api.md#tools)`-style links resolve in `tests/sync-docs-links.test.mjs` |
| Release pill language | FR pages linked EN-only release posts | `pickReleasePost` filters by lang; fallback kept | unit test on the pick helper (4 cases) |
| No-JS nav hidden | The responsive hide rule applied to the fallback nav | Fallback nav has its own class; hide rule no longer applies | `e2e/nav-noscript.spec.ts` at 390 px |

## Gate (full sequence, PR #1 head)

```
$ npm run format:check
All matched files use Prettier code style!
$ npm run typecheck
- 0 errors
- 0 warnings
$ npm run lint
lint-source: 97 source files scanned, SPDX/emoji/hex/tracking/URL rules ok
$ npm test
# tests 58  # pass 58  # fail 0
$ npm run build
patch-docs-chrome: patched mobile TOC nav in 38 pages, rebuilt 3 redirect stub(s)
$ npm run test:landing
check-landing: / cloud (...), /selfhosted (snippet byte-identical, MCP JSON parses with kb_YOUR_KEY, install + docs nav, 1 plate each, h1 per variant, limits 4 rows on both, glyph grid ok)
$ npm run test:links
check-links: 56 pages crawled, 0 broken links, 0 broken anchors, twins + llms.txt ok
$ npm run test:meta
check-meta: 56 pages, 1 canonical each, 53 unique og:image files resolving in dist/, JSON-LD ok, sitemap priorities ok
$ npm run test:a11y
check-a11y: axe on 56 built routes, 0 violations on site-owned pages, 1 note(s) in synced app docs (owned by kluii/app)
$ npm run test:claims
check-claims: 6/6 claims verified against src/generated (app 2.0.0), 2 pending (pre-release)
$ npm run lint:content
content-lint: 56 built pages scanned, 0 emoji / 0 banned words on site-owned pages, footer ok, 42 note(s) in synced app docs
$ npm run test:perf
check-perf: /selfhosted JS 2367 B transferred · CSS 4852 B · fonts 127188 B
check-perf: budgets ok
$ CI=1 npm run test:e2e
  27 passed (2.5s)
```

## Production-path proof (CTA case gate)

```
$ PUBLIC_CLOUD_URL=https://<redacted> npm run build
(postbuild ok)
$ PUBLIC_CLOUD_URL=https://<redacted> npm run lint:content
content-lint: 56 built pages scanned, ... 42 note(s) in synced app docs
(exit 0)
```

Before the fix this build failed lint:content with `CTA not sentence case: "Open Klui Cloud"` on both the privacy and confidentiality pages.

## install-time artifact proof

```
$ printf '5\n2 vCPU / 2 GB\n' > src/generated/install-time.txt
$ npm run -s test:claims
check-claims: 6/6 claims verified against src/generated (app 2.0.0)
(exit 0 — file removed afterwards)
```
