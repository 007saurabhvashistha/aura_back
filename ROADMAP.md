# Aura Roadmap

Development proceeds **one sprint at a time**, and within a sprint, **one task at a
time**. We optimize for production-ready architecture, not feature count.

## Sprint 0 — Foundation ✅ (current)

- [x] Repository & folder structure (monorepo)
- [x] Documentation placement (`docs/`)
- [x] `.github/` templates (PR, issues, CODEOWNERS)
- [x] Frontend bootstrap (React + Vite + TS)
- [x] Backend bootstrap (Express + TS) with health check
- [x] Neon (Postgres) + Drizzle connection scaffolding
- [x] Docker + docker-compose
- [x] CI (GitHub Actions)

## Sprint 1 — Authentication

- [x] Signup
- [x] Login
- [x] JWT access + refresh tokens
- [x] Profile (basic)

## Sprint 2 — User Profile

- [ ] Interests
- [ ] Language
- [ ] Avatar
- [ ] Preferences

## Sprint 3 — Realtime (LiveKit)

- [ ] Connection
- [ ] Join room
- [ ] Leave room
- [ ] Microphone

## Sprint 4 — Voice Agent

- [ ] STT
- [ ] LLM
- [ ] TTS
- [ ] Response loop

## Sprint 5 — Memory

- [ ] Session memory
- [ ] Long-term memory
- [ ] Relationship engine
