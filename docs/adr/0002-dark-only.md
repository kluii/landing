# ADR-0002 — Dark only, one theme, no toggle

## Status
accepted · 2026-11-26 · Deciders: Wyliam

## Context
The product is dark-first. A theme toggle doubles the contrast surface (every token pair must pass in both themes) and stores a preference — the site sets no cookie and no localStorage. A flash of light on load is also a CLS/LCP risk on phones.

## Decision
One theme: warm graphite `--canvas #121110`, `color-scheme: dark` on `html`. No `prefers-color-scheme` block exists anywhere in `src/styles` (asserted by tests/tokens.test.mjs). A print stylesheet goes white for paper when docs are printed.

## Consequences
No theme flash, no stored preference, half the contrast test matrix. Readers who prefer light get the browser's reader mode or print. The decision reopens only with a human ruling.

## Alternatives rejected
| Alternative | Why not |
|---|---|
| Light + dark toggle | Doubles the contrast surface; stores a preference the privacy page would have to admit |
| System-follow without storage | Flash of the wrong theme on load |
