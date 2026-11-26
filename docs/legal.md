# Legal pages

Templates, filled by data, gated at build. Not legal advice: a human operator reviews the filled pages before a production deploy, and a French lawyer reviews them once before launch.

---

## 1. Pages

| Path | Language | Purpose |
|---|---|---|
| `/legal/notices` | FR | Mentions légales (LCEN art. 6-III): identity of the publisher, publication director, host |
| `/legal/confidentialite` | FR | Politique de confidentialité (RGPD) |
| `/legal/privacy` | EN | Same content, English |
| `/legal/terms` | FR + EN | Terms of the **hosted** instance only; not published until a hosted tier exists |

The self-hosted operator does not use these pages: the application ships its own templates (legal pages are part of the app per the product brief), because the operator is whoever runs the instance. This site's pages describe **this** instance: the one at `PUBLIC_SITE_URL` and, when it exists, the hosted service.

## 2. Placeholders

All values live in `src/data/legal.ts`:

```ts
export const LEGAL = {
  operator: '{{OPERATOR}}',        // legal name of the publisher
  legalForm: '{{LEGAL_FORM}}',     // e.g. "entrepreneur individuel"
  address: '{{ADDRESS}}',
  contact: '{{CONTACT}}',          // email that actually receives mail
  registration: '{{REGISTRATION}}',// SIREN / RCS, or "dispensé" when it applies
  publicationDirector: '{{DIRECTOR}}',
  hostName: '{{HOST_NAME}}',
  hostAddress: '{{HOST_ADDRESS}}',
  hostPhone: '{{HOST_PHONE}}',
  region: '{{HOSTING_REGION}}',
  updatedAt: '{{UPDATED_AT}}',
};
```

Rules:

- A production build (`NODE_ENV=production`) fails when any value still matches `^\{\{.*\}\}$`, naming the field. Preview builds render the placeholder visibly, so a reviewer sees what is missing instead of a plausible-looking blank.
- The host block is not optional: LCEN requires the host's name, address and phone. "Cloudflare" alone is not an address.
- `updatedAt` is a date, not "recently".
- No placeholder may be replaced by an invented value. An empty field that fails the build is better than a made-up SIREN.

## 3. Mentions légales — required content

1. Publisher: name (or company), legal form, address, contact.
2. Registration numbers where the law requires them (SIREN for a registered business; "dispensé de déclaration" only when it is true).
3. Publication director: a named person, not "the team".
4. Host: name, address, phone.
5. Intellectual property: the site's code is AGPL-3.0; the wordmark and the copy are the publisher's; the docs are under the same licence as the code.
6. Contact for reporting illegal content, with the actual address.

## 4. Privacy — required content

- **Data collected by this site**: analytics only, and only if enabled. No account, no form, no newsletter, no cookie. If analytics is off, the page says so and says it plainly.
- **Legal basis**: legitimate interest for audience measurement (CNIL exemption), or consent if a cookie ever appears.
- **Retention**: the analytics retention period as configured (≤ 25 months for the exemption), and nothing else.
- **Recipients**: the hosting provider, and the analytics provider if self-hosted — named.
- **Transfers**: none outside the EU, or the actual mechanism if there is one.
- **Rights**: access, rectification, erasure, objection, portability; the contact address; the right to complain to the CNIL with its address.
- **Minors**: the product is not directed at children; no age gate is claimed.
- **Cookies**: a sentence stating that the site sets none, and what would change that.
- **The application is separate**: a paragraph explaining that a self-hosted instance's data is controlled by whoever runs it, not by this site.

## 5. What the pages must not do

- Claim a DPO when none is appointed.
- Claim "100 % secure" or "GDPR compliant" as a badge. Compliance is described, not certified.
- Copy a generic policy from a template site without matching the actual data flows (there are almost none here, and the page must say so rather than list categories that do not exist).
- Promise a response time that nobody measures.

## 6. Update triggers

A legal page is updated in the same change as:

- Adding analytics, a cookie, a form, or any third-party script.
- Changing the host or the hosting region.
- Changing the operator identity or contact.
- Publishing a hosted tier (the terms page appears).
- Changing the AGPL licence statement.

The footer link text never changes; the `updatedAt` date does.

## 7. Acceptance

- Production build with a placeholder fails, with the field name.
- The three published pages exist in the right language, with `lang` set correctly.
- Every link on the pages resolves (the link gate covers them).
- The privacy page's list of collected data matches what the site actually does — verified by reading `astro.config.mjs`, the analytics component, and the header configuration, not by trusting the copy.
