# FieldAssist

FieldAssist is a portfolio-quality operations platform for frontline technicians and supervisors. This repository is being built as a staged fullstack monorepo with a voice-ready, device-friendly workflow for work execution, incident reporting, and live operational oversight.

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
- `pnpm db:down`

Project setup, architecture, API documentation, and product decisions will be expanded as the implementation stages are completed.
