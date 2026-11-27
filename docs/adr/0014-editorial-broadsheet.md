# ADR-0014 — The landing is an editorial broadsheet on warm graphite

## Status
accepted · 2026-11-26 · Deciders: Wyliam

## Context
The previous landing was "too techy". The Midday style reference was inverted onto Klui's graphite ground (DESIGN.md §0): serif display (Newsreader 400) for headlines only, Inter body with positive tracking (+0.02em at 16 px, +0.04em below, +0.05em labels — a rule, not a taste), JetBrains Mono for facts, pill controls on the site vs 4/8 px in the app, hairlines instead of shadows, and one parchment plate as the only light surface holding the product. Centred masthead hero, left-aligned sections below.

## Decision
The token set, the three type voices and the plate rule are fixed in DESIGN.md and enforced by tests (warm ramp, contrast on real surfaces, letter-spacing only in tokens.css, dark-only). A "polish" pass that tightens the body tracking or puts the serif in a paragraph is a regression (AGENTS.md §5 trap 13).

## Consequences
The identity survives redesigns because it lives in tokens and tests, not in a component's opinion. Where the anti-slop skill pushes decoration, DESIGN.md wins; where it pushes structure, it wins over instinct.

## Alternatives rejected
| Alternative | Why not |
|---|---|
| Generic developer-landing hero (left text, right image) | The exact template the brief rejects |
| Neutral black ground | Breaks the parchment lineage; the ramp is warm R>G>B |
| Serif in body or buttons | Mixes the voices; the serif announces, never explains |
