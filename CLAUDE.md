# CLAUDE.md

PropSights web app — Next.js 15 (App Router) frontend + backend.

- The real app is `apps/web`; `lib/db` holds the Drizzle schema for the
  Postgres serving layer. pnpm workspace (`pnpm install`, `pnpm typecheck`,
  `pnpm build`; dev: `pnpm --filter @workspace/landing-next dev`, port 3000).
- Backend logic = App-Router route handlers in `apps/web/app/api/dashboard/*`;
  data access in `apps/web/src/lib/server/db.ts` + `marketData.ts`.
- Data comes from the Hetzner Postgres (`DATABASE_URL`; SSH tunnel for dev —
  see docs/TECH_STACK.md). The schema is owned by the data-engineering repos
  (Core.Noesis writes it via `noesis.storage.postgres`) — **read-only here**;
  the contract is docs/DASHBOARD_CONTRACT.md + docs/POSTGRES.md.
- No `DATABASE_URL` → deterministic demo data (keep that fallback working).

## Conventions

- Documentation lives in `docs/` — big changes should update the relevant
  docs/ file (or add a brief one) in the same commit. Keep it short; don't
  document routine tweaks.
