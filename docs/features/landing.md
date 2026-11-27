# The landing, section by section

Implementation checklist for the two landing variants (ADR-0015): `/` + `/fr` sell Klui Cloud, `/selfhosted` + `/fr/selfhosted` sell self-hosting. `Landing.astro` renders one section registry per `variant`; copy is locked in `docs/content.md` §2 (self-hosted strings) and lives in `src/data/copy.ts` under `LANDING[lang][variant]`. Visual rules in `DESIGN.md`.

The page is a broadsheet: a centred serif masthead, then left-aligned sections on a 12-column grid, with one paper plate carrying the product.

---

## 1. Nav

- Height 72 px, static on the landing, hairline bottom, transparent over the canvas.
- Left: wordmark (`assets/light-logo.png`, 24 px, `alt="Klui"`), linking to the variant's home.
- Right, per variant (ADR-0015):
  - cloud: `Self-hosted` → the other landing, `Changelog`, `GitHub`;
  - self-hosted: `Docs`, `Cloud` → the other landing, `Self-hosted` (current, `aria-current="page"`), `Changelog`, `GitHub`.
  - The link to the other landing is the point of the split: a real label, never a footnote.
- Far right, the variant CTA (44 px ghost pill, 1 px `--border-strong`): cloud → `Open Klui Cloud` at `PUBLIC_CLOUD_URL` (unset in dev: disabled pill, `Cloud address not configured`, marked `data-cloud-unconfigured`; a production build fails on the marker); self-hosted → `Copy the install command` anchored to `#install`.
- Below 768 px: wordmark + a 40 px menu button; the sheet is a dialog with the same items and a close control. Focus trapped, `Esc` closes, focus returns.
- No active-tab underline on the landing. Docs show the section in their own nav.

**Check:** keyboard-only reaches every item; the sheet does not scroll the page behind it; the ghost pill is 44 px on touch; the nav contains no filled control; the cloud nav has no `/docs` link (e2e `landing-split.spec.ts`).

## 2. Hero (centred masthead)

```
                       [ v2.0.0 — close-out summaries, 21 MCP tools  → ]
                    A kanban for projects that end.
      Klui is a fast, self-hosted board where a link is the invite, agents read
      and write through MCP, and every project closes with a summary you can hand over.
              [Copy the install command]   [Open the live demo board →]
                 v2.0.0 · AGPL-3.0 · self-hosted · 21 MCP tools
```

- Announcement pill: `--surface-2`, 1 px `--border`, pill, 32 px, `mono-sm`, optional trailing `→`; it links to the **shipped** release note for that version. It never says "coming soon".
- `h1`: `display` (Newsreader 400, `clamp(44px, 6.4vw, 76px)`, -0.025em), centred, `text-wrap: balance`, max 3 lines at 1440 px, max 4 at 390 px.
- Lead: `lead` (18 px, +0.02em), `--ink-muted`, `max-width: 44ch`, centred. One sentence.
- Actions, per variant: cloud = paper pill `Open Klui Cloud` (or the disabled unconfigured pill) + ghost `Prefer to self-host?`; self-hosted = paper pill (copies the command) + ghost `Prefer the cloud?` (+ the demo ghost only when `PUBLIC_DEMO_URL` is set). One row ≥ 640 px; stacked full width below. All 44 px.
- Spec line: `mono-sm`, `--ink-subtle`, items separated by `·` with 8 px gaps, values from `claims.ts` and `package.json`.
- Copy action: copies the single command from `snippets.ts`, flips the label to `Copied` for 2 s, announces via `aria-live="polite"`. No modal, no scroll, no toast library.
- If `PUBLIC_DEMO_URL` is unset the secondary pill is absent and the primary stays centred. The page must not look broken without it.
- No image, no `background-image`, no glyph grid behind the text of the hero headline: the LCP element is the `h1`.

**Check:** LCP is the `h1`; 0 CLS; the copy pill is keyboard operable; the demo pill is absent (not dead) when unconfigured; the headline never exceeds three lines at 1440 px.

## 3. The plate

The product is printed on paper: a parchment mat on the near-black page (the only warm surface, ADR-0015).

- Plate: `--plate` (#E9E5DD), radius 8, 16 px mat on all sides, width up to 1120, centred, no shadow, no rotation, no perspective. It is the only light surface on the page besides the primary pill.
- Inside: `AppShot.astro` — a `<picture>` with `srcset` mobile (390×844) behind `(max-width: 639px)` and the desktop capture (1600×1000) as the default `<img>`, explicit `width`/`height`, `loading="eager"`, `fetchpriority="high"`, `decoding="async"`, one-sentence alt. Files: `src/assets/app-desktop.png`, `src/assets/app-mobile.png` — drop the real captures in, flip `APP_SHOT_PLACEHOLDER`, nothing else changes.
- Until a capture ships, the classic placeholder frame renders: the plate's inner `--surface` + `--border`, 8 px radius, a stroke image glyph, mono caption `App screenshot — desktop 1600×1000` / `— mobile 390×844`, marked `data-app-shot="placeholder"`; a `NODE_ENV=production` content-lint fails on the marker. No fake UI, no skeleton board, no gradient.
- Optional: a 24 px `assets/dark-logo.png` wordmark printed at the mat's top-left. It sits outside the shot, not on top of it.
- The caption under the plate is the accessible description: `Plate 1 — the app itself, captured at 1600×1000 and 390×844.` in `mono-sm` `--ink-subtle`, centred.
- No hover, no drag, no cursor change: it is a printed plate, not a demo.

**Check:** exactly one plate per landing page and none inside a card; 390 px has no page-level horizontal scroll (e2e `responsive.spec.ts`); the placeholder never reaches a production build.

## 4. The three lines

A single left-aligned section, three rows, no cards, a hairline between rows:

```
No account to join.
A teammate, a client, a stranger: send the link, they pick a display name,
they work. Nothing to install, nothing to verify.        Read the permissions model →

Agents are participants, not integrations.
Per-board keys, 21 MCP tools, and the same permissions a human has.
The setup block is on the page.                          Read the MCP reference →

The project has an end.
Closing a board freezes it and writes a summary from the event log:
what got done, by whom, and what is left.                See a close-out summary →
```

- Claim in `h3` (Inter 500, 20 px, +0.01em — this is the one sans sub-headline, deliberately not the serif), evidence in `body`, link right-aligned on desktop and below on mobile.
- The number in the second row comes from `claims.ts`, never typed.
- Each link resolves in v2; the link gate enforces it.

**Check:** each claim is in `claims.ts` or is a pure capability statement; the section fits one 900 px viewport on desktop.

## 5. Install

- Heading `h2` (serif): `Three commands, one container.`
- Code block with the exact snippet from `snippets.ts`:

```
git clone https://github.com/WyliGr/klui.git
cd klui && cp .env.example .env
docker compose up -d
```

- Below: three short steps in prose (what each line does), then `Full quickstart →`.
- Caption in `mono-sm`: `Tested on a 2 vCPU / 2 GB instance. Postgres 16 is included.` — the instance size is a claim and lives in `claims.ts`.
- No "Get started" button, no terminal chrome (no fake traffic lights), no typing animation.

**Check:** snippet bytes equal `snippets.ts`; the copy pill is keyboard operable; the block scrolls inside itself at 390 px.

## 6. The end

- Heading `h2` (serif): `The project ends, and the summary writes itself.`
- One paragraph (≤ 3 sentences) on why it comes from the event log rather than a hand-written report.
- A rendered close-out block on `--surface` with a hairline and 8 px radius: title line, `18 of 24 cards done in 46 days` in `mono`, three subsections (`Done`, `Remaining`, `People`), a mono ASCII rhythm line. It reads like a document, not a card in a card.
- Link: `Read the close-out spec →`.
- Must not imply the summary is AI-generated. It is computed.

**Check:** the block reflows at 390 px without horizontal scroll; the ASCII line does not wrap mid-glyph (it is in a `pre` with `overflow: auto`); the heading is the serif.

## 7. Agents

- Heading `h2` (serif): `Point an agent at the board.`
- One paragraph: per-board key, scope, same permissions as the human, revocation.
- Code block with the MCP config JSON from `snippets.ts`, key placeholder `kb_YOUR_KEY`.
- Two links: `MCP reference →`, `Setup panel →`.
- Mono footnote: `21 tools · JSON-RPC 2.0 · POST /mcp`.

**Check:** the JSON parses (test), the placeholder is obviously a placeholder, the tool count matches `claims.ts`.

## 8. What it does not do

- Heading `h2` (serif): `What it does not do`
- Four rows from `docs/content.md` §8: `h3` claim + `body` explanation, hairline between, no icons, no cards.
- No "coming soon", no apology, no roadmap hint.
- Closing line: `If one of these is a blocker, Klui is not the right tool yet.`

**Check:** every limit is true for the documented app version; the section exists in the built HTML (a content test asserts the heading).

## 9. Final CTA and footer

- Final block, centred: `display-sm` serif line `Run it in five minutes.`, the primary copy pill again (same component, same snippet), and one sentence under it: `No account, no licence key, no telemetry unless you turn it on.`
- Footer: hairline top, 96 px top padding, three columns: wordmark + one-line description; links (`Docs`, `Changelog`, `GitHub`, `Licence`, `Privacy`); mono line `Klui 2.0.0 · site 2.0.0` and `Made with <3 by Wyliam` linking to https://wyliam.dev.
- The footer is on every route, including `/404`.

**Check:** the footer string is asserted on every built page; the version line matches both `package.json` files.

## 10. Behaviour without JavaScript

- The page renders fully: elements start visible, and the reveal script only adds the hidden-then-shown class when motion is allowed and the observer exists.
- The copy pill is not rendered at all without JS; the `<pre>` stays selectable. No dead button.
- The nav sheet has a no-JS fallback: the same links in a plain list inside `<noscript>`.

**Check:** disable JS, load the page, confirm every section is visible and every link reachable.

## 11. French version

- Same structure and same plate, translated copy from `src/content/` — not a separate implementation.
- H1: `Un kanban pour les projets qui se terminent.`
- French runs longer: the headline may take four lines at 1440 px, and a sentence is shortened rather than the type reduced.
- Typographic apostrophe (’) and non-breaking spaces before `:` `;` `!` `?` `»` and after `«`.
- `lang="fr"` on `<html>`, `hreflang` both ways, `EN / FR` as two plain links in the nav, no dropdown.

**Check:** `hreflang` matches the canonicals; the French page passes the same axe run; no French string overflows a pill.
