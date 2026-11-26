# ADR-0010 — Analytics off unless PUBLIC_ANALYTICS_URL is set; cookieless; no banner while that holds

## Status
accepted · 2026-11-26 · Deciders: Wyliam

## Context
A banner on a site that sets no cookie is a tax; a cookie without a banner is a violation. The two are one decision.

## Decision
With `PUBLIC_ANALYTICS_URL` unset: zero script tags, zero requests, no banner — asserted by a test on built HTML. With it set: exactly one cookieless `<script defer>`, the analytics host added to `connect-src` in the CSP, `DNT: 1`/`Sec-GPC: 1` respected, and the privacy page naming the provider. If any CNIL-exemption condition fails, the answer is "enable the banner" or "remove the tool", never "adjust the copy". If a cookie ever appears, the banner, the cookie policy and the consent-gated loader ship in the same change.

## Consequences
The privacy page states plainly that no measurement happens when the variable is unset. O-03 default: no analytics.

## Alternatives rejected
| Alternative | Why not |
|---|---|
| Always-on analytics with a banner | A banner nobody needed |
| Cookieless analytics always on | Measurement the visitor did not ask for; the exemption is conditional, not decorative |
