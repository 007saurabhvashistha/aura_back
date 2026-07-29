# Contributing to Aura

Aura is built like a company, not a hackathon project. Please follow these rules.

## Golden Rule

Never code first. **Think → Design → Plan → Implement.** Read the
[System Prompt](docs/engineering/system-prompt.md) and
[Engineering Principles](docs/engineering/engineering-principles.md) before starting.

## One Task Per Issue

Every issue is a single, well-scoped task. Use the **Feature / Task** issue
template. Tasks are described in this format:

```
Sprint
Goal
Context
Related Documents
Acceptance Criteria
Constraints
Expected Deliverables
```

## Branching

- `main` — always production ready
- `develop` — integration branch
- `feature/<feature>` — new features
- `bugfix/<bug>` — fixes
- `hotfix/<issue>` — production fixes

## Commit Messages

Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `style:`, `chore:`.

Never commit broken code. Never commit secrets.

## Pull Requests

- PR required for every change.
- Code review required.
- Fill in the PR template completely.
- Lint, type-check, tests, and build must pass.

## Code Standards

Follow [Coding Standards](docs/engineering/coding-standards.md):

- Folders `lower-case`, files `snake_case` where practical, classes `PascalCase`, variables `camelCase`.
- Max file size ~300 lines; max function ~40 lines.
- Controllers: no business logic. Services: no SQL. Repositories: no HTTP.
- Always validate input, handle errors, and log.

## Testing

Every feature needs unit, integration, and API tests. Target 80%+ coverage
(90%+ for critical services). See [Testing Guidelines](docs/engineering/testing-guidelines.md).
