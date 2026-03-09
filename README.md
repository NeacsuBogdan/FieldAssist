# FieldAssist

FieldAssist is a portfolio-quality operations platform for frontline technicians and supervisors. This repository is being built as a staged fullstack monorepo with a voice-ready, device-friendly workflow for work execution, incident reporting, and live operational oversight.

## Why it exists

Frontline work is often executed in motion, under time pressure, and on device-constrained hardware. FieldAssist is designed to support that environment with clear task execution, strong status visibility, and a supervisor view that can react to work in progress without forcing technicians through dense enterprise screens.

## Stage 0 status

The repository has been initialized with:

- pnpm workspaces
- shared TypeScript, ESLint, and Prettier configuration
- placeholder `apps/api`, `apps/web`, and `packages/shared` packages
- Docker Compose for local PostgreSQL
- initial project documentation scaffolding

## Planned structure

```text
apps/
  api/
  web/
packages/
  shared/
docs/
```

## Core scripts

- `pnpm install`
- `pnpm dev`
- `pnpm build`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm db:up`
- `pnpm db:generate`
- `pnpm db:migrate`
- `pnpm db:seed`
- `pnpm db:down`

## Stage 1 snapshot

- Fastify API foundation with versioned `/api/v1` routes
- Prisma schema and Postgres database wiring
- JWT-based authentication with seeded technician and supervisor accounts
- Role-aware auth decorators for protected routes
- Shared auth schemas and response contracts

## Local API setup

1. Copy `apps/api/.env.example` to `apps/api/.env`
2. Run `pnpm db:up`
3. Run `pnpm db:migrate`
4. Run `pnpm db:seed`

## Demo accounts

- `technician@fieldassist.local` / `FieldAssist123!`
- `supervisor@fieldassist.local` / `FieldAssist123!`

Current architecture and API notes live in the `docs/` folder and will expand as more product stages are completed.
