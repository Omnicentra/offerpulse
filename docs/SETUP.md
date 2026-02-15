# OfferPulse Setup Guide

## ✅ What's Done

- ✅ Monorepo structure created
- ✅ Marketing app moved to `apps/marketing`
- ✅ Dashboard app created in `apps/app`
- ✅ All dependencies installed
- ✅ Prisma client generated

## 🚀 Quick Start

### 1. Set Up Database

You need a PostgreSQL database. Options:

**Option A: Local PostgreSQL**
```bash
# Install PostgreSQL (if not installed)
# macOS: brew install postgresql
# Then start it: brew services start postgresql

# Create database
createdb offerpulse
```

**Option B: Use a cloud database (recommended for quick start)**
- Sign up for [Neon](https://neon.tech) (free tier available)
- Or use [Supabase](https://supabase.com) (free tier)
- Copy the connection string

### 2. Configure Environment Variables

Create `.env.local` in `apps/app/`:

```bash
cd apps/app
cat > .env.local << EOF
DATABASE_URL="postgresql://user:password@localhost:5432/offerpulse?schema=public"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NEXTAUTH_URL="http://localhost:3001"
EOF
```

**Or manually create the file:**
```env
DATABASE_URL="your-postgresql-connection-string"
NEXTAUTH_SECRET="generate-a-random-secret-here"
NEXTAUTH_URL="http://localhost:3001"
```

### 3. Initialize Database

```bash
cd apps/app

# Push schema to database
pnpm db:push

# Seed with demo data
pnpm db:seed
```

### 4. Run the Apps

From the root directory:

```bash
# Run both apps
pnpm dev

# Or run individually:
pnpm dev:marketing  # http://localhost:3000
pnpm dev:app       # http://localhost:3001
```

## 🎯 Access the Apps

### Marketing Site
- URL: http://localhost:3000
- No authentication required

### Dashboard App
- URL: http://localhost:3001
- **Demo Account:**
  - Email: `demo@offerpulse.io`
  - Password: `demo123`

Or create a new account by clicking "Sign up"

## 📁 Project Structure

```
offerpulse/
├── apps/
│   ├── marketing/     # Marketing website (port 3000)
│   └── app/           # Dashboard app (port 3001)
├── packages/
│   ├── config/        # Shared configs
│   ├── lib/           # Shared utilities
│   └── ui/            # Shared UI components
└── package.json       # Root workspace
```

## 🔧 Troubleshooting

### Database Connection Issues

**Error: "Can't reach database server"**
- Ensure PostgreSQL is running
- Check DATABASE_URL format: `postgresql://user:password@host:port/database`
- Verify database exists

**Error: "relation does not exist"**
- Run `pnpm db:push` to create tables

### Port Already in Use

If port 3000 or 3001 is in use:
- Marketing: Change port in `apps/marketing/package.json` dev script
- Dashboard: Change port in `apps/app/package.json` dev script

### Import Errors

If you see import errors:
- Run `pnpm install` from root
- Ensure shared packages are built (they auto-build)

### Prisma Client Not Found

```bash
cd apps/app
pnpm db:generate
```

## 📚 Next Steps

1. **Complete Dashboard Pages**
   - Overview page is skeleton - add real data fetching
   - Build out Competitors, Changes, Snapshots pages
   - Add API routes for data operations

2. **Set Up Monitoring Pipeline**
   - Configure Inngest or cron jobs
   - Implement snapshot capture
   - Add change detection logic

3. **Deploy to Vercel**
   - Create two Vercel projects
   - Marketing: Root directory `apps/marketing`
   - Dashboard: Root directory `apps/app`
   - Configure environment variables

## 🆘 Need Help?

- Check [QUICK_START.md](./QUICK_START.md) for detailed instructions
- See [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md) for what's built
- Review [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for marketing app details
