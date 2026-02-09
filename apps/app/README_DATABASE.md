# Database Setup Required

## Current Status

❌ **Database not configured** - Account creation/login won't work until this is set up.

## Error You're Seeing

```
Can't reach database server at `localhost:5432`
Failed to create account
```

## Quick Fix (Choose One)

### 🌟 Option 1: Neon (Recommended - Free)

1. Visit https://neon.tech
2. Sign up (free tier available)
3. Create project → Copy connection string
4. Paste into `apps/app/.env.local` as `DATABASE_URL`
5. Run: `pnpm db:push && pnpm db:seed`

### Option 2: Supabase (Also Free)

1. Visit https://supabase.com  
2. Create project → Get connection string from Settings
3. Update `apps/app/.env.local`
4. Run: `pnpm db:push && pnpm db:seed`

### Option 3: Local PostgreSQL

```bash
# Install PostgreSQL (if needed)
# macOS: brew install postgresql
# Then: brew services start postgresql

# Create database
createdb offerpulse

# Update .env.local
DATABASE_URL="postgresql://$(whoami)@localhost:5432/offerpulse"

# Initialize
pnpm db:push
pnpm db:seed
```

## After Setup

1. Restart the dev server
2. Try creating an account again
3. It should work! ✅

## File Location

Your `.env.local` file is at:
```
apps/app/.env.local
```

Make sure it has:
```env
DATABASE_URL="your-actual-database-connection-string"
NEXTAUTH_SECRET="any-random-secret"
NEXTAUTH_URL="http://localhost:3001"
```
