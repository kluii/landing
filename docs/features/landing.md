# The landing, section by section

Implementation checklist for `/` and `/fr/`. Copy is locked in `docs/content.md` §2; visual rules in `DESIGN.md`. This file says what each section contains, what it must not contain, and how to check it.

The page is a broadsheet: a centred serif masthead, then left-aligned sections on a 12-column grid, with one paper plate carrying the product.

---

## 1. Nav

- Height 72 px, static on the landing, hairline bottom, transparent over the canvas.
- Left: wordmark (`assets/light-logo.png`, 24 px, `alt="Klui"`).
- Right: `Docs`, `Changelog`, `GitHub` in `label` (`13 px / 500 / +0.05em`), `--ink-muted`, hover `--ink`.
- Far right: a **ghost pill** `Deploy` → `/docs/v2/quickstart` (44 px, 1 px `--border-strong`). No filled pill in the nav: the hero keeps the only paper button on the page.
- Below 768 px: wordmark + a 40 px menu button; the sheet is a dialog with the same four items and a close control. Focus trapped, `Esc` closes, focus returns.
- No active-tab underline on the landing (one page). Docs show the section in their own nav.

**Check:** keyboard-only reaches every item; the sheet does not scroll the page behind it; the ghost pill is 44 px on touch; the nav contains no filled control.

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
- Actions: one paper pill (primary, copies the command) and one ghost pill (secondary, demo board). One row ≥ 640 px; stacked full width below. Both 44 px.
- Spec line: `mono-sm`, `--ink-subtle`, items separated by `·` with 8 px gaps, values from `claims.ts` and `package.json`.
- Copy action: copies the single command from `snippets.ts`, flips the label to `Copied` for 2 s, announces via `aria-live="polite"`. No modal, no scroll, no toast library.
- If `PUBLIC_DEMO_URL` is unset the secondary pill is absent and the primary stays centred. The page must not look broken without it.
- No image, no `background-image`, no glyph grid behind the text of the hero headline: the LCP element is the `h1`.

**Check:** LCP is the `h1`; 0 CLS; the copy pill is keyboard operable; the demo pill is absent (not dead) when unconfigured; the headline never exceeds three lines at 1440 px.

## 3. The plate

The product is printed on paper: a parchment mat on the graphite page.

- Plate: `--plate` (#E9E5DD), radius 8, 16 px mat on all sides, width up to 1120, centred, no shadow, no rotation, no perspective. It is the only light surface on the page besides the primary pill.
- Inside: the board mock, keeping the app's own dark surfaces (`--surface-2` wells, `--surface-muted` cards), separated from the mat by a 1 px rule at 20 % `--plate-muted`.
- Optional: a 24 px `assets/dark-logo.png` wordmark printed at the mat's top-left (the one place the black-ink asset is correct). If used, it sits outside the mock, not on top of it.
- Three columns, five cards: one with a coloured tag, one with a mono due date, one with initials, one done, one plain. Titles are real work from the pilot (`Wire the digest`, `Fix the drop index`, `Export markdown`), never lorem ipsum.
- Column names come from the app's `classic` template, so the mock matches what a user gets.
- The mock is `aria-hidden`; the caption under the plate is the accessible description: `Plate 1 — a board from the pilot, five cards, one finished.` in `mono-sm` `--ink-subtle`, centred.
- No hover, no drag, no cursor change: it is a printed plate, not a demo. The live board is the demo pill.
- Below 640 px the plate keeps its 12 px mat and the mock becomes a rail inside it (`overflow-x: auto`, snap, `overscroll-behavior-x: contain`); the page never scrolls sideways.

**Check:** exactly one plate on the page and none inside a card; 390 px has no page-level horizontal scroll; the third column is reachable by swiping inside the plate; the caption is read and the mock is not.

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
