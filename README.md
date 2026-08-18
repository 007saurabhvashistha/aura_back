# Aura-Backend

Independent backend repository for Aura.

## Structure

- services/api: Express + TypeScript API
- services/brain: long-term split target
- services/worker: background jobs placeholder
- packages/shared: shared API contract types
- database: migrations snapshot and DB artifacts

## Setup

1. npm install
2. Copy .env.example to .env
3. npm run dev

## Quality Gates

- npm run lint
- npm run typecheck
- npm run test
- npm run build

## API Contract Rule

Backend publishes versioned API contracts for frontend integration.
OpenAPI/Swagger publication is mandatory before Sprint 6 feature expansion.