# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Overview
OfferPulse is a competitor monitoring SaaS that tracks e-commerce competitor offers, detects changes, and provides actionable recommendations. It's a pnpm/Turborepo monorepo with two Next.js 16 apps and shared packages.

## Build and Development Commands

```bash
# Install dependencies
pnpm install

# Development - runs both apps
pnpm dev

# Run individual apps
pnpm dev:app        # Dashboard at localhost:3001
pnpm dev:marketing  # Marketing site at localhost:3000

# Linting and type checking
pnpm lint
pnpm type-check

# Build
pnpm build
pnpm build:app
pnpm build:marketing
```

### Database Commands (from apps/app)
```bash
pnpm db:push        # Push schema changes to database (local dev)
pnpm db:migrate     # Run migrations
pnpm db:migrate:prod # Run migrations with NODE_ENV=production
pnpm db:generate    # Generate Drizzle migration files
pnpm db:seed        # Seed database with demo data
pnpm db:studio      # Open Drizzle Studio GUI
```

### Vercel (Omnicentra team)
Link local app directories to existing Vercel projects (run from repo root):

```bash
vercel link apps/app --yes --scope omnicentra --project offerpulse-app
vercel link apps/marketing --yes --scope omnicentra --project offerpulse-marketing
```

Then deploy from each app: `cd apps/app && vercel` or `cd apps/marketing && vercel`.

## Architecture

### Monorepo Structure
```
apps/
├── app/           # Dashboard (app.offerpulse.com) - tRPC + Drizzle + Better-auth
└── marketing/     # Marketing site (offerpulse.com) - Stripe, Resend, PostHog

packages/
├── lib/           # Shared utilities, validators, constants, routing helpers
├── ui/            # Shared UI components (currently empty, components live in apps)
└── config/        # Shared ESLint, Tailwind, and TypeScript configs
```

### Dashboard App (apps/app) Key Directories
- `app/` - Next.js App Router pages (route groups: `(auth)`, `(dashboard)`)
- `src/server/trpc/` - tRPC router definitions (`routers/root.ts` has all routes)
- `src/server/db/` - Drizzle schema (`schema.ts`), migrations, seeds
- `src/server/auth/` - Better-auth configuration
- `src/server/jobs/` - Inngest background job functions
- `src/server/scraping/` - Browser automation for competitor snapshots
- `src/server/ai/` - AI-powered analysis and recommendations
- `src/server/notifications/` - Email (Resend) and Slack alerts

### tRPC Routers
The API is organized by domain in `apps/app/src/server/trpc/routers/`:
- `auth` - Authentication procedures
- `competitors` - Competitor CRUD
- `monitorSettings` - Per-competitor monitoring configuration
- `snapshots` - Captured competitor snapshots
- `changeEvents` - Detected changes
- `recommendations` - AI-generated action items
- `alerts` - Notification settings
- `weeklyPulse` - Weekly summary reports
- `users`, `workspaceSettings` - User/workspace management

### Database Schema
Core entities in `apps/app/src/server/db/schema.ts`:
- **Auth**: `user`, `session`, `account`, `verification` (Better-auth)
- **Multi-tenant**: `workspaces`, `workspaceMembers`
- **Monitoring**: `competitors`, `monitorSettings`, `snapshots`
- **Intelligence**: `changeEvents`, `recommendations`, `recommendationChecklistItems`
- **Settings**: `alertSettings`, `workspaceSettings`
- **Reporting**: `weeklyPulses`
- **Jobs**: `scrapeJobs`

### Background Jobs (Inngest)
Jobs in `apps/app/src/server/jobs/functions/`:
- `captureSnapshotJob` - Scrape competitor pages
- `scheduleCapturesJob` - Schedule periodic captures
- `detectChangesJob` - Compare snapshots for changes
- `generateRecommendationsJob` - AI analysis of changes
- `sendAlertsJob` - Email/Slack notifications
- `generateWeeklyPulseJob` - Weekly summary generation

### Shared Package Usage
Import from `@offerpulse/lib`:
- `routing.ts` - Cross-app navigation helpers (`buildAppSignupUrl`, `getDashboardUrl`)
- `constants.ts` - Enums for change types, confidence levels, strategies
- `validators.ts` - Shared Zod schemas
- `monitoring/` - Monitoring-related utilities

## Code Conventions

### TypeScript
- Use interfaces over types
- Avoid enums in app code (use maps); enums exist only in `packages/lib/constants.ts`
- Avoid `any` - use proper types
- Use functional components with TypeScript interfaces

### Naming
- Directories: kebab-case (`auth-wizard`, `ai-workflow-dialog`)
- Component files: kebab-case (`ai-workflow-dialog.tsx`)
- Use named exports for components

### React/Next.js
- Favor React Server Components; minimize `'use client'`
- Wrap client components in Suspense
- Use dynamic loading for non-critical components
- Follow Next.js App Router patterns

### tRPC
- Define procedures with Zod input validation
- Use `publicProcedure`, `protectedProcedure`, or `workspaceProcedure` appropriately
- Use superjson as transformer (preserves Date, Map, Set)
- Export only type definitions to client (`AppRouter` type)

### Drizzle ORM
- Schema defined in `apps/app/src/server/db/schema.ts`
- Use `pnpm db:push` for local development schema changes
- Use `pnpm db:migrate:prod` for production deployments
- Use relational queries with `with` for joins
- Use transactions for atomic operations

### Environment Variables
- Validated with `@t3-oss/env-nextjs` (dashboard) or `@t3-oss/env-core` (marketing)
- Schema defined in `env.ts` in each app root
- Server vars must be declared in `turbo.json` `globalEnv` for Turborepo/Vercel builds
- Import as `import { env } from "@/env"` in server code only

## Testing
No test framework is configured yet. When adding tests, add commands to `apps/app/package.json` and `apps/marketing/package.json`.

## Demo Account
Dashboard app demo login:
- Email: `demo@offerpulse.io`
- Password: `demo123`

## Cursor Cloud specific instructions

Standard commands live in the sections above and in `apps/app/BACKEND_SETUP.md`; the notes below only cover non-obvious cloud gotchas.

### Environment / secrets
- All required app + marketing env vars are injected as real environment variables in the VM (DB, Better-auth, R2, Stripe, Resend, Firecrawl, OpenRouter, Upstash, Slack, Shopify, PostHog, Sentry, app URLs). `next dev` and the `drizzle-kit`/`tsx` DB scripts read `process.env` directly, so **no `.env.local` is required just to run the dev servers**.
- The setup session writes `apps/app/.env.local` and `apps/marketing/.env.local` from those env vars for convenience (they are git-ignored and not persisted across fresh VMs — regenerate from `process.env` if a DB script needs `dotenv -e .env.local`, e.g. `pnpm db:seed`).
- `AIRTABLE_API_KEY` is the one required marketing var that is **not** injected. It only backs marketing email-capture (early-access queue). A `pat_dev_placeholder_replace_me` value is used so the marketing app boots; the free tools (Firecrawl + OpenRouter) work, but Airtable-backed email capture will fail until a real key is provided as a secret.

### Database
- `DATABASE_URL` points to a **shared hosted Postgres that is already migrated and seeded** (all tables present; real workspaces/competitors/users exist). Do **not** run `pnpm db:push`, `pnpm db:migrate`, or `pnpm db:seed` against it during setup — they mutate shared data. Only run schema changes deliberately.
- The demo login in the section above (`demo@offerpulse.io`) does **not** exist in this DB. For a quick manual test, sign up a fresh user at `/signup` — a workspace is auto-created via a Better-auth database hook (`databaseHooks.user.create.after`).

### Running / testing
- Run `pnpm dev` (both apps), or `pnpm dev:app` (dashboard, :3001) / `pnpm dev:marketing` (marketing, :3000). Dashboard `/` redirects to `/login`.
- `.cursor/rules/.mdc` tells normal code-change agents not to start dev servers; that guidance does not apply when the task is explicitly to run/verify the app.
- Adding a competitor (`competitors.create`) writes straight to the DB and needs no background worker. The **Inngest dev server** (`npx inngest-cli@latest dev`, :8288) is optional and only needed to exercise background jobs (snapshot capture, change detection, AI recs, alerts).
- `pnpm type-check` passes for both apps. `pnpm lint` currently **fails with pre-existing violations** (unused vars / `no-explicit-any`) in both `app` and `marketing` — this is existing code state, not an environment problem.
