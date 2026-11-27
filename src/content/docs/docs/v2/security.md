---
title: 'Security and abuse'
description: 'Target: OWASP ASVS Level 1 as a checklist, a threat model that names the adversaries, and CI gates that fail.'
sidebar:
  order: 5
generated: true
app_version: '2.0.0'
---
# Security and abuse

Target: **OWASP ASVS Level 1** as a checklist, a threat model that names the adversaries, and CI gates that fail. No adjectives in product copy: the word "unhackable" does not exist here, and neither does "bot-proof".

---

## 1. Assets

| Asset | Why it matters | Where it lives |
|---|---|---|
| Board content | Private work, sometimes a client's project | Postgres, encrypted at rest only if the host does it |
| Credentials | Password hashes, TOTP secrets, recovery codes | Postgres + instance key |
| Tokens | Sessions, agent keys, write links, RSS feeds | Hash at rest, shown once |
| Identity | Emails, usernames, IPs | Postgres, deliberately minimal |
| Instance secrets | Session secret, token pepper, encryption key | `KLUI_SECRETS_DIR` or env, mode 0600 |

## 2. Adversaries and trust boundaries

| Adversary | Capability | Primary controls |
|---|---|---|
| Anonymous internet | Guesses URLs, scrapes public boards, floods signup | Non-enumerable link suffixes, rate limits, moderation, optional Cap |
| Malicious link holder | Has a write token, tries to escalate or destroy | Link role ceiling (no delete, no structure, no export), revocation, `last_used_at` visibility |
| Curious member | Legitimate read, tries to see another board | `can()` + 404-not-403, agent scope, no cross-board search |
| Compromised agent key | Reads/writes its board and nothing else | Board scope as a structural actor property, short expiry, revocation, per-key rate limit |
| Stolen session cookie | Acts as the user until revocation | `httpOnly` + `Secure` + `SameSite=Lax`, rotation on privilege change, session list with revoke, reset invalidates all |
| Malicious instance admin | Has ops rights on a shared instance | **No board content access by design** (D-06); break-glass is documented and audited |
| Host operator | Reads the disk | Out of scope for an app; documented honestly in the README (self-hosting means the host can read the database) |
| Network attacker | Intercepts traffic | TLS required in production, HSTS, secure cookies |

Trust boundaries: browser → server (untrusted input), agent → server (credential, then untrusted input), proxy → server (trust only configured hops), server → Postgres (trusted, same host or a private network).

---

## 3. Secrets

- Required at boot: `KLUI_SESSION_SECRET`, `KLUI_TOKEN_PEPPER`, `KLUI_ENCRYPTION_KEY` (32 bytes, base64).
- Resolution: env → `KLUI_SECRETS_DIR/<name>` → generate + write (0600) in development. In `KLUI_ENV=production`, a missing secret is **fatal**: the process exits with the list of what is missing.
- **Never rotate silently.** A regenerated session secret logs everyone out and reads as "accounts are broken". Rotation is a documented operation that invalidates sessions deliberately.
- TOTP secrets and OIDC client secrets are encrypted with `KLUI_ENCRYPTION_KEY` (AES-256-GCM, random IV per value, AAD = row id).
- No secret is ever logged, echoed in an error, or included in a dump. `logger.ts` redacts `authorization`, `cookie`, `set-cookie`, `password`, `token`, `secret`, `key` fields recursively.

---

## 4. Authentication and sessions

- Passwords: argon2id (memory 64 MB, iterations 3, parallelism 1 as a starting point, tuned to ~250 ms on the target host), min 12 chars, breached-password check at signup (k-anonymity range query against a local list or an offline list; no full password ever leaves the instance), per-account and per-IP throttling, constant-time comparison, no user enumeration on login or reset.
- Sessions: server-side, id = 32 random bytes, stored as `sha256`, cookie `klui_session` (`httpOnly`, `Secure` in production, `SameSite=Lax`, `Path=/`), 30 days absolute, rotated on password change / TOTP change / role change, revoked on reset and logout-all.
- CSRF: double-submit (`klui_csrf` cookie + `X-Klui-CSRF` header) on state-changing cookie-auth requests, compared in constant time. Bearer requests are exempt. A request with `Origin` present and not matching `KLUI_PUBLIC_URL` is rejected.
- TOTP: RFC 6238, 30 s step, ±1 window, replay protection by storing the last accepted step per user, 10 single-use recovery codes (argon2id), regeneration invalidates the old set.
- Reset: 32-byte token, `sha256` at rest, 30 min TTL, single use, anti-enumeration response (`202` always), session invalidation on success. Without SMTP: `503 email_not_configured` and an admin path documented in `docs/deployment.md` — never a fake "email sent".
- OIDC: authorization code + PKCE, `state` and `nonce` in a signed cookie, exact `redirect_uri` match, `provider_account_id` as the stable key, no auto-link by email, provider secrets encrypted, per-provider enable flag, "test this provider" performing a real discovery + token exchange.
- Break-glass: one local admin with a password that SSO cannot disable; documented; its password change requires the current password even when SSO is enforced.

## 5. Authorization

See `docs/permissions.md`. The security-relevant invariants:

- One decision function; every route, tool and subscription calls it.
- Unreadable = `404`, with a byte-identical body and no varying headers.
- Agent scope is structural: a board-scoped key cannot address another board, whatever its owner's role.
- Instance admin is not a board role.
- Every list query is scoped by an authorized board id at the query level, never filtered after loading.

## 6. Input handling

- Every body, query and param is parsed by a Zod schema; unknown keys are rejected (`additionalProperties: false`), not ignored.
- Markdown in card descriptions and comments is rendered from a restricted AST: no raw HTML, no images, no scripts, no `javascript:`/`data:` URLs, links get `rel="nofollow ugc noopener"` and `target="_blank"`. The renderer is tested against a corpus of XSS payloads.
- Uploads: **none in 2.0.** There is no attachment feature; an "attach" affordance does not exist in the UI and `POST /cards/:id/attachments` does not exist. Branding logo upload is the only file path: SVG is sanitised (scripts, `on*` handlers, external references removed) or rejected, PNG is re-encoded, max 512×512 and 256 KB.
- Bodies are capped (1 MB JSON, 5 MB import). Nested depth is capped (10). Arrays are capped per schema.
- No user-controlled string is ever interpolated into SQL (Prisma only), a shell, a file path, or an email header.
- OG rendering: titles are escaped into SVG text, line-wrapped server-side, and capped (2 lines, 60 chars/line). An OG card is never rendered from unescaped user input.

## 7. Abuse

- Token buckets per IP / session / agent key, plus per-board anonymous writes (30/hour default). `429` with `Retry-After`; the client shows the wait.
- Proxy trust: `X-Forwarded-For` is read only when `KLUI_TRUSTED_PROXY_HOPS > 0`, and only the Nth-from-right entry is used. Default 0. A wrong value either bans everyone or bans nobody — both are incidents.
- Bans: application table with `(subject, subject_kind, reason, expires_at)`, admin view, enforced before authorization (a ban leaks nothing). Never fail2ban inside the container: it manipulates host firewall state and cannot see container traffic. Edge banning (CrowdSec/Traefik) is documented as the host-side option.
- Captcha: Cap, self-hosted, **off by default**, enabled per instance, triggered only past a threshold on anonymous writes and (optionally) signup. A captcha is a bot filter, not a security control; it replaces none of the limits above.
- Moderation: the only mechanism that makes an open board survivable. Anonymous writes on a `moderated` board create pending cards, never live content.

## 8. HTTP hardening

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'sha256-<theme-bootstrap>';
  style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self';
  font-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'
Strict-Transport-Security: max-age=31536000; includeSubDomains   (production only)
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()
Cache-Control: no-store on HTML and credentialed JSON
```

`style-src 'unsafe-inline'` is required by the token/theme system; there is no third-party style. The only inline script is the theme bootstrap, authorised by a hash computed at build time (a test asserts the hash matches the served HTML).

## 9. Data lifecycle

- Retention: events 365 days (configurable), sessions cleaned after expiry + 7 days, pending cards 7 days, bans per TTL, digest logs 30 days.
- Account deletion: deletes sessions, TOTP, recovery codes, OAuth accounts, digest prefs, notifications, memberships; boards owned by the user are deleted only after an explicit confirmation naming them; comments are anonymised (`author_id` null, `author_label` "deleted user") rather than removed, so threads stay readable.
- Exports and backups contain personal data: documented as such, with a retention window and a note that the operator is the data controller.
- Logs: no emails, no tokens, no bodies. IPs are logged for security events only (login, ban, rate-limit trip) with a 30-day retention.
- `noindex` on every credentialed URL (`/l/<token>`, RSS, share links, OG previews of link boards). `X-Robots-Tag: noindex` as well as the meta tag, so a bot that does not parse HTML still gets it.

## 10. ASVS Level 1 checklist (implementation map)

| ASVS area | Where |
|---|---|
| V1 Architecture | this file, `docs/architecture.md` |
| V2 Authentication | §4, `docs/features/auth.md` |
| V3 Session management | §4, D-16 |
| V4 Access control | `docs/permissions.md`, `authz.ts` |
| V5 Validation | §6, Zod contracts |
| V6 Cryptography | §3, `lib/secrets.ts` |
| V7 Error handling | `docs/api.md` §1, `lib/errors.ts` |
| V8 Data protection | §9 |
| V9 Communication | §8, HTTPS-only in production |
| V10 Malicious code | dependency policy, `npm audit --omit=dev` |
| V11 Business logic | rate limits, moderation, close-out immutability |
| V12 Files | §6 (branding only) |
| V13 API | `docs/api.md`, `docs/mcp.md` |
| V14 Configuration | `env.ts`, fail-closed secrets |

## 11. CI gates

- `npm audit --omit=dev` — the runtime number. The image installs `--omit=dev`; a dev-only CVE is not a release blocker and quoting the combined count inflates the risk. Fail on `high`/`critical` with a documented allowlist file that names the advisory, the reason, and the expiry date.
- Secret scan (gitleaks or equivalent) over the diff and the tree.
- Fail-closed boot test: production without `KLUI_SESSION_SECRET` must exit non-zero.
- Authz matrix test.
- XSS corpus test on the markdown renderer and OG escaping.
- A test asserting `KLUI_ANALYTICS_URL` unset produces no outbound request.
- A test asserting `/metrics` is `404` by default.

## 12. Disclosure

`SECURITY.md` at the repository root: a contact address, a 72-hour acknowledgement commitment, a scope statement (the app, not the operator's host), and a "please do not test on someone else's instance" line. No bounty is promised.

## 13. Known limitations (state them, do not hide them)

- A self-hosted instance's operator can read the database. End-to-end encryption is not offered, and pretending otherwise would be a lie in a product that promises honesty.
- No attachment scanning because there are no attachments in 2.0.
- Rate limits are per process; a multi-replica deployment needs a shared store (documented as out of scope for 2.0, which ships one process).
- The instance admin can disable 2FA policy, reset passwords, and ban users. That is an ops power with abuse potential, mitigated by the fact that it grants no board content.
