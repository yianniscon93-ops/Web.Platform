# Tech Stack

## Current architecture

```
apps/web        Next.js 15 (App Router) — marketing landing + analytics dashboard.
                Backend logic lives in app/api/dashboard/* route handlers;
                data access in src/lib/server/db.ts + marketData.ts.
lib/db          Drizzle ORM schema + Postgres client (schema source of truth
                for the serving layer; `pnpm --filter db push`).
```

- **Runtime:** Node 24, TypeScript 5.9, pnpm workspace.
- **UI:** React 19, Tailwind 4, framer-motion, react-leaflet.
- **Data:** PostgreSQL on the Hetzner box (`DATABASE_URL`), populated by the
  data-engineering pipelines (see `docs/DATA_ENGINEERING.md`). The schema is
  owned by data engineering — this app reads only. With no `DATABASE_URL`
  set, `apps/web` serves deterministic demo data.
- **Dev DB access:** SSH tunnel —
  `ssh -N -L 5433:localhost:5432 root@<server>` then
  `DATABASE_URL=postgresql://bnb:bnb@localhost:5433/bnb`.

## Related repos

| Repo | Role |
|---|---|
| [Core.Noesis](https://github.com/yianniscon93-ops/Core.Noesis) | Python package: scraping + data-engineering functions |
| [Data.STR](https://github.com/yianniscon93-ops/Data.STR) | Airbnb pipeline jobs (cron) |
| [Data.Property](https://github.com/yianniscon93-ops/Data.Property) | Bazaraki LTR/sales jobs (cron) |
| [Data.Insights](https://github.com/yianniscon93-ops/Data.Insights) | Client reports + combined analysis |

## History

This repo was previously `propsights`, a Replit-scaffolded workspace with a
Vite SPA (`artifacts/landing`), an Express skeleton (`artifacts/api-server`)
and generated API-client packages. Those were removed in the 2026-08 repo
restructure — `artifacts/landing-next` was promoted to `apps/web`. See git
history before the `repo-restructure` branch for the old layout.
