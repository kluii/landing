# Analytics

Off by default. When it is on, it measures page views without identifying anyone, and the privacy page says exactly that — because it is true.

---

## 1. The decision in one line

`PUBLIC_ANALYTICS_URL` unset → **zero requests, zero script tag, no banner.** Set → one cookieless script, no banner, and a privacy page that names the provider.

The two halves are inseparable: a script that sets a cookie without a banner is a violation; a banner on a site that sets none is a tax. If the two ever disagree, the site is wrong.

## 2. What "cookieless" has to mean

To stay outside the consent requirement for audience measurement (CNIL exemption), the tool must, at the same time:

1. Measure only for audience statistics (not advertising, not profiling, not cross-site).
2. Use no cookie, no `localStorage`, no `sessionStorage` identifier.
3. Not track a user across sites, and not link the data with other processing.
4. Not use a fingerprint, a device identifier, or a persistent hash that survives a day.
5. Truncate or anonymise the IP before storage (the provider must do it, and it must be documented).
6. Keep raw data ≤ 25 months.
7. Provide an opt-out that works without an account.

If any of these fails, the answer is not "adjust the copy" — it is "enable the banner" or "remove the tool".

## 3. What is measured

- Page views, by path, aggregated.
- Referrer host (not the full URL), aggregated.
- Device class (mobile / tablet / desktop) and browser family.
- Country, at the coarse level the tool produces by default.
- Outbound clicks on the primary CTA, as an event with the destination host only.

The point is activation, not visits: the interesting numbers are "how many people copied the install command" and "how many opened the docs quickstart". Those are two events, and they are the only custom events allowed.

## 4. What is never measured

- Individual journeys, session recordings, heatmaps, scroll depth per user.
- Any identifier that persists across a day.
- Form contents (there are no forms).
- The demo board's usage (it is the app's instance, not the site's).
- Anything from the docs search query text. Pagefind runs locally; the query never leaves the browser, and that must stay true.

## 5. Implementation

- One component, `Analytics.astro`, rendered by `Base.astro` only when `PUBLIC_ANALYTICS_URL` is set.
- It emits one `<script defer src="<url>" data-domain="<host>">`-style tag matching the provider, with no inline config beyond the domain.
- The provider must be self-hosted (or EU-hosted) and named in `docs/decisions.md` when chosen. A US-hosted default is a transfer the privacy page would have to disclose.
- `connect-src` in the CSP lists the analytics host, and only when the variable is set.
- A build test asserts: with the variable unset, `dist/**/*.html` contains no analytics host, and the page performs no third-party request (checked by parsing the HTML for external `script`/`img`/`link` origins).

## 6. Opt-out

- Respect `DNT: 1` and `Sec-GPC: 1` in the analytics component: when either is present, the component does not render the script.
- The privacy page documents the opt-out and the fact that no banner is shown because no consent is required.
- No dark pattern: no "accept all" modal, no pre-checked box, no cookie wall.

## 7. The day a cookie appears

Adding a cookie is a decision that ships in one change, containing all of:

1. A consent banner (refuse as easy as accept, no pre-ticked boxes, no cookie wall).
2. A cookie policy section in the privacy page, with names, purposes and durations.
3. A consent-gated loader: the script loads only after consent.
4. `docs/analytics.md` and `docs/decisions.md` updated.

Shipping the cookie first and the banner "next sprint" is the failure this section exists to prevent.

## 8. Acceptance

- With `PUBLIC_ANALYTICS_URL` unset: no script tag, no request, no cookie, and the privacy page says no measurement happens.
- With it set: exactly one request to the configured host on first load, none before interaction beyond that, and no cookie in `document.cookie` or in the storage API.
- The test that proves the "unset" case fails if someone hard-codes a script tag in `Base.astro`.
