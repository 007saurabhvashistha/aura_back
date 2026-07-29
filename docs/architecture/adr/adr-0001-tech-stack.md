# ADR-0001

Title

Core technology stack for the Aura MVP

Status

Accepted

Context

Problem

Aura needs a foundation stack that is fast to iterate on, strongly typed end
to end, easy to hire for, and cheap to run in the MVP phase while keeping the
door open for the eventual microservice / event-driven architecture described
in the architecture guidelines.

Decision

- Frontend: React + Vite + TypeScript
- Backend: Node.js + Express + TypeScript
- Database: Neon (serverless PostgreSQL)
- ORM / migrations: Drizzle ORM + Drizzle Kit
- Monorepo: npm workspaces (apps/, services/, packages/)
- Auth: JWT access tokens + refresh tokens
- Containerization: Docker + docker-compose
- CI: GitHub Actions

Alternatives Considered

- FastAPI + Flutter + Supabase (original prompt): strong option, but the team
  standardizes on a single TypeScript language across frontend and backend for
  velocity and shared types in the MVP phase.
- Prisma instead of Drizzle: Prisma is excellent but Drizzle is lighter, has
  first-class Neon serverless support, and no extra query engine binary.

Pros

- One language (TypeScript) across the whole stack.
- Shared types via packages/shared.
- Neon serverless scales to zero — cheap for MVP.
- Clean path to splitting services later.

Cons

- Node/Express requires more manual structure than an opinionated framework.
- Drizzle is younger than Prisma.

Consequences

- All boundaries validated with Zod.
- Each future service can graduate out of services/api into its own deployable.

Future Revisions

Revisit when the first service needs to scale independently (Voice or AI).

Author

Aura Engineering

Date

2026-07-29
