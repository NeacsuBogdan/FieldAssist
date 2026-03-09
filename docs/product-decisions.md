# Product Decisions

## Why this MVP scope

The product centers on the smallest realistic loop that demonstrates value for both frontline roles:

- technicians need a clear assigned queue, step guidance, note capture, and escalation path
- supervisors need visibility into active work, open incidents, and the activity trail behind changes

That scope is large enough to feel like a real operations tool without spreading into planner/admin functionality too early.

## Why this stack

- React + Vite keep the web app fast to iterate on while staying production-credible.
- React Router, TanStack Query, and Zustand cover routing, server state, and light client state without adding unnecessary framework weight.
- Tailwind supports a deliberate visual system with large controls and consistent spacing.
- Fastify gives the API strong performance, explicit plugin boundaries, and good TypeScript ergonomics.
- Prisma + PostgreSQL keep the data layer understandable and easy to discuss in an interview or code review.
- Zod schemas shared through `packages/shared` keep request and response contracts aligned across the stack.
- Socket.IO is pragmatic for a portfolio MVP that needs authenticated browser realtime without building a more elaborate event transport layer.

## How the UI supports headset-friendly usage

- Technician screens favor cards and single-column reading patterns over dense tables.
- Important actions use large buttons with clear labels such as start, pause, complete, and submit incident.
- Current task context stays visible through progress, status badges, and focused step panels.
- Voice-ready affordances are included through `aria-label`, `title`, placeholders, and `data-voice-label` attributes on key controls.
- Loading, empty, and error states are explicit so narrow-screen or in-motion usage does not degrade into ambiguous blank panels.
- Realtime status is surfaced directly in the app shell so connectivity state is visible without extra navigation.

## Intentionally not built yet

- Public account registration
- Refresh tokens, SSO, or enterprise identity integration
- Supervisor-side authoring for assets, templates, and work order assignment
- Offline-first sync and conflict resolution
- Cloud attachment storage and secure download links
- Notification rules, escalations, and reporting dashboards
- Fine-grained socket room subscriptions and background processing
