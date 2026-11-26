# Klui site — Roadmap

> Sequencing for the `klui-site` repository (landing + documentation + changelog + legal). Read `PROMPT.md` first, then this file, then `DESIGN.md` and `docs/`.
>
> One task at a time, in order. A task starts only when its predecessors' exit criteria are green **and recorded** in `docs/verify/l<wave>.md`.

---

## How to use this file

- IDs are `L<wave>-<nn>`. Use them in branch names only as a suffix if it helps; the branch name describes the change.
- **Size:** `S` ≤ half a day, `M` 1–3 days, `L` 3–6 days, `XL` > a week.
- **Exit** is what a stranger can check. "Build the hero" is not an exit; "the hero renders at 390 px with 0 layout shift and 0 axe violations" is.
- `[ ]` todo · `[~]` in progress · `[x]` done and verified · `[!]` blocked (reason in the verify file)

**Wave map**

```
L0 Foundation     repo, Astro, tokens, CI, headers, deploy preview
 └─ L1 Landing    nav, hero, board mock, the three lines, install, close-out, agents, limits, footer
     └─ L2 Docs   Starlight + tokens, sync from the app repo, versioning, search, .md + llms.txt
         └─ L3 Content  changelog, legal templates, FR, hreflang
             └─ L4 Release  SEO/OG, performance, a11y, analytics, claims gate, launch
```

L0 and L1 can ship before the app's 2.0 exists, with `PUBLIC_DEMO_URL` unset and the "what it does not do" list written for the pre-release state. Everything that states a capability waits for the release that ships it (L4 gate).

---

## L0 — Foundation (est. 3–5 days)

**Goal:** an empty but honest site: it builds, it deploys, its CI runs for real, and the visual tokens are already the product's.

**Wave exit:** a push to a branch produces a preview URL that serves a styled `/` with the wordmark, the footer, and 0 console errors; the CI log is observed and pasted into `docs/verify/l0.md`.

- [ ] **L0-01 — Repository bootstrap** `S` · dep: —
  `LICENSE` (AGPL-3.0), `README.md` (what it is, how to run, where the docs are), `.gitignore`, `.editorconfig`, `.nvmrc`, `.prettierrc`, `.prettierignore`, SPDX header in every source file.
  **Exit:** `npx prettier --check` on tracked files is clean; every `.astro`/`.ts`/`.mjs` starts with the SPDX line.

- [ ] **L0-02 — Astro skeleton** `S` · dep: L0-01
  Astro with static output, `src/pages/index.astro`, `src/layouts/Base.astro`, `astro.config.mjs` with `site`, `i18n` (en default, fr), sitemap integration, `compressHTML`.
  **Exit:** `npm run build` emits `dist/index.html`; `npx astro check` passes.

- [ ] **L0-03 — Tokens and base CSS** `M` · dep: L0-02
  `src/styles/tokens.css` (warm graphite ramp, parchment plate, tracking tokens, three type voices), `base.css` (reset, type, focus, selection, scrollbars, reduced motion), no theme bootstrap (dark only — assert it).
  **Exit:** a kitchen-sink page renders every token; the contrast test passes for every text token against every surface it can sit on, including the plate; every neutral passes the warm-ramp check.

- [ ] **L0-04 — Fonts** `S` · dep: L0-03
  Newsreader (variable, display only), Inter (400/500) and JetBrains Mono (400) self-hosted, woff2, subset to latin + latin-ext + French punctuation, `font-display: swap`, `size-adjust` fallbacks, serif and sans regular preloaded.
  **Exit:** zero requests to a font CDN in the built HTML; measured font payload < 150 KB; CLS 0 on a cold load.

- [ ] **L0-05 — CI, observed** `M` · dep: L0-02
  Workflow on every push: install, format check, astro check, lint, build, link check, upload artifact. A deploy preview on branches (static preview is fine).
  **Exit:** a real run exists, its log shows each step passing, and the URL plus one log line are in `docs/verify/l0.md`. A workflow that never ran is not CI.

- [ ] **L0-06 — Headers and hosting config** `M` · dep: L0-05
  Cache policy (immutable for `/_astro/*`, `no-cache` for HTML), security headers (CSP, HSTS, `nosniff`, `Referrer-Policy`, `frame-ancestors 'none'`), 404 page, `robots.txt`.
  **Exit:** `curl -I` on the preview shows the headers; CSP blocks an injected inline script (tested with a probe page that is not committed).

- [ ] **L0-07 — Decisions and working agreement** `M` · dep: —
  `docs/adr/0001-stack.md` (exact versions), `0002-dark-only.md`, `0003-monochrome-chrome.md`, `0004-docs-single-source.md`, `0005-claims-policy.md`, `0006-no-client-framework.md`. `AGENTS.md` with install/run, gates, branch rules, non-negotiables, traps.
  **Exit:** ADR-0001 lists exact resolved versions; `AGENTS.md` lets a new agent make a correct change without reading anything else.

- [ ] **L0-08 — Documentation skeleton** `S` · dep: L0-07
  `docs/architecture.md`, `content.md`, `docs-sync.md`, `seo.md`, `deploy.md`, `legal.md`, `analytics.md`, `testing.md`, `decisions.md`, `features/`, `verify/`.
  **Exit:** every document in the read order of `PROMPT.md` exists and opens.

---

## L1 — The landing (est. 2 weeks)

**Goal:** one screen that answers what / why / how, in the product's own visual language, with no claim the app cannot back.

**Wave exit:** the landing at 390 px and 1440 px passes axe with 0 violations, loads ≤ 15 KB of JS, and its install snippet is byte-identical to the one the docs import.

- [ ] **L1-01 — Nav and footer** `S` · dep: L0-03
  Nav: wordmark 24 px, Docs / Changelog / GitHub, one primary button. Below 768 px a sheet, keyboard operable, focus trapped, `Esc` closes. Footer: footer rule, `Made with <3 by Wyliam` linking to https://wyliam.dev, licence, privacy, mono version line.
  **Exit:** keyboard-only navigation reaches every link; the sheet traps focus and restores it; the footer appears on every route including 404.

- [ ] **L1-02 — Hero** `M` · dep: L1-01
  Centred masthead: announcement pill (linking to a shipped release note), serif H1, lead, one paper pill and one ghost pill, mono spec line. Copy fixed by `PROMPT.md` §6. No image above the fold.
  **Exit:** LCP is the H1 (recorded with Lighthouse), 0 CLS, the copy action writes to the clipboard and announces "Copied" via `aria-live`, the H1 is at most three lines at 1440 px.

- [ ] **L1-03 — Plate and board mock** `L` · dep: L1-02
  A parchment plate (16 px mat, radius 8, no shadow) holding a real DOM board: three columns, five cards, one done, two tag chips in app palette colours, mono metadata. `aria-hidden` on the mock, a visible mono caption under the plate. Below 640 px the mock scrolls inside its own rail.
  **Exit:** exactly one plate per page, never nested in a card; no horizontal page scroll at 390 px; the mock keeps the app's radii (no pills inside it); captures at both widths reviewed against `DESIGN.md` §11.

- [ ] **L1-04 — The three lines** `M` · dep: L1-02
  Account-free participation, agents, the end. Each line is prose + one anchor link to the relevant docs page. No cards, no icon grid.
  **Exit:** each line's claim is listed in `claims.ts` with a source; the section reads in one viewport at 1440 px.

- [ ] **L1-05 — Install block** `M` · dep: L1-01
  The compose snippet, three commands, a copy button, a link to the quickstart. Snippet imported from `src/data/snippets.ts`, never retyped.
  **Exit:** the rendered snippet is byte-identical to `snippets.ts`; the copy button works without JS disabled (static `<pre>` remains readable).

- [ ] **L1-06 — Close-out block** `M` · dep: L1-04
  A rendered close-out summary (headings, counts, mono dates, ASCII rhythm line), not a screenshot. One sentence: it is generated from the event log and never hand-edited.
  **Exit:** the block uses the same type scale as docs prose; the ASCII line does not overflow at 390 px.

- [ ] **L1-07 — Agents block** `M` · dep: L1-04
  MCP config JSON in a code block with copy, one sentence on per-board keys and scope, link to the MCP reference.
  **Exit:** the JSON parses (a test parses every code block tagged `json` in the built HTML); the key in the example is a placeholder (`kb_YOUR_KEY`), never a token-shaped literal.

- [ ] **L1-08 — Limits section** `S` · dep: L1-04
  Four honest limits (attachments, calendar view, mobile apps, presence), each one line, versioned with the release in `claims.ts`.
  **Exit:** every limit is true for the documented app version; the section cannot be removed by a copy change without a decisions entry.

- [ ] **L1-09 — Glyph grid** `M` · dep: L1-03
  Static SVG field of mono glyphs behind the hero, 5–7 % ink, masked to fade at the edges, `aria-hidden`, `pointer-events: none`.
  **Exit:** no animation, no canvas, no bitmap; the SVG is < 8 KB gzipped; it never sits behind body text.

- [ ] **L1-10 — Motion** `S` · dep: L1-03
  One reveal per section: opacity + 8 px, 400 ms, once, `IntersectionObserver`, no library. Disabled under `prefers-reduced-motion`.
  **Exit:** with reduced motion the page renders identical content with no transition; no layout shift from the reveal.

- [ ] **L1-11 — Copy pass** `M` · dep: L1-04
  Every string reviewed against `docs/content.md`: no superlative, no exclamation, no "seamless", no emoji, sentence case, one idea per paragraph.
  **Exit:** a grep for the banned word list returns zero hits in `src/content` and `src/components`.

---

## L2 — Documentation (est. 3 weeks)

**Goal:** docs that a stranger can deploy from, generated from the app's own content, versioned, searchable, and readable offline as markdown.

**Wave exit:** `npm run build` with a checkout of the app at the release tag produces `/docs/v2/*` for every app doc, `/docs/v1/*` frozen, Pagefind search returning results, `.md` twins, and `llms.txt`; the link gate reports 0 broken links and 0 broken anchors.

- [ ] **L2-01 — Starlight setup** `M` · dep: L0-03
  Starlight with the site's tokens; every `--sl-color-*` override in one file; no purple anywhere; sidebar, TOC, pagination and search restyled to mono metadata.
  **Exit:** a screenshot review of three pages shows no default Starlight accent; the override file is the only place `--sl-color` appears.

- [ ] **L2-02 — Sync script** `L` · dep: L2-01
  `scripts/sync-docs.mjs`: copy the app's `docs/*.md` and `docs/features/*.md` into `src/content/docs/en/v2/`, rewrite relative links, inject frontmatter (title, description, order), stamp `app_version`, fail on a missing expected file, never touch `_site/` pages.
  **Exit:** running it twice is idempotent (second run changes nothing); a deliberately missing file fails with the file name; the diff of a second run is empty.

- [ ] **L2-03 — Site-only pages** `M` · dep: L2-02
  Quickstart intro, FAQ, limits, "why self-host", a migration note from v1. Written by hand, under `_site/`, merged at build.
  **Exit:** each page states which parts are generated and which are hand-written (a mono line under the title); the FAQ answers real questions from the app's decisions register.

- [ ] **L2-04 — Versioning** `M` · dep: L2-02
  `/docs/v2` current, `/docs/v1` frozen archive, a switcher that names the version and does not pretend v1 has v2 features.
  **Exit:** the switcher links only to pages that exist in the target version; v1 pages carry a "frozen" banner.

- [ ] **L2-05 — Environment reference** `M` · dep: L2-02
  The env var table generated from the app's `docs/deployment.md` table (parsed at sync time) or kept in sync by the claims gate; every variable with default, required-in-production flag and one sentence.
  **Exit:** a variable present in the app and absent in the page fails the sync check.

- [ ] **L2-06 — MCP reference** `M` · dep: L2-02
  Tool table generated from `tools.json` (emitted by the app) with name, arguments, one example per tool; the page states the app version it was generated from.
  **Exit:** the number of tools on the page equals `tools.json` length; a tool rename in `tools.json` changes the page and fails the claims gate until reviewed.

- [ ] **L2-07 — `.md` twins and `llms.txt`** `M` · dep: L2-02
  Every docs page served as `/docs/<slug>.md` (raw content, no chrome); `llms.txt` listing the set with one-line descriptions; `robots.txt` allows them.
  **Exit:** a script crawls the built `dist/`, asserts a `.md` file per HTML docs page, and asserts every entry in `llms.txt` resolves.

- [ ] **L2-08 — Search** `S` · dep: L2-01
  Pagefind index built at build time, no backend, no external service; the search UI is the Starlight one restyled.
  **Exit:** searching "expected_updated_at" returns the API page first; the index is excluded from the sitemap; no request leaves the origin.

- [ ] **L2-09 — Docs IA and redirects** `S` · dep: L2-04
  Sidebar order, groups, "start here" page, and redirects from the old paths (`/quickstart` → `/docs/v2/quickstart`) so shared links keep working.
  **Exit:** every redirect answers `301` in the preview; no orphan page (a page not reachable from the sidebar or a link) — asserted by the link crawl.

- [ ] **L2-10 — Docs accessibility** `M` · dep: L2-01
  Skip link, landmarks, focus order, code block copy buttons keyboard-operable, tables scrollable on mobile, headings in order.
  **Exit:** axe 0 violations on ten sampled docs pages; a keyboard-only pass reaches the copy button of every code block.

---

## L3 — Content surfaces (est. 2 weeks)

**Goal:** a changelog that writes itself from commits, legal pages that cannot ship half-filled, and a French site that reads like French.

**Wave exit:** a release tag produces a blog post draft with the right groups; a production build with an unfilled placeholder fails; `/fr/` serves a complete translation with correct `hreflang`.

- [ ] **L3-01 — Changelog generator** `M` · dep: L0-05
  `scripts/changelog.mjs`: read conventional commits since the last tag, group by type, write `src/content/blog/en/<version>.mdx` with `draft: true` and a `TODO(hand-written paragraph)` marker; never auto-publish.
  **Exit:** a dry run against a fixture repo produces the expected groups; a tag without commits exits 0 with "nothing to write"; the script never rewrites an existing post.

- [ ] **L3-02 — Blog layout** `M` · dep: L3-01
  Index (newest first, version + date in mono), post layout with TOC, headings, code blocks, and a "generated from commits" footer that names the range.
  **Exit:** 0 axe violations on the index and a post; a post with a long code block scrolls inside the block at 390 px.

- [ ] **L3-03 — Legal templates** `L` · dep: L3-02
  Mentions légales (FR), privacy (EN + FR), terms for the hosted service. Placeholders in `src/data/legal.ts`; the pages render from it.
  **Exit:** in production, a `{{...}}` placeholder aborts the build with the field name; the privacy page lists every category of data the site itself collects (analytics only), not the app's.

- [ ] **L3-04 — French site** `L` · dep: L3-03
  Landing, legal, changelog index, and the site-only docs pages in French; `/fr/` routing; `hreflang` and `lang` correct; typographic apostrophes and non-breaking spaces.
  **Exit:** a French reviewer pass recorded in the verify file; a test asserts every EN page has an FR twin except the generated app docs (documented exception).

- [ ] **L3-05 — Content tests** `M` · dep: L3-04
  Banned-word list, sentence-case check on CTAs, no-emoji scan of built HTML, placeholder scan, `Made with <3` presence on every page.
  **Exit:** each test fails when the rule is broken (proven by a temporary fixture that is reverted).

---

## L4 — Release (est. 1–2 weeks)

**Goal:** launch a site that is fast, indexable, honest, and checkable.

**Wave exit:** every line of `PROMPT.md` §14 verified and pasted into `docs/verify/l4.md`; Lighthouse ≥ 95 on all four categories on the deployed URL.

- [ ] **L4-01 — OG images** `M` · dep: L1-02
  Build-time SVG → PNG for home, docs pages and posts (`@resvg/resvg-js`, Inter subset), 1200×630, title + section + wordmark, one template.
  **Exit:** every page has a unique `og:image` that returns 200; the image renders a 3-line title without overlap (geometry asserted, not eyeballed).

- [ ] **L4-02 — Metadata** `M` · dep: L4-01
  Canonical, `hreflang`, Open Graph, Twitter card, JSON-LD (`SoftwareApplication` + `Organization` + `BreadcrumbList` on docs), sitemap with priorities that mean something.
  **Exit:** the structured data validates; no page has two canonicals; `/fr/` pages point at `/` as the alternate.

- [ ] **L4-03 — Performance** `M` · dep: L1-10
  Budget enforcement: JS ≤ 15 KB on the landing, CSS ≤ 20 KB, LCP < 1.2 s on throttled 4G, CLS 0. Lighthouse budgets in CI with a fail threshold.
  **Exit:** the budget test fails when a 20 KB dependency is added (proven once, then reverted).

- [ ] **L4-04 — Accessibility audit** `M` · dep: L2-10
  axe on every route, keyboard-only walk of the landing and docs, reduced motion, forced colours, zoom 200 %.
  **Exit:** 0 violations; the keyboard walk is recorded step by step; zoom 200 % does not clip the nav or the hero.

- [ ] **L4-05 — Analytics, gated** `S` · dep: L3-04
  Snippet only when `PUBLIC_ANALYTICS_URL` is set; cookieless; no banner while that holds; a test asserts zero third-party requests when unset.
  **Exit:** built HTML with the var unset contains no analytics host; with it set, exactly one script tag and one request.

- [ ] **L4-06 — Demo link health** `S` · dep: L1-02
  Build-time check of `PUBLIC_DEMO_URL`; omit the link when unset or unreachable; a nightly job re-checks and opens an issue when it dies.
  **Exit:** a build with a dead URL omits the link and logs why; the nightly job's first run is pasted into the verify file.

- [ ] **L4-07 — Claims gate** `M` · dep: L2-06
  `npm run test:claims`: compare `claims.ts` values (tool count, version, retention, install time) against the synced artifacts; fail on mismatch; require `verified_at` to equal the documented app version.
  **Exit:** bumping a tool in `tools.json` fails the gate with the claim named; the release run passes with every claim verified.

- [ ] **L4-08 — Launch checklist** `S` · dep: L4-01…L4-07
  Version bump, changelog post, deploy, smoke (10 URLs, 3 viewports), post-deploy header check, sitemap submission, a recorded baseline of the Lighthouse run.
  **Exit:** the checklist is executed against the real URL, not a preview, and pasted into `docs/verify/l4.md`.

---

## Cut line

**2.0 site must ship:** L0, L1, L2, L3-01, L3-02, L3-03, L4-01, L4-02, L4-03, L4-04, L4-07, L4-08.

**May slip without ceremony:** the French site (L3-04) if the translation is not reviewed — an unreviewed French page is worse than none; the blog filter; the docs version switcher's v1 archive if v1 docs are not yet collected.

**Kill criteria**

| Trigger | Decision |
|---|---|
| Docs sync proves unreliable (link rewriting breaks pages) | Keep the sync for content but mark generated pages read-only in review, and add a manual override list; do not fork the docs. |
| Pagefind index over 5 MB | Split the index per version (v1/v2) before removing search. |
| OG rendering slows the build past 90 s | Render only home + docs section roots + posts, keep a static fallback elsewhere. |
| Lighthouse performance < 90 after two passes | Remove the glyph grid and the reveal before touching the type or the copy. |

---

## Wave close protocol

1. Full gate from a clean `npm ci`.
2. Walk the wave's pages against the **built** output (`npm run preview`), at 390 px and 1440 px.
3. `docs/verify/l<wave>.md`: one section per exit criterion, command, trimmed real output, verdict.
4. Add anything you decided during the wave to `docs/decisions.md`.
5. Report in the shape defined in `PROMPT.md` §12.
6. Do not start the next wave on a red gate or an unwritten verify file.
