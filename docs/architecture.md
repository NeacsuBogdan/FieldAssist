# Architecture

## System overview

FieldAssist is a pnpm workspace monorepo with separate applications for the API and web client plus a shared package for cross-cutting schemas and types.

Current Stage 1 focus:

- Fastify API with versioned REST endpoints
- Prisma ORM backed by PostgreSQL
- Shared auth contracts in `packages/shared`
- JWT auth for technician and supervisor sessions

## Planned folder structure

```text
apps/
  api/
    prisma/
    src/
    test/
  web/
packages/
  shared/
docs/
```

## Auth approach

- Seeded demo users for portfolio/demo workflows
- Password hashing using Node.js `scrypt`
- Stateless JWT bearer authentication
- Fastify auth decorators for authentication and role checks

## Tradeoffs

- Logout is currently stateless and handled client-side by dropping the token.
- The API foundation is intentionally narrow in Stage 1 so the domain model can expand cleanly in Stage 2.
