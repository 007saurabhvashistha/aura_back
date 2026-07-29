# Aura Architecture

## Philosophy

Aura follows:

- Clean Architecture
- Domain Driven Design
- SOLID
- Feature First Development
- Microservice Architecture

## Layers

Presentation

↓

API

↓

Application

↓

Domain

↓

Infrastructure

↓

Database

## Core Services

Gateway

Auth

Users

Profiles

Voice

AI

Memory

Relationship

Moderation

Analytics

Billing

Notifications

Admin

## Rules

Services never directly access another service database.

All communication happens through APIs/events.

Everything should be independently deployable.

Every service owns its own schema.

Never create shared databases.

## Scalability

Stateless Services

Horizontal Scaling

Redis Cache

Queue Based Processing

Event Driven Architecture

Eventually Kubernetes.

---

## Implementation Stack (Current)

> The principles above are stack-agnostic. Aura's current implementation stack is:

| Layer | Technology |
| ----- | ---------- |
| Frontend | React + Vite + TypeScript |
| Backend | Node.js + Express + TypeScript |
| Database | Neon (Serverless PostgreSQL) |
| ORM | Drizzle ORM |
| Auth | JWT + Refresh Tokens |
| Containerization | Docker |
| CI/CD | GitHub Actions |

See [../../README.md](../../README.md) for the monorepo layout.
