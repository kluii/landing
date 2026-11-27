# ADR-0003 — Monochrome chrome, no emoji, one ASCII texture

## Status
accepted · 2026-11-26 · Deciders: Wyliam

## Context
The app is monochrome; a coloured landing would advertise a product that does not exist. Emoji read as decoration and are banned in every language, enforced by a test on the built HTML rather than by discipline.

## Decision
Surfaces, type and rules are grayscale (warm ramp, R>G>B). The accent is the ink: a paper-white fill with near-black text for the single primary control. Colour appears only inside the illustration (the board mock's tag chips, from the app's stored tag colours, tint capped). The only texture is one static, masked ASCII glyph grid behind the hero. Icons are typographic (`→`, `×`, `⌄` in JetBrains Mono) or a single 16 px stroke SVG in one component.

## Consequences
`lint-source.mjs` fails on hex outside tokens.css and on emoji in source; `content-lint.mjs` fails on emoji and banned words in built HTML. Starlight's default purple accent is overridden in exactly one file (src/styles/starlight.css).

## Alternatives rejected
| Alternative | Why not |
|---|---|
| One brand hue as accent | The app has none; inventing one makes the mock lie about the product |
| Icon library | A package of pictograms for a page that needs three arrows |
| Emoji as icons | Banned by test; also unreadable at 16 px and inconsistent across platforms |
