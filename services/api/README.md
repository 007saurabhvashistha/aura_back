# Aura API (`services/api`)

Node.js + Express + TypeScript backend for Aura, following clean architecture.

## Structure

```
src/
├── index.ts                 # Entry point (starts the HTTP server)
├── app.ts                   # Express app factory (no listen)
├── config/
│   └── env.ts               # Env parsing/validation (zod), fail-fast
├── db/
│   ├── client.ts            # Neon/Postgres pool + Drizzle client (lazy)
│   └── schema.ts            # Drizzle schema (empty until Sprint 1)
├── middleware/
│   ├── error_handler.ts     # Central error handler
│   └── not_found.ts         # 404 handler
├── modules/
│   └── health/              # Feature module (controller/service/routes)
└── utils/
    ├── api_response.ts      # Standard { status, message, data, errors, meta }
    └── logger.ts            # Structured JSON logger
```

Layering rule: **controllers** hold no business logic, **services** hold no SQL,
**repositories** (added per feature) hold no HTTP.

## Scripts

```bash
npm run dev        # tsx watch (hot reload)
npm run build      # tsc -> dist/
npm start          # run compiled dist/index.js
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
npm test           # vitest
npm run db:generate  # drizzle-kit generate (needs DATABASE_URL)
npm run db:migrate   # drizzle-kit migrate
```

## Environment

Copy `.env.example` to `.env`. The server boots without `DATABASE_URL`; the
health endpoint will report the database as `unknown`/`disconnected` until a
Neon connection string is provided.

## Endpoints

| Method | Path      | Auth | Description             |
| ------ | --------- | ---- | ----------------------- |
| GET    | `/`       | —    | Service identity        |
| GET    | `/health` | —    | Liveness/readiness probe |
| POST   | `/api/v1/auth/signup`  | —      | Create an account, returns user + tokens |
| POST   | `/api/v1/auth/login`   | —      | Log in, returns user + tokens |
| POST   | `/api/v1/auth/refresh` | —      | Rotate refresh token, returns new tokens |
| POST   | `/api/v1/auth/logout`  | —      | Revoke a refresh token |
| GET    | `/api/v1/auth/me`      | Bearer | Current user's profile |

### Auth notes

- Passwords are hashed with bcrypt (12 rounds); the hash is never returned.
- Access tokens are short-lived (`JWT_ACCESS_EXPIRES_IN`, default 15m).
- Refresh tokens are JWTs, persisted **hashed** in `refresh_tokens`, and
  **rotated** on every refresh (the used token is revoked). Logout revokes them.
- Auth endpoints are **rate limited** (100/15min baseline; 10/15min on
  login/signup) and emit structured **audit logs** (`auth.*`).
- In **production** the app fails fast unless strong, distinct JWT secrets are set.

See the full [Authentication feature doc](../../docs/features/authentication.md).
