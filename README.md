<div align="center">

# Aura

**An AI Relationship Platform — voice-first, memory-driven, emotionally intelligent.**

Aura is **not** a chatbot. Aura is built to grow a long-term relationship between
an AI and a user.

</div>

---

## Mission

Build the world's most emotionally intelligent voice AI platform. Every feature
must answer one question: **"Why does this improve the relationship between the AI
and the user?"** If it doesn't, we don't build it.

## Core Pillars

- Voice First
- Long-term Memory
- Emotional Intelligence
- Relationship Engine
- Agent Platform
- Creator Marketplace (future)
- Enterprise Platform (future)

## Tech Stack

| Layer | Technology |
| ----- | ---------- |
| Frontend | React + Vite + TypeScript |
| Backend | Node.js + Express + TypeScript |
| Database | Neon (Serverless PostgreSQL) |
| ORM / Migrations | Drizzle ORM + Drizzle Kit |
| Auth | JWT + Refresh Tokens |
| Monorepo | npm workspaces |
| Containers | Docker + docker-compose |
| CI | GitHub Actions |

## Folder Structure

```
Aura/
├── apps/
│   └── web/            # React + Vite + TypeScript frontend
├── services/
│   └── api/            # Express + TypeScript backend
├── packages/
│   └── shared/         # Shared TypeScript types / contracts
├── infrastructure/
│   └── docker/         # Dockerfiles
├── docs/               # Single source of truth (product, architecture, engineering)
├── .github/            # PR/issue templates, CODEOWNERS, CI
├── docker-compose.yml
├── package.json        # npm workspaces root
├── ROADMAP.md
├── CONTRIBUTING.md
├── CHANGELOG.md
└── LICENSE
```

## Getting Started

### Prerequisites

- Node.js `>=20`
- npm `>=10`
- A Neon Postgres connection string (for the backend)

### 1. Install

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Fill DATABASE_URL with your Neon connection string
```

Also copy the per-workspace env files:

```bash
cp services/api/.env.example services/api/.env
cp apps/web/.env.example apps/web/.env
```

### 3. Run

```bash
# Frontend  → http://localhost:5173
npm run dev:web

# Backend   → http://localhost:4000
npm run dev:api
```

Or everything with Docker:

```bash
docker compose up --build
```

## Documentation

All documentation lives in [docs/](docs/README.md) and is the single source of truth.

- [Product Bible](docs/product-bible/README.md)
- [Architecture](docs/architecture/architecture.md)
- [Engineering Standards](docs/engineering/coding-standards.md)
- [Architecture Decision Records](docs/architecture/adr/README.md)

## Roadmap

See [ROADMAP.md](ROADMAP.md). Development proceeds one sprint — and one task — at a time.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

See [LICENSE](LICENSE).
