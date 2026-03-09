# Progress

## Stage checklist

- [x] Stage 0 - Repo audit and foundation
- [x] Stage 1 - Database, API foundation, auth
- [ ] Stage 2 - Core domain: assets, templates, work orders
- [ ] Stage 3 - Frontend foundation and auth flow
- [ ] Stage 4 - Technician experience
- [ ] Stage 5 - Incident reporting
- [ ] Stage 6 - Realtime updates
- [ ] Stage 7 - Polish, accessibility, device-friendly pass
- [ ] Stage 8 - Test hardening, CI, docs, final cleanup

## Audit notes

- The provided working directory was empty.
- No existing git history or project files were present.
- Global git identity was available and copied into local repo config.
- The repository was initialized with `main` and a working `dev` branch.

## Stage log

### Stage 0

- Initialized pnpm workspace structure.
- Added root TypeScript, ESLint, Prettier, Docker Compose, and editor config.
- Added placeholder package wiring for API, web, and shared code.
- Added baseline README and progress tracking.
- Verified `pnpm install`, `pnpm lint`, `pnpm typecheck`, and `pnpm build`.

### Stage 1

- Replaced the placeholder API package with a Fastify application and shared route/service structure.
- Added Prisma schema, migration, and Postgres-backed seed data for technician and supervisor demo users.
- Implemented `/api/v1/health`, `/api/v1/auth/login`, `/api/v1/auth/logout`, and `/api/v1/auth/me`.
- Added JWT auth, role-aware request decorators, environment parsing, and centralized error handling.
- Added auth route tests and verified the seeded login flow against the running app.
- Verified `pnpm db:up`, `pnpm db:migrate`, `pnpm db:seed`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`.
