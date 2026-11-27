# Testing and gates

The site has few moving parts, so the tests are about the things that rot silently: links, numbers, copy, and the built output.

---

## 1. Seams

| Seam | Proves | Command |
|---|---|---|
| Build | Astro compiles, schemas validate, pages exist | `npm run build` |
| Types | `.astro` and content schemas are sound | `npm run typecheck` |
| Links | No broken internal link, anchor, `.md` twin or `llms.txt` entry | `npm run test:links` |
| Claims | Every number matches the synced app artifact | `npm run test:claims` |
| Content lint | No emoji, no banned word, no uppercase eyebrow, no placeholder in production | `npm run lint:content` |
| Accessibility | axe on every built route | `npm run test:a11y` |
| Performance | JS/CSS budgets, LCP, CLS | `npm run test:perf` |
| OG geometry | Title/footers never overlap, for 1–3 lines | `npm test` (unit) |
| e2e (Playwright) | Landing split, cross-links, per-route canonical, and the responsive guard: 390/768/1440 px on `/`, `/selfhosted`, `/fr`, `/fr/selfhosted`, one `/docs/v2/` page — `scrollWidth === clientWidth` and no element past the viewport unless contained | `npm run test:e2e` (build + preview first; CI job `e2e`) |
| Visual | 390 px and 1440 px captures reviewed by eye | manual, recorded |

## 2. Link gate

Runs against `dist/` after the build:

1. Parse every `.html`; collect `href` and `src`.
2. Internal paths must resolve to a file in `dist/` (respecting `trailingSlash: never` and `index.html` mapping).
3. Anchors: build the slug set from each target page's `<h2 id>` / `<h3 id>` and require the fragment to exist. A link to `#` fails.
4. Every docs page must have `dist/docs/<path>.md`; every `llms.txt` entry must resolve to a `.md` file and to its HTML page.
5. No link to `localhost`, no `http://` for a first-party URL, no link to a draft.

Output is one line per broken target, with the source page. The gate fails on the first ten and prints the total.

## 3. Claims gate

- For each entry in `claims.ts`: the artifact must exist, its parsed value must equal `value`, and `verifiedAt` must equal the documented app version.
- A claim referenced nowhere in `src/` fails (stale claim).
- A number rendered in a page without a `claims.ts` key fails: the build scans the rendered HTML for digits near the words it knows (`tools`, `days`, `minutes`) and compares against the manifest. False positives are handled by a small allowlist for version strings and dates.

## 4. Content lint

- **Emoji:** scan `dist/**/*.html` for emoji code points and pictographs; report page and character.
- **Banned words:** the list in `docs/content.md` §4, case-insensitive, word-boundary.
- **Eyebrows:** flag an uppercase or `text-transform: uppercase` element immediately preceding an `h1`/`h2`.
- **Placeholders:** in a production build (`NODE_ENV=production`), any `{{...}}` in the output fails, naming the field.
- **Footer:** every page contains `Made with <3 by Wyliam` linking to `https://wyliam.dev`.
- **Tracking:** `letter-spacing` may only be declared in `tokens.css`; a component that sets its own fails. A visual check confirms body text is not `letter-spacing: normal`.
- **Neutral ground:** every dark-ramp token satisfies `max(R,G,B) − min(R,G,B) ≤ 3` (a warm or cool cast fails); the plate tokens stay warm (`R > G > B`).

## 5. Performance budget

Measured on the built site served by the host's preview, throttled to "Slow 4G, 4× CPU":

| Metric | Budget |
|---|---|
| JS on the landing (transferred) | ≤ 15 KB |
| CSS on the landing (transferred) | ≤ 20 KB |
| LCP (landing) | < 1.2 s |
| CLS | 0 |
| Lighthouse performance | ≥ 95 |
| Lighthouse a11y / best practices / SEO | ≥ 95 |
| Font payload | < 150 KB total across three families; serif and sans regular preloaded |
| Largest image | none above the fold; docs images ≤ 200 KB each |

The budget is enforced by a Lighthouse CI assertion file with hard fail thresholds, and by a size check on `dist/_astro/*.js` for the landing route. When the budget fails, the order of what to cut is fixed: glyph grid, then the reveal, then the board mock's third column — never the copy, never the type.

## 6. Accessibility

- axe runs on every route in `dist/` (skip `/404`? no — include it), zero violations, not "zero serious".
- Exactly one `h1` per built page (static assertion in check-a11y; the docs chrome hides its own title when the synced markdown carries one — L5).
- A keyboard walk: skip link → nav → hero actions → mock (skipped, `aria-hidden`) → sections → footer, with a visible ring at every stop.
- The sheet: opens, traps focus, `Esc` closes, focus returns to the trigger.
- `prefers-reduced-motion` disables the reveal and the arrow transition.
- Zoom 200 % on a 1280 px viewport: no clipping, no horizontal page scroll.
- Colour contrast: the token test, plus `--plate-ink` and `--plate-muted` against `--plate`, plus one measured sample of a tag chip in the mock (the tint rule guarantees it).
- The plate: exactly one element per page computes to `background: var(--plate)`, it never exceeds the container width, and the mock inside keeps the app's radii — a pill inside the mock is a defect.

## 7. OG geometry test

For a one-line, two-line and three-line title:

- Render the template to SVG, extract `<text>` baselines.
- Assert the last baseline is at least 40 px above the footer baseline.
- Assert the title block starts above the wordmark's baseline and does not overlap it.

A byte-count or "looks right in the PNG" check cannot see two strings drawn on top of each other.

## 8. Visual review

Two captures per wave, 1440×900 and 390×844, full page, dark:

- Compared against the previous wave's captures for unintended shifts.
- Reviewed for: hero line breaks, mock overflow, code block scroll, footer presence, focus ring.
- Recorded in the verify file with the file paths, not pasted as base64.

A pixel diff is not a gate here; a human look is. The captures are committed under `docs/verify/captures/` with the wave in the name.

## 9. False greens

1. **A build that used a stale docs sync.** `--check` must be part of CI, not only the release script.
2. **A link gate that only checks `href` starting with `/`.** External links still need `rel` and a 200 in the smoke run.
3. **A claims gate passing because the artifact is also stale.** The artifact's `app_version` must match `claims.ts`, both compared to the tag.
4. **An axe run on a dev server.** It must run on built HTML, because Astro can emit different markup in dev.
5. **A Lighthouse run on a warm cache.** Clear it; the number that matters is the first visit.
6. **A screenshot taken after a scroll.** The reveal hides content below the fold; capture full-page with motion disabled.
7. **A "0 broken links" from an empty crawl.** Assert the page count first.

## 10. Verification protocol

`docs/verify/l<wave>.md`, one section per exit criterion:

```md
### Exit: the landing at 390 px passes axe with 0 violations

$ npm run build && npm run test:a11y
built 128 pages in 1.9s
axe: 14 routes, 0 violations

Verdict: PASS
```

Command, real trimmed output, verdict. No invented numbers. A red gate is reported red and the wave stops.
