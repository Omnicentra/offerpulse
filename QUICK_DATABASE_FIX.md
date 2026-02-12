# Quick Database Fix

## The Issue

You're seeing "Failed to create account" because the app can't connect to a database.

## Fastest Solution (5 minutes)

### Step 1: Get a Free Database

1. Go to **https://neon.tech** (or **https://supabase.com**)
2. Sign up (free)
3. Create a new project
4. Copy the connection string

### Step 2: Update Configuration

Edit `apps/app/.env.local` and replace the DATABASE_URL:

```env
DATABASE_URL="your-actual-connection-string-from-neon-or-supabase"
NEXTAUTH_SECRET="any-random-string-here"
NEXTAUTH_URL="http://localhost:3001"
```

### Step 3: Initialize Database

```bash
cd apps/app
pnpm db:push
pnpm db:seed
```

### Step 4: Restart Server

The server should auto-reload, but if not:
```bash
# Stop servers
lsof -ti:3000,3001 | xargs kill -9

# Start again
cd /Users/olaoladapo/offerpulse
pnpm dev
```

### Step 5: Try Again

Go to http://localhost:3001 and create an account - it should work now!

## Alternative: Use Demo Account

If you just want to test the UI without setting up a database, you can't log in yet, but you can:
- View the login/signup pages
- See the UI design

The database is required for actual authentication to work.

## Need the Connection String Format?

It should look like:
```
postgresql://username:password@host.neon.tech/dbname?sslmode=require
```

Or for Supabase:
```
postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres
```
