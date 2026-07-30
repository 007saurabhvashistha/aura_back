# Feature: Authentication

Owner: Aura Engineering

Status: Implemented (Sprint 1)

## Description

Email/password authentication for Aura using self-hosted JWTs (no external auth
provider). Provides registration, login, a short-lived access token, a rotating
refresh token, logout (revocation), and a protected profile endpoint.

## Business Goal

Give users a secure, private account so their relationship with Aura can persist
across sessions and devices.

## Technical Goal

A clean-architecture auth module (routes → controller → service → repository)
that is provider-agnostic, strongly typed end to end, and secure by default.

## Acceptance Criteria

- [x] A user can register with email + password.
- [x] A user can log in and receive an access + refresh token pair.
- [x] Passwords are hashed (bcrypt) and never stored or returned in plaintext.
- [x] Access tokens are short-lived; refresh tokens rotate on use.
- [x] A used/rotated or logged-out refresh token is rejected.
- [x] Invalid, malformed, or expired tokens return `401`.
- [x] A protected endpoint (`/me`) requires a valid access token.
- [x] All input is validated; validation failures return `422`.
- [x] Auth endpoints are rate limited.
- [x] Production refuses to start with weak/default JWT secrets.
- [x] Unit and integration/API tests pass.

## API

Base path: `/api/v1/auth`. All responses use the standard envelope
`{ status, message, data, errors, meta }`.

| Method | Path       | Auth   | Success | Body |
| ------ | ---------- | ------ | ------- | ---- |
| POST   | `/signup`  | —      | `201`   | `{ email, password, name? }` |
| POST   | `/login`   | —      | `200`   | `{ email, password }` |
| POST   | `/refresh` | Cookie | `200`   | — (reads `refresh_token` cookie) |
| POST   | `/logout`  | Cookie | `200`   | — (reads `refresh_token` cookie) |
| GET    | `/me`      | Bearer | `200`   | — |

`signup` and `login` return `{ user, tokens }` and set the refresh token as an
`httpOnly` cookie (see the Sprint 2 update below). `tokens` contains only the
access token. `refresh` returns a new `tokens` object and rotates the cookie.
`me` returns the `UserProfile`.

> **Sprint 2 update — refresh-token cookies.** As of Sprint 2 the refresh token
> is no longer returned in the response body. It is delivered as an
> `httpOnly`, `Secure` (production), `SameSite` cookie scoped to
> `/api/v1/auth`, and is never accessible to JavaScript. The access token
> stays in memory on the client. Rotation and revocation behavior is unchanged.

### Error codes

| Status | Code | When |
| ------ | ---- | ---- |
| 401 | `invalid_credentials` | Wrong email or password |
| 401 | `invalid_refresh` | Missing/rotated/revoked/unknown refresh token |
| 401 | `expired_refresh` | Refresh token past its expiry |
| 401 | `unauthorized` | Missing/malformed/expired access token on `/me` |
| 409 | `email_taken` | Signup with an existing email |
| 422 | (zod issues) | Input validation failed |
| 429 | `rate_limited` | Too many requests |

## Database

Two tables (Drizzle ORM, migration `drizzle/0000_nice_dark_phoenix.sql`):

- `users` — `id` (uuid pk), `email` (unique), `password_hash`, `name`,
  `created_at`, `updated_at`.
- `refresh_tokens` — `id` (uuid pk, used as the JWT `jti`), `user_id` (fk →
  users, cascade), `token_hash`, `expires_at`, `revoked_at`, `created_at`.

## Edge Cases

- Duplicate signup → `409 email_taken`.
- Login for unknown email still runs a bcrypt comparison to reduce
  user-enumeration timing differences.
- Refresh token reuse after rotation → `401 invalid_refresh` (old row revoked).
- Logout is idempotent — an already-invalid token is treated as logged out.
- The API boots without `DATABASE_URL` (health reports `disconnected`); auth
  calls then return `503 db_unavailable`.

## Security

- Passwords hashed with **bcrypt** (12 rounds); hashes never leave the service.
- **JWT** access tokens (default 15m) signed with `JWT_ACCESS_SECRET`; refresh
  tokens signed with a **distinct** `JWT_REFRESH_SECRET`.
- Refresh tokens are stored **hashed** (SHA-256) and **rotated + revoked** on
  every refresh and on logout (fulfils the "JWT Rotation" requirement).
- **Production guard:** the app fails fast if a JWT secret is missing, shorter
  than 32 characters, a known default, or if both secrets are equal.
- **Rate limiting:** baseline `100 / 15 min` on the auth router; stricter
  `10 / 15 min` on `login` and `signup`.
- **Audit logging:** structured events `auth.signup.success`,
  `auth.signup.rejected`, `auth.login.success`, `auth.login.failure`,
  `auth.token.refresh`, `auth.logout` — never include passwords or tokens.
- Input validated with Zod at the boundary; errors mapped to `422`.
- `helmet` and strict CORS are applied at the app level.

## Testing

- Unit: `tests/auth.schemas.test.ts`, `tests/auth.security.test.ts`
  (validation, bcrypt hashing, JWT round-trips).
- Integration/API (CI-safe, in-memory mocked repository):
  `tests/auth.api.test.ts` — signup/login/refresh/rotation/logout/me plus
  `401/409/422` paths.
- Run: `npm test` (from repo root or the `@aura/api` workspace).

## Environment Variables

See `services/api/.env.example`:

- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` (required & strong in production)
- `JWT_ACCESS_EXPIRES_IN` (default `15m`), `JWT_REFRESH_EXPIRES_IN` (default `7d`)
- `DATABASE_URL` (Neon), `CORS_ORIGIN`

## Deployment

Provide strong, distinct `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`
(≥ 32 chars) via secrets management. Run migrations with
`npm run db:migrate --workspace @aura/api`.

## Future Improvements (out of Sprint 1 scope)

- RBAC / roles.
- Email verification and password reset.
- Background cleanup of expired refresh-token rows.
- Device/session listing and per-session revocation.
