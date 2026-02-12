# Deploy to Vercel - Step by Step Instructions

## ✅ Cleanup Complete

The old duplicate `offerpulse/` folder has been renamed to `_old_offerpulse_backup` to avoid confusion.

## Active Workspaces (Use These)

1. **Marketing Site**: `apps/marketing/` - Port 3000
2. **Dashboard App**: `apps/app/` - Port 3001

---

## Deployment via Vercel Dashboard (Recommended)

### Part 1: Deploy Marketing Site

#### Step 1: Open Vercel Dashboard
👉 **Go to**: https://vercel.com/new

#### Step 2: Import Repository
1. Select your GitHub repository (offerpulse)
2. Click **"Import"**

#### Step 3: Configure Project Settings

**IMPORTANT: Click "Edit" next to each field to change it**

| Setting | Value |
|---------|-------|
| **Project Name** | `offerpulse-marketing` |
| **Framework Preset** | `Next.js` |
| **Root Directory** | `apps/marketing` ← Click Edit and type this |
| **Build Command** | (leave default or use `pnpm build`) |
| **Output Directory** | `.next` |
| **Install Command** | (leave default) |

#### Step 4: Add Environment Variables
Click **"Environment Variables"** section and add:

**Variable 1:**
- Name: `NEXT_PUBLIC_MARKETING_APP_URL`
- Value: `https://offerpulse-marketing.vercel.app` (temp, will update later)

**Variable 2:**
- Name: `NEXT_PUBLIC_DASHBOARD_APP_URL`
- Value: `https://offerpulse-dashboard.vercel.app` (temp, will update later)

#### Step 5: Deploy
Click **"Deploy"** button

✅ Wait for deployment to complete (2-3 minutes)

---

### Part 2: Deploy Dashboard App

#### Step 1: Create New Project
👉 **Go to**: https://vercel.com/new (again)

#### Step 2: Import Same Repository
1. Select your GitHub repository again
2. Click **"Import"**

#### Step 3: Configure Project Settings

| Setting | Value |
|---------|-------|
| **Project Name** | `offerpulse-dashboard` |
| **Framework Preset** | `Next.js` |
| **Root Directory** | `apps/app` ← Click Edit and type this |
| **Build Command** | (leave default or use `pnpm build`) |
| **Output Directory** | `.next` |
| **Install Command** | (leave default) |

#### Step 4: Add Environment Variables

**Variable 1:**
- Name: `NEXT_PUBLIC_MARKETING_APP_URL`
- Value: `https://offerpulse-marketing.vercel.app`

**Variable 2:**
- Name: `NEXT_PUBLIC_DASHBOARD_APP_URL`
- Value: `https://offerpulse-dashboard.vercel.app`

#### Step 5: Deploy
Click **"Deploy"** button

✅ Wait for deployment to complete

---

### Part 3: Update Environment Variables with Real URLs

#### After Both Deployments Complete

You'll get URLs like:
- Marketing: `https://offerpulse-marketing-xxx.vercel.app`
- Dashboard: `https://offerpulse-dashboard-xxx.vercel.app`

#### Update Marketing Project Env Vars
1. Go to marketing project → **Settings** → **Environment Variables**
2. Edit both variables:
   ```
   NEXT_PUBLIC_MARKETING_APP_URL=https://offerpulse-marketing-xxx.vercel.app
   NEXT_PUBLIC_DASHBOARD_APP_URL=https://offerpulse-dashboard-xxx.vercel.app
   ```
3. Click **"Save"**

#### Update Dashboard Project Env Vars
1. Go to dashboard project → **Settings** → **Environment Variables**
2. Edit both variables (use same URLs as above)
3. Click **"Save"**

#### Redeploy Both Projects
1. Go to **Deployments** tab in each project
2. Click **"..."** menu on latest deployment
3. Click **"Redeploy"**
4. Check **"Use existing Build Cache"**
5. Click **"Redeploy"**

---

### Part 4: Test the Cross-App Flow

1. Visit your marketing site: `https://offerpulse-marketing-xxx.vercel.app`
2. Enter a competitor URL in the hero: `https://example-store.com`
3. Click **"Generate snapshot"**
4. Should redirect to: `https://offerpulse-dashboard-xxx.vercel.app/signup?competitorUrl=...`
5. Complete signup and onboarding
6. ✅ You should land on competitor detail page!

---

## Configure Custom Domains (Optional)

### Marketing Site → offerpulse.com

**In Marketing Project:**
1. Settings → Domains
2. Add: `offerpulse.com`
3. Add: `www.offerpulse.com`
4. Configure DNS as shown in Vercel

### Dashboard App → app.offerpulse.com

**In Dashboard Project:**
1. Settings → Domains
2. Add: `app.offerpulse.com`
3. Configure DNS

### Final Env Var Update
After custom domains are active:
```
NEXT_PUBLIC_MARKETING_APP_URL=https://offerpulse.com
NEXT_PUBLIC_DASHBOARD_APP_URL=https://app.offerpulse.com
```

Redeploy both projects.

---

## Troubleshooting

### Build Fails with "pnpm-lock.yaml not found"

**Solution:** Vercel should auto-detect monorepo. If it doesn't:
1. Settings → General → Build & Development Settings
2. Ensure Root Directory is set correctly
3. Try changing Build Command to: `pnpm install && pnpm run build`

### "Module not found" errors

**Solution:** Workspace dependencies not resolved
1. Ensure Root Directory is `apps/marketing` or `apps/app`
2. Vercel should install from monorepo root automatically
3. Redeploy with fresh cache

### Cross-app routing not working

**Solution:** Check environment variables
1. Verify both URLs are set in both projects
2. Ensure no trailing slashes
3. Redeploy after changing env vars

---

## What I Did For You

✅ Renamed old duplicate folder: `offerpulse/` → `_old_offerpulse_backup`
✅ Simplified `vercel.json` files for both apps
✅ Verified correct workspace structure
✅ Created this deployment guide

## Next Step

👉 **Go to Vercel Dashboard**: https://vercel.com/new

Follow Part 1 above to deploy the marketing site!
