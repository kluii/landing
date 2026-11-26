# The live demo board

The strongest claim on the page is that a link plus a display name is enough to work. The demo is where a visitor checks it without installing anything.

---

## 1. What it is

- A **public** board on the demo instance, with anonymous write set to `open` and link role `edit` for card content.
- Seeded with a believable short project: four columns, eight to twelve cards, two or three tags with colours, one done card, two comments, one card assigned to an agent label. No real names, no real client, no personal data.
- Reset nightly by the application's demo job (`KLUI_DEMO_RESET=true` on that instance), so a visitor's mess does not become the next visitor's first impression.
- Read-only **not** required: the point is that the visitor can add a card and see it stick. The reset is what makes that safe.

The instance, its reset job and its moderation policy belong to the application's deployment, not to this repository. This repository only links to it.

## 2. Configuration

```
PUBLIC_DEMO_URL=https://demo.example.com/w/demo-team/klui-demo-a4f2
```

- The URL is a `public` board link, so it is indexable by design and safe to print.
- If the variable is unset, the secondary hero action and the "three lines" demo link are omitted. The page must read as complete without them — a missing optional link is not a layout bug.

## 3. No iframe

The app is never embedded:

- Cookies and CSP on a cross-origin frame are a swamp, and a broken third-party frame is a blank rectangle in the hero.
- The app is ~200 KB of JS; embedding it doubles the landing's budget for something the visitor can open in a tab.
- A frame cannot be styled to the site's chrome without pretending it is part of the site.

The hero's board is an HTML mock (`docs/features/landing.md` §3), not the live app.

## 4. Link health

- **Build time:** a `HEAD` request (5 s timeout) to `PUBLIC_DEMO_URL`; a non-2xx omits the link and logs one warning with the status. The build does not fail: a demo outage must not block a docs fix.
- **Nightly:** a scheduled job re-checks the URL and opens an issue (or a Discord message) after two consecutive failures. Two, because a deploy takes a minute and one failure is noise.
- **Release time:** the release checklist includes opening the demo in a browser and adding a card, then deleting it. A link that resolves but shows an empty board is still a broken demo.

## 5. Copy

- Hero secondary: `Open the live demo board`
- In the three lines, the first row's link: `Try it without an account →`
- A caption under the hero mock must not imply the mock *is* the demo: `A board from the pilot. The live demo is a separate, resettable board.`

## 6. What the demo must never contain

- A real person's name, email, or a real client's project.
- A token, a key, or a link to a private board.
- A card describing an unshipped feature (it would read as a promise).
- More than ~12 cards: the demo is a first impression, not a corpus.

## 7. When the demo is down

1. The build omits the link (automatic).
2. On an already-deployed site, the nightly job opens an issue; the fix is on the app's instance, not here.
3. Never replace the link with a screenshot of the demo without labelling it as a capture with its app version — a stale picture is the failure mode this whole section avoids.

## 8. Acceptance

- With the variable unset, no demo link appears anywhere in the built HTML.
- With it set and reachable, exactly one link per location, opening in a new tab with `rel="noopener"`.
- With it set and unreachable, the build succeeds, the link is absent, and the warning names the status code.
- The nightly job's first real run is pasted into the verify file.
