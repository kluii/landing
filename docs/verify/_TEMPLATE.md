# Wave L<n> — verification

> One section per exit criterion, in `ROADMAP.md` order. Command, real trimmed output, verdict. A red gate is recorded red and the wave stops.

Environment: commit `<sha>`, branch `<branch>`, Node `<version>`, app tag `<v2.0.0>`, date `<YYYY-MM-DD>`.

## Gate

```
$ npm ci && npm run format:check && npm run typecheck && npm run lint
…
$ npm test
… (files, tests, duration)
$ npm run build
… (pages, time, dist size)
$ npm run test:links && npm run test:a11y && npm run test:claims && npm run lint:content
…
```

## L<n>-<nn> — <task title>

### Exit: <criterion, copied verbatim from ROADMAP.md>

```
$ <command>
<real output, trimmed to the lines that prove it>
```

Verdict: PASS | FAIL

## Visual check

Captures: `docs/verify/captures/l<n>-1440.png`, `docs/verify/captures/l<n>-390.png`.
Reviewed: hero line breaks, mock overflow, code block scroll, footer presence, focus ring.

## Deviations

| What | Why | Where recorded |
|---|---|---|
| … | … | ADR-NNNN / decisions.md S-nn |

## Open items handed to the next wave

- …
