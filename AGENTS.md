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
- **Auth**: `users`, `sessions`, `accounts`, `verificationTokens` (Better-auth)
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
