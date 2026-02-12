# Migration Guide: Marketing App to Monorepo

## Current Status

The monorepo structure has been created with:
- ✅ Root configuration (package.json, turbo.json, pnpm-workspace.yaml)
- ✅ Shared packages (config, lib, ui)
- ✅ Dashboard app structure (apps/app)
- ✅ Prisma schema and seed data
- ✅ Auth setup (NextAuth)

## Next Steps

### 1. Move Marketing App

The existing marketing app needs to be moved from `offerpulse/` to `apps/marketing/`:

```bash
# Option 1: Manual copy (recommended)
cp -r offerpulse/* apps/marketing/

# Option 2: Use git mv (preserves history)
git mv offerpulse apps/marketing
```

### 2. Update Marketing App Imports

Update all imports in `apps/marketing/` to use shared packages:

- `@/lib/utils` → `@offerpulse/lib/utils`
- Keep `@/components` as local imports
- Update `tsconfig.json` paths if needed

### 3. Install Dependencies

```bash
# Install all dependencies
pnpm install

# Generate Prisma client
cd apps/app
pnpm db:generate
```

### 4. Set Up Database

```bash
# Create .env.local in apps/app
DATABASE_URL="postgresql://user:password@localhost:5432/offerpulse"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3001"

# Run migrations
cd apps/app
pnpm db:push
pnpm db:seed
```

### 5. Complete Dashboard Implementation

The dashboard app structure is in place. Remaining work:

1. **UI Components** - Copy from marketing app and update imports
2. **Dashboard Layout** - Sidebar navigation component
3. **Dashboard Pages** - All pages listed in requirements
4. **API Routes** - Competitors, changes, snapshots, etc.
5. **Monitoring Pipeline** - Inngest functions or cron jobs

## File Structure

```
offerpulse/
├── apps/
│   ├── marketing/          # Marketing site (localhost:3000)
│   │   ├── app/
│   │   ├── components/
│   │   └── package.json
│   └── app/                # Dashboard (localhost:3001)
│       ├── app/
│       ├── components/
│       ├── lib/
│       ├── prisma/
│       └── package.json
├── packages/
│   ├── config/             # Shared configs
│   ├── lib/                 # Shared utilities
│   └── ui/                  # Shared UI components
└── package.json            # Root workspace
```

## Development

```bash
# Run both apps
pnpm dev

# Run marketing only
pnpm dev:marketing

# Run dashboard only
pnpm dev:app
```

## Deployment

### Marketing (offerpulse.com)
- Root: `apps/marketing`
- Build: `cd ../.. && pnpm build:marketing`

### Dashboard (app.offerpulse.com)
- Root: `apps/app`
- Build: `cd ../.. && pnpm build:app`
- Environment: Requires DATABASE_URL, NEXTAUTH_SECRET, etc.
