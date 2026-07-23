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

**Kids Church** — registration app for a children's ministry. Staff sign in to reach the dashboard at `/`; kids register with a guardian's info via the public `/register` form; staff can search/sort/edit registrations at `/kids`.

### Stack
- **Next.js 16 App Router** with React 19 — all pages under `src/app/`
- **Drizzle ORM** on PostgreSQL — schema in `src/db/schema/index.ts`, client in `src/db/index.ts`
- **JWT sessions** via `jose` — implementation in `src/lib/auth.ts`, stored in `app_session` cookie (12h expiry, HS256); required to view `/`, not required for `/register`
- **Tailwind CSS 4** for styling — custom colors `kids-magenta` / `kids-navy` / `kids-green` / `kids-yellow` defined via `@theme` in `src/app/globals.css`, matched to the Kids Church logo. Headings/buttons on kid-facing pages use the `Fredoka` font (`font-[family-name:var(--font-fredoka)]`).

### Data model
Four tables:
- `guardians` — `firstName`, `lastName`, `contactNumber`, `gender` (`Male` | `Female`); one row is created per registration (no dedup against existing guardians yet)
- `kids` — `firstName`, `lastName`, `nickname`, `age`, `gender`, `serviceAttending` (free text), `guardianId` (FK, not null)
- `users` — `username`, `passwordHash` (bcryptjs), `name`, `role` (`admin` | `user`) — staff accounts
- `login_logs` — audit log scaffold (not currently written to; wire up in `login` action if needed)
- `feature_flags` — `key` (primary key), `enabled` (default `true`), `updatedAt`; global on/off switches, editable at `/settings` (admin only). Currently just `cursor_trail`. Missing row ⇒ treated as enabled (see fallback pattern below).

### Route sections
- `src/app/page.tsx` — the staff dashboard, kid-friendly themed; protected (redirects to `/login` if no session, also guarded by `src/proxy.ts`); menu tiles: **Register**, **Registered Kids**
- `src/app/register/` — public registration form (`RegisterForm.tsx`), `actions.ts` has the `registerKid` Server Action (inserts `guardians` row, then `kids` row referencing it), `success/` is the post-registration confirmation page
- `src/app/kids/` — protected list of all registered kids (`page.tsx`), joined with `guardians`; supports `?q=` search (kid/guardian name, `ilike`) and `?sort=&dir=` column sorting via `KidsTable.tsx` header links; `KidsSearch.tsx` is a debounced client search box that updates the URL
- `src/app/kids/[id]/edit/` — edit an existing kid + guardian; `actions.ts` has the `updateKid` Server Action (bound with the kid's id via `.bind(null, id)` for use with `useActionState`)
- `src/app/login/` — staff login page; `actions.ts` has the `login`/`logout` Server Actions; redirects to `/` if already signed in, and to `/` on successful login
- `src/app/settings/` — admin-only global settings (redirects non-admins to `/`); currently toggles the `cursor_trail` feature flag via the `toggleCursorTrail` Server Action in `actions.ts`

### Patterns
**Auth gating pattern** — any page that requires login:
```ts
const session = await getSession();
if (!session) redirect("/login");
```
Role checks: `session.role === "admin"`. Admin-only pages (e.g. `/settings`) redirect non-admins to `/` rather than `/login` — they're authenticated, just not authorized.

**Feature flags** — read with `db.select().from(featureFlags).where(eq(featureFlags.key, KEY))`, then fall back with `flag?.enabled ?? true` (a missing row means the feature is on). `src/app/layout.tsx` reads `CURSOR_TRAIL_FLAG_KEY` on every request to decide whether to mount `<CursorTrail />`. Toggling is an upsert (`onConflictDoUpdate`) in `src/app/settings/actions.ts`, since the row may not exist yet on first toggle.

**Route protection** — `src/proxy.ts` is Next 16's middleware equivalent; its `matcher` covers `/` and `/kids/:path*`. Add more patterns there as protected routes are added, mirroring the `DEVELOPER_ONLY`-style regex array approach if role-specific gating is needed. `/register` is intentionally excluded — it must stay public.

**Mutations use Server Actions**, not API routes, following the pattern in `src/app/login/actions.ts`, `src/app/register/actions.ts`, and `src/app/kids/[id]/edit/actions.ts`.

**Shared registration fields/validation** — the child and guardian form fields (and their validation) are shared between `/register` and `/kids/[id]/edit` to avoid drift between the two forms:
- `src/components/ChildFields.tsx` / `src/components/GuardianFields.tsx` — the actual `<fieldset>` inputs, each taking an optional `defaultValues` prop (unset for register, pre-filled for edit)
- `src/components/form.tsx` — low-level `Field` / `Select` primitives used by the above
- `src/lib/kidRegistration.ts` — `readChildInput`/`readGuardianInput` (FormData → typed input) and `validateChildInput`/`validateGuardianInput`, called by both `registerKid` and `updateKid`

**When adding/changing a child or guardian field, edit these shared files once — do not duplicate the change into both the register and edit Server Actions/forms.**

**Brand mark** — `src/components/LogoMark.tsx` renders the Kids Church logo (`public/kids-logo.webp`); reused in the header, home page hero, and login card; also set as the favicon via `metadata.icons` in `layout.tsx`.

**Dashboard nav tiles** — `src/components/NavTile.tsx` is the reusable colorful tilt/press tile used on `/` (Register, Registered Kids); pass `href`, `icon`, `label`, `description`, and one of the `kids-*` colors.

**Constants** — `src/lib/constants.ts` holds `SERVICE_OPTIONS` (the fixed list of services shown in the "Service attending" dropdown) and the `MOBILE_NUMBER_*` pattern/regex/help text used to validate guardian contact numbers on both client and server.

**API routes** (`src/app/api/`) exist only for:
- `health` — health check
- `keep-alive` — pings the DB to prevent idle connection drops on serverless/hosted Postgres; gated by `CRON_SECRET` bearer token

**Path alias:** `@/*` maps to `src/*`.

### Environment variables
- `DATABASE_URL` — pooled connection (used by the app at runtime)
- `DATABASE_URL_UNPOOLED` — direct connection (used by Drizzle migrations)
- `SESSION_SECRET` — JWT signing secret
- `CRON_SECRET` — bearer token required by `/api/keep-alive`
