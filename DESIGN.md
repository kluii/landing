---
version: alpha
name: Klui Site
description: An editorial broadsheet on graphite. Serif headlines over spaced sans-serif body, pill controls, hairline rules, one paper plate for the product. No shadow, no gradient, no brand hue.
colors:
  canvas: "#121110"
  surface: "#191817"
  surface-2: "#201E1C"
  surface-muted: "#262421"
  border: "#2C2A27"
  border-strong: "#413D38"
  ink: "#F4F1EB"
  ink-muted: "#ADA79E"
  ink-subtle: "#948E85"
  primary: "#F5F2EC"
  primary-hover: "#FFFDF8"
  primary-foreground: "#14120F"
  plate: "#E9E5DD"
  plate-ink: "#14120F"
  plate-muted: "#5F5A52"
  danger: "#E8836F"
  focus: "#F5F2EC"
  selection: "#2E2B27"
  glyph: "#1E1C19"
typography:
  display:
    fontFamily: Newsreader
    fontSize: 76px
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-0.025em"
  display-sm:
    fontFamily: Newsreader
    fontSize: 48px
    fontWeight: 400
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  h1:
    fontFamily: Newsreader
    fontSize: 40px
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  h2:
    fontFamily: Newsreader
    fontSize: 32px
    fontWeight: 400
    lineHeight: 1.15
    letterSpacing: "-0.015em"
  h3:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "0.01em"
  lead:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0.02em"
  body:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: "0.02em"
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0.04em"
  label:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.05em"
  mono:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0em"
  mono-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0.02em"
rounded:
  sm: 8px
  full: 9999px
spacing:
  "1": 4px
  "2": 8px
  "3": 12px
  "4": 16px
  "5": 20px
  "6": 24px
  "8": 32px
  "10": 40px
  "12": 48px
  "16": 64px
  "20": 80px
  "24": 96px
  "30": 120px
components:
  nav:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink-muted}"
    typography: "{typography.label}"
    height: 72px
  announcement-pill:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
    typography: "{typography.mono-sm}"
    rounded: "{rounded.full}"
    height: 32px
    padding: 14px
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    height: 44px
    padding: 22px
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.full}"
    height: 44px
  button-ghost:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    height: 44px
    padding: 20px
  plate:
    backgroundColor: "{colors.plate}"
    textColor: "{colors.plate-ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.sm}"
    padding: 16px
  plate-meta:
    backgroundColor: "{colors.plate}"
    textColor: "{colors.plate-muted}"
    typography: "{typography.mono-sm}"
    padding: 8px
  code-block:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.mono}"
    rounded: "{rounded.sm}"
    padding: 20px
  board-column:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
    typography: "{typography.mono-sm}"
    rounded: "{rounded.sm}"
    padding: 8px
    width: 288px
  board-card:
    backgroundColor: "{colors.surface-muted}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.sm}"
    padding: 12px
  tag-chip:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
    typography: "{typography.mono-sm}"
    rounded: "{rounded.full}"
    height: 22px
    padding: 8px
  section-title:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.h2}"
  prose:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
  table-head:
    backgroundColor: "{colors.surface-muted}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    padding: 12px
  footer:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink-subtle}"
    typography: "{typography.mono-sm}"
    padding: 32px
  callout:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.sm}"
    padding: 20px
  error-text:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.danger}"
    typography: "{typography.body-sm}"
  rule:
    backgroundColor: "{colors.border}"
    height: 1px
  rule-strong:
    backgroundColor: "{colors.border-strong}"
    height: 1px
  focus-ring:
    backgroundColor: "{colors.focus}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.full}"
    size: 2px
  selection:
    backgroundColor: "{colors.selection}"
    textColor: "{colors.ink}"
  glyph-grid:
    backgroundColor: "{colors.glyph}"
    textColor: "{colors.ink-muted}"
    typography: "{typography.mono-sm}"
---

# Klui Site — Design System

The source of truth for `klui-site`. A component that disagrees is wrong, even when it looks fine. A token that is not here does not exist.

This revision takes **Midday** (the supplied style reference) as its structural model and inverts it onto Klui's graphite ground. §0 states exactly what was kept, changed and refused, so the direction can be vetoed in one read rather than discovered after a build.

---

## 0. The ruling: kept, changed, refused

| Midday device | Klui ruling |
|---|---|
| **Light parchment canvas** (`#dbdad7`) | **Inverted.** The site stays dark (standing instruction): a warm graphite `#121110`, not a neutral black. The parchment survives as the **plate** — one paper panel that holds the product (§11). |
| **Serif display** (Hedvig 72 px, weight 400, -0.025em) | **Kept, re-cast** as Newsreader 400 at 76 px. A serif headline is the whole point: it is what stops the page reading like every other developer landing. |
| **Spaced sans body** (+0.05em at 14 px, +0.025em at 16 px and up) | **Kept**, slightly calmed to +0.04em / +0.02em for a 16 px body. Positive tracking is the editorial signature; it is not a bug to tighten later. |
| **Pill controls** (9999 px on every interactive element) | **Kept on the site only.** The app keeps 4/8 px: a dense tool with pill controls reads like a toy. Marketing and product are different density contexts, and the split is deliberate. |
| **Hairline borders in the canvas colour** | **Kept in spirit, adjusted in value.** "Engraved" needs light-on-light; on graphite a border must be *lighter* than the ground (`#2C2A27` on `#121110`, 1.32:1) to read as a seam. |
| **Flat: zero shadow, zero gradient** | **Kept.** The only depth cues are the surface step, the hairline, and the plate. |
| **One functional colour** (moss `#4caf50`, data only) | **Refused.** The app has no success colour, and the mock must match the app. Colour exists only inside the illustration, as the user's own tag chips. |
| **Dark product screenshot frame** | **Inverted into the plate**: a parchment mat around the dark app mock. Same compositional job — the product is the only depth — opposite polarity. |
| **Centred hero; dropdown carets; trust line; logo wall** | **Partly refused.** The centred headline is kept (a broadsheet masthead); carets, trust line and logo wall are dropped — there are no customers to show and no menus to hide links in. |
| **Pricing toggle, pricing cards, integration pills** | **Not applicable.** No hosted pricing, no integration marketplace. |

Three things are therefore **new** and specific to Klui: the warm graphite ground, the paper plate as the only light surface, and a mono ledger voice (versions, counts, dates) that Midday does not have.

---

## 1. Overview

A broadsheet translated to a product page. One serif headline announces; spaced sans explains; mono states facts; the product is printed on a paper plate. Everything is flat, everything is a hairline, and the page has exactly two light surfaces — the plate and the primary pill — on a warm near-black ground.

Three principles:

1. **Editorial hierarchy, not boxes.** Size, space and a rule do the work. A section is a headline, a paragraph, a plate or a block, and 96 px of air.
2. **Two voices plus a ledger.** Serif announces, sans explains, mono states. Never two in one sentence, never a fourth.
3. **The product is the only picture.** No stock photography, no illustration library, no abstract gradient. A DOM board on a paper plate, a terminal block, a rendered summary.

**Refused:** a second theme, emoji, icon sets, shadows, gradients, glow, marquee, parallax, cursor effects, logo walls, testimonials, pricing tables, a dark-mode toggle.

---

## 2. Colors

### 2.1 Graphite and paper

| Token | Value | Role | Measured |
|---|---|---|---|
| `--canvas` | `#121110` | Page ground, warm near-black | — |
| `--surface` | `#191817` | Code blocks, callouts | ink 15.73 |
| `--surface-2` | `#201E1C` | Board columns, pills, inline code | ink 14.74 |
| `--surface-muted` | `#262421` | Board cards, table head, inset | ink 13.73 |
| `--border` | `#2C2A27` | Hairline seam | 1.32 vs canvas |
| `--border-strong` | `#413D38` | Visible divider, ghost-pill outline | 1.75 vs canvas |
| `--ink` | `#F4F1EB` | Headlines, body, code | 16.73 / 15.73 / 14.74 / 13.73 (canvas / surface / surface-2 / muted) |
| `--ink-muted` | `#ADA79E` | Nav, secondary copy, lead after the first line | 7.90 / 7.43 / 6.96 / 6.48 |
| `--ink-subtle` | `#948E85` | Captions, mono metadata, footer | 5.81 / 5.46 / 5.12 / 4.77 |
| `--primary` | `#F5F2EC` | Primary pill fill ("paper") | 16.73 with foreground |
| `--primary-foreground` | `#14120F` | Text on paper | 16.73 |
| `--plate` | `#E9E5DD` | The product plate (parchment) | 15.01 vs canvas |
| `--plate-ink` | `#14120F` | Text printed on the plate | 14.88 |
| `--plate-muted` | `#5F5A52` | Caption and meta on the plate | 5.44 |
| `--danger` | `#E8836F` | Error text only | 7.10 / 6.68 |
| `--focus` | `#F5F2EC` | Focus ring | 17.6 vs canvas |
| `--selection` | `#2E2B27` | Text selection | — |
| `--glyph` | `#1E1C19` | ASCII grid glyphs | 1.13 vs canvas |

Rules:

- **Warm, never tinted.** Every neutral has a slight red-yellow bias (`R > G > B` by 1–3). A cool gray (`#121212`, `#1f2937`) breaks the parchment lineage and is a defect.
- Text contrast is measured against the surface it sits on. A caption inside a code block is measured against `--surface`.
- Hairlines are decorative (1.3–1.8). Anything a user must perceive as a control boundary uses `--border-strong` at ≥ 3:1 against its own fill, or a fill change.
- `--ink-subtle` is legal at 12–13 px on every surface (4.77 minimum). It is not body copy.
- `--danger` is the only chromatic site token, and only as text. No red banners, no red buttons.
- The **plate is the only large light surface**. Two of them on a page is a layout bug, not a style choice.

### 2.2 Colour inside the illustration

Tag chips in the board mock use the application's rule: a stored hex, tint capped (18 % on dark, 12 % on light), label in ink. Those colours are data, not site tokens: never used for links, buttons, rules or backgrounds.

### 2.3 Print and forced colours

- Print: white paper, black ink, no plate, no glyph grid, links with their URL in parentheses. Docs are printed; the landing is not.
- `forced-colors: active` → UA palette; the glyph grid is hidden, the plate keeps `Canvas`/`CanvasText`.

---

## 3. Typography

Three families, three jobs.

| Voice | Family | Job |
|---|---|---|
| Display | **Newsreader** (variable, OFL, weight 400) | Hero, section headlines, docs page titles, 404 |
| Body | **Inter** (400/500) | Paragraphs, nav, buttons, labels, tables |
| Ledger | **JetBrains Mono** (400) | Versions, counts, dates, URLs, code, plate captions |

| Token | Size / line / weight / tracking | Use |
|---|---|---|
| `display` | 76 / 1.0 / 400 / -0.025em, `clamp(44px, 6.4vw, 76px)` | Hero `h1` only |
| `display-sm` | 48 / 1.05 / 400 / -0.02em | Final CTA, 404 |
| `h1` | 40 / 1.1 / 400 / -0.02em | Docs page title |
| `h2` | 32 / 1.15 / 400 / -0.015em | Section titles |
| `h3` | 20 / 1.3 / 500 / +0.01em (sans) | Sub-headline, limits claim |
| `lead` | 18 / 1.6 / 400 / +0.02em | Hero lead, one intro per section |
| `body` | 16 / 1.65 / 400 / +0.02em | Prose, docs |
| `body-sm` | 14 / 1.5 / 400 / +0.04em | Captions, mock cards, dense rows |
| `label` | 13 / 1.4 / 500 / +0.05em | Nav, buttons, table headers |
| `mono` | 13 / 1.5 / 400 / 0 | Code, terminal, metadata |
| `mono-sm` | 12 / 1.4 / 400 / +0.02em | Plate captions, version line, footnotes |

Rules that are gates:

- **Positive tracking on sans is the signature.** Body 16 px carries +0.02em; 14 px and below carry +0.04em; `label` carries +0.05em. A pass that "tightens" it is a regression, not a polish.
- **The serif never goes below 24 px**, never carries body, labels, nav or buttons. Its weight stays 400 at every size: the form carries authority, not the weight.
- **Negative tracking only on the serif**, and only -0.015 to -0.025em.
- No uppercase, no letter-spaced capitals, no eyebrow above a headline.
- Hero `h1`: three lines maximum at 1440 px, four at 390 px, `text-wrap: balance`.
- Prose width 66 characters max (`max-width: 34em` at 16 px); docs 46 rem.
- Numerals in tables and counts: `font-variant-numeric: tabular-nums`.
- French: typographic apostrophe (’) and non-breaking spaces before `:` `;` `!` `?` `»` and after `«`.

---

## 4. Layout

**Container.** 1200 px max, prose 680 px, docs 46 rem with a 280 px sidebar. Gutters 24 px ≥ 768, 20 px below.

**Section rhythm.** 96 px top and bottom (120 px for the hero and the final CTA), with a 1 px `--border` rule spanning the full viewport at the start of each section after the first. The ground never changes except for the plate.

**Hero (centred, masthead logic).**

```
[nav 72]
                    announcement pill (mono, hairline, pill)
                    display headline, 3 lines max, centred
                    lead, max 52ch, centred, --ink-muted
                    [paper pill: Copy the install command] [ghost pill: Open the demo →]
                    mono spec line: v2.0.0 · AGPL-3.0 · 21 MCP tools
        ┌──────────────── paper plate, up to 1120, bleeds to the gutters ───────────────┐
        │  16 px parchment mat holding the dark board mock                              │
        └───────────────────────────────────────────────────────────────────────────────┘
                    plate caption, mono-sm, --ink-subtle, centred
```

A centred serif headline is a masthead, not a generic SaaS hero: every section below it is left-aligned on the column grid, and that contrast is the structure. No image above the fold.

**Grid.** 12 columns, 24 px gutter. Text spans 6–7 columns; plates and code blocks span 10–12; the limits list spans 8.

**Breakpoints.** 390 (reference phone) / 640 / 768 / 1024 / 1440. Nothing is designed at 1920 that is not readable at 1024.

**Spacing.** 4 / 8 / 12 / 16 / 20 / 24 / 32 / 48 / 64 / 80 / 96 / 120. Only these.

**Nav.** 72 px, transparent over the canvas, hairline bottom. Wordmark 24 px left. Right: `Docs`, `Changelog`, `GitHub` in `label` `--ink-muted`, then a **ghost pill** (`Deploy`). No filled pill in the nav, so the hero keeps the only paper button. Static on the landing, sticky in docs.

---

## 5. Elevation & Depth

Flat, like the reference.

- No `box-shadow` on any component. The mobile sheet gets the only one (`0 -8px 40px rgba(0,0,0,.55)`).
- No gradient. The glyph grid is flat ink on flat ground.
- Depth is three things: the **plate** (a light surface on graphite), the **surface step** (canvas → surface → surface-2 → surface-muted), and the **hairline**.
- The plate sits directly on the canvas: no offset, no rotation, no shadow — a printed plate, not a floating card.
- Scrollbars: thin, `--border-strong` thumb, transparent track.

---

## 6. Shapes

- **Pills** (9999 px) for every control and badge: buttons, announcement pill, tag chips, version badge, docs filter chips.
- **8 px** for every surface: plate, cards, code blocks, callouts, inputs, the mobile sheet.
- **4 px** only for inline code inside a sentence, so it does not read as a button.
- Nothing else. No 0 px control, no 16 px card, no squircle, no free-standing circle.
- Borders 1 px; the only 2 px border is the focus ring.

---

## 7. Components

**Announcement pill.** `--surface-2`, 1 px `--border`, pill, height 32, padding 0 14, `mono-sm` `--ink`, optional trailing `→`. One per page, above the hero headline, linking to a **shipped** release note — never a "coming soon" banner.

**Primary pill (paper).** Height 44, padding 0 22, `label`, pill, fill `--primary`, text `--primary-foreground`. Hover `--primary-hover`; active 1 px translate; focus 2 px `--focus` at 2 px offset. One per viewport region. On the plate it inverts: `--plate-ink` fill, `--plate` text.

**Ghost pill.** Height 44, padding 0 20, transparent, 1 px `--border-strong`, `--ink`, pill. Hover `--surface-2`. It never becomes filled.

**Text link.** `--ink`, 1 px underline at 4 px offset, underline stays on hover, colour does not change. The `→` is mono at 0.9 em, 6 px gap, 2 px translate on hover.

**Plate.** `--plate`, radius 8, 16 px mat, holding the dark board mock; up to 1120 wide, centred, bleeding to the gutters on desktop. Inside, the mock keeps its dark surfaces (`--surface-2` wells, `--surface-muted` cards), separated from the mat by a 1 px rule at 20 % `--plate-muted`. The mock is `aria-hidden`; the caption under the plate is the description, `mono-sm` `--ink-subtle`, centred, prefixed `Plate 1 —` only when there are several.

**Code block.** `--surface`, 1 px `--border`, radius 8, padding 20. Header row: language `mono-sm` `--ink-subtle` left, copy ghost pill (28 px) right. Body `mono` 13/1.5. Horizontal scroll inside the block only.

**Inline code.** `--surface-2`, 1 px `--border`, radius 4, `mono-sm`, padding 0 5.

**Section.** Optional `h2` (serif), optional lead, content, optional mono footnote bottom-right. A section without a headline is allowed (the plate, the final CTA); a section with two headlines is two sections.

**Limits list.** Rows of `h3` claim + `body` explanation, 1 px `--border` between, 24 px vertical padding. No icons, no cards.

**Table.** Header `label` on `--surface-muted`, rows `body-sm`, 1 px `--border`, numeric columns right-aligned, horizontal scroll inside a bordered container on mobile.

**Callout.** `--surface`, hairline, radius 8, padding 20, `body-sm`. No icon, no coloured background; a danger callout uses `--danger` text and a 2 px `--danger` left rule.

**Footer.** Top hairline, 96 px top padding, three columns: wordmark + one-line description; links; mono version line. `Made with <3 by Wyliam` always present, linking to https://wyliam.dev.

---

## 8. Do's and Don'ts

**Do**

- Set the headline in the serif at 400, make it big, and leave air around it.
- Keep the positive tracking on sans — it is the voice of the page.
- Use the plate once, for the product, and nowhere else.
- Let one paper pill be the only filled control in a viewport.
- Write the claim, then the evidence, then the link to the docs.
- Measure LCP: it must be the headline text.

**Don't**

- Don't use emoji, in any language, in any element, including alt text.
- Don't add a brand hue, a second accent, a gradient, a glow, a glass panel or a shadow.
- Don't put the serif in a paragraph, a label, a nav item or a button.
- Don't tighten the body tracking "for polish".
- Don't use pills inside the board mock — the mock is the app, and the app is 4/8 px.
- Don't put two plates on a page, or a plate inside a card.
- Don't invent social proof, prices, or a comparison cell that is not verified.
- Don't hide the install command behind a "Get started" button.

---

## 9. Motion

- One reveal per section: opacity 0 → 1 and `translateY(10px) → 0`, 500 ms, `cubic-bezier(0.2, 0, 0, 1)`, once, `IntersectionObserver` at 15 %. Slightly slower than the app: the page is read, not operated.
- Hover: 140 ms on `color`, `background-color`, `border-color`, `transform` (arrow only).
- Nothing else: no parallax, no marquee, no typewriter, no counters, no cursor followers, no scroll-jacking.
- `prefers-reduced-motion: reduce` → no reveal, no transitions, everything visible immediately.

---

## 10. Iconography

- **No icon library.** The site's icons are typographic: `→` for links, `×` for close, `⌄` for the version switcher, all set in JetBrains Mono at 0.9 em.
- One optional inline SVG for the copy glyph (16 px, stroke 1.5, `currentColor`), in a single component.
- A pill may hold a 12 px glyph and a label; a glyph never stands alone without `aria-label`.
- No emoji, no pictographs, no ASCII art in headings. ASCII belongs to code and to the mock's rhythm line.

---

## 11. Imagery: the plate

The reference's strongest move is a single product screenshot framed as the only depth on a flat page. Klui inverts the polarity: **a parchment plate on a graphite page**, holding a dark board mock.

- The mock is **HTML**, not a screenshot: 288 px columns, `--surface-2` wells, `--surface-muted` cards, tag chips from the app palette, mono metadata, one done card. It stays crisp at any zoom and cannot go stale.
- The plate is the only light surface. Mat 16 px; the mock keeps a 1 px seam; no shadow, no rotation, no perspective.
- The plate is decorative (`aria-hidden`), with a visible caption that carries the meaning for assistive tech.
- On phones the plate becomes a rail inside its own mat: the mock scrolls, the page does not.
- Screenshots are allowed **only in docs**, named with the app version, fixed dimensions, regenerated on release.
- No stock photography, no illustration library, no 3D, no laptop mockup, no fake browser chrome.
- The glyph grid sits behind the hero only, at 5 % ink, masked, static, never behind body text.

---

## 12. Docs theme (Starlight)

Same system, denser.

- Serif `h1`/`h2`, spaced sans body, mono for code and metadata — the same three voices as the landing.
- Override in one file, `src/styles/starlight.css`: `--sl-color-bg* → --canvas`, `--sl-color-text → --ink`, `--sl-color-text-accent → --ink`, `--sl-color-accent-*` → the ink ramp (`#F4F1EB`, `#D8D3CB`, `#ADA79E`), `--sl-color-hairline* → --border`, `--sl-font → Inter`, `--sl-font-system → Inter`, serif applied to `h1`/`h2` by a local rule, `--sl-content-width: 46rem`.
- Sidebar: `body-sm`, 32 px rows, active item marked by a 2 px ink bar and `--ink` text. No pill in the sidebar: pills belong to actions, not navigation.
- Search: `--surface` panel, radius 8, results 32 px, matched term in `--ink`, no highlight colour.
- Admonitions: label word + 2 px left rule; `--ink` for note, `--ink-muted` for tip, `--danger` for danger. No coloured backgrounds.
- Code blocks mirror the landing's, at 16 px padding.
- No purple anywhere: a single default Starlight accent reads as an unfinished template.

---

## 13. Voice

Full policy in `docs/content.md`. The design-relevant part:

- Headlines are statements in the serif; the lead is one spaced sentence in sans; facts are mono.
- Sentence case everywhere. No uppercase, no exclamation, no rhetorical question.
- Numbers only from `claims.ts`, written plainly (`21 tools`, `under five minutes`).
- The limits section uses the same voice as the benefits: no apology, no hedging.
- No emoji. Ever.

---

## 14. Accessibility

- Body ≥ 4.5:1 on its own surface (measured in §2.1); large text ≥ 3:1; the focus ring is 17.6:1 and never hidden.
- Positive tracking helps small sizes but does not excuse low contrast: `--ink-subtle` is the floor at 4.77:1.
- Every interactive element is keyboard reachable in DOM order; the sheet traps focus and restores it; the version switcher is a native `<select>`.
- Skip link in docs; landmarks; one `h1`; heading levels never skip.
- The plate is decorative with a real caption; code blocks are `<pre><code>`; the copy pill has an accessible name that changes with its label.
- `prefers-reduced-motion`, `forced-colors`, zoom 200 % and 390 px are part of the gate.
- Forced colours: the plate keeps `Canvas`/`CanvasText`; the glyph grid disappears.

---

## 15. Assets

| File | Ink | Use on |
|---|---|---|
| `assets/light-logo.png` | `#FFFFFF` | the graphite site — nav, footer, OG |
| `assets/dark-logo.png` | `#0C0C0C` | **on the plate** (a 24 px wordmark printed at the mat's top-left), print, light OG variant |

- The file name describes the ink, not the theme. The plate is the one place in the UI where the dark asset is correct.
- Heights: 24 px nav, 24 px on the plate, 32 px footer, 40 px OG, 48 px 404.
- Clear space: half the logo height. Never recoloured, never shadowed, never on a busy surface.
- Favicon: not the wordmark (illegible at 16 px). A 32 px SVG — `K` in Newsreader 400, `--ink` on a `--canvas` square, 6 px radius.

---

## 16. Implementation notes

- Tokens in `src/styles/tokens.css`, one `:root`. A `prefers-color-scheme: light` block must not exist; a test greps for it.
- Fonts: Newsreader (variable, 400, latin), Inter (400/500), JetBrains Mono (400). Three woff2, preload serif + sans regular, total ≤ 150 KB, `font-display: swap`, `size-adjust` on fallbacks so CLS stays 0.
- Tracking is a token, never a component decision: `--tracking-body: 0.02em`, `--tracking-small: 0.04em`, `--tracking-label: 0.05em`, `--tracking-display: -0.025em`. A component that sets its own `letter-spacing` is a defect.
- Radii: `--radius-pill: 9999px` only on controls and badges; `--radius-surface: 8px` on plate/code/card/callout/sheet; `--radius-inline: 4px` on inline code only.
- The warm-neutral rule is tested: every neutral token must satisfy `R > G > B` with a delta of 1–3. It is what keeps the palette from drifting cool.
- A stylelint rule rejects hex/`rgb()`/`hsl()` outside `tokens.css`, and `letter-spacing` outside the token definitions.
- The contrast test parses `tokens.css` and checks `--ink`, `--ink-muted`, `--ink-subtle` against `--canvas`, `--surface`, `--surface-2`, `--surface-muted`; `--plate-ink` and `--plate-muted` against `--plate`; `--primary-foreground` against `--primary`. It fails if a token drops below 4.5:1 anywhere.
- A geometry test asserts the hero `h1` is the LCP candidate (no `img` or `background-image` above the fold), that the plate never exceeds the container width, and that the plate is the only element with a computed background of `--plate`.
- The no-emoji test scans the built HTML for emoji ranges and reports page plus character.
