# Graduation projects 2026

Use pnpm. Drizzle reads `DATABASE_URL` (see `drizzle.config.ts` and `.env.example`).

## Commands

- **Dev**: `pnpm dev` (requires Infisical — runs `infisical run --env=dev -- next dev --turbopack`)
- **Build**: `pnpm build:dev` (dev env) / `pnpm build` (uses env from shell)
- **Start**: `pnpm start`
- **Lint**: `pnpm lint`
- **Typecheck**: `pnpm typecheck`
- **Format**: `pnpm format`
- **Pre-ship verification**: `pnpm format && pnpm lint && pnpm typecheck && pnpm build`

### Database (Drizzle + PostgreSQL)

- `pnpm db:generate` — generate migration files from schema changes (no env needed)
- `pnpm db:migrate` / `pnpm db:migrate:prod` — apply migrations
- `pnpm db:push` / `pnpm db:push:prod` — push schema directly (dev/prod)
- Schema: `db/schema.ts` | Config: `drizzle.config.ts` | Migrations: `db/migrations/`

## Architecture

### Stack

Next.js 16 App Router · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui · Drizzle ORM · PostgreSQL · Cloudflare R2 · JWT Auth · Web Push (VAPID)

### Route Structure

```
app/
  page.tsx              — public landing (hero, announcements, projects list)
  projects/[id]/        — public project detail
  admin/                — protected admin area (role-guarded)
    projects/           — manage projects
    admins/             — manage admin roles
    login/              — email/password login page
    notifications/      — send push notifications
  notifications/actions.ts — Web Push server actions
```

### Auth & Roles

- Auth uses **JWT sessions** (`jose`) stored in an httpOnly cookie (`admin_session`). Passwords are hashed with `bcryptjs`.
- Admin credentials (email + password_hash + role) are stored in the `admins` DB table.
- Two roles: `"super_admin"` and `"project_owner"` — defined in `lib/roles.ts` and `db/schema.ts` (`adminRoleEnum`).
- `lib/auth.ts` provides `createSession`, `verifySession`, `deleteSession`, `authenticateAdmin`, `hashPassword`, `verifyPassword`.
- `lib/roles.ts:checkRole()` reads the session for server-side role checks.
- `middleware.ts` guards all `/admin/*` routes (except `/admin/login`) by verifying the JWT cookie — redirects to `/admin/login` if invalid.
- Admin role assignment is done directly via DB operations in `app/admin/admins/actions.ts`.
- Seed script: `tsx db/seed-admin.ts <email> <password> [role]` creates the first admin.

### Database Layer

- Single `config` export from `lib/config.ts` exposes `config.db` (Drizzle instance) and `config.r2` (R2 credentials).
- Connection pooling via `pg.Pool` with dev-mode singleton on `globalThis` to survive HMR.
- Query helpers live in `db/queries.ts`; all schema in `db/schema.ts`; enum constants in `db/enums.ts`.
- Key tables: `projects`, `tags`, `project_participants`, `subscriptions`, `notifications`, `admins`, `admin_projects`.

### Notifications (Web Push PWA)

- `NotificationProvider` (`components/notification-provider.tsx`) manages service worker registration, push subscription state, and exposes `useNotification()` hook.
- Server actions in `app/notifications/actions.ts` handle subscribe/unsubscribe/send using `web-push` with VAPID keys.
- Failed subscriptions are auto-deleted during broadcast.

### UI Conventions

- **RTL-first, Arabic-first**: root `<html>` has `lang="ar" dir="rtl"`. All layouts and components must account for RTL.
- **Mobile-first**: design for mobile before desktop.
- Prefer shadcn/ui components over custom equivalents. Add them to `components/ui/` with
  `npx shadcn@latest add <name>`. See `components.json` for the RTL configuration
  (base color `mist`, style `radix-mira`).
- Three custom Thmanyah font families: `--font-sans`, `--font-heading`, `--font-serif`.
- URL state managed by `nuqs` (NuqsAdapter wraps the app).
- Client-side fuzzy search via `fuse.js`.

### Rendering Strategy

- Prefer static prerendering. Use `generateStaticParams` for dynamic routes where possible.
- Use `<Suspense>` boundaries for anything that blocks static rendering.
- Before choosing a rendering strategy, discuss the applicable options and tradeoffs and
  recommend the best fit. Before adding `"use client"`, evaluate cached Server Components,
  Suspense and `generateStaticParams`.
- Server actions (`"use server"`) are used for all mutations.
