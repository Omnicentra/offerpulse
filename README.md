# OfferPulse Monorepo

Monorepo containing the OfferPulse marketing website and dashboard application.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+ (`npm install -g pnpm`)
- PostgreSQL database

### Installation

```bash
# Install dependencies
pnpm install

# Set up database (see SETUP.md for details)
cd apps/app
pnpm db:push
pnpm db:seed
```

### Run Development Servers

```bash
# From root directory - run both apps
pnpm dev

# Or run individually:
pnpm dev:marketing  # http://localhost:3000
pnpm dev:app       # http://localhost:3001
```

## 📁 Structure

```
offerpulse/
├── apps/
│   ├── marketing/     # Marketing website (offerpulse.com)
│   └── app/           # Dashboard app (app.offerpulse.com)
├── packages/
│   ├── ui/            # Shared UI components
│   ├── config/        # Shared configs (eslint, tsconfig, tailwind)
│   └── lib/           # Shared utilities
└── package.json       # Root workspace config
```

## 🎯 Access the Apps

### Marketing Site
- **URL:** http://localhost:3000
- **No authentication required**

### Dashboard App
- **URL:** http://localhost:3001
- **Demo Account:**
  - Email: `demo@offerpulse.io`
  - Password: `demo123`

## 📚 Documentation

- **[SETUP.md](./SETUP.md)** - Detailed setup instructions
- **[QUICK_START.md](./QUICK_START.md)** - Getting started guide
- **[IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md)** - What's built and what's remaining
- **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** - Marketing app migration details

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Styling:** TailwindCSS + shadcn/ui
- **Monorepo:** Turborepo + pnpm workspaces
- **Database:** PostgreSQL + Prisma (dashboard only)
- **Auth:** NextAuth.js (dashboard only)

## 📦 Available Scripts

### Root Level
- `pnpm dev` - Run both apps
- `pnpm dev:marketing` - Run marketing site only
- `pnpm dev:app` - Run dashboard app only
- `pnpm build` - Build all apps
- `pnpm lint` - Lint all apps

### Dashboard App (`apps/app`)
- `pnpm db:generate` - Generate Prisma client
- `pnpm db:push` - Push schema to database
- `pnpm db:migrate` - Run migrations
- `pnpm db:seed` - Seed database with demo data
- `pnpm db:studio` - Open Prisma Studio

## 🚢 Deployment

### Marketing Site (offerpulse.com)

Deploy to Vercel:
- Root directory: `apps/marketing`
- Framework: Next.js
- Build command: `cd ../.. && pnpm build:marketing`
- Output directory: `apps/marketing/.next`

### Dashboard App (app.offerpulse.com)

Deploy to Vercel:
- Root directory: `apps/app`
- Framework: Next.js
- Build command: `cd ../.. && pnpm build:app`
- Output directory: `apps/app/.next`
- Environment variables: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`

## 🔧 Environment Variables

### Dashboard App (`apps/app/.env.local`)

Required:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Random secret for JWT signing
- `NEXTAUTH_URL` - App URL (http://localhost:3001 for dev)

Optional:
- `RESEND_API_KEY` - For email notifications
- `SLACK_WEBHOOK_URL` - For Slack alerts
- `INNGEST_EVENT_KEY` - For background jobs

## 🐛 Troubleshooting

See [SETUP.md](./SETUP.md) for troubleshooting guide.

## 📝 License

Private - All rights reserved
