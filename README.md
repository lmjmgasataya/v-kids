# v-2-kids

Base Next.js application with TypeScript, Drizzle ORM, and PostgreSQL.

## Stack

- **Next.js 16** App Router · **React 19**
- **Drizzle ORM** on PostgreSQL
- **Tailwind CSS 4**
- JWT sessions via `jose` (`app_session` cookie)

## Local setup

```bash
# 1. Start Postgres
docker compose up -d        # postgres:16 on :5432, Adminer on :8080

# 2. Copy and fill in env (a working .env.local for docker-compose is already provided)
cp .env.local.example .env.local  # set DATABASE_URL, SESSION_SECRET, CRON_SECRET

# 3. Apply schema
nvm use 24
npm install
npm run db:push

# 4. Seed the default admin user (admin / changeme)
npm run db:seed

# 5. Run dev server
npm run dev                 # http://localhost:3000
```

## Commands

```bash
npm run dev           # dev server (binds 0.0.0.0)
npm run build         # production build
npm run lint          # ESLint

npm run db:generate   # generate migration files from schema changes
npm run db:migrate    # apply pending migrations (DATABASE_URL_UNPOOLED)
npm run db:push       # push schema without migration files (dev only)
npm run db:studio     # Drizzle Studio GUI
npm run db:seed       # seed the default admin user
```

## What's included

- **Auth** — JWT session cookie (`src/lib/auth.ts`), login/logout Server Actions (`src/app/login/actions.ts`), route protection via `src/proxy.ts` (guards `/dashboard/*`)
- **Database** — Drizzle client (`src/db/index.ts`), schema (`src/db/schema/index.ts`) with `users` and `login_logs` tables
- **Example pages** — public home (`/`), login (`/login`), protected dashboard (`/dashboard`)
- **API routes** — `/api/health` (DB connectivity check), `/api/keep-alive` (cron-friendly DB ping, `CRON_SECRET`-gated)
- **Shared components** — `NavigationProgress`, `PageLoader`, `SubmitButton`

Extend the `users.role` enum and add role checks in `proxy.ts` / server components as the app grows.
