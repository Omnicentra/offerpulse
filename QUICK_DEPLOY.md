# ⚡ Quick Deploy to Vercel

## Two Projects Needed

You need **2 separate Vercel projects** (same repo, different configs):

1. **Marketing** → `offerpulse.com`
2. **Dashboard** → `app.offerpulse.com`

## 🚀 Deploy Marketing Site

### Via Dashboard (Easiest)

1. Go to https://vercel.com/new
2. Import your Git repo
3. **Settings**:
   - **Root Directory**: `apps/marketing`
   - **Build Command**: `cd ../.. && pnpm build:marketing`
   - **Output Directory**: `apps/marketing/.next`
   - **Install Command**: `cd ../.. && pnpm install`
4. Deploy!

### Via CLI

```bash
cd apps/marketing
vercel
# Set root: apps/marketing
# Build: cd ../.. && pnpm build:marketing
```

## 🚀 Deploy Dashboard App

### Via Dashboard

1. Go to https://vercel.com/new
2. Import the **same** Git repo
3. **Settings**:
   - **Root Directory**: `apps/app`
   - **Build Command**: `cd ../.. && pnpm build:app`
   - **Output Directory**: `apps/app/.next`
   - **Install Command**: `cd ../.. && pnpm install`

4. **Environment Variables** (Required):
   ```
   DATABASE_URL=your-postgresql-url
   NEXTAUTH_SECRET=random-secret-here
   NEXTAUTH_URL=https://your-app.vercel.app
   ```

5. Deploy!

### Via CLI

```bash
cd apps/app
vercel
# Set root: apps/app
# Build: cd ../.. && pnpm build:app
# Add env vars when prompted
```

## 📦 Get Database URL

**Easiest: Vercel Postgres**
- Vercel Dashboard → Storage → Create Postgres
- Use `POSTGRES_URL` as `DATABASE_URL`

**Or use Neon/Supabase** (see VERCEL_DEPLOYMENT.md)

## 🔧 After Deployment

### Marketing
✅ Should work immediately

### Dashboard
1. Run migrations (one-time):
   ```bash
   vercel env pull .env.local
   cd apps/app
   pnpm db:push
   pnpm db:seed
   ```

2. Or create a migration API route

## 🌐 Add Domains

- Marketing: Add `offerpulse.com` in project settings
- Dashboard: Add `app.offerpulse.com` in project settings

## ✅ Done!

Your apps will be live! 🎉
