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

- [x] **Step 2 — Prisma OTP model + AuthSession review**
  - `prisma/models/otp.prisma` — `Otp` model (`phone`, `codeHash`, `purpose`, `expiresAt`, `usedAt`, `attempts`, `createdAt`) + `OtpPurpose` enum (`LOGIN`, `RESET_PASSWORD`).
  - `AuthSession.id` → `String @id @default(uuid())` (UUID = `sid`). `replacedById` → `String?`.
  - Removed redundant `@@index([refreshTokenHash])` (`@unique` already indexes it).
  - Migration `20260827120000_add_otp_and_auth_session` created + applied; client regenerated.
  - Note: DB was behind schema (missing `phone`/`status`/`passwordHash`/`AuthSession`); migration also synced pre-existing drift on `User` and `Page`.
  - Decisions made: `sid` = UUID; OTP stored as hash (`codeHash`).

- [x] **Step 3 — Password service (Argon2id)**
  - `@node-rs/argon2` installed (Rust binding, prebuilt, no node-gyp).
  - `src/auth/services/password.service.ts` — `hash()` + `verify()` with Argon2id, OWASP params (19 MiB, t=2, p=1).
  - Registered in `AuthModule` providers + exports.
  - Note: `Algorithm` is a `const enum` — unusable with `isolatedModules: true` (TS2748); used literal `2` (Argon2id).
  - Hash/verify sanity-checked.

- [x] **Step 4 — User service (DB-backed)**
  - `src/prisma/prisma.module.ts` — `@Global()` module exporting `PrismaService`.
  - `UsersService` rewritten: `findByPhone`, `findById`, `createByPhone`, `setPassword` (Prisma).
  - `AuthService.validateUser` now: phone lookup → status `ACTIVE` check → `passwordHash` present → `PasswordService.verify`.
  - `LocalStrategy` uses `usernameField: 'phone'`.
  - App boots clean; DI resolves; routes mapped.

- [x] **Step 5 — OTP service**
  - `src/auth/services/otp.service.ts` — `request()` + `verify()`.
  - OTP: 6-digit `crypto.randomInt`, HMAC-SHA256 hash (server secret) stored, never plaintext.
  - Single-use: atomic `updateMany where usedAt null` → `count === 1` (replay/concurrency safe).
  - Expiry (`expiresAt`), brute-force (`attempts` cap), request rate-limit (`maxRequests` per window).
  - Config added: `otp.secret`, `otp.requestWindowSeconds`; `OTP_SECRET` added to `.env`.

- [x] **Step 6 — Token service**
  - `src/auth/services/token.service.ts` — `signAccessToken(claims)`, `generateRefreshToken()`, `hashRefreshToken()`, `newJti()`.
  - Access claims typed `{ sub, sid, jti }`; JWT signed via configured `JwtService` (RS256).
  - Refresh token: 32-byte `randomBytes` base64url, stored as SHA-256 hash (high-entropy → no HMAC key needed).

- [x] **Step 7 — Session service**
  - `src/auth/services/session.service.ts` — `create`, `findByRefreshHash`, `findById`, `rotate`, `revokeOne`, `revokeAllForUser`, `revokeFamily`, `touch`.
  - `rotate`: atomic claim (`updateMany where revokedAt null`) → concurrent refresh gets `count 0` → revokes whole family.
  - Reuse detection: presenting a revoked/expired token → `revokeFamily`.
  - `familyId` = `randomUUID()` on create, preserved across rotation; `replacedById` = predecessor.
  - Integration-tested against DB: create → rotate → reuse throws → family revoked. UUIDv7 id confirmed (time-ordered `01…` prefix).

- [x] **Step 8 — Cookie utilities**
  - `src/auth/services/cookie.service.ts` — `setAccessToken`/`setRefreshToken`/`clearAuthCookies`, `accessTokenName`/`refreshTokenName`.
  - Flags: `httpOnly`, `secure`, `sameSite`, `path=/`, `maxAge`. `__Host-` prefix when secure + no domain.
  - Refactor: `jwt.accessTtl` (string `15m`) → `jwt.accessTtlSeconds` (number `900`) — single source for JWT `expiresIn` and cookie `maxAge`; dropped `JwtSignOptions` cast.

- [x] **Step 9 — JWT strategy rewrite**
  - Extract JWT from HttpOnly cookie via `ExtractJwt.fromExtractors` + `cookie-parser` (in `main.ts`).
  - Verify RS256 public key, then server-side: load user → `ACTIVE` check → load session by `sid` → `isActive` (not revoked, not expired).
  - Returns `{ userId, phone, sessionId }` on `req.user`.
  - Added `SessionService.isActive` helper. App boots clean.

### Remaining

- [ ] Step 10 — Guards
- [ ] Step 11 — CSRF
- [ ] Step 12 — Controllers/endpoints
- [ ] Step 13 — Status enforcement
- [ ] Step 14 — Login state endpoint

## Open decisions

1. OTP delivery — console/log for dev, SMS later?
2. Cookie prefix — `__Host-` vs `__Secure-` (subdomain)?

Resolved: OTP at rest = hash (`codeHash`); `sid` = UUID (`AuthSession.id`).
