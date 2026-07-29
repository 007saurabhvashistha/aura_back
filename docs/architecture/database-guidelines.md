# Database Principles

Every service owns its database.

Naming

snake_case

Tables

Plural

Primary Keys

UUID

Created At

Updated At

Soft Delete

Required where applicable.

Indexes

Added intentionally.

Foreign Keys

Minimal across services.

Migrations

Drizzle Kit (drizzle-orm)

Never edit old migrations.

Create new ones.

---

## Neon (PostgreSQL)

- Aura uses Neon serverless Postgres.
- Connection string lives in `DATABASE_URL` (never committed).
- Use the Neon serverless driver in serverless/edge contexts and `pg` Pool locally.
- Migrations are generated with `drizzle-kit generate` and applied with `drizzle-kit migrate`.
