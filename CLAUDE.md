# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

Run `nvm use 24` before any `npm` command.

```bash
# Development
npm run dev          # Start dev server (binds 0.0.0.0)
npm run build        # Production build
npm run lint          # ESLint

# Database
npm run db:generate  # Generate Drizzle migration files from schema changes
npm run db:migrate   # Apply pending migrations (uses DATABASE_URL_UNPOOLED)
npm run db:push      # Push schema directly without migration files (dev only)
npm run db:studio    # Open Drizzle Studio GUI
npm run db:seed      # Seed the default admin user (loads .env.local automatically)
```

There are no tests configured in this project.

Local Postgres runs via Docker:
```bash
docker compose up -d  # Starts postgres:16 on :5432 and Adminer on :8080
```

## Architecture

Base application chassis — Next.js + Drizzle/Postgres + JWT auth, with no domain-specific business logic yet. Extend from here.

### Stack
- **Next.js 16 App Router** with React 19 — all pages under `src/app/`
- **Drizzle ORM** on PostgreSQL — schema in `src/db/schema/index.ts`, client in `src/db/index.ts`
- **JWT sessions** via `jose` — implementation in `src/lib/auth.ts`, stored in `app_session` cookie (12h expiry, HS256)
- **Tailwind CSS 4** for styling

### Data model
Two tables:
- `users` — `username`, `passwordHash` (bcryptjs), `name`, `role` (`admin` | `user`)
- `login_logs` — audit log scaffold (not currently written to; wire up in `login` action if needed)

### Route sections
- `src/app/page.tsx` — public home page, links to login or dashboard depending on session
- `src/app/login/` — login page; `actions.ts` has the `login`/`logout` Server Actions
- `src/app/dashboard/` — example protected page (redirects to `/login` if no session); also guarded by `src/proxy.ts`

### Patterns
**Auth gating pattern** — any page that requires login:
```ts
const session = await getSession();
if (!session) redirect("/login");
```
Role checks: `session.role === "admin"`.

**Route protection** — `src/proxy.ts` is Next 16's middleware equivalent; its `matcher` currently only covers `/dashboard/:path*`. Add more patterns there as protected routes are added, mirroring the `DEVELOPER_ONLY`-style regex array approach if role-specific gating is needed.

**Mutations use Server Actions**, not API routes, following the pattern in `src/app/login/actions.ts`.

**API routes** (`src/app/api/`) exist only for:
- `health` — health check
- `keep-alive` — pings the DB to prevent idle connection drops on serverless/hosted Postgres; gated by `CRON_SECRET` bearer token

**Path alias:** `@/*` maps to `src/*`.

### Environment variables
- `DATABASE_URL` — pooled connection (used by the app at runtime)
- `DATABASE_URL_UNPOOLED` — direct connection (used by Drizzle migrations)
- `SESSION_SECRET` — JWT signing secret
- `CRON_SECRET` — bearer token required by `/api/keep-alive`
