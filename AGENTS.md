# Repo essentials

- Package manager is pnpm
- Dev server requires Infisical env injection: `pnpm dev` runs `infisical run --env=dev -- next dev --turbopack`.
- Database tooling uses Drizzle; migrations/config read `DATABASE_URL` (see `drizzle.config.ts` and `.env.example`).

# Common commands

- Dev: `pnpm dev`
- Build: `pnpm build:dev`
- Start: `pnpm start`
- Lint: `pnpm lint`
- Typecheck: `pnpm typecheck`
- Format: `pnpm format`
- After done with your work, always verify by running: `pnpm format && pnpm lint && pnpm typecheck && pnpm build`.

# UI stack

- shadcn/ui is configured via `components.json` (RTL enabled, base color `mist`, style `radix-mira`).
- Prefer adding shadcn components (`npx shadcn@latest add <name>`) over building your own. Components go into `components/ui`.
- This site is Arabic-first and therefore RTL-first; always account for RTL layout.
- This site is mobile-first; always account for mobile layout as well as desktop layout.

# Static rules

- This project prioritizes static prerendering whenever possible; use Suspense where needed.
- Always discuss prerendering strategy options (client components, cache components, Suspense, `generateStaticParams`, etc.), summarize tradeoffs, and recommend the best fit.
