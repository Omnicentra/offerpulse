# OfferPulse Backend Setup Guide

This guide will help you set up and run the OfferPulse backend infrastructure.

## Architecture Overview

The backend consists of:

- **Database**: PostgreSQL via Neon with Drizzle ORM
- **Authentication**: Better-auth with email/password
- **API Layer**: tRPC for type-safe API calls
- **Background Jobs**: Inngest for scheduled tasks
- **Web Scraping**: Playwright for browser automation
- **AI**: OpenAI/Anthropic for recommendations
- **Notifications**: Resend (email) and Slack (webhooks)

### When is a workspace created?

**A workspace is created automatically when a user signs up.**

1. **On signup** – Better-auth creates the user in the `users` table, then a **database hook** (`databaseHooks.user.create.after`) runs and:
   - Creates a new workspace (e.g. `"My Store"` or `"{name} Store"`)
   - Inserts a row in `workspace_members` with role `owner` linking the user to that workspace

2. **In the app** – The `WorkspaceProvider` calls `trpc.users.getMyWorkspaces` (when the user is logged in) and uses the first workspace as the current workspace. Users with multiple workspaces (e.g. after being invited) can switch via `setWorkspaceId`.

So: **signup → user created → hook runs → workspace + membership created → app loads workspaces and picks the first one.**

## Prerequisites

- Node.js 18+ and pnpm
- PostgreSQL database (recommend Neon for easy setup)
- API keys for optional services (see Environment Variables)

## Quick Start

### 1. Install Dependencies

From the monorepo root:

```bash
pnpm install
```

### 2. Set Up Environment Variables

Copy the example file:

```bash
cd apps/app
cp .env.local.example .env.local
```

Edit `.env.local` with your actual values:

```env
# Required
DATABASE_URL=postgresql://user:password@host:5432/database
BETTER_AUTH_SECRET=your-secret-key-here-generate-with-openssl-rand-base64-32
BETTER_AUTH_URL=http://localhost:3001

# AI (at least one required for recommendations)
OPENAI_API_KEY=your-openai-api-key
# or ANTHROPIC_API_KEY=your-anthropic-api-key

# Optional but recommended for production
INNGEST_EVENT_KEY=your-inngest-event-key
INNGEST_SIGNING_KEY=your-inngest-signing-key
RESEND_API_KEY=your-resend-api-key
```

### 3. Set Up Database

Generate migration files:

```bash
pnpm db:generate
```

Run migrations:

```bash
pnpm db:migrate
```

Seed with demo data (optional):

```bash
pnpm db:seed
```

This creates a demo user (aligned with staging):

- Email: `chipzstar.dev@googlemail.com`
- Password: `demo123`
- Name: Chisom Oguibe
- Workspace: `Demo Store`

### 4. Install Playwright Browsers

For web scraping:

```bash
npx playwright install chromium
```

### 5. Start Development Server

```bash
pnpm dev
```

The app will be available at http://localhost:3001

### 6. Start Inngest Dev Server (Optional)

For testing background jobs:

```bash
npx inngest-cli@latest dev
```

Then visit http://localhost:8288 to see the Inngest dashboard.

## Database Commands

```bash
# Generate migration from schema changes
pnpm db:generate

# Run migrations
pnpm db:migrate

# Push schema directly (dev only)
pnpm db:push

# Open Drizzle Studio (GUI)
pnpm db:studio

# Seed database (all phases)
pnpm db:seed

# Seed only specific phases (e.g. users + workspaces)
pnpm db:seed -- --only=users,workspaces

# Or pass phase names as positional args
pnpm db:seed -- users workspaces workspace-members

# Phases (in order): users | workspaces | workspace-members | competitors | snapshots | alerts
```

## Project Structure

```
src/
├── server/
│   ├── db/                 # Database schema and client
│   │   ├── schema.ts       # Drizzle schema (15 tables)
│   │   ├── index.ts        # Database client
│   │   ├── migrate.ts      # Migration runner
│   │   └── seed.ts         # Seed script
│   ├── auth/               # Better-auth configuration
│   │   ├── index.ts        # Server-side auth
│   │   └── client.ts       # Client-side helpers
│   ├── trpc/               # tRPC routers
│   │   ├── trpc.ts         # tRPC initialization
│   │   ├── routers/        # Domain-specific routers
│   │   │   ├── _app.ts     # Root router
│   │   │   ├── competitors.ts
│   │   │   ├── snapshots.ts
│   │   │   ├── change-events.ts
│   │   │   ├── recommendations.ts
│   │   │   └── ...
│   ├── jobs/               # Inngest background jobs
│   │   ├── client.ts       # Inngest client
│   │   └── functions/      # Job definitions
│   │       ├── capture-snapshot.ts
│   │       ├── schedule-captures.ts
│   │       ├── detect-changes.ts
│   │       ├── generate-recommendations.ts
│   │       ├── send-alerts.ts
│   │       └── generate-weekly-pulse.ts
│   ├── scraping/           # Web scraping service
│   │   ├── index.ts        # Main scraping orchestrator
│   │   ├── browser-pool.ts # Browser management
│   │   ├── screenshot.ts   # Screenshot capture
│   │   └── extractor.ts    # Offer signal extraction
│   ├── change-detection/   # Change detection algorithm
│   │   └── index.ts
│   ├── ai/                 # AI recommendation generation
│   │   └── index.ts
│   └── notifications/      # Email and Slack alerts
│       ├── email.ts
│       ├── slack.ts
│       └── index.ts
├── lib/
│   ├── trpc/               # tRPC client setup
│   ├── logger.ts           # Centralized logging
│   ├── errors.ts           # Custom error classes
├── env.ts                  # Environment validation (@t3-oss/env-nextjs, project root)
└── providers/
    ├── trpc-provider.tsx   # tRPC React provider
    └── workspace-provider.tsx
```

## Background Jobs

The application uses Inngest for background job processing:

### Job Functions

1. **schedule-captures** (cron: every hour)
   - Schedules competitor snapshots based on monitor settings
   - Triggers capture jobs for active competitors

2. **capture-snapshot** (event: `competitor/capture`)
   - Scrapes competitor website
   - Extracts offer signals
   - Captures screenshot
   - Stores snapshot in database

3. **detect-changes** (event: `change/detected`)
   - Compares new snapshot with previous
   - Identifies meaningful changes
   - Creates change event records

4. **generate-recommendations** (event: `recommendation/generated`)
   - Uses AI to analyze changes
   - Generates strategic recommendations
   - Creates actionable checklist items

5. **send-alerts** (event: `alert/send`)
   - Sends email notifications (Resend)
   - Sends Slack notifications (webhooks)
   - Respects user alert settings

6. **generate-weekly-pulse** (cron: Monday 9 AM)
   - Aggregates weekly changes
   - Generates pulse report
   - Sends summary notifications

### Testing Jobs Locally

1. Start Inngest dev server:
   ```bash
   npx inngest-cli@latest dev
   ```

2. Trigger a test event via the Inngest UI at http://localhost:8288

3. Or trigger programmatically via tRPC mutation

## API Routes

### tRPC API

All API routes are defined in `src/server/trpc/routers/`:

```typescript
// Example: List competitors
const { data } = trpc.competitors.list.useQuery({ workspaceId });

// Example: Create competitor
const createMutation = trpc.competitors.create.useMutation();
await createMutation.mutateAsync({
  workspaceId,
  name: "Competitor Name",
  url: "https://competitor.com",
});
```

### Better-auth API

Authentication endpoints at `/api/auth/[...all]`:

- POST `/api/auth/sign-in/email` - Sign in
- POST `/api/auth/sign-up/email` - Sign up
- POST `/api/auth/sign-out` - Sign out
- GET `/api/auth/session` - Get session

### Inngest API

Inngest webhook at `/api/inngest`:

- Receives job execution requests from Inngest Cloud

## Environment Variables Reference

### Required

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Auth secret (32+ chars) |
| `BETTER_AUTH_URL` | Base URL for auth callbacks |

### AI (at least one required)

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | OpenAI API key for GPT-4 |
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude |

### Background Jobs (production)

| Variable | Description |
|----------|-------------|
| `INNGEST_EVENT_KEY` | Inngest event key |
| `INNGEST_SIGNING_KEY` | Inngest webhook signing key |

### Notifications (optional)

| Variable | Description |
|----------|-------------|
| `RESEND_API_KEY` | Resend API key for emails |
| `ALERT_EMAIL` | Email address for alerts |

### Storage (optional, for screenshots)

| Variable | Description |
|----------|-------------|
| `R2_ACCOUNT_ID` | Cloudflare R2 account ID |
| `R2_ACCESS_KEY_ID` | R2 access key |
| `R2_SECRET_ACCESS_KEY` | R2 secret key |
| `R2_BUCKET_NAME` | R2 bucket name |

### App URLs

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_MARKETING_APP_URL` | Marketing site URL |
| `NEXT_PUBLIC_DASHBOARD_APP_URL` | Dashboard app URL |

## Production Deployment

### Vercel Deployment

Projects live under the **Omnicentra** team. To link this repo to the existing Vercel projects (e.g. after a fresh clone), run from the **monorepo root**:

```bash
vercel link apps/app --yes --scope omnicentra --project offerpulse-app
vercel link apps/marketing --yes --scope omnicentra --project offerpulse-marketing
```

Then:

1. Set up environment variables in the Vercel dashboard for each project
2. Deploy from each app: `cd apps/app && vercel` (or `vercel --prod`), and similarly for `apps/marketing`

Vercel will automatically:
- Build the Next.js app
- Run migrations on deploy
- Set up serverless functions

### Manual Deployment

1. Build the app:
   ```bash
   pnpm build
   ```

2. Run migrations:
   ```bash
   pnpm db:migrate:prod  # Use db:migrate:prod for production deployments
   ```

3. Start the server:
   ```bash
   pnpm start
   ```

### Inngest Production

1. Sign up at https://inngest.com
2. Get your production event key and signing key
3. Set environment variables
4. Inngest will automatically discover your functions via `/api/inngest`

## Troubleshooting

### Database Connection Issues

- Verify `DATABASE_URL` is correct
- Check that your IP is whitelisted (if using Neon)
- Ensure database exists and is accessible

### Playwright Issues

- Run `npx playwright install` to install browsers
- On Linux, you may need system dependencies:
  ```bash
  npx playwright install-deps
  ```

### Inngest Jobs Not Running

- Check that Inngest dev server is running locally
- Verify event keys are set in production
- Check Inngest dashboard for errors

### AI Recommendations Not Working

- Verify at least one AI API key is set
- Check API key permissions and quotas
- Review logs for AI service errors

## Next Steps

1. **Complete Frontend Migration**: See `FRONTEND_MIGRATION_STATUS.md` for remaining pages
2. **Implement Storage**: Add Cloudflare R2 or AWS S3 for screenshots
3. **Add Monitoring**: Integrate Sentry for error tracking
4. **Set Up CI/CD**: Add tests and automated deployments
5. **Configure Production Alerts**: Set up real email and Slack webhooks

## Support

For issues or questions:
- Check the [main README](../../README.md)
- Review inline code documentation
- Open an issue on GitHub
