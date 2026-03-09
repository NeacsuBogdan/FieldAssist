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

## Backend module structure

- `auth`: login, logout, current user lookup, and role-aware auth decorators
- `work-orders`: list/detail domain reads plus start, pause, and complete actions
- `dashboard`: supervisor summary and activity timeline reads
- `activity`: audit logging service used by domain mutations

## Data model summary

- `User` stores technician and supervisor identities
- `Asset` represents the physical equipment attached to work orders
- `WorkflowTemplate` and `WorkflowTemplateStep` define repeatable procedures
- `WorkOrder` and `WorkOrderStepExecution` track execution state per assigned job
- `IncidentReport` and `Attachment` capture exceptions and supporting metadata
- `ActivityLog` stores timeline events for supervisor visibility and later realtime fan-out

## Tradeoffs

- Logout is currently stateless and handled client-side by dropping the token.
- The API foundation is intentionally narrow in Stage 1 so the domain model can expand cleanly in Stage 2.
