# Architecture

## System overview

FieldAssist is a `pnpm` monorepo with a React web client, a Fastify API, and a shared contracts package. The system is intentionally small enough to stay reviewable while still reflecting a production-style boundary between UI, transport contracts, domain logic, persistence, and realtime delivery.

## Folder structure

```text
apps/
  api/
    prisma/
      migrations/
      schema.prisma
      seed.ts
    src/
      config/
      lib/
      modules/
        activity/
        auth/
        dashboard/
        health/
        incidents/
        realtime/
        uploads/
        work-orders/
      server.ts
    test/
  web/
    src/
      app/
      components/
      features/
      lib/
      pages/
      test/
packages/
  shared/
    src/
docs/
```

## Frontend architecture

- Route-level pages handle the major product areas: login, technician queue, work order detail, supervisor dashboard, and incidents.
- React Router owns navigation and role-aware access control.
- TanStack Query manages server state and cache invalidation.
- Zustand holds lightweight client state for auth persistence and realtime connection status.
- Tailwind CSS drives the visual system with reusable UI primitives for buttons, inputs, status badges, and state panels.
- Realtime updates do not duplicate domain state in the socket layer. Socket events invalidate React Query caches, and the UI rehydrates from the API.

## Backend architecture

- Fastify provides the HTTP server, request lifecycle, route plugins, and structured logging.
- Route handlers stay thin. Validation happens at the route boundary with shared Zod schemas.
- Business rules live in service modules such as `work-order.service.ts`, `incident.service.ts`, and `dashboard.service.ts`.
- Prisma owns persistence and maps cleanly to the PostgreSQL data model.
- Centralized error handling normalizes validation, authorization, conflict, and not-found responses.
- Socket.IO is attached at the API boundary and emits pragmatic domain events after successful mutations.

## Data model summary

- `User`: authenticated technician and supervisor identities
- `Asset`: physical equipment tied to work orders
- `WorkflowTemplate`: reusable maintenance procedure definition
- `WorkflowTemplateStep`: ordered procedural steps with voice labels and expected outcomes
- `WorkOrder`: assigned job linked to an asset and workflow template
- `WorkOrderStepExecution`: mutable execution record for each step on a specific work order
- `IncidentReport`: issue escalation tied to a work order and optionally a step execution
- `Attachment`: metadata for locally stored uploaded files
- `ActivityLog`: audit timeline for work order, step, incident, and attachment actions

## Realtime flow

1. A mutation route completes a domain action in the service layer.
2. The route emits one or more Socket.IO events such as `work-order.updated`, `step.updated`, or `incident.created`.
3. The web client listens through `RealtimeSync` and invalidates the affected React Query keys.
4. Any subscribed supervisor or technician screen refreshes from the API without manual reload.

## Auth approach

- Passwords are hashed with Node.js `scrypt`.
- Login returns a signed JWT plus a trimmed user payload.
- The client stores the token in persisted Zustand state.
- `SessionSync` revalidates the session on reload through `GET /api/v1/auth/me`.
- Fastify decorators handle authentication and role-based authorization for protected routes.

## Tradeoffs

- Logout is stateless. The client clears its token and the API does not maintain a token revocation list.
- Attachment storage is local-first for the MVP to keep setup simple. The storage boundary is isolated in the upload service so it can be replaced with S3 or similar later.
- The socket layer broadcasts coarse domain events instead of trying to stream partial entity diffs. That keeps the server simpler and lets the API remain the source of truth.
- The current product focuses on execution, triage, and visibility. Supervisor-side authoring flows are intentionally deferred.
