# Documentation site

Starlight, restyled to the product, generated from the app repository, versioned, searchable, and readable as markdown.

---

## 1. Page inventory

| Page | Origin | Sidebar order |
|---|---|---|
| `/docs/v2` (index) | site (`_site/index.md`) | 0 |
| `/docs/v2/quickstart` | site (`_site/quickstart.md`) | 1 |
| `/docs/v2/deployment` | app | 2 |
| `/docs/v2/mcp` | app | 3 |
| `/docs/v2/permissions` | app | 4 |
| `/docs/v2/security` | app | 5 |
| `/docs/v2/api` | app | 6 |
| `/docs/v2/architecture` | app | 7 |
| `/docs/v2/features/*` | app | 8, alphabetical |
| `/docs/v2/faq` | site | 90 |
| `/docs/v2/limits` | site | 91 |
| `/docs/v2/why-self-host` | site | 92 |
| `/docs/v2/migrate-from-v1` | site | 93 |
| `/docs/v1/*` | frozen | — (own group) |

The sidebar order comes from the sync script's map, not from the app's file order: a doc whose position depends on `ls` reorders itself every time someone adds a file.

## 2. Starlight configuration

```js
starlight({
  title: 'Klui',
  logo: { src: './assets/light-logo.png', alt: 'Klui' },
  customCss: ['./src/styles/starlight.css'],
  social: [{ icon: 'github', label: 'GitHub', href: GITHUB }],
  sidebar: [ /* built from the sync map + site pages */ ],
  pagination: false,
  tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 3 },
  head: [ /* OG + JSON-LD per page */ ],
})
```

- `pagination: false` on purpose: prev/next at the bottom of a 20-page docs set encourages linear reading of pages that are reference material.
- The TOC is on the right on ≥ 1280 px, collapsed on smaller screens.
- `logo` uses the white-ink PNG; Starlight renders it on the dark canvas.
- Social: GitHub only. No Discord, no X, no LinkedIn — channels that do not exist should not be linked.

## 3. Layout and theme

- Tokens from `tokens.css`; overrides in `starlight.css` (§12 of `DESIGN.md`).
- Sidebar 280 px, `body-sm`, 32 px rows, active item with a 2 px ink bar and `--ink` text; no filled active background.
- Content width 46rem, prose 66 characters. `h1`/`h2` in Newsreader 400 (serif), `h3` in Inter 500 with +0.01em, body 16 px at +0.02em, `label` at +0.05em.
- Nav 72 px, sticky; the only pill in the docs chrome is the search trigger — pills belong to actions, not navigation.
- Code blocks: `--surface`, 1 px border, radius 8, copy button in the header row, horizontal scroll inside the block.
- Tables: hairline rows, mono for numbers, horizontal scroll on mobile.
- Admonitions: label word + 2 px left rule (`--ink`, `--ink-muted`, `--danger`); no coloured backgrounds, no icons.
- Search: Pagefind UI restyled to the code-block surface; the trigger is a ghost pill (36 px), the input 40 px, results 32 px rows, no highlight colour.

## 4. Search

- Pagefind indexes the built HTML at build time; the index is stored under `/_pagefind/`.
- `data-pagefind-body` on `<main>` so navigation and footers are not indexed; `data-pagefind-ignore` on the version banner and the edit link.
- The index is split per version (`v1`, `v2`) and the search UI is scoped to the current version; searching v2 must never surface a v1 page without saying so.
- No query analytics, no "recent searches" storage: the query stays in the browser.
- A test asserts the index is non-empty and that a known term (`expected_updated_at`) returns the API page in the top three.

## 5. Versioning

- v2 is generated at every release. v1 is a frozen snapshot committed once.
- The switcher is a `<select>` (native, keyboard-friendly) labelled `Version`, rendered only when more than one version exists.
- The v1 banner: `This is the documentation for Klui 1.x. It is frozen and no longer updated.` in a callout, before the content, and the page title carries `(v1)`.
- Cross-version links are allowed only to the other version's index, never to a specific page that may not exist there.

## 6. Markdown twins

- Every page emits `dist/docs/<path>.md` with the body only, links rewritten to absolute site URLs (so the file is useful outside the site), and a first-line `# Title`.
- For generated pages, the twin is the app's source with the same link rewriting; this is what makes `/docs/v2/api.md` a clean hand-off to an agent.
- `llms.txt` is generated from the collection: title + one-sentence description + absolute `.md` URL.
- Twins are excluded from the sitemap, allowed by `robots.txt`, served as `text/markdown`.

## 7. Docs-specific traps

1. **The sidebar reordering itself** when a file is added — order from the map, not the filesystem.
2. **A link to a heading that was renamed in the app** — anchor checking in the link gate, every build.
3. **A generated page edited in the site repo** — `sync-docs --check` fails in CI; the fix is in the app.
4. **Starlight's purple** — override `--sl-color-accent*` in one file; check a focus ring specifically.
5. **Search indexing the nav** — `data-pagefind-body` on `main` only.
6. **A code block that scrolls the page instead of itself** — `overflow-x: auto` on `pre`, `min-width: 0` on its grid/flex parent.
7. **A `.md` twin that renders MDX components as raw tags** — twins are generated from markdown sources only; an MDX page needs a hand-written twin or a component-free fallback.
8. **Version switcher landing on a 404** — it links to the other version's index unless the exact slug is known to exist.
9. **Docs that assume the app's repository layout** — the docs are read by operators, not by contributors; a path in the app repo is prefixed with "in the source tree".
10. **An FAQ that answers a question with a link** — the answer is the sentence; the link is the detail.

## 8. Acceptance

- Every app doc becomes a page; a missing one fails the build.
- Every page has a `.md` twin and an `llms.txt` line.
- The link gate reports zero broken links and zero broken anchors.
- Search returns the API page for `expected_updated_at`.
- The v1 banner renders only on v1, and the switcher appears only when v1 exists.
- axe: zero violations on ten sampled pages, including one with a table and one with a code block.
