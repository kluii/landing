---
title: 'Authentication'
description: 'Password + TOTP + optional OIDC + break-glass.'
sidebar:
  order: 11
generated: true
app_version: '2.0.0'
---
# Authentication

Password + TOTP + optional OIDC + break-glass. Nothing here is a checkbox: every item has a failure it prevents.

---

## 1. Accounts

- Signup: email, username, password. Username is validated by the shared module (3–32, `[a-z0-9-]`, no leading/trailing hyphen, case-insensitive unique, reserved list).
- The **first account on an empty instance becomes instance admin**. The rule is enforced by a transaction that counts users, not by "whoever loads first".
- `KLUI_REGISTRATION_OPEN` and the runtime setting both apply; closed → `403 registration_closed`.
- Email verification exists (`email_verified_at`) but is not required unless the instance enables it — which requires SMTP, so the setting is unavailable when SMTP is unset (no dead switch).
- No user enumeration on login, reset, or signup-by-email. Signup may reveal a taken *username* (the user chose it) but not an email.

## 2. Passwords

- `argon2id`, tuned to ~250 ms on the target host (memory 64 MB, iterations 3, parallelism 1 as a starting point). Parameters live in one constant and are recorded in the ADR.
- Minimum 12 characters, maximum 256 bytes (argon2 has no reason to see more), no composition rules — length beats symbol theatre.
- Breached-password check at signup and password change: k-anonymity range query or an offline list. The password never leaves the instance in clear.
- Change password requires the current password, even for an SSO account (the local password is the break-glass).
- Throttling: 5 attempts / 15 min per account, 20 / hour per IP, with a constant response for both. A successful login resets the account bucket.

## 3. Sessions

- Server-side; id = 32 random bytes, base64url, stored as `sha256(id)`. The raw id exists only in the cookie.
- Cookie `klui_session`: `httpOnly`, `Secure` in production, `SameSite=Lax`, `Path=/`, no `Domain`, 30 days absolute.
- Rotation on: login (new id), password change, TOTP enable/disable, role change, privilege escalation. The pre-rotation id is deleted, not left to expire.
- `GET /me/sessions` lists id, ip, user agent, created, last seen, current. Revoking one deletes it; revoking the current one signs out immediately.
- `logout-all` deletes every session for the user.
- Password reset invalidates every session (D-16).
- Session cleanup job removes rows expired > 7 days.

## 4. CSRF

- Double submit: `klui_csrf` cookie (not `httpOnly`, `SameSite=Lax`) + `X-Klui-CSRF` header, constant-time compare.
- Only for cookie-authenticated state-changing requests. Bearer requests are exempt (a cross-site page cannot set an `Authorization` header).
- A request with an `Origin` present that does not match `KLUI_PUBLIC_URL` is rejected with `403 forbidden_origin`.
- `Sec-Fetch-Site: same-origin` is accepted as a secondary signal; the double-submit is the control.

## 5. TOTP

- Enrol: `POST /auth/totp/enroll` returns the secret, an `otpauth://` URL and 10 recovery codes — **once**. The secret is stored encrypted; `confirmed_at` stays null until a valid code is presented.
- Verify window ±1 step, replay protection by remembering the last accepted step.
- Policy: `available` (default) / `required` / `disabled`, instance-wide. `required` refuses password-only login with `401 totp_required`, which reveals nothing about the account beyond "this instance requires 2FA".
- Recovery codes: 10, 20+ random chars, argon2id-hashed, single use, regenerable (regeneration invalidates the old set immediately).
- Disabling requires both the password and a valid TOTP code.

## 6. Password reset

- `POST /auth/reset/request` always answers `202` — the response must not reveal whether the account exists.
- Token: 32 random bytes, `sha256` at rest, 30 min TTL, single use, invalidated by a new request.
- `POST /auth/reset/confirm` sets the password, revokes every session, and records a `security.password_reset` event (instance-level, not board).
- **Without SMTP the endpoint fails closed with `503 email_not_configured`.** It never pretends to send. The documented admin path is: an instance admin triggers a reset for a user, the user receives a one-time link out of band. Admin-initiated resets also revoke sessions (the v1 asymmetry is not repeated).
- Rate limited per IP and per account.

## 7. OIDC

- Provider framework, not a hard-coded provider: discovery from `/.well-known/openid-configuration`, claim mapping (`sub`, `email`, `name`, `preferred_username`), stable `provider_account_id = sub`.
- Flow: authorization code + PKCE, `state` + `nonce` in a signed, `httpOnly` cookie, exact `redirect_uri` match.
- Secrets encrypted with the instance key; per-provider enable flag; admin UI with "Test this provider" performing a real discovery + token exchange and showing the actual error.
- **Account linking is explicit.** An existing local account with the same email is never auto-linked. The user signs in locally, then links. Attempting to sign in with a provider whose email matches an existing account answers with a link prompt, not a session.
- A provider failure never locks out the instance: local password login and the break-glass admin remain.

## 8. Break-glass

- One local admin with a password SSO cannot disable. Created at bootstrap; documented in `docs/deployment.md`.
- Its password can be changed with the current password (or, if lost, with direct database access and the documented procedure — an operator with the database can already do anything).
- The admin UI shows a warning when the break-glass account has no TOTP.

## 9. Events and audit

| Event | Recorded when |
|---|---|
| `security.login` | Successful login, with method (password / totp / oidc) |
| `security.login_failed` | Failed attempt (no password, no email in the payload) |
| `security.password_changed` | Self-service or admin-initiated |
| `security.password_reset` | Reset confirmed |
| `security.totp_enabled` / `_disabled` | |
| `security.session_revoked` | By the user, or by logout-all |
| `security.oidc_linked` / `_unlinked` | |

These are instance-level events (no `board_id`), retained 365 days, visible to the user in account settings and to the instance admin in an audit view.

## 10. Passkeys

Not in 2.0. When they land: a device list with name, last used, revoke; the same recovery-code story as TOTP; and WebAuthn as an additional factor, never the only one until a recovery path is proven.

## 11. Acceptance

- Unknown account and wrong password produce the same status, body and comparable timing (measured, not eyeballed).
- Rotating a session invalidates the old cookie on the next request.
- Reusing a recovery code fails.
- Reset revokes every session.
- A local account with the same email as an OIDC identity is not linked until the user signs in and clicks Link.
- With SMTP unset, reset answers `503` and the UI says why.
