# ADR-0009 — The hero is DOM text; the board is an HTML mock, never a screenshot or iframe

## Status
accepted · 2026-11-26 · Deciders: Wyliam

## Context
An image hero makes the LCP a PNG on a slow phone and hides the text from screen readers. A stale screenshot is a false claim. An iframe of the app leaks cookies and doubles the payload.

## Decision
The hero H1 is DOM text (the LCP element). The product picture is one parchment plate holding a real DOM board mock (three columns, five cards, tag chips in app palette colours), `aria-hidden` with a visible mono caption. The live demo is a separate link, omitted at build time when `PUBLIC_DEMO_URL` is unset or unreachable. Screenshots are allowed only in docs, named with the app version.

## Consequences
LCP is measurable as text; the mock cannot go stale. A geometry test asserts the plate is the only `--plate` element and never exceeds the container.

## Alternatives rejected
| Alternative | Why not |
|---|---|
| Screenshot of the app | Goes stale; trap #2; LCP becomes a PNG |
| Embedded app iframe | Cookies/CSP swamp; ~200 KB; trap #9 |
| Generated illustration | Stock-adjacent decoration; the product is the only picture |
