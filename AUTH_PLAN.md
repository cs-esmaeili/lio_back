# Authentication System — Plan & Progress

Production-grade authentication for a NestJS app using Passport + PostgreSQL.

## Goal

Primary user identity: Iranian mobile phone number (`09XXXXXXXXX`), unique.

- Primary login: OTP.
- Optional password (Argon2id), not required.
- OTP codes: cryptographically secure, short-lived, single-use, bound to phone + purpose, securely stored, invalidated on use/expiry, brute-force and replay protected.

### User status

- `ACTIVE` / `DISABLED` / `BANNED`.
- Only `ACTIVE` can authenticate or refresh.
- Ban/disable revokes all active sessions immediately.
- An already-issued unexpired access token must NOT be enough to authenticate a banned/disabled user (server-side state check).

### Access token

- Short-lived JWT (5–15 min), RS256.
- Payload: `sub`, `sid`, `jti` only. No sensitive data.
- Stored in HttpOnly + Secure cookie, never localStorage/sessionStorage/JS state.
- Passport JWT strategy reads it from the cookie.

### Refresh token

- Opaque crypto-random value, NOT a JWT.
- Only a hash is stored in PostgreSQL; raw value never stored.
- Stored in HttpOnly + Secure cookie.
- Rotation: use A → invalidate A → issue B → store hash(B).
- Reuse detection: a used/rotated token reappearing revokes the whole token family.
- Concurrent refresh must not consume the same token twice.

### Sessions

- One user, many sessions (Chrome / Firefox / mobile).
- `AuthSession`: id, userId, refreshTokenHash, familyId, expiresAt, revokedAt, lastUsedAt, ip, userAgent.
- Support: individual/current/all revocation, expiration, validation, rotation, reuse detection, revoke on password change / ban / disable.
- PostgreSQL is source of truth. No Redis.

### Auth flow (access token validation)

JWT from cookie → signature verify → expiry verify → load user → check status → load session by `sid` → check expiry → check revocation → authenticated user.

A cryptographically valid JWT must not bypass server-side user/session state.

### Security

- CSRF protection (double-submit token; auth tokens HttpOnly, CSRF token JS-readable).
- Cookies: HttpOnly, Secure, SameSite, Path, `__Host-` prefix where compatible.
- Login state endpoint (`/auth/me`) returns `{ authenticated, user, loading }` — never tokens.
- Protects against: XSS token theft, CSRF, refresh-token theft/replay, JWT replay, session fixation, OTP replay/brute force, password brute force, expired/revoked creds, banned/disabled users, refresh-token DB compromise, concurrent refresh, bad cookie/SameSite config, sensitive data in JWT.

## Stack

NestJS · Passport · PostgreSQL · Prisma · HttpOnly cookies · JWT (RS256) · opaque refresh · OTP · Argon2id · server-side sessions · CSRF.

---

## Steps

### Phase 0 — Foundation

1. **Config, secrets & RSA keys** — env config, RS256 keypair, delete hardcoded secret.

### Phase 1 — Data layer

2. **Prisma schema: OTP model + AuthSession review** — `Otp` model, `sid` decision, migration.

### Phase 2 — Services (pure logic)

3. **Password service (Argon2id)** — hash + verify.
4. **User service (DB-backed)** — replace mock, phone lookup, status check.
5. **OTP service** — generate, hash store, single-use, expiry, rate-limit.
6. **Token service** — access JWT (RS256, `sub`/`sid`/`jti`) + opaque refresh.
7. **Session service** — create/validate/rotate/reuse-detect/revoke.

### Phase 3 — HTTP layer

8. **Cookie utilities** — HttpOnly/Secure/SameSite/Path/`__Host-`.
9. **JWT strategy rewrite** — cookie extraction, RS256 public key, user+session state check.
10. **Guards** — `JwtAuthGuard`, `OptionalAuthGuard` for `/me`.
11. **CSRF** — double-submit token, origin check.
12. **Controllers/endpoints** — otp/request, otp/verify, login, refresh, logout, me.

### Phase 4 — Cross-cutting

13. **Status enforcement** — ban/disable revokes all; password change revokes others.
14. **Login state endpoint polish** — `/auth/me`.

---

## Progress

### Done

- [x] **Step 1 — Config, secrets & RSA keys**
  - RSA 2048 keypair → `keys/jwt-private.pem`, `keys/jwt-public.pem` (gitignored).
  - `src/config/configuration.ts` — typed config factory (namespaces: `app`, `jwt`, `cookie`, `otp`).
  - `app.module.ts` — `ConfigModule.forRoot({ isGlobal: true, load: [configuration] })`.
  - `auth.module.ts` — `JwtModule.registerAsync` with private key + `RS256`.
  - `jwt.strategy.ts` — verify with public key + `RS256`.
  - Deleted `src/auth/constants.ts`.
  - `.env.example` added.
  - Build green; keypair sign/verify verified.

### Remaining

- [ ] Step 2 — Prisma OTP model + AuthSession review
- [ ] Step 3 — Password service (Argon2id)
- [ ] Step 4 — User service (DB-backed)
- [ ] Step 5 — OTP service
- [ ] Step 6 — Token service
- [ ] Step 7 — Session service
- [ ] Step 8 — Cookie utilities
- [ ] Step 9 — JWT strategy rewrite
- [ ] Step 10 — Guards
- [ ] Step 11 — CSRF
- [ ] Step 12 — Controllers/endpoints
- [ ] Step 13 — Status enforcement
- [ ] Step 14 — Login state endpoint

## Open decisions

1. OTP delivery — console/log for dev, SMS later?
2. OTP at rest — hash (recommended) vs plaintext?
3. Cookie prefix — `__Host-` vs `__Secure-` (subdomain)?
4. `sid` — UUID vs Int (`AuthSession.id`)?
