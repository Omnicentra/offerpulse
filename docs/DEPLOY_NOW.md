# 🚀 Quick Deploy to Vercel

## Fastest Way (Vercel Dashboard)

### Step 1: Marketing Site

1. Go to https://vercel.com/new
2. Import your Git repository
3. **Project Settings**:
   - **Root Directory**: `apps/marketing`
   - **Framework**: Next.js (auto-detected)
   - **Build Command**: `cd ../.. && pnpm build:marketing`
   - **Output Directory**: `apps/marketing/.next`
   - **Install Command**: `cd ../.. && pnpm install`
4. Click **Deploy**

### Step 2: Dashboard App

1. Go to https://vercel.com/new
2. Import the **same** Git repository
3. **Project Settings**:
   - **Root Directory**: `apps/app`
   - **Framework**: Next.js (auto-detected)
   - **Build Command**: `cd ../.. && pnpm build:app`
   - **Output Directory**: `apps/app/.next`
   - **Install Command**: `cd ../.. && pnpm install`
4. **Environment Variables** (Add these):
   ```
   DATABASE_URL=your-postgresql-connection-string
   NEXTAUTH_SECRET=your-random-secret
   NEXTAUTH_URL=https://your-app-url.vercel.app
   ```
5. Click **Deploy**

## Get Database URL

For the dashboard app, you need a PostgreSQL database:

**Option 1: Vercel Postgres** (Easiest)
- In Vercel dashboard → Storage → Create Postgres
- Use the `POSTGRES_URL` it provides

**Option 2: Neon** (Free)
- Go to https://neon.tech
- Create project → Copy connection string
- Use as `DATABASE_URL`

**Option 3: Supabase** (Free)
- Go to https://supabase.com
- Create project → Settings → Database → Connection string
- Use as `DATABASE_URL`

## After Deployment

### Marketing Site
- ✅ Should work immediately
- Add your domain in Vercel project settings

### Dashboard App
1. After first deploy, you need to run migrations:
   ```bash
   # Get environment variables
   vercel env pull .env.local
   
   # Run migrations
   cd apps/app
   pnpm db:push
   pnpm db:seed
   ```

2. Or create a one-time migration API route

## Domain Setup

### Marketing (Root)
- Add `offerpulse.com` in Vercel project → Domains
- Follow DNS instructions

### Dashboard (Subdomain)
- Add `app.offerpulse.com` in Vercel project → Domains
- Follow DNS instructions

## That's It! 🎉

Your apps will be live at:
- Marketing: `https://offerpulse.com`
- Dashboard: `https://app.offerpulse.com`
