# Product Decisions

## Why this MVP scope

The first backend milestone focuses on authentication and secure access control because every later workflow depends on knowing who is performing work and what role-specific data they should see.

## Why this stack

- Fastify keeps the API lean and fast while supporting explicit route structure.
- Prisma provides a clear schema and migration workflow for a portfolio-ready codebase.
- PostgreSQL keeps the production story credible without unnecessary infrastructure.
- Shared Zod contracts improve consistency across the API and future frontend.

## Headset-friendly implications

Even at the backend layer, the product is being shaped around fast state changes, simple response payloads, and role-scoped workflows so the eventual frontend can keep screens readable and actions obvious.

The seeded data deliberately includes a partially completed job, a newly assigned job, and an open incident so the MVP can demonstrate technician and supervisor perspectives without extra setup.

## Intentionally deferred

- Public registration
- Token revocation lists
- Attachment file transport
- Realtime events
- Full work order domain
