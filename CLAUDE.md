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
Core tables:
- `guardians` — `firstName`, `lastName`, `contactNumber`, `gender` (`Male` | `Female`); one row is created per registration (no dedup against existing guardians yet)
- `kids` — `firstName`, `lastName`, `nickname`, `age`, `gender`, `serviceAttending` (free text), `guardianId` (FK, not null)
- `service_team_members` — `firstName`, `lastName`, `birthday` (date), `serviceAttending` (free text), `photoKey` (nullable, private Backblaze B2 object key — not a URL; link to it with `serviceTeamPhotoUrl` from `src/lib/photoUrl.ts`), `idCardPhotoZoom`/`idCardPhotoX`/`idCardPhotoY` (crop of the round photo badge in the middle of their ID card QR); created via the public `/register/team` form. No login/check-in for these yet — registration only.
- `users` — `username`, `passwordHash` (bcryptjs), `name`, `role` (`admin` | `user`) — staff accounts
- `login_logs` — audit log scaffold (not currently written to; wire up in `login` action if needed)
- `feature_flags` — `key` (primary key), `enabled` (default `true`), `updatedAt`; global on/off switches, editable at `/settings` (admin only). Currently `cursor_trail`, `service_cards` (service picker as cards vs. dropdown on `/check-in`), `volunteer_manage_service_team` and `volunteer_manage_kids` (let non-admins edit/delete service team members / kids; missing row ⇒ **disabled**, gated via `canManageServiceTeam` / `canManageKids` in each section's `permissions.ts`). Missing row ⇒ treated as enabled (see fallback pattern below).

### Route sections
- `src/app/page.tsx` — the staff dashboard, kid-friendly themed; protected (redirects to `/login` if no session, also guarded by `src/proxy.ts`); menu tiles: **Register**, **Registered Kids**, **Check-In**, **KC Bucks**, **Attendance**, **Service Team**
- `src/app/register/` — public landing page with two `NavTile` choices; `child/` has the child+guardian form (`RegisterForm.tsx`, `actions.ts` with the `registerKid` Server Action, `success/` confirmation page); `team/` has the service-team-member form (`TeamRegisterForm.tsx`, `actions.ts` with the `registerServiceTeamMember` Server Action, `success/` confirmation page)
- `src/app/kids/` — protected list of all registered kids (`page.tsx`), joined with `guardians`; supports `?q=` search (kid/guardian name, `ilike`) and `?sort=&dir=` column sorting via `KidsTable.tsx` header links; `src/components/SearchBox.tsx` is the shared debounced client search box that updates the URL
- `src/app/kids/[id]/edit/` — edit an existing kid + guardian; `actions.ts` has the `updateKid` Server Action (bound with the kid's id via `.bind(null, id)` for use with `useActionState`)
- `src/app/service-team/` — protected list of registered service team members (`page.tsx`), same `?q=`/`?sort=&dir=` convention as `/kids` via `queries.ts` + `ServiceTeamTable.tsx`; links each row's photo through `serviceTeamPhotoUrl` (thumbnail for the avatar, full size for the enlarge/download). Edit/Delete are admin-only unless the `volunteer_manage_service_team` flag is on — gate with `canManageServiceTeam(session)` from `permissions.ts` (page, edit page, and both actions): `[id]/edit/` has `EditServiceTeamForm.tsx` + the `updateServiceTeamMember` Server Action (photo is optional on edit — keeps the existing `photoKey` unless a new one is captured), `actions.ts` has `deleteServiceTeamMember`.
- `src/app/login/` — staff login page; `actions.ts` has the `login`/`logout` Server Actions; redirects to `/` if already signed in, and to `/` on successful login
- `src/app/settings/` — admin-only global settings (redirects non-admins to `/`); toggles the `cursor_trail` and `service_cards` feature flags via the `toggleCursorTrail`/`toggleServiceCards` Server Actions in `actions.ts`
- `src/app/devops-admin/` — admin-only (layout + every page/action redirects non-admins to `/`; deliberately not linked anywhere — reached only by typing the URL). Overview toggles every feature flag (grouped by area; DB flags the code doesn't read show under "Other" with a delete) and lists DB/table sizes; `data/` shows row counts + per-table CSV download via `/api/devops-admin/export` (admin-checked in the handler, 401/403); `login-logs/` shows the latest 200 `login_logs`; `check-stm/` is a read-only QR scanner that reports which card a scanned code belongs to (for testing printed IDs). **New tables go in `src/lib/devopsTables.ts`** (grouped by area, with `omit` for secret columns); **new flags go in `FLAG_GROUPS` in `src/lib/featureFlags.ts`** with their missing-row default.

### Patterns
**Auth gating pattern** — any page that requires login:
```ts
const session = await getSession();
if (!session) redirect("/login");
```
Role checks: `session.role === "admin"`. Admin-only pages (e.g. `/settings`) redirect non-admins to `/` rather than `/login` — they're authenticated, just not authorized.

**Feature flags** — read with `db.select().from(featureFlags).where(eq(featureFlags.key, KEY))`, then fall back with `flag?.enabled ?? true` (a missing row means the feature is on). `src/app/layout.tsx` reads `CURSOR_TRAIL_FLAG_KEY` on every request to decide whether to mount `<CursorTrail />`; `src/app/check-in/page.tsx` reads `SERVICE_CARDS_FLAG_KEY` and passes it to `CheckInWorkspace` as `serviceCardsEnabled`, which switches the service picker between a row of cards and a plain `<select>`. Toggling is an upsert (`onConflictDoUpdate`) in `toggleFeatureFlag` (`src/lib/featureFlags.ts`), since the row may not exist yet on first toggle; it applies each flag's `defaultEnabled` from `FLAG_GROUPS` (keep it in sync with the reader's `??` fallback) and revalidates the flag's path. Used by both `/settings` and `/devops-admin`.

**Route protection** — `src/proxy.ts` is Next 16's middleware equivalent; its `matcher` lists every protected top-level route (`/`, `/kids`, `/settings`, `/check-in`, `/attendance`, `/kc-bucks`, `/service-team`, each with `/:path*`). Add new patterns there as protected routes are added, mirroring the `DEVELOPER_ONLY`-style regex array approach if role-specific gating is needed. `/register` is intentionally excluded — it must stay public.

**Mutations use Server Actions**, not API routes, following the pattern in `src/app/login/actions.ts`, `src/app/register/child/actions.ts`, and `src/app/kids/[id]/edit/actions.ts`.

**Photo capture (service team members)** — `src/components/PhotoCapture.tsx` is a client component that drives the device camera directly (`getUserMedia` → live `<video>` preview → user-triggered frame grab onto a `<canvas>` → `canvas.toBlob` → assigned to a hidden `<input type="file">` via `DataTransfer`, so the surrounding `<form>`/Server Action needs no special handling). It falls back to a plain file input only if camera access fails/is denied. Used by both `/register/team` (required, no existing photo) and `/service-team/[id]/edit` (optional — pass `initialPreviewUrl` to show the current photo with a "Retake photo" option). Server-side, `src/app/register/team/actions.ts` and `src/app/service-team/[id]/edit/actions.ts` resize/re-encode the uploaded `File` with `sharp` (`.rotate()` first, to fix phone EXIF orientation), then upload via `uploadPhoto` in `src/lib/storage.ts` (an S3-compatible client pointed at a **private** Backblaze B2 bucket) and store the returned object key (`photoKey`). To display a photo, link to `serviceTeamPhotoUrl(memberId, photoKey, "thumb" | "card" | "full")` — the login-protected route `src/app/service-team/[id]/photo/route.ts`, which serves resized variants from `getPhotoVariant` in `src/lib/photoCache.ts` (`unstable_cache`, keyed by the immutable object key, plus `Cache-Control: private, immutable`). **Never read from B2 per request or hand the browser a signed B2 URL** — every B2 download is a billed Class B transaction and the free daily cap has been hit before; any new photo read must go through `getPhotoVariant`. Routes that use it need `SHARP_NATIVE_TRACE_INCLUDES` in `next.config.ts`. `next.config.ts` raises `experimental.serverActions.bodySizeLimit` to `10mb` to allow the raw (pre-resize) upload through.

**Service team ID card QR photo** — service team QRs are generated with `errorCorrectionLevel: "H"` so a round photo badge can sit in the middle (`IdCardBack`'s `photoSrc`/`photoCrop`; one fixed size for every card, `ID_CARD_PHOTO_SCALE`). The server passes the uncropped `card` variant as a data URL; the browser draws the circle, white ring and zoom/position onto a canvas (`src/lib/photoBadge.ts`, `QrPhotoBadge`) so print and html2canvas export match the screen. Admins adjust it with `PhotoCropEditor` on `/service-team/[id]/id-card` and `/service-team/print-ids`; `/devops-admin/check-stm` scans a printed card to confirm it still reads.

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
- `devops-admin/export` — `?table=<key>` CSV download for `/devops-admin/data`; admin session required

**Path alias:** `@/*` maps to `src/*`.

### Environment variables
- `DATABASE_URL` — pooled connection (used by the app at runtime)
- `DATABASE_URL_UNPOOLED` — direct connection (used by Drizzle migrations)
- `SESSION_SECRET` — JWT signing secret
- `CRON_SECRET` — bearer token required by `/api/keep-alive`
- `B2_BUCKET` / `B2_ENDPOINT` / `B2_REGION` / `B2_KEY_ID` / `B2_APPLICATION_KEY` — Backblaze B2 bucket (S3-compatible API) used by `src/lib/storage.ts` for service-team-member photo uploads
- `B2_PUBLIC_URL_BASE` — public base URL prefixed onto the object key to build the stored `photoUrl` (bucket must be public)
