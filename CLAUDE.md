# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Dev**: `pnpm dev` (requires Infisical — runs `infisical run --env=dev -- next dev --turbopack`)
- **Build**: `pnpm build:dev` (dev env) / `pnpm build` (uses env from shell)
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

Next.js 16 App Router · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui · Drizzle ORM · PostgreSQL · Cloudflare R2 · Clerk (auth) · Web Push (VAPID)

### Route Structure

```
app/
  page.tsx              — public landing (hero, announcements, projects list)
  projects/[id]/        — public project detail
  admin/                — protected admin area (role-guarded)
    projects/           — manage projects
    admins/             — manage admin roles
    notifications/      — send push notifications
  sign-in/, sign-up/    — Clerk auth pages
  notifications/actions.ts — Web Push server actions
```

### Auth & Roles

- Auth is handled by **Clerk** (`@clerk/nextjs`). User roles are stored in Clerk's `publicMetadata.role`.
- Two roles: `"admin"` (super admin) and `"project_owner"` — defined in `types/globals.d.ts`.
- `lib/roles.ts:checkRole()` reads `sessionClaims.metadata.role` for server-side role checks.
- Admin actions (`app/admin/*/actions.ts`) call `checkRole` and redirect to `/not-authorized` on failure.
- Admin role assignment uses Clerk's `clerkClient().users.updateUserMetadata()`.

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
- shadcn/ui components go in `components/ui/`. Add new ones via `npx shadcn@latest add <name>`.
- Three custom Thmanyah font families: `--font-sans`, `--font-heading`, `--font-serif`.
- URL state managed by `nuqs` (NuqsAdapter wraps the app).
- Client-side fuzzy search via `fuse.js`.

### Rendering Strategy

- Prefer static prerendering. Use `generateStaticParams` for dynamic routes where possible.
- Use `<Suspense>` boundaries for anything that blocks static rendering.
- Before adding a `"use client"` directive, discuss and evaluate: cached server component, Suspense boundary, or `generateStaticParams` first.
- Server actions (`"use server"`) are used for all mutations.
