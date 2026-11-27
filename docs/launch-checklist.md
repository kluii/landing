# Launch checklist (L4-08)

Executed against the real URL `https://klui.wyliam.dev`, not a preview. Production
deploy requires explicit human approval (PROMPT §3.10) — until then every deploy
step below is PENDING.

| # | Step | Command / evidence | Status |
|---|---|---|---|
| 1 | Version bump | `package.json` version = the release being shipped; footer mono line prints it | DONE in repo (site 2.0.0) |
| 2 | Changelog post | `node scripts/changelog.mjs --from v1.x --to v2.0.0`, human pass on both TODOs, `draft: false` in the release PR | PENDING (no app tag exists yet; app repo has no releases) |
| 3 | Legal placeholders filled | `LEGAL_*` env or edited `src/data/legal.ts`; production build must pass `lint:content` with `NODE_ENV=production` | PENDING (operator values are a human decision) |
| 4 | Demo URL | `PUBLIC_DEMO_URL` set and reachable, or the hero link is omitted by the build | PENDING (no demo instance) |
| 5 | Deploy | build from a clean tree at the release commit, upload `dist/` to the host, Caddyfile active (301s + headers) | PENDING — needs explicit human approval |
| 6 | Smoke: 10 URLs × 3 viewports | `/`, `/fr`, `/docs/v2`, `/docs/v2/quickstart`, `/docs/v1`, `/blog`, a blog post (when published), `/legal/privacy`, `/legal/confidentialite`, `/404` at 390/768/1440 px | PENDING deploy |
| 7 | Post-deploy header check | `curl -I` on `/`, `/docs/v2/quickstart`, a `/docs/*.md` twin: CSP, HSTS, nosniff, cache-control on `/_astro/*` | PENDING deploy |
| 8 | Redirect check | `/quickstart`, `/docs`, `/changelog` answer 301 to their new homes | PENDING deploy |
| 9 | Sitemap submission | submit `https://klui.wyliam.dev/sitemap-index.xml` to the search console | PENDING deploy |
| 10 | Lighthouse baseline on the deployed URL | `npx lighthouse https://klui.wyliam.dev --preset=desktop --chrome-flags="--headless --no-sandbox"` — record all four categories + LCP + CLS in `docs/verify/l4.md` | PENDING deploy (CI baseline: 100/100/100/100, LCP 0.25 s, CLS 0) |
| 11 | Nightly demo-link re-check | CI job that fetches `PUBLIC_DEMO_URL` and opens an issue when it dies (L4-06) | PENDING (may slip per cut line) |
