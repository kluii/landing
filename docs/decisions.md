# Locked decisions

Every decision below is closed. Reopening one requires an ADR with the alternative, its cost, and a human ruling — not a copy edit.

The register exists because a landing is edited by people who were not in the room, and because a site is the easiest place in a project to let a claim drift away from the code.

Status: **locked** · **open** (needs a human input before the dependent task).

---

## Stack and structure

| ID | Decision | Why | ADR |
|---|---|---|---|
| S-01 | **Astro + Starlight, static output.** No SSR adapter, no serverless function, no request-time work. `dist/` is the product. | A landing and docs that need a server to render text are slower, more expensive and more fragile than a folder of files. | ADR-0001 |
| S-02 | **No client framework.** No React/Vue/Svelte/Solid. Client JS is limited to the copy button, the mobile sheet, the version switcher, and Starlight's own bundle. | Every KB of framework ships to a phone to render text that was already rendered at build time. | ADR-0006 |
| S-03 | **The site and the app never import each other.** The only coupling is `scripts/sync-docs.mjs` reading a checkout, and the claims manifest naming a version. | Two repos that import each other cannot be released independently. | ADR-0004 |
| S-04 | **Docs content is generated from the application repository at the release tag.** The site never forks technical documentation. | Two copies of a quickstart diverge within one release, and the wrong one is always the one indexed. | ADR-0004 |
| S-05 | **`/docs/v2` is current, `/docs/v1` is frozen.** v1 pages are never edited after publication. | People migrating from v1 need the truth about v1, not a rewritten memory of it. | ADR-0007 |
| S-06 | **Search is Pagefind**, built at build time, no backend, no third-party service. | A docs search that phones a vendor is a privacy claim the site cannot make. | ADR-0001 |
| S-07 | **Every docs page has a `.md` twin and appears in `llms.txt`.** | Agents read documentation too, and a raw markdown URL is how they do it well. | ADR-0008 |

## Visual

| ID | Decision | Why | ADR |
|---|---|---|---|
| S-08 | **Dark only, one theme, no toggle.** `color-scheme: dark`; a print stylesheet goes white for paper. | The product is dark-first, and a toggle doubles the contrast surface for no reader benefit. | ADR-0002 |
| S-09 | **Monochrome chrome. No brand hue.** The accent is the ink (white fill, near-black text). | The app is monochrome; a coloured landing would advertise a product that does not exist. | ADR-0003 |
| S-10 | **Colour appears only inside product illustrations**, from the app's tag palette. | The only colour the product really has is the user's own tags. Showing it inside the mock is honest; painting the site with it is not. | ADR-0003 |
| S-11 | **The hero is DOM text, and the board is an HTML mock, never a screenshot or an iframe.** | LCP stays text, the mock stays crisp at any zoom, and it cannot go stale or leak a cookie. | ADR-0009 |
| S-12 | **One ASCII texture (the glyph grid) and no illustration library.** | The texture is the identity; an illustration library is a stock photo with extra steps. | ADR-0003 |
| S-13 | **No emoji, ever, in any language, including alt text and changelog subjects.** | Enforced by a test on the built HTML, because "we won't" is not a mechanism. | ADR-0003 |
| S-28 | **The landing is an editorial broadsheet.** Serif display (Newsreader 400) for headlines only, sans body with positive tracking, mono for facts. | Will's brief: the previous landing was "too techy". The serif/sans contrast is the one device that reads as editorial rather than as another developer template, and it survives translation to the dark ground. | ADR-0014 |
| S-29 | **Positive tracking on sans is a rule, not a taste.** +0.02em on 16 px, +0.04em at 14 px and below, +0.05em on labels; the serif carries -0.015 to -0.025em. | It is the page's voice. A "polish" pass that tightens it silently removes the identity; a token plus a lint rule is the only way it survives a redesign. | ADR-0014 |
| S-30 | **Pills on the site, 4/8 px in the app.** Every site control is 9999 px, every surface 8 px. | Marketing and product are different density contexts; a dense board with pill controls reads like a toy. The split is deliberate and stated so nobody "harmonises" it later. | ADR-0014 |
| S-31 | **Warm graphite, not neutral black.** `#121110` and a neutral ramp with `R > G > B` by 1–3. | It keeps the reference's parchment lineage after inversion. A cool `#121212` breaks it and makes the site a different brand from the page it was designed from. | ADR-0014 |
| S-32 | **One paper plate holds the product.** Parchment mat around the dark board mock, once per page, never nested. | It is the reference's "the product is the only depth" move, inverted so the dark app sits on paper instead of a dark screenshot on a light page. | ADR-0009 |
| S-33 | **No functional colour on the site.** Midday's moss green is refused. | The app has no success colour; importing one would make the mock lie about the product. Colour exists only as the user's tag chips inside the illustration. | ADR-0003 |
| S-34 | **Centred hero (masthead), left-aligned sections below.** | A broadsheet centres its front-page headline; the body is columns. It is also the one hero composition the anti-slop pass cannot call generic, because the rest of the page is deliberately asymmetric. | ADR-0014 |

## Copy and claims

| ID | Decision | Why | ADR |
|---|---|---|---|
| S-14 | **Every number displayed is backed by `claims.ts`, which names a source path and the app version it was verified against.** The release gate fails on a mismatch. | The v1 landing shipped a tool count that lagged two releases behind the app. A number without a source is a rumour. | ADR-0005 |
| S-15 | **No invented social proof**: no testimonials, no logo wall, no "trusted by", no user counts, no star counts. | There are no customers yet. Inventing one is the fastest way to lose the only audience this product has. | ADR-0005 |
| S-16 | **No pricing page until a hosted tier exists.** The primary CTA is self-hosting. | A pricing page for a service nobody can buy is a broken promise with a table on it. | ADR-0005 |
| S-17 | **No competitor comparison table unless every cell is verified and dated.** If a cell cannot be verified in ten minutes, the row is deleted. | "Trello has no free guests" is false; a comparison that lies once is worthless afterwards. | ADR-0005 |
| S-18 | **A "what it does not do" section is mandatory** and is versioned with the release. | The limits are the proof that the benefits are measured rather than marketed. | ADR-0005 |
| S-19 | **No newsletter, no waitlist, no email capture in 2.0.** | An address collected without a retention rule, a privacy page and a real sender is a liability. | ADR-0005 |
| S-20 | **Banned words:** powerful, seamless, supercharge, revolutionary, game-changing, AI-powered, blazing fast, effortlessly, unleash, 10x. | A tool's landing is read by people who will notice the sentence does not mean anything. | ADR-0005 |

## Legal, analytics, i18n

| ID | Decision | Why | ADR |
|---|---|---|---|
| S-21 | **Analytics off unless `PUBLIC_ANALYTICS_URL` is set; cookieless only; no banner while that holds.** | A banner on a site that sets no cookie is a tax paid for nothing; a cookie without a banner is a violation. | ADR-0010 |
| S-22 | **If a cookie ever appears, the banner ships in the same change** — not later. | The two are one decision, and splitting them is how sites end up non-compliant for a quarter. | ADR-0010 |
| S-23 | **Legal pages are templates with placeholders** (`{{OPERATOR}}`, `{{CONTACT}}`, `{{HOSTING_REGION}}`); a production build with a surviving placeholder fails. | A half-filled legal page is worse than a missing one: it looks compliant. | ADR-0011 |
| S-24 | **The operator of an instance is whoever runs it.** The site's legal pages describe the hosted instance; the app ships its own templates for self-hosters. | The app cannot know who hosts it; the site knows exactly who hosts the cloud. | ADR-0011 |
| S-25 | **English is the source, French ships.** Generated app docs are exempt from the FR parity test until their translation is reviewed. | Machine-translated technical documentation is a support burden disguised as localisation. | ADR-0012 |
| S-26 | **The changelog is generated from conventional commits plus one hand-written paragraph, always `draft: true`.** | An auto-published changelog reads like a git log and says nothing about why the release matters. | ADR-0013 |
| S-27 | **`Made with <3 by Wyliam` in the footer of every page, linking to https://wyliam.dev.** | Product rule, every project. | — |

## Open decisions

| ID | Question | Blocks | Default if unanswered |
|---|---|---|---|
| O-01 | The public URL of the demo board (`PUBLIC_DEMO_URL`). | L1-02, L1-04, L4-06 | The link is omitted; the section renders without it. |
| O-02 | The legal operator identity, contact address, hosting region. | L3-03, L4-08 | Production build fails; preview builds show the placeholders. |
| O-03 | Analytics provider and its URL, or none. | L4-05 | No analytics; no script tag; no banner. |
| O-04 | Where the frozen v1 docs come from (an archive of the old site, or none). | L2-04 | v1 is not published; the switcher shows v2 only, with a note. |
| O-05 | The repository URL and the hosted-instance URL used in the install snippet. | L1-05, L4-02 | `github.com/WyliGr/klui` and the snippet stays readable, the copy action still works. |
| O-06 | Domain(s): apex, docs subdomain, demo subdomain. | L4-02 | One origin; docs under `/docs`. |
