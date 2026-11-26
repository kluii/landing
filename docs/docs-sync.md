# Docs sync: one source of truth

The application repository owns technical documentation. The site publishes it. There is no second copy to maintain, and no scenario in which the site documents behaviour the app does not have.

---

## 1. What is generated, what is written here

| Content | Owner | Where it lives |
|---|---|---|
| Architecture, API, MCP, permissions, security, deployment, testing, features | App repo (`docs/*.md`, `docs/features/*.md`) | copied into `src/content/docs/en/v2/` |
| Quickstart intro, FAQ, limits, "why self-host", v1→v2 migration note | Site | `src/content/docs/en/v2/_site/` |
| Changelog and release notes | Site (generated draft + human paragraph) | `src/content/blog/` |
| Legal | Site | `src/content/legal/` |

Generated pages carry `generated: true` and `app_version` in their frontmatter; site-only pages carry `generated: false`. The docs layout prints that fact in mono under the title: `generated from klui 2.0.0` or `written for this site`. A reader can tell which is which, and so can a reviewer.

---

## 2. The sync script

```
node scripts/sync-docs.mjs --from ../klui --tag v2.0.0 [--check]
```

Steps:

1. Read `../klui/package.json` → `appVersion`.
2. Read the app's `docs/` tree; expect this exact set: `architecture.md`, `api.md`, `mcp.md`, `permissions.md`, `security.md`, `deployment.md`, `testing.md`, `decisions.md`, and `features/*.md`. A missing expected file is a hard failure with the path.
3. Copy each file to `src/content/docs/en/v2/<slug>.md`, where `<slug>` is the file name without extension (`features/board-interaction.md` → `features/board-interaction`).
4. Inject frontmatter: `title` (first `# ` heading), `description` (first paragraph, first sentence, ≤ 160 chars), `sidebar.order` from a map in the script (`quickstart` first, `faq` last), `generated: true`, `app_version`.
5. Rewrite links: `docs/api.md` → `/docs/v2/api`; `docs/features/x.md` → `/docs/v2/features/x`; `./y.md` → sibling; an absolute `http(s)` link is untouched; a link to a file that does not exist in the expected set fails the run.
6. Write `src/generated/app-version.txt`, plus `tools.json`, `env.json`, `install-time.txt` copied from the app's artifacts (the app publishes them at release; if absent, the claims gate fails with the artifact name).
7. In `--check` mode, do all of the above into memory and diff against the working tree; exit 1 on any difference. CI uses `--check` for pull requests, and the plain run for the release branch.

The script is idempotent: a second run produces the same bytes. It never touches `_site/`, `content/blog/`, or `content/legal/`.

---

## 3. Versioning

- `/docs/v2` is the current set, regenerated at every release of the app.
- `/docs/v1` is a frozen copy of the previous line's docs, committed once, never regenerated. Its frontmatter carries `frozen: true`, and the layout renders a banner: `This is the documentation for Klui 1.x. It is frozen and no longer updated.`
- The switcher appears only when v1 exists. It links to the same slug in the other version **only if that page exists there**; otherwise it links to the other version's index.
- A v1 page never links to a v2 feature page as if it existed. Cross-version links go through the index.

## 4. `.md` twins and `llms.txt`

At build time, for every docs page:

- Emit `dist/docs/<path>.md` containing the page's markdown body (no nav, no frontmatter, a single `# Title` at the top). For synced pages this is the app's file with its links already rewritten to site paths.
- Emit an entry in `dist/llms.txt`:

```
# Klui documentation
> Klui is a self-hosted kanban where links are invites and agents work over MCP.

## Docs
- [Quickstart](https://example.com/docs/v2/quickstart.md): one compose file to a working board
- [MCP reference](https://example.com/docs/v2/mcp.md): the 21 tools and their arguments
```

Rules:

- The `.md` twin is generated from the same source as the HTML, never hand-written.
- `llms.txt` lists every docs page exactly once, with a one-sentence description taken from frontmatter.
- Both are excluded from the sitemap and both are `text/markdown; charset=utf-8` (configured on the host).
- A page without a description fails the build: an `llms.txt` line with no sentence is noise.

## 5. Editing rules

- **Never edit a generated page in the site repo.** The next sync overwrites it; `--check` fails in CI and the reviewer sees the diff. Change the app's doc, release, re-sync.
- A site-only page is written in MDX only if it needs a component; otherwise plain markdown, so its `.md` twin is clean.
- A documentation change that alters behaviour ships with the code change in the app repo, in the same PR. The sync runs at the release; the site is rebuilt after the app image is published.

## 6. Failure modes and what they mean

| Symptom | Cause | Fix |
|---|---|---|
| `missing expected doc: docs/mcp.md` | App renamed or moved a doc | Update the expected set and the sidebar map in the same commit as the app change |
| `link target not in the expected set` | A doc links to a file the site does not publish | Either publish it (add to the set) or fix the link in the app |
| `--check` dirty with no local edit | The app tag moved | Re-run the sync against the new tag, review the diff, commit |
| `.md` twin missing | A page added outside the collection | Add it to the collection; the build fails otherwise |
| `llms.txt` entry 404s | Slug mismatch after a rename | Add a redirect and keep the old slug in `llms.txt` for one release |
