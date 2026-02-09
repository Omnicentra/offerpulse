# Database Setup - Quick Guide

## The Problem

The dashboard app needs a PostgreSQL database to store users, competitors, and monitoring data. Right now it's trying to connect to a database that doesn't exist.

## Quick Solutions (Choose One)

### Option 1: Use a Cloud Database (Easiest - 2 minutes)

1. **Sign up for Neon** (free tier): https://neon.tech
   - Click "Sign Up" (free)
   - Create a new project
   - Copy the connection string (looks like: `postgresql://user:password@host.neon.tech/dbname`)

2. **Update `.env.local`**:
   ```bash
   cd apps/app
   # Edit .env.local and replace DATABASE_URL with your Neon connection string
   ```

3. **Initialize database**:
   ```bash
   pnpm db:push
   pnpm db:seed
   ```

### Option 2: Use Supabase (Also Free)

1. Go to https://supabase.com
2. Create a new project
3. Get the connection string from Settings > Database
4. Update `.env.local` with the connection string
5. Run `pnpm db:push && pnpm db:seed`

### Option 3: Local PostgreSQL

If you have PostgreSQL installed:

```bash
# Create database
createdb offerpulse

# Update apps/app/.env.local:
DATABASE_URL="postgresql://your-username@localhost:5432/offerpulse"

# Initialize
cd apps/app
pnpm db:push
pnpm db:seed
```

## Current .env.local Location

The file is at: `apps/app/.env.local`

## After Setup

Once the database is set up:
1. Restart the dev server (or it will auto-reload)
2. Try creating an account again
3. It should work!

## Need Help?

Check the server logs for specific database errors:
```bash
tail -f /tmp/turbo-dev.log | grep -i database
```
