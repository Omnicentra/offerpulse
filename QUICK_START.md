# OfferPulse Dashboard - Quick Start Guide

## 🎉 What's Been Built

A complete monorepo structure with:
- ✅ Marketing app structure (ready to migrate)
- ✅ Dashboard app with full Prisma schema
- ✅ Authentication (NextAuth with credentials)
- ✅ Dashboard layout with sidebar navigation
- ✅ Overview and Competitors pages (skeleton)
- ✅ Shared packages for utilities and configs

## 🚀 Getting Started

### 1. Install Dependencies

```bash
# Install pnpm if you haven't
npm install -g pnpm

# Install all dependencies
pnpm install
```

### 2. Set Up Database

```bash
cd apps/app

# Create .env.local
cat > .env.local << EOF
DATABASE_URL="postgresql://user:password@localhost:5432/offerpulse"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NEXTAUTH_URL="http://localhost:3001"
EOF

# Generate Prisma client
pnpm db:generate

# Push schema to database
pnpm db:push

# Seed with demo data
pnpm db:seed
```

### 3. Run Development Servers

```bash
# From root directory
pnpm dev

# Or run individually:
pnpm dev:marketing  # localhost:3000
pnpm dev:app       # localhost:3001
```

### 4. Access the Dashboard

1. Go to http://localhost:3001
2. Sign up with any email/password
3. You'll be redirected to the dashboard

**Demo Account:**
- Email: `demo@offerpulse.io`
- Password: `demo123`

## 📁 Project Structure

```
offerpulse/
├── apps/
│   ├── marketing/          # Marketing site (to be migrated)
│   └── app/                # Dashboard app
│       ├── app/
│       │   ├── dashboard/  # Dashboard pages
│       │   ├── login/      # Auth pages
│       │   └── api/        # API routes
│       ├── components/     # React components
│       ├── lib/            # App-specific utilities
│       └── prisma/         # Database schema
├── packages/
│   ├── config/            # Shared configs
│   ├── lib/                # Shared utilities
│   └── ui/                 # Shared UI components
└── package.json           # Root workspace
```

## 🎯 Next Steps

1. **Complete Marketing Migration**
   - Move files from `offerpulse/` to `apps/marketing/`
   - Update imports to use shared packages

2. **Build Dashboard Pages**
   - Implement full Overview page with real data
   - Build Competitors table and add flow
   - Create Changes feed
   - Add Snapshot diff viewer
   - Build Recommendations page
   - Add Alerts configuration
   - Create Weekly Pulse page
   - Build Settings page

3. **Implement Monitoring Pipeline**
   - Set up Inngest or cron jobs
   - Implement snapshot capture
   - Add change detection
   - Create recommendation engine
   - Set up alert sending

4. **Add Missing UI Components**
   - Dialog/Modal
   - Dropdown menu
   - Select
   - Table
   - Badge
   - Skeleton loaders

## 🔧 Configuration

### Environment Variables

Required for `apps/app/.env.local`:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Random secret for JWT signing
- `NEXTAUTH_URL` - App URL (http://localhost:3001 for dev)

Optional:
- `RESEND_API_KEY` - For email notifications
- `SLACK_WEBHOOK_URL` - For Slack alerts
- `INNGEST_EVENT_KEY` - For background jobs

## 📚 Key Files

- `apps/app/prisma/schema.prisma` - Complete database schema
- `apps/app/lib/auth.ts` - NextAuth configuration
- `packages/lib/monitoring/index.ts` - Change detection logic
- `apps/app/components/dashboard/sidebar.tsx` - Navigation
- `apps/app/app/dashboard/overview/page.tsx` - Overview page

## 🐛 Troubleshooting

**Database connection errors:**
- Ensure PostgreSQL is running
- Check DATABASE_URL format
- Run `pnpm db:push` to create tables

**Auth not working:**
- Check NEXTAUTH_SECRET is set
- Verify NEXTAUTH_URL matches your dev server
- Clear browser cookies and try again

**Import errors:**
- Run `pnpm install` to ensure all packages are linked
- Check that shared packages are built (they should auto-build)

## 📖 Documentation

- See `IMPLEMENTATION_STATUS.md` for detailed status
- See `MIGRATION_GUIDE.md` for marketing app migration steps
- See `README.md` for monorepo overview
