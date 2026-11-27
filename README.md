<!-- SPDX-License-Identifier: AGPL-3.0-only -->

# klui-site

The public site for Klui 2.0: one landing screen, versioned documentation, a changelog
and legal templates. Static Astro output — no backend, no database, no auth, no client
framework. `dist/` is the product.

The application lives in a separate repository (`kluii/app`); this site never imports it.
The only coupling is `scripts/sync-docs.mjs`, which reads a checkout of the app at the
release tag and turns its `docs/` into `/docs/v2/*`, plus `src/data/claims.ts` naming the
app version the site documents.

## Run it

```bash
npm ci
node scripts/sync-docs.mjs --from ../klui --tag v2.0.0   # needs a checkout of the app next to this repo
npm run dev                                               # http://localhost:4321
npm run build                                             # -> dist/
npm run preview                                           # serves dist/ on :4321
```

Without the sync, the build fails on missing docs. That is intentional: the site does not
ship with placeholder documentation.

## Gates (all of them, before every push)

```bash
npm run format:check
npm run typecheck        # astro check
npm run lint             # eslint + no-emoji + no-hex + no-literal-string
npm test
npm run build
npm run test:links
npm run test:a11y
npm run test:claims
npm run lint:content
npm run test:perf
```

## Where things are

- `PROMPT.md` — the implementation brief this repo was built from.
- `AGENTS.md` — the working agreement (run it, gates, branches, traps).
- `ROADMAP.md` — waves and tasks; `docs/verify/l<wave>.md` records each wave's gate output.
- `DESIGN.md` — the visual system; `src/styles/tokens.css` is its only coded form.
- `docs/` — decisions register, content/claims policy, architecture, sync, SEO, deploy, legal, analytics, testing.
- `src/content/docs/v2/` — synced from the app (`_site/` holds the hand-written pages); `v1/` is frozen.
- `src/data/` — `claims.ts` (every number on the site), `snippets.ts` (the one install command), `links.ts`, `legal.ts`.

## Branches and commits

`main` is production (merge from `dev` only, with explicit human approval). Task branches
`feat/<topic>` etc. from `dev`; conventional commits, signed off. Never commit or push to
`main`.

## Licence

AGPL-3.0-only — see [LICENSE](LICENSE). Made with <3 by [Wyliam](https://wyliam.dev).
