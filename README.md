# Kids Church

Registration app for Kids Church, built on Next.js, TypeScript, Drizzle ORM, and PostgreSQL.

## Stack

- **Next.js 16** App Router · **React 19**
- **Drizzle ORM** on PostgreSQL
- **Tailwind CSS 4**, colors matched to the Kids Church logo (magenta/navy/green/yellow)
- JWT sessions via `jose` (`app_session` cookie) for staff-only areas

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

# 4. Seed the admin user(s) (see ACCOUNTS in src/db/seed-users.ts for username/password)
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

- **Registration** — public `/register` form; a child (`kids` table) and their guardian (`guardians` table, separate) are captured and inserted together (`src/app/register/actions.ts`)
- **Registered kids list** (`/kids`) — searchable (kid or guardian name), sortable by any column header, links to an edit page per kid
- **Edit registration** (`/kids/[id]/edit`) — updates the kid and guardian together; shares its fields and validation with `/register` (see `src/lib/kidRegistration.ts`, `src/components/ChildFields.tsx`/`GuardianFields.tsx`) so the two forms can't drift apart
- **Staff dashboard** (`/`) — kid-friendly themed, requires sign-in; menu tiles: **Register**, **Registered Kids**
- **Auth** — JWT session cookie (`src/lib/auth.ts`), login/logout Server Actions (`src/app/login/actions.ts`), route protection via `src/proxy.ts` (guards `/` and `/kids/*`); signing in lands on `/`, signing out redirects to `/login`
- **Database** — Drizzle client (`src/db/index.ts`), schema (`src/db/schema/index.ts`) with `users`, `login_logs`, `guardians`, and `kids` tables
- **API routes** — `/api/health` (DB connectivity check), `/api/keep-alive` (cron-friendly DB ping, `CRON_SECRET`-gated)
- **Shared components** — `LogoMark` (brand mark), `NavigationProgress`, `PageLoader`, `SubmitButton`

Extend the `users.role` enum and add role checks in `proxy.ts` / server components as staff features grow (e.g. a kid check-in dashboard).
