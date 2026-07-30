# Feature: User Identity & Personalization

Owner: Aura Engineering

Status: Implemented (Sprint 2)

## Description

The user identity and personalization layer for Aura. Adds a product profile
(separate from the auth identity), normalized languages and interests,
strictly-validated preferences, server-authoritative 18+ age verification, an
avatar upload foundation, and the frontend authentication foundation (routing,
auth context, protected routes, authenticated API client).

## Business Goal

Give every user a lightweight identity Aura can personalize around — while
learning the rest through conversation rather than a long questionnaire.

## Technical Goal

Extend the clean-architecture backend (routes → controller → service →
repository) with a `profile` domain, keep authentication identity untouched in
`users`, and stand up the missing frontend auth foundation.

## Acceptance Criteria

- [x] A dedicated 1:1 `user_profiles` row is created atomically at signup.
- [x] `GET /users/me` returns identity + profile + languages + interests +
      onboarding state.
- [x] `PATCH /users/me` updates only allowed fields and rejects `dateOfBirth`,
      `isAgeVerified`, `ageVerifiedAt`, and unknown keys.
- [x] Age verification is server-authoritative (min age 18); DOB is processed
      transiently and never persisted, returned, or logged.
- [x] Languages and interests use controlled catalogues; unknown values are
      rejected; `PUT` replaces the whole set atomically.
- [x] Preferences are JSONB validated with a strict Zod schema.
- [x] Avatar object keys are server-issued (`avatars/{userId}/{uuid}.{ext}`);
      commit validates ownership; provider is abstract; `DELETE` is supported.
- [x] Refresh token is delivered as an `httpOnly` cookie; access token stays in
      memory; a 401 triggers a single-flight refresh + one retry.
- [x] Frontend has React Router, an auth context, protected routes, and an
      authenticated API client.
- [x] Unit and integration/API tests pass; typecheck and build pass.

## API

Base path: `/api/v1/users`. All endpoints require a Bearer access token and use
the standard envelope `{ status, message, data, errors, meta }`. Writes are
rate limited.

| Method | Path                    | Success | Body |
| ------ | ----------------------- | ------- | ---- |
| GET    | `/me`                   | `200`   | — |
| PATCH  | `/me`                   | `200`   | `{ displayName?, bio?, primaryLanguage?, communicationStyle?, aiPersonality?, preferences? }` |
| GET    | `/me/languages`         | `200`   | — |
| PUT    | `/me/languages`         | `200`   | `{ languages: [{ languageCode, proficiency }] }` |
| GET    | `/me/interests`         | `200`   | — |
| PUT    | `/me/interests`         | `200`   | `{ interests: string[] }` |
| POST   | `/me/age-verification`  | `200`   | `{ dateOfBirth: "YYYY-MM-DD" }` |
| POST   | `/me/avatar/upload-url` | `200`   | `{ contentType, sizeBytes }` |
| PUT    | `/me/avatar`            | `200`   | `{ objectKey }` (server-issued) |
| DELETE | `/me/avatar`            | `200`   | — |

### Catalogues

- **Languages** (ISO-639-1): `en, hi, ar, es, fr, de, pt`.
- **Proficiency**: `native, fluent, conversational, learning`.
- **Interests**: `music, gaming, travel, movies, sports, technology, business,
  fitness, food, books, anime, fashion, coding, art, photography`.
- **Communication style**: `casual, formal, playful, direct, supportive`.
- **AI personality**: `warm, playful, calm, intellectual, empathetic`
  (user preference only — not coupled to any agent configuration).

### Error codes

| Status | Code | When |
| ------ | ---- | ---- |
| 400 | `invalid_object_key` | Avatar key does not belong to the user |
| 400 | `unsupported_content_type` | Avatar content type not allowed |
| 401 | `unauthorized` | Missing/invalid access token |
| 403 | `age_not_eligible` | User is under 18 |
| 404 | `user_not_found` | Authenticated user no longer exists |
| 422 | (zod issues) | Input validation failed |
| 429 | `rate_limited` | Too many requests |

## Database

Three tables (Drizzle ORM, migration `drizzle/0001_yellow_captain_universe.sql`).
`users` and `refresh_tokens` are structurally unchanged.

- `user_profiles` — 1:1 with `users` (`user_id` unique, fk cascade). Fields:
  `display_name`, `bio`, `avatar_url`, `primary_language`,
  `communication_style`, `ai_personality`, `preferences` (jsonb, default `{}`),
  `is_age_verified` (bool, default false), `age_verified_at`, timestamps.
  **No date-of-birth column** — by design.
- `user_languages` — normalized, `UNIQUE(user_id, language_code)`, fk cascade.
- `user_interests` — normalized, `UNIQUE(user_id, interest)`, fk cascade.

## Age & Safety (data minimization)

Aura is an 18+ product for Sprint 2. Age verification is a first-class safety
requirement, not merely profile data:

- DOB is submitted only to `POST /me/age-verification`, used to compute age
  server-side, then **discarded**. It is never stored, returned, or logged.
- Only `is_age_verified` and `age_verified_at` are persisted.
- `is_age_verified` can never be set by the client.

## Avatar architecture

Provider-agnostic `StorageService` (local stub in Sprint 2). The server issues
the object key `avatars/{userId}/{uuid}.{ext}`; the client uploads bytes to the
returned target and commits only the server-issued key. Commit validates the
key belongs to the authenticated user and matches the allowed format. No binary
data is stored in PostgreSQL and arbitrary external URLs are never accepted.

## Frontend

- `react-router-dom` with public (`/login`, `/signup`) and protected (`/`,
  `/onboarding`, `/profile`) routes.
- `AuthContext` restores a session on load via the refresh cookie, holds the
  access token in memory, and exposes `login`/`signup`/`logout`/`refreshProfile`.
- The authenticated API client sends credentials, injects the Bearer token, and
  on a 401 performs a single-flight refresh with exactly one retry (no loops).
- In development the Vite server proxies `/api` and `/health` to the API so the
  `httpOnly` cookie is same-origin.

## Onboarding

Required: display name, 18+ age verification, primary language. Everything else
(interests, communication style, preferences, AI personality, avatar) is
optional and skippable — Aura learns the rest over time. `onboarding.complete`
is computed server-side and the frontend only reflects it.

## Tests

- `tests/profile.api.test.ts` — 27 integration tests (profile, PATCH rejections,
  age verification incl. DOB-not-persisted/returned/logged, languages,
  interests, avatar ownership/limits, unauthenticated access).
- `tests/auth.api.test.ts` — updated for cookie-based refresh/logout.
