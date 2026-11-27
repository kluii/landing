# ADR-0006 — No client framework; two islands

## Status
accepted · 2026-11-26 · Deciders: Wyliam

## Context
Every KB of framework ships to a phone to render text that was already rendered at build time. The landing budget is ≤ 15 KB of JS.

## Decision
No React/Vue/Svelte/Solid. The only client JavaScript is what Astro ships for: the copy button (clipboard + aria-live), the mobile nav sheet (focus trap, Esc), and Starlight's own bundles (search UI, sidebar). Islands are plain `<script>` modules inside components, no hydration directives.

## Consequences
`npm run test:perf` fails the build if the landing's transferred JS exceeds 15 KB. A component that needs state is a defect to discuss, not a framework to add.

## Alternatives rejected
| Alternative | Why not |
|---|---|
| One framework for "future interactivity" | Pays the budget on every visit for features that do not exist |
| Web components | A framework with extra steps; the two islands need 30 lines total |
