# FieldAssist

FieldAssist is a voice-first, headset-friendly operations platform for frontline technicians and supervisors. It is built as a portfolio-quality fullstack MVP focused on assigned work execution, incident reporting, and near real-time operational oversight.

## Why this product exists

Frontline workflows are usually performed under time pressure, often on narrow screens or companion devices. FieldAssist is designed to keep the next action obvious, reduce screen clutter, and give supervisors live visibility into work that is already in motion.

## Product highlights

- Technician login with seeded demo accounts
- Assigned work order queue with device-friendly task cards
- Step-by-step workflow execution with notes and progress tracking
- Incident reporting with optional local attachment metadata
- Supervisor dashboard for active work, incident load, and recent activity
- Socket.IO-driven live updates for work orders, incidents, and dashboard state
- Shared contracts, strong validation, and typed frontend/backend integration

## Tech stack

- Monorepo: `pnpm` workspaces
- Web: React, TypeScript, Vite, React Router, TanStack Query, Zustand, Tailwind CSS
- API: Node.js, Fastify, TypeScript, Zod, Prisma, PostgreSQL, Socket.IO
- Testing: Vitest, React Testing Library, Playwright
- Tooling: ESLint, Prettier, GitHub Actions, Docker Compose

## Monorepo structure

```text
apps/
  api/        Fastify API, Prisma schema, seed data, route tests
  web/        React application, UI components, frontend tests
packages/
  shared/     Shared Zod schemas, enums, and API contracts
docs/
  api.md
  architecture.md
  product-decisions.md
  progress.md
  screenshots/
```

## Local setup

1. Install dependencies with `pnpm install`
2. Copy `apps/api/.env.example` to `apps/api/.env`
3. Copy `apps/web/.env.example` to `apps/web/.env`
4. Start PostgreSQL with `pnpm db:up`
5. Apply migrations with `pnpm db:migrate`
6. Seed demo data with `pnpm db:seed`
7. Start the API and web app with `pnpm dev`
8. Open `http://localhost:5173`

The API health route is available at `http://localhost:4000/api/v1/health`.

## Environment variables

### `apps/api/.env`

| Variable | Purpose | Default example |
| --- | --- | --- |
| `NODE_ENV` | Runtime mode | `development` |
| `HOST` | API host binding | `0.0.0.0` |
| `PORT` | API port | `4000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://fieldassist:fieldassist@localhost:5432/fieldassist?schema=public` |
| `JWT_SECRET` | JWT signing secret | `replace-with-a-long-random-secret-at-least-32-characters` |
| `CORS_ORIGIN` | Allowed web origin | `http://localhost:5173` |
| `LOG_LEVEL` | Fastify logger level | `info` |
| `UPLOADS_DIR` | Local upload storage directory | `uploads` |

### `apps/web/.env`

| Variable | Purpose | Default example |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Versioned API base URL used by the client | `http://localhost:4000/api/v1` |

## Demo accounts

- Technician: `technician@fieldassist.local` / `FieldAssist123!`
- Supervisor: `supervisor@fieldassist.local` / `FieldAssist123!`

## Available scripts

- `pnpm dev`: run the API and web app together
- `pnpm build`: build every workspace package
- `pnpm lint`: lint root Playwright files plus all workspace packages
- `pnpm typecheck`: typecheck root Playwright files plus all workspace packages
- `pnpm test`: run API and web unit/integration tests
- `pnpm test:e2e:install`: install the Playwright Chromium browser locally
- `pnpm test:e2e`: run Playwright smoke coverage against the seeded app
- `pnpm db:up`: start PostgreSQL through Docker Compose
- `pnpm db:down`: stop the local PostgreSQL container
- `pnpm db:migrate`: apply Prisma migrations
- `pnpm db:migrate:dev`: create and apply a new Prisma migration during development
- `pnpm db:seed`: seed deterministic demo data
- `pnpm db:generate`: regenerate the Prisma client

## Testing

- Unit and integration: `pnpm test`
- End-to-end smoke: `pnpm test:e2e`
- Full quality pass: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`

The Playwright suite expects:

- PostgreSQL to be running
- migrations to be applied
- the suite will reseed demo data automatically before execution
- Chromium to be installed with `pnpm test:e2e:install`

## Screenshots

Screenshot placeholders live under `docs/screenshots/`.

- `login.png`: seeded sign-in screen and product overview
- `technician-queue.png`: assigned work order list
- `work-order-detail.png`: technician execution screen
- `supervisor-dashboard.png`: operational summary and activity timeline
- `incident-workspace.png`: supervisor incident triage view

## Documentation

- `README.md`
- `docs/architecture.md`
- `docs/product-decisions.md`
- `docs/api.md`
- `docs/progress.md`

## Future improvements

- Refresh tokens or SSO instead of single bearer-token sessions
- Work order creation and supervisor assignment flows in the UI
- Cloud object storage for attachments and secure download URLs
- Offline capture and sync for low-connectivity environments
- Role-scoped socket rooms and more granular dashboard subscriptions
- Richer analytics, SLA reporting, and maintenance history views
