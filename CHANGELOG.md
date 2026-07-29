# Changelog

All notable changes to Aura are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Sprint 1 — Authentication**
  - `users` and `refresh_tokens` tables (Drizzle schema + migration applied to Neon).
  - `POST /api/v1/auth/signup`, `login`, `refresh`, `logout`, and `GET /api/v1/auth/me`.
  - Password hashing (bcrypt), JWT access + refresh tokens with rotation and revocation.
  - `authenticate` middleware, `HttpError` mapping, and async handler.
  - Production JWT-secret hardening (fail-fast on weak/default/duplicate secrets).
  - Rate limiting on auth endpoints (`express-rate-limit`).
  - Structured auth audit logging (`auth.*` events).
  - Integration/API tests (CI-safe, in-memory repository) + unit tests.
  - Authentication feature documentation (`docs/features/authentication.md`).

- **Sprint 0 — Foundation**
  - Monorepo structure (npm workspaces: `apps/`, `services/`, `packages/`).
  - Documentation moved into `docs/` (product-bible, architecture, engineering, templates).
  - `.github/` PR template, issue templates, CODEOWNERS, and CI workflow.
  - Frontend bootstrap: React + Vite + TypeScript (`apps/web`).
  - Backend bootstrap: Express + TypeScript with health check (`services/api`).
  - Neon (Postgres) + Drizzle ORM connection scaffolding.
  - Docker + docker-compose for local development.
  - ADR-0001: Core technology stack.
