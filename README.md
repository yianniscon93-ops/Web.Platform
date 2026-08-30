# Web.Platform

PropSights web app — Next.js frontend + backend for the Cyprus property
analytics product.

```
apps/web   Next.js 15 (App Router): marketing site + analytics dashboard,
           API route handlers reading the Postgres serving layer
lib/db     Drizzle schema + Postgres client
docs/      tech stack, dashboard plan, serving-layer contract
```

```bash
pnpm install
pnpm --filter @workspace/landing-next dev   # http://localhost:3000
pnpm typecheck && pnpm build
```

Without `DATABASE_URL` the dashboard serves demo data; see
[docs/TECH_STACK.md](docs/TECH_STACK.md) for the SSH-tunnel setup.
