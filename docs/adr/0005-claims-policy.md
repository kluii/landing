# ADR-0005 — Claims policy: every number has a source and a verified version

## Status
accepted · 2026-11-26 · Deciders: Wyliam

## Context
The v1 landing shipped a tool count two releases behind the app. A number without a source is a rumour; there are no customers yet, so no invented social proof either.

## Decision
`src/data/claims.ts` is the only place a number is declared: value, source path in the app repo, synced artifact, `verifiedAt`. `npm run test:claims` compares values against `src/generated/*` artifacts, requires `verifiedAt` to equal the documented app version, fails on stale (unreferenced) claims, and scans built HTML for the printed tool count. A production build fails on any unverified claim; pre-release, claims marked `pending` (e.g. install time, until the app records the measurement) are reported and fail only production. No testimonials, no logo wall, no star counts, no pricing page, no unverified comparison cells; the "what it does not do" section is mandatory and versioned with the release.

## Consequences
Adding a number to the site means adding a claim first. The release gate re-reads the artifacts, so a bumped tool count fails until reviewed.

## Alternatives rejected
| Alternative | Why not |
|---|---|
| Numbers inline in components | Not greppable against the app; drifts silently |
| Trust the release manager | The v1 incident is the counter-example |
