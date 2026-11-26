# AGENTS.md

Working agreement for `klui-site`. Read `PROMPT.md`, then `ROADMAP.md`, then `DESIGN.md`, then the docs your task names. If you read only this file, you can still make a correct change — that is the test it has to pass.

---

## 1. Run it

```bash
# prerequisites: Node LTS (see .nvmrc), npm
npm ci
npm run dev            # http://localhost:4321
npm run build          # → dist/
npm run preview        # serves dist/ on :4321 — always verify against this, not dev
```

Docs sync needs a checkout of the app repository next to this one:

```bash
node scripts/sync-docs.mjs --from ../klui --tag v2.0.0
```

Without the sync, `npm run build` fails on missing docs. That is intentional: the site does not ship with placeholder documentation.

## 2. Gates (all of them, before every push)

```bash
npm run format:check
npm run typecheck        # astro check
npm run lint             # eslint + no-emoji + no-hex + no-literal-string
npm test
npm run build
npm run test:links
npm run test:a11y
npm run test:claims
npm run lint:content
```

A gate that passes only with a skipped test, a narrowed assertion, or an untracked exclusion is a failed gate. Run it yourself; never push to let CI find out.

## 3. Branch and commit

- `main` is production. Only a merge from `dev`, only with explicit human approval for that release.
- `dev` is integration; everything arrives by PR from a task branch.
- `feat/<topic>`, `fix/<topic>`, `chore/<topic>`, `docs/<topic>`, from `dev`. The topic describes the change.
- Conventional commits: `feat:`, `fix:`, `doc:`, `wip:`, `refactor:`. The commit type is `doc:` while the branch prefix is `docs/` — intentional.
- Small, revertable commits. Every commit signed off (`git commit -s`).
- **Identity before the first commit:**
  - GitHub: `git config user.name "Wyliam" && git config user.email "82271052+WyliGr@users.noreply.github.com"`
  - Forgejo personal: `git config user.name "Hermes" && git config user.email "hermes@wyliam.fr"`
  - Verify: `git config --local user.email` prints something.

## 4. Non-negotiables

1. Astro + Starlight, static output. No SSR, no serverless, no request-time work.
2. No client framework. Two islands, nothing else.
3. No emoji in the UI, in any language, checked by a test on the built HTML.
4. Dark only: one set of tokens, no light block, no toggle.
5. Monochrome chrome, editorial type: Newsreader headlines, spaced Inter body, JetBrains Mono facts; pills for controls, 8 px surfaces, one paper plate. Colour only inside the illustration, from the app's tag palette.
6. No number on the page that is not in `claims.ts` with a source and a verified version.
7. No invented social proof, no pricing page, no comparison cell that is not verified and dated.
8. The install snippet exists once, in `snippets.ts`, and is imported everywhere.
9. Never edit a generated docs page in this repository; change the app's doc and re-sync.
10. Every page carries `Made with <3 by Wyliam` linking to https://wyliam.dev.
11. Never commit or push to `main`.

## 5. Traps (each has shipped as a real bug)

1. A landing that describes the roadmap instead of the product.
2. A screenshot from a build older than the release it illustrates.
3. A hard-coded number that was true once (v1 shipped a tool count two releases behind).
4. Two copies of the install command that drift within one release.
5. A comparison table that misrepresents a competitor (`Trello has no free guests` is false).
6. A docs link to a heading that no longer exists.
7. Starlight's default purple accent surviving the theme override.
8. A hero that is an image: the LCP becomes a PNG and the text disappears for a screen reader.
9. A "live demo" link that 404s because nobody checked it at build time.
10. A cookie banner nobody needed, or analytics with no banner.
11. Dark text at 3.2:1 because contrast was measured against the canvas only.
12. A deploy from a dirty tree, with a footer version that does not match the commit.
13. A "polish" pass that tightens the body tracking, or that puts the serif in a paragraph — both silently delete the identity the page was built for.

## 6. Where things live

| You are changing | Files |
|---|---|
| A section of the landing | `src/components/`, `src/pages/index.astro`, `docs/features/landing.md` |
| A colour, a size, a radius | `src/styles/tokens.css` + `DESIGN.md`, never a component |
| A copy string | `src/data/` (locked copy) or the page, + `docs/content.md` if it is a locked string |
| A number | `src/data/claims.ts` + the artifact it compares against |
| A doc page | the **app** repository, then re-run the sync |
| A legal field | `src/data/legal.ts` |
| An external URL | `src/data/links.ts` |
| A decision | `docs/decisions.md` + an ADR |

## 7. Reporting

End every task with the shape in `PROMPT.md` §12. Write `docs/verify/l<wave>.md` before the wave closes. A claim without a pasted log line is not a result.

## 8. Product rules that survive any redesign

- The site never claims a capability the shipped app lacks; the changelog announces, the landing states.
- Self-hosting is the primary path. No feature is described as cloud-only, ever.
- The footer rule and the AGPL licence stay visible.
- If a section cannot be made honest, it is removed rather than softened.
