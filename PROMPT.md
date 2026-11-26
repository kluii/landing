# Klui — Landing and documentation site: implementation prompt

> Hand this file to the coding agent. It is the entry point for the `klui-site` repository and nothing else. The application lives in a different repository and is not your concern: you do not build the app, you do not mock the app's internals, and you do not add a route that pretends to be the app.
>
> Two empty repositories exist: `klui` (the application) and `klui-site` (this one). You are building `klui-site`: a static Astro site with a landing page, versioned documentation, a changelog blog, and legal pages.

---

## 0. Mission

Build the public surface of Klui 2.0: **one landing screen, a real documentation set, a changelog, and legal templates.** Static output, no backend, no database, no auth, no client framework. It must load fast on a phone, read as a tool rather than a pitch, and never claim something the shipped application cannot do.

The product thesis the site has to carry, in this order:

1. **Collaboration without an account** — a link plus a display name.
2. **Agents are first-class** — a real MCP surface, per-board keys, a setup block a human can copy.
3. **The project has an end** — a close-out summary built from the event log, and an export that rebuilds the board elsewhere.
4. **Self-hosting with nothing behind a licence key** — one image, one compose file, AGPL-3.0, every feature included.

A visitor must be able to answer three questions in ten seconds: what is it, why is it different, how do I run it. If a section does not serve one of those, it is deleted, not shortened.

---

## 1. Read order

Read these in order, completely, before the first commit. They live in this repository.

1. `AGENTS.md` — working agreement, gates, traps.
2. `ROADMAP.md` — waves and tasks. One task at a time, in order.
3. `DESIGN.md` — the whole visual system for the landing and the docs.
4. `docs/decisions.md` — the locked register. Nothing here reopens without an ADR and a human ruling.
5. `docs/content.md` — voice, claims policy, what the site may and may not say.
6. `docs/architecture.md` — Astro structure, content collections, i18n, build.
7. `docs/docs-sync.md` — how application docs become site docs (single source of truth).
8. `docs/seo.md` — metadata, OG images, sitemap, `.md` endpoints, `llms.txt`.
9. `docs/deploy.md` — build, headers, hosting.
10. `docs/legal.md` and `docs/analytics.md` — templates, placeholders, consent.
11. `docs/testing.md` — the gates.
12. `docs/features/*.md` — read the ones covering your current task.

**Precedence:** this file, then `docs/decisions.md`, then `docs/content.md` (copy), then `DESIGN.md` (visual), then `ROADMAP.md` (sequencing), then your instinct. A conflict you cannot resolve is written into `docs/verify/<wave>.md` with both texts quoted — never resolved silently in code.

---

## 2. Skills to load and follow

Load these before planning anything. Authority order:

1. **`will-s-coding-convention`** — branches, conventional commits, authorship, gates, the footer rule, the no-secret rule. This outranks every generic skill and every aesthetic opinion.
2. **`unslop`** — the anti-slop art direction and browser inspector. Run its inspector on the landing and on three docs pages before calling a wave done. It is the floor, not the grade: a passing meter on a generic page is still a generic page.
3. **`modern-web-guidance`** — mandatory before implementing dialogs, popovers, focus management, forms, scroll behaviour, or anything about `prefers-*`.

If a skill is not installed in your harness, say so once in the verify file and follow the rules restated in `DESIGN.md` and `docs/content.md`.

**Conflict rule:** `will-s-coding-convention` > `docs/content.md` > `DESIGN.md` > `unslop`. Where `unslop` pushes decoration (gradients, glow halos, floating cards, oversized type, icon soup), `DESIGN.md` wins: the landing is a tool's front door, not a portfolio piece. Where `unslop` pushes structure (one idea per viewport, real hierarchy, no filler copy, measured contrast, no generic hero-left/image-right), it wins over your instinct.

---

## 3. Non-negotiables

1. **Astro + Starlight, static output.** No SSR adapter, no serverless function, no API route that does work at request time. `dist/` is the product.
2. **No client framework.** No React, Vue, Svelte, Solid. The only client JavaScript is what Astro ships for the copy button, the mobile menu, the changelog filter, and Starlight's own bundles.
3. **No emoji in the UI**, in any language, at any size. Icons are stroke-only inline SVG, 16 or 20 px, drawn once in one component. The site uses typographic arrows (`→`) in mono rather than icons wherever a word or an arrow will do.
4. **Dark only.** One theme, warm graphite (`--canvas #121110`), no toggle, no flash of light. `color-scheme: dark` on `html`, plus a print stylesheet for docs.
5. **Monochrome chrome, editorial type.** The site's surfaces, type and rules are grayscale; colour appears only **inside the illustration** (the board mock, screenshots) and comes from the application's tag palette. Three voices, never mixed: Newsreader for headlines only, Inter with positive tracking for body, JetBrains Mono for facts. The positive tracking is the signature and must not be "corrected". Controls are pills (9999 px), surfaces are 8 px, and the product sits on one paper plate.
6. **Every number on the site is greppable in the application.** Tool count, install time, retention, version, licence. The claims manifest (`src/data/claims.ts`) names the source and the app version it was verified against; a release build fails when a claim is unverified.
7. **No claim that the app cannot back.** No "unhackable", no "bot-proof", no "hacker-proof", no "AI-powered everything". No comparison that is false: Trello does have free guests; the real gaps are "no MCP for board guests" and "no board re-creation from an export".
8. **No invented social proof.** No testimonials, no logo wall, no "trusted by", no star count, no user number. There are no customers yet, and inventing one is the fastest way to lose the only audience this product has.
9. **No pricing page** until a hosted tier exists. The primary call to action is self-hosting.
10. **Never commit or push to `main`.** Nothing merges without a green gate and a PR. Production deploy only with explicit human approval.
11. **Never report a number you did not measure.** Build times, Lighthouse scores, bundle sizes: measured or absent.
12. **The site and the app never import each other.** The site's build does not read the app's source at runtime; the only coupling is the docs sync script (§8) reading a checkout, and the claims manifest naming a version.

---

## 4. Stack (decided — do not reopen)

| Layer | Choice |
|---|---|
| Framework | Astro (static output) |
| Docs | Starlight, versioned `v2` (current) and `v1` (frozen) |
| Blog | Astro content collections, MDX |
| Styling | Plain CSS with custom properties; Tailwind only if Starlight already requires it (it does not) |
| Search | Pagefind (static index, built at build time, no backend) |
| Fonts | Newsreader (display serif, 400), Inter (400/500), JetBrains Mono (400) — self-hosted, subset, `font-display: swap` |
| OG images | Rendered at build from an SVG template via `@resvg/resvg-js` |
| Analytics | Cookieless only, opt-in by env var, no banner (§10) |
| Package manager | npm |

Dependency rules:

- Pin exact versions in `package.json` (no `^`, no `~`) for `astro`, `@astrojs/starlight`, `@resvg/resvg-js`, `pagefind`.
- Adding a dependency that ships to the browser requires a line in `docs/adr/` saying what it replaces or why it is unavoidable.
- No UI kit, no animation library, no icon package, no CSS framework, no font CDN, no analytics SDK beyond a single script tag.

---

## 5. Repository layout

```
AGENTS.md  LICENSE  README.md  PROMPT.md  ROADMAP.md  DESIGN.md
astro.config.mjs  package.json  tsconfig.json  .env.example
assets/
  light-logo.png      white ink, for dark surfaces
  dark-logo.png       black ink, for light surfaces (print, OG light variant, favicon on white)
public/
  favicon.svg  robots.txt  _headers (host-specific)  fonts/
src/
  pages/              index.astro, fr/index.astro, 404.astro, llms.txt.ts
  layouts/            Base.astro, Landing.astro, Legal.astro
  components/         Nav.astro, Footer.astro, Hero.astro, BoardMock.astro,
                      Section.astro, CodeBlock.astro, CopyButton.astro,
                      GlyphGrid.astro, ArrowLink.astro
  content/docs/       en/…  fr/…  v1/…
  content/blog/       en/…  fr/…
  content/legal/      en/…  fr/…
  data/               claims.ts, snippets.ts, links.ts, legal.ts
  styles/             tokens.css, base.css, landing.css, docs.css
scripts/              sync-docs.mjs, og-images.mjs, changelog.mjs,
                      check-claims.mjs, check-links.mjs
docs/                 (this documentation set)
```

Nothing in `src/` may import from `../docs/` and nothing in `docs/` is rendered by the build. Documentation for the repository is not site content; site content is not repository documentation. The one bridge is `scripts/sync-docs.mjs` (§8).

---

## 6. The landing, in one screen

Order is fixed; each block is a section with a real reason to exist. No feature grid, no "everything you need" block, no marquee.

1. **Nav** — wordmark (`assets/light-logo.png`, 24 px), three links (Docs, Changelog, GitHub), one button (Deploy). No hamburger above 768 px; below, a sheet.
2. **Hero** — one `h1` (6–10 words), one lead sentence (≤ 28 words), two actions (primary: copy the install command; secondary: open the demo board), and the board mock.
3. **The three lines** — account-free participation, agents via MCP, the project ends. Each line is a short sentence, not a feature card, and each is anchored to a visible part of the mock or to a real capability.
4. **How it runs** — the actual compose snippet, the three commands, a link to the quickstart. The snippet is the same string the docs import.
5. **The end** — the close-out summary, shown as a real rendered block (text, not a screenshot), with one sentence on why it is generated from events.
6. **Agents** — the MCP config block, one sentence on per-board keys and scope, a link to the MCP reference.
7. **What it does not do** — four honest limits, versioned with the release (attachments, calendar view, mobile apps, presence). This section is mandatory and cannot be softened.
8. **Footer** — `Made with <3 by Wyliam` (link), licence, docs, privacy, and a mono line with the site version and the app version it documents.

**Hero copy is fixed by this prompt.** If you change it, the change goes in `docs/content.md` with the reason, in the same commit.

- Announcement pill (above the headline, linking to a shipped release note): `v{appVersion} — close-out summaries, {tools} MCP tools`
- H1: `A kanban for projects that end.`
- Lead: `Klui is a fast, self-hosted board where a link is the invite, agents read and write through MCP, and every project closes with a summary you can hand over.`
- Primary action: `Copy the install command`
- Secondary: `Open the live demo board` (hidden when `PUBLIC_DEMO_URL` is unset)

---

## 7. Documentation

- Quickstart (one compose file, copy-pasteable), deployment (Caddy and Traefik), backup and restore (with a restore drill), upgrade and rollback, environment variable reference, MCP reference (generated from the tool schemas), permissions model, security model, FAQ, and a "limits" page that matches the landing's honesty.
- **Versioned:** `/docs/v2` is current, `/docs/v1` is frozen and never edited (it documents the previous line, for people migrating). A version switcher exists and does not pretend v1 supports v2 features.
- Every page also exists as `/docs/<slug>.md` (raw markdown, no navigation chrome) and `/llms.txt` lists the set with one-line descriptions.
- The quickstart must be executable by someone who has never read an English README: every command complete, every placeholder named, no "configure as needed".

---

## 8. Single source of truth for docs

The application repository owns the technical content (`docs/*.md` there). The site does not fork it.

- `scripts/sync-docs.mjs --from ../klui` copies the app's docs into `src/content/docs/en/v2/`, rewrites relative links, adds frontmatter (title, description, sidebar order), and stamps each file with `app_version` from the app's `package.json`.
- The script is idempotent, fails loudly on a missing file, and never overwrites a hand-written site-only page (quickstart intro, FAQ, limits) — those live in `src/content/docs/en/v2/_site/` and are merged at build.
- `docs-sync` runs in CI with a checked-out app repo at the release tag. The site's content therefore states the version it documents.
- A page that exists in the app but not in the site fails the sync check; a page in the site that claims to be synced but is not in the app also fails.

---

## 9. Design constraints

`DESIGN.md` is the source of truth. The rules that get broken first:

1. **One theme, warm graphite.** `--canvas #121110`, ink `#F4F1EB`, parchment plate `#E9E5DD`. Warm neutrals only (`R > G > B` by 1–3): a cool gray breaks the parchment lineage. No tinted sections, no coloured panels, no glow, no gradient. Controls are pills (9999 px), surfaces 8 px; the board mock keeps the app's 4/8 px.
2. **Three voices, never mixed.** Serif announces (headlines only, weight 400, never below 24 px), sans explains (16 px body at +0.02em), mono states (versions, counts, code). No uppercase, no letter-spaced capitals, no eyebrow, no serif in a paragraph or a button.
3. **Hairlines, not shadows.** Sections are separated by a 1 px rule and 96–120 px of space. Nothing floats; the only shadow in the system is the mobile sheet's backdrop.
4. **The plate is the only light surface.** One parchment panel holds the product mock; the paper pill is the only filled control. Two plates on a page, or a plate inside a card, is a layout bug.
5. **The ASCII glyph grid is the only texture.** Static SVG, monochrome, masked to fade; never animated, never behind body text.
6. **No emoji, no illustration library, no stock photo.** The product is the picture: a real HTML board mock, real rendered output blocks, real terminal text.
7. **Motion is a single reveal**, 500 ms, once, disabled under `prefers-reduced-motion`. No parallax, no marquee, no typewriter, no scroll-jacking, no cursor effects.
8. **Contrast is measured**, in the stylesheet and in a test: body ≥ 4.5:1, large text ≥ 3:1, links distinguishable without colour (underline on hover and focus), focus ring visible on every interactive element.
9. **390 px is the reference phone.** The hero, the board mock and the code blocks must be usable there; the mock scrolls inside its own rail, never the page.
10. **Docs look like the landing**, not like a default Starlight theme: same tokens, serif headings, spaced body, ink accent, mono sidebar metadata, no purple anywhere.

---

## 10. Analytics, legal, and the honest bits

- **Analytics is off unless `PUBLIC_ANALYTICS_URL` is set.** Cookieless, no cross-site identifier, no fingerprinting, no consent banner — and that claim is only allowed while it is true (see `docs/analytics.md` for the CNIL exemption checklist). Setting a cookie anywhere means the banner becomes mandatory before the next deploy.
- **Legal pages are templates with placeholders** (`{{OPERATOR}}`, `{{CONTACT}}`, `{{HOSTING_REGION}}`). A production build fails if a placeholder survives. The operator of a self-hosted instance fills their own; the site's copies describe the hosted instance.
- **The demo board is real**: `PUBLIC_DEMO_URL` points at a public board on the demo instance, reset nightly. If it is unset or unreachable at build time, the link is omitted — never shipped dead.
- **No newsletter capture in 2.0.** No email field, no "join the waitlist". A form that collects addresses without a privacy page, a retention rule and a real sender is a liability.

---

## 11. How to work

One task at a time, from `ROADMAP.md`, in order.

1. Read the task, its dependencies, and the documents it names.
2. Branch from `dev`: `feat/<topic>`, `fix/<topic>`, `chore/<topic>`, `docs/<topic>`. The topic describes the change.
3. Set the commit identity **before the first commit**:
   - GitHub: `git config user.name "Wyliam" && git config user.email "82271052+WyliGr@users.noreply.github.com"`
   - Forgejo personal: `git config user.name "Hermes" && git config user.email "hermes@wyliam.fr"`
   - Verify with `git config --local user.email`; empty means you inherited the wrong identity.
4. Small, conventional, revertable commits.
5. Run the gate in your own environment. Never push to let CI find out.
6. Push the branch; no PR unless asked; never `main`.
7. Write `docs/verify/l<wave>.md` with the command, the real trimmed output and the verdict for every exit criterion.

**Gate commands:**

```
npm ci
npm run format:check      # prettier, tracked files
npm run typecheck         # astro check
npm run lint              # eslint + the no-emoji, no-hex, no-literal-string rules
npm test                  # unit tests (content, claims, links helpers)
npm run build             # astro build, static output
npm run test:links        # internal links, anchors, .md endpoints, llms.txt
npm run test:a11y         # axe on the built pages
npm run test:claims       # claims manifest vs synced artifacts
npm run lint:content      # banned words, emoji, placeholders, footer
npm run test:perf         # JS/CSS budgets, Lighthouse assertions
npx lighthouse http://localhost:4321 --preset=desktop --chrome-flags="--headless --no-sandbox"
```

A gate that passes only with a skipped test, a narrowed assertion, or an untracked exclusion is a failed gate.

---

## 12. Reporting

```
TASK      L2-03 — sync script and versioned docs
BRANCH    feat/docs-sync
COMMITS   5 (list)
GATE      format ok | typecheck ok | lint ok | unit 34/34 | build ok (128 pages, 1.9 s) | links 0 broken | a11y 0 violations | claims 9/9 verified
PROOF     <one pasted line per claim, trimmed>
DEVIATIONS <none | what, why, where recorded>
NEXT      <task id or "blocked: reason">
```

A done claim without a pasted log line is not done. A failing gate you cannot fix is reported as failing, and the wave stops.

---

## 13. Traps (each has shipped as a real bug)

1. **A landing that describes the roadmap instead of the product.** Every section names something the shipped app does today; anything else waits for the release that adds it.
2. **A screenshot from a stale build.** A capture that predates a change is a false claim. Screenshots carry the app version in the filename and are regenerated on release; the build fails if a referenced capture predates the documented version.
3. **A number that was true once.** "21 tools" lives in `claims.ts` with its source; the release gate re-reads the synced artifact.
4. **An install snippet that does not match the docs.** One constant in `src/data/snippets.ts`, imported by the landing and by the quickstart. Two copies drift within one release.
5. **A comparison table that misrepresents a competitor.** Verified cells with a date, or no table. "Trello has no free guests" is false and has been written by better people than you.
6. **A docs page that links to a heading that no longer exists.** Anchor checks are part of the link gate, on every build.
7. **A default Starlight theme shipping purple accents.** Override the `--sl-color-*` variables in one place; a single purple focus ring reads as "unfinished template".
8. **A hero that is an image.** LCP becomes a PNG on a slow phone, and the text disappears for a screen reader. The hero is DOM text; images are illustrations with alt text and fixed dimensions.
9. **A "live demo" link that 404s.** The build omits it when the URL is unset; a nightly job re-checks the URL and opens an issue when it dies.
10. **A cookie banner nobody needed, or analytics with no banner.** The decision is in `docs/analytics.md`; changing it is a decision, not a copy tweak.
11. **A dark theme with 3.2:1 body text.** The contrast test measures the tokens against the surfaces they actually sit on, not against the canvas only.
12. **A `dist/` deployed from a dirty tree.** The release note records the commit; the footer prints the version; the two must match.

---

## 14. Definition of done for the site

A stranger with the repository and a terminal can verify each line:

- `npm ci && npm run build` produces `dist/` with no network calls at build time except the fonts and the docs sync from a local checkout.
- The landing loads with ≤ 15 KB of JavaScript, LCP < 1.2 s on a throttled 4G profile, and Lighthouse ≥ 95 on performance, accessibility, best practices and SEO.
- Every internal link and anchor resolves; every docs page has a `.md` twin and appears in `llms.txt`.
- `npm run test:claims` passes against the app release tag the site documents.
- Every legal placeholder is filled in the production build, or the build fails.
- No emoji anywhere in `src/`, checked by a test that scans the built HTML.
- The footer carries `Made with <3 by Wyliam` on every page.
