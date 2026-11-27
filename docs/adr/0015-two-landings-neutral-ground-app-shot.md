# ADR-0015 — Two landings, a neutral ground, and the app itself in the hero

## Status
accepted · 2026-11-27 · Deciders: Wyliam (human ruling: the L5 task brief, quoted in `docs/verify/l5.md`)

Supersedes the ground-colour clause of ADR-0014 (S-31), the mock clause of ADR-0009 (S-11) and the "primary CTA is self-hosting" clause of ADR-0005 (S-16). Nothing else in those ADRs changes.

## Context

Three defects shipped in L4 and one product direction was decided after it:

1. The warm graphite ground (`--canvas #121110`, R18 G17 B16) reads brown graphite, not black, on a large area.
2. The hero shows a hand-built DOM board mock instead of the application; a screenshot slot is needed for real captures (1600×1000 desktop, 390×844 mobile) without changing markup when they arrive.
3. `/` carried self-hosting as the only pitch. The product now has two honest pitches: a managed cloud instance and self-hosting, on two routes of one component tree.
4. PROMPT.md §3.9 / S-16 said "the primary call to action is self-hosting" while no hosted tier exists; the cloud page therefore carries no price, no SLA, no customer count — only "early access" as a status word, and its CTA URL comes from `PUBLIC_CLOUD_URL` (never invented; a production build fails while it is unset).

## Decision

- **Two landing routes, one codebase.** `/` (and `/fr/`) sell Klui Cloud; `/selfhosted` (and `/fr/selfhosted`) sell self-hosting — today's page, minus nothing. `Landing.astro` takes `variant: 'cloud' | 'selfhosted'` and renders from one section registry; `Nav.astro` and `Footer.astro` take the same variant; copy lives in `src/data/copy.ts` under `LANDING[lang][variant]`. Each nav carries a real-labelled link to the other landing. The cloud page has no `/docs` link in its nav and no docs CTA in its body.
- **Neutral near-black ground.** The dark ramp is desaturated (`max(R,G,B) − min(R,G,B) ≤ 3`, enforced by `tests/tokens.test.mjs`); the parchment plate (`--plate #E9E5DD`) is the single warm element: paper on black.
- **The hero shows the app.** `AppShot.astro` renders a `<picture>` (639 px breakpoint, explicit 1600×1000 / 390×844, eager/high/async) fed by `src/assets/app-desktop.png` and `src/assets/app-mobile.png`. Until real captures land, a classic placeholder frame renders, marked with a constant; a `NODE_ENV=production` content-lint fails while it is in the built output. `BoardMock.astro` is deleted.

## Consequences

- The cloud page cannot be built for production until `PUBLIC_CLOUD_URL` is set (same mechanism as the legal placeholders); in dev the CTA renders disabled with "Cloud address not configured".
- The mock's tag-colour rule (colour only inside the illustration) moves to the real captures; the placeholder carries no colour.
- Two more routes enter every gate (meta, links, OG, sitemap, a11y, responsive e2e); the JS budget is unchanged (no new runtime dependency; Playwright is dev-only).
- Self-hosting stays a first-class page, not a footer link: `/selfhosted` keeps every section `/` had in L4.

## Alternatives rejected

| Alternative | Why not |
|---|---|
| Keep one landing, add a cloud banner | The two pitches promise different things; one page cannot carry both without one of them becoming a footnote |
| Fork the markup into two page files | The two pages drift apart within a release — the exact trap the section registry exists to prevent |
| Keep the warm graphite ground | On a large area it reads brown, not black; the neutrality test now fails any warm cast |
| Ship a skeleton board as the placeholder | A grey fake UI looks broken, not deliberate; a production build must refuse a grey box |
| Invent a cloud URL for the CTA | A guessed domain is a dead link wearing a promise; the env var is the only source |
