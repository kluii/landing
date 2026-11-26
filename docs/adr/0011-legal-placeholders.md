# ADR-0011 — Legal pages are templates with placeholders; production builds fail on them

## Status
accepted · 2026-11-26 · Deciders: Wyliam

## Context
A half-filled legal page looks compliant. The operator of a self-hosted instance is whoever runs it; this site's pages describe the hosted instance only.

## Decision
All legal values live in `src/data/legal.ts` as `{{PLACEHOLDER}}`s, overridable by `LEGAL_*` env vars. A production build (`NODE_ENV=production`) fails naming the field while any placeholder survives; preview builds render it visibly. No placeholder may be replaced by an invented value. The host block (name, address, phone) is mandatory — LCEN art. 6-III.

## Consequences
O-02 (operator identity, contact, region) blocks production deploys by design. The privacy page lists only the data the site actually collects.

## Alternatives rejected
| Alternative | Why not |
|---|---|
| Ship with plausible defaults | A made-up SIREN is worse than a failed build |
| Legal pages only in the app | The app cannot know who hosts the cloud instance |
