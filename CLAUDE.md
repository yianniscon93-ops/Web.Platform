# CLAUDE.md

Plotsights web app — Next.js 15 (App Router) frontend + backend.

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
- Replies: be deliberate, not minimal — every sentence should earn its place.
  Lead with the answer; skip recaps, restating the question and filler. Do
  explain when the topic needs it (a tradeoff, a non-obvious cause, a risky
  step) — short is not the goal, signal is.
- UI/design work: use the vendored [Impeccable](https://github.com/pbakaus/impeccable)
  skill (`/impeccable`, release skill-v4.5.0) in `.claude/skills/impeccable/` +
  `.claude/agents/impeccable-*.md`. Don't hand-edit it; refresh with
  `npx impeccable update`. Its design-detector hook (`.claude/settings.json`)
  checks UI edits and runs a deeper pass on Stop; `/impeccable hooks off` pauses it.
- Two more vendored design skills, also not hand-edited:
  `.claude/skills/design-taste-frontend/` ([taste-skill](https://github.com/Leonxlnx/taste-skill)
  `skills/taste-skill` @ a60a36d, MIT; scripts need Node 22+ and Chrome) and
  `.claude/skills/frontend-design/` ([anthropics/skills](https://github.com/anthropics/skills)
  @ dbd4588). Refresh by re-copying the folder at a newer commit.
- `.claude/agents/design-director.md` (Opus, xhigh) combines all three:
  Impeccable is the spine, Taste supplies the idea and a lint/inspect gate,
  frontend-design the plan review and copy. Owner decisions in DESIGN.md
  outrank every skill's house rules (e.g. Taste's no-glass, no-hairline bans).
