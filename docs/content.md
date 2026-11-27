# Content, voice and claims

The landing is a claim surface. Every sentence on it is either a fact about the shipped app, an instruction you can follow, or an opinion clearly marked as one. This document governs all three.

---

## 1. Readers

| Reader | Comes from | Wants in 10 seconds | Kills the page by |
|---|---|---|---|
| The developer | A link, a forum, a colleague | What it is, how it runs, why not Trello | A generic hero and a "Get started" button |
| The team lead | Looking for something small for a 6-week project | Who can join without an account, what happens at the end | A feature grid that never says what it is |
| The agent | `/llms.txt`, a docs page, a crawl | The exact command, the exact tool names | Prose that describes features without naming them |

Write for the first and let the third read the docs. The second decides whether the product category is real; one sentence about the close-out summary does that.

---

## 2. Locked copy

These strings are fixed. Changing one is a decision recorded in this file with the reason, in the same commit.

**Announcement pill:** `v{appVersion} — close-out summaries, {tools} MCP tools` — links to the shipped release note for that version. Only a released fact, never a teaser.

**H1 (hero, /selfhosted):**
`A kanban for projects that end.`

The cloud variant (`/`, ADR-0015) carries its own H1 (`A kanban for projects that end — we run it.`)
and lead in `src/data/copy.ts` under `LANDING[lang].cloud`; the strings above stay locked on
`/selfhosted`, byte-identical.

**Lead:**
`Klui is a fast, self-hosted board where a link is the invite, agents read and write through MCP, and every project closes with a summary you can hand over.`

**Primary action:** `Copy the install command`
**Secondary action:** `Open the live demo board`

**The three lines:**

1. `No account to join.` — `A teammate, a client, a stranger: send the link, they pick a display name, they work. Nothing to install, nothing to verify.`
2. `Agents are participants, not integrations.` — `Per-board keys, {tools} MCP tools, and the same permissions a human has. The setup block is on the page.`
3. `The project has an end.` — `Closing a board freezes it and writes a summary from the event log: what got done, by whom, and what is left.`

`{tools}` is injected from `claims.ts` — never typed.

**Limits section heading:** `What it does not do`
**Footer line:** `Made with <3 by Wyliam`

**Spec line under the actions (mono):** `v{siteVersion} · AGPL-3.0 · self-hosted · {tools} MCP tools`

**Plate caption:** `Plate 1 — the app itself, captured at 1600×1000 and 390×844.`
(Changed in L5 / ADR-0015 with the reason recorded here, per §2: the DOM board mock was
replaced by the real capture slot `AppShot.astro`, so the caption no longer describes a
mock — it names the capture dimensions. FR twin: `Planche 1 — l’application elle-même,
capturée en 1600×1000 et 390×844.`)

Every value in braces comes from `claims.ts` or `package.json`.

---

## 3. Voice

- **Sentence case** everywhere: headlines, buttons, nav, table headers.
- **Short sentences.** If a sentence has three clauses, it has two ideas and belongs in two sentences.
- **Verbs for actions.** "Copy the install command", not "Get started". "Read the docs", not "Learn more".
- **Concrete nouns.** "Board", "card", "column", "agent key", "close-out summary" — the words the app uses on screen. Never "workspace", "project hub", "collaboration space".
- **No second person in headlines**, second person in instructions. A headline says what the thing is; a step says what you do.
- **No rhetorical questions.** "Ready to ship faster?" is answered by closing the tab.
- **No exclamation marks.** None. Not in the changelog either.
- **No emoji.** Enforced by a test on the built HTML.
- **No hedging that hides a fact**: "up to", "may", "can help" are allowed only when the limit is stated in the same sentence.
- **Opinion is allowed and labelled**: "We think a board that never ends becomes a museum" is a position, and it is fine. "The fastest kanban in the world" is a claim, and it is not.
- **One idea per paragraph.** Two-sentence paragraphs are the norm; three is the maximum on the landing.

---

## 4. Banned words and patterns

`powerful`, `seamless`, `seamlessly`, `supercharge`, `revolutionary`, `game-changing`, `next-generation`, `AI-powered`, `blazing fast`, `effortless`, `effortlessly`, `unleash`, `10x`, `synergy`, `unhackable`, `bot-proof`, `hacker-proof`, `military-grade`, `world-class`, `best-in-class`, `trusted by`, `loved by`, `join thousands`.

Patterns that are also banned:

- An uppercase eyebrow above a headline.
- A three-word slogan followed by a paragraph that repeats it.
- "It's not just a X, it's a Y."
- A stat block with no source (`99% faster`).
- A fake terminal window with invented output.
- A testimonial attributed to "Sarah, PM".

The lint list lives in `scripts/content-lint.mjs`; the banned words are a test, not a style note.

---

## 5. What a claim may look like

| Type | Allowed | Example |
|---|---|---|
| Capability | Yes, if the app ships it today | "Anonymous visitors can add a card and mark it done." |
| Limit | Yes, and it is encouraged | "There are no attachments in 2.0." |
| Number | Only from `claims.ts` | "21 MCP tools." |
| Comparison (own terms) | Yes | "Most boards have no way to be rebuilt from an export. This one does." |
| Comparison (named competitor) | Only with a verified, dated cell (§7) | "Trello's free plan includes guest members; Klui's difference is that a guest can drive the board over MCP." |
| Speed | Only with the measurement in the same paragraph | "Cold start to a working board in 4 minutes 12 seconds, measured on a 2 vCPU instance." |
| Security | Only descriptive, never absolute | "Passwords are hashed with argon2id; tokens are stored as hashes and shown once." |
| Roadmap | Never on the landing | — |

A claim about the future is a bug. If a feature is scheduled but not shipped, it waits for the release that ships it; the changelog announces it, the landing does not pre-announce it.

---

## 6. The claims manifest

`src/data/claims.ts`:

```ts
export const CLAIMS = {
  tools: {
    value: 21,
    source: 'klui/server/src/mcp/tools/index.ts (TOOLS.length)',
    artifact: 'tools.json',
    verifiedAt: '2.0.0',
  },
  installMinutes: {
    value: 5,
    source: 'klui/docs/deployment.md §Quickstart (measured on the pilot LXC)',
    artifact: 'install-time.txt',
    verifiedAt: '2.0.0',
  },
  retentionDays: {
    value: 365,
    source: 'klui/server/src/env.ts (KLUI_RETENTION_EVENTS_DAYS default)',
    artifact: 'env.json',
    verifiedAt: '2.0.0',
  },
  appVersion: { value: '2.0.0', source: 'klui/package.json', artifact: 'app-version.txt', verifiedAt: '2.0.0' },
} as const;
```

Rules:

- `value` is what the page prints. Nothing prints a number that is not here.
- `source` is a path in the app repository plus the expression or section, so a human can check it in one minute.
- `artifact` is the synced file the gate compares against (`tools.json`, `env.json`, `app-version.txt`, produced by the sync script from the app checkout).
- `verifiedAt` must equal the app version the site documents. The release gate compares it to `app-version.txt` and fails on mismatch.
- A claim with no artifact is allowed only for a measurement performed by a human, and then `source` names the document that records it (with the date).

`npm run test:claims` fails when: an artifact is missing, a value differs, `verifiedAt` is behind the documented version, or a claim in `claims.ts` is referenced nowhere on the site (a stale claim is a lie waiting to be re-used).

---

## 7. Comparisons

Named comparisons are the highest-risk sentences on the site. The policy:

1. Every cell in a comparison table has a **verification date** and a **source** in a footnote.
2. A cell that cannot be verified in ten minutes is deleted, and the row goes with it.
3. Facts must be stated in the competitor's favour when they are true. Trello has free guest members. Linear has a free plan. Both are fine to write.
4. The comparison must name the difference in **our** terms, not in theirs ("no MCP for board guests", not "Trello is outdated").
5. No table at all is an acceptable outcome, and it is better than one wrong cell.

A comparison table that survives must be checked again at every release, because competitor plans change without notice.

---

## 8. The limits section

Four items, each one line, each true for the released version:

- `No attachments. Cards hold text, tags, an assignee and a date.`
- `No calendar or timeline view. The board is the board.`
- `No mobile app. The web UI works at 390 px; there is nothing to install.`
- `No presence or live cursors. You see changes, not people.`

The list is versioned in `claims.ts` as `limits` with `verifiedAt`. When a limit is removed by a release, it is removed from this list in the same release, and the changelog says so. Removing a limit without shipping the feature is the one edit that must never pass review.

---

## 9. Section copy rules

| Section | Rule |
|---|---|
| Nav | Three links maximum, no "Product / Solutions / Resources" menus |
| Hero | H1 ≤ 10 words, lead ≤ 28 words, two actions |
| Three lines | One claim, one sentence of evidence, one link to the docs |
| Install | The command, three steps, one link to the quickstart |
| The end | One paragraph and a rendered summary; no adjectives |
| Agents | One paragraph, the config block, one link to the MCP reference |
| Limits | Four lines, no apology, no "coming soon" |
| Footer | Legal links, licence, version, `Made with <3 by Wyliam` |

No section may contain a second `h2`. If it needs one, it is two sections.

---

## 10. Numbers and units

- Numbers under ten are spelled out in prose (`three commands`), except in a table, a version, a count of tools, or a measurement.
- Durations: `under five minutes`, `4 min 12 s` when measured. Never `instant`.
- Sizes: `KB` and `MB` for bytes, `ms` for latency, `px` in design docs only.
- Versions: `2.0.0` in the footer and the changelog; `v2` in URLs and the switcher. Never `v2.0` in a URL.
- Dates: `26 November 2026` in prose, `2026-11-26` in mono metadata.

---

## 11. French

- Translated, not transposed: a French sentence that mirrors the English syntax reads like a translation.
- Same locked meaning: the H1 becomes `Un kanban pour les projets qui se terminent.` — a statement, not a slogan.
- Typographic apostrophe (’) and non-breaking spaces before `:` `;` `!` `?` `»` and after `«`.
- Product terms: `tableau`, `colonne`, `carte`, `étiquette`, `agent`, `clé d’agent`, `lien`, `bilan de clôture`, `auto-héberger`. The glossary in the app's `docs/features/i18n.md` is authoritative.
- Machine translation is allowed for a first pass, through the glossary, and is never published without a human pass recorded in the verify file.
- The French page keeps the same layout; a longer string is cut in copy, not shrunk in type.

---

## 12. Changelog voice

- Title: the version and a human phrase — `2.0.0 — the board gets an end`.
- Opening paragraph: why this release exists, two to four sentences, written by a human.
- Then the generated sections: Added / Changed / Fixed / Security, one line each, the commit subject cleaned up (no `feat(web):` prefix).
- Never a list of every commit. A changelog is a reading of the release, not a mirror of `git log`.
- Breaking changes get their own section at the top, with the migration step.
