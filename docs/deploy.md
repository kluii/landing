# Deployment

A folder of files with the right headers. Nothing to keep alive, nothing to scale, nothing to restart at 3 a.m.

---

## 1. Build

```bash
npm ci
node scripts/sync-docs.mjs --from ../klui --tag v2.0.0
npm run build          # → dist/
```

Build-time environment:

| Variable | Default | Purpose |
|---|---|---|
| `PUBLIC_SITE_URL` | `https://klui.wyliam.dev` | Canonicals, OG URLs, sitemap, `llms.txt` |
| `PUBLIC_DEMO_URL` | unset | The live demo board; the link is omitted when unset or unreachable |
| `PUBLIC_ANALYTICS_URL` | unset | Analytics script; nothing is emitted when unset |
| `PUBLIC_GITHUB_URL` | `https://github.com/WyliGr/klui` | Repo links |
| `PUBLIC_DOCS_VERSION` | `v2` | Which version the docs switcher opens on |
| `LEGAL_OPERATOR` / `LEGAL_CONTACT` / `LEGAL_REGION` | unset | Fill the legal placeholders; missing values fail a production build |
| `SOURCE_DATE_EPOCH` | unset | Reproducible `lastmod` and OG timestamps |

`PUBLIC_*` values are inlined into the HTML at build time. That is fine for a canonical URL and catastrophic for a secret — never put a key in a `PUBLIC_` variable.

## 2. Headers

```
Cache-Control: public, max-age=0, must-revalidate        # *.html
Cache-Control: public, max-age=31536000, immutable       # /_astro/*
Cache-Control: public, max-age=3600                      # images, og/*.png
Content-Type: text/markdown; charset=utf-8               # *.md
Content-Type: application/xml                            # sitemap*
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'; script-src 'self' 'sha256-<inline-hash>'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' <analytics-host>; frame-ancestors 'none'; base-uri 'none'; form-action 'none'
Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()
```

- `script-src` carries a hash only if Astro or Starlight emits an inline script; compute the hash at build and inject it. No `'unsafe-inline'` for scripts, ever.
- `style-src 'unsafe-inline'` is required by Astro's scoped styles; there is no third-party CSS.
- `form-action 'none'` because the site has no form. If a form is ever added, that is a decision, not a header tweak.
- `connect-src` lists the analytics host only when `PUBLIC_ANALYTICS_URL` is set.

**Caddy**

```
klui.wyliam.dev {
  root * /srv/klui-site
  encode zstd gzip
  file_server
  header /docs/*.md Content-Type "text/markdown; charset=utf-8"
  header {
    Strict-Transport-Security "max-age=31536000; includeSubDomains"
    X-Content-Type-Options "nosniff"
    Referrer-Policy "strict-origin-when-cross-origin"
  }
}
```

**Traefik** — a static file server container with the same `headers` middleware; immutable caching on `/_astro/` via a router rule.

## 3. Deploy

```
1. Build from a clean clone at the release tag.
2. Upload dist/ to a versioned directory: /srv/klui-site/releases/<version>/
3. Switch the symlink: /srv/klui-site/current -> releases/<version>
4. Reload nothing (static files); the web server follows the symlink.
5. Smoke: 8 URLs, 3 viewports, headers, sitemap, llms.txt.
```

- Keep the last three releases for rollback: repoint the symlink, no rebuild.
- Deploy is atomic because the symlink swap is. A partial upload never serves.
- The preview host (branches) sends `X-Robots-Tag: noindex` and is behind basic auth or an unguessable hostname.

## 4. Post-deploy smoke

| Check | Expected |
|---|---|
| `/` | 200, `<h1>` present, LCP element is text |
| `/docs/v2/quickstart` | 200, code block, copy button |
| `/docs/v2/quickstart.md` | 200, `text/markdown` |
| `/llms.txt` | 200, every listed URL resolves |
| `/sitemap-index.xml` | 200, no `noindex` URL inside |
| `/404` | 404 status, page renders, footer present |
| `curl -I /` | CSP, HSTS, nosniff, referrer policy present |
| OG image of the home page | 200, `image/png`, 1200×630 |

The smoke script is `scripts/smoke.mjs`, run against the real URL after the swap, and its output is pasted into the release verify file.

## 5. Domains and TLS

- One apex or subdomain serves the site. Docs live under `/docs`; a separate docs subdomain is allowed only if it 301s to the canonical path (one canonical, always).
- The demo board and the app live on different origins. Never proxy the app under the marketing domain: cookies, CSP and cookie scope all become ambiguous.
- Certificates via the host's ACME; HSTS only after the certificate is confirmed working on both apex and `www` (if `www` exists, it 301s to the apex).

## 6. Rollback

```
ln -sfn /srv/klui-site/releases/<previous> /srv/klui-site/current
```

Nothing else. A rollback that requires a rebuild is a rollback that happens forty minutes late.

## 7. Release checklist

1. App release tagged; `sync-docs --check` clean against that tag.
2. `npm run test:claims` green with `verifiedAt` = the new version.
3. Screenshots regenerated for docs (if any changed) and named with the new version.
4. Changelog post merged, `draft: false`, opening paragraph written by a human.
5. `npm run build` from a clean clone; `dist/` size recorded.
6. Deploy, symlink swap, smoke run, headers checked.
7. Sitemap resubmitted only when URLs changed.
8. Baseline Lighthouse recorded (desktop and mobile) in the verify file.
