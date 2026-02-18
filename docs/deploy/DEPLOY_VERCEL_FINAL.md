# Final Vercel Deployment Instructions

## ✅ All Build Errors Fixed

Both apps now build successfully:
- ✅ Marketing: TypeScript errors fixed
- ✅ Dashboard: React Query types fixed, old files removed
- ✅ Mobile layout fixed
- ✅ Cross-app routing ready

## 🚨 Important: Use Vercel Dashboard (Not CLI)

The CLI has issues with pnpm monorepos. Use the **Vercel Dashboard** for reliable deployment.

---

## Step-by-Step Deployment

### Part 1: Deploy Marketing Site

#### 1. Open Vercel Dashboard
👉 https://vercel.com/new

#### 2. Import Repository
- Click "Import Git Repository"
- Select your `offerpulse` repository
- Click "Import"

#### 3. Configure Project

**Click "Configure Project" and set:**

| Setting | Value | Note |
|---------|-------|------|
| **Project Name** | `offerpulse-marketing` | Must be lowercase |
| **Framework** | `Next.js` | Auto-detected |
| **Root Directory** | `apps/marketing` | ← **Click "Edit" button to set this!** |
| **Build Command** | (leave default) | Vercel auto-detects `pnpm build` |
| **Output Directory** | `.next` | Default is fine |
| **Install Command** | (leave default) | Vercel auto-detects pnpm |

**Critical:** Make sure to click the **"Edit"** button next to "Root Directory" and type `apps/marketing`

#### 4. Add Environment Variables

Click "Environment Variables" dropdown and add:

**Variable 1:**
- **Name**: `NEXT_PUBLIC_MARKETING_APP_URL`
- **Value**: `https://marketing.vercel.app` (temporary, will update)
- **Environment**: All (Production, Preview, Development)

**Variable 2:**
- **Name**: `NEXT_PUBLIC_DASHBOARD_APP_URL`  
- **Value**: `https://dashboard.vercel.app` (temporary, will update)
- **Environment**: All

#### 5. Deploy
Click **"Deploy"** button

⏳ **Wait 2-3 minutes** for build to complete

✅ You'll get a URL like: `https://offerpulse-marketing-xxx.vercel.app`

---

### Part 2: Deploy Dashboard App

#### 1. Create New Project
👉 https://vercel.com/new

#### 2. Import Same Repository
- Select `offerpulse` again
- Click "Import"

#### 3. Configure Project

| Setting | Value |
|---------|-------|
| **Project Name** | `offerpulse-dashboard` |
| **Framework** | `Next.js` |
| **Root Directory** | `apps/app` | ← **Click "Edit" to set!** |
| **Build Command** | (leave default) |
| **Output Directory** | `.next` |

#### 4. Add Environment Variables

**Variable 1:**
- **Name**: `NEXT_PUBLIC_MARKETING_APP_URL`
- **Value**: (copy from marketing deployment)

**Variable 2:**
- **Name**: `NEXT_PUBLIC_DASHBOARD_APP_URL`
- **Value**: (will update after this deploys)

#### 5. Deploy
Click **"Deploy"**

✅ You'll get: `https://offerpulse-dashboard-xxx.vercel.app`

---

### Part 3: Update Environment Variables

#### After Both Deploy Successfully:

You now have two URLs. Update env vars in **BOTH** projects:

**Marketing Project** (Settings → Environment Variables):
```
NEXT_PUBLIC_MARKETING_APP_URL=https://offerpulse-marketing-xxx.vercel.app
NEXT_PUBLIC_DASHBOARD_APP_URL=https://offerpulse-dashboard-xxx.vercel.app
```

**Dashboard Project** (Settings → Environment Variables):
```
NEXT_PUBLIC_MARKETING_APP_URL=https://offerpulse-marketing-xxx.vercel.app
NEXT_PUBLIC_DASHBOARD_APP_URL=https://offerpulse-dashboard-xxx.vercel.app
```

#### Redeploy Both:
1. Go to Deployments tab
2. Click "..." on latest deployment
3. Click "Redeploy"
4. Wait for completion

---

### Part 4: Test Cross-App Flow

1. Visit marketing URL
2. Enter competitor URL in hero
3. Click "Generate snapshot"
4. Should redirect to dashboard signup with URL ✅
5. Complete signup and onboarding
6. Competitor should be auto-created! ✅

---

## Custom Domains (Optional)

### Marketing → offerpulse.com

**In Marketing Project:**
1. Settings → Domains
2. Add `offerpulse.com`
3. Add `www.offerpulse.com`
4. Configure DNS as shown

### Dashboard → app.offerpulse.com

**In Dashboard Project:**
1. Settings → Domains
2. Add `app.offerpulse.com`
3. Configure DNS

### Final Env Update (After Custom Domains Active):

Both projects:
```
NEXT_PUBLIC_MARKETING_APP_URL=https://offerpulse.com
NEXT_PUBLIC_DASHBOARD_APP_URL=https://app.offerpulse.com
```

Redeploy both one last time.

---

## Why Dashboard > CLI?

Vercel Dashboard:
- ✅ Auto-detects pnpm from root lockfile
- ✅ Handles monorepo workspaces automatically
- ✅ Visual interface (no typos)
- ✅ Better error messages
- ✅ Shows build logs in real-time

CLI:
- ❌ Issues with pnpm monorepos
- ❌ Confusing prompts
- ❌ Package manager detection problems

---

## Deployment Status

✅ **Old duplicate folder removed**
✅ **All TypeScript errors fixed**
✅ **Mobile layout fixed**
✅ **Both apps build successfully locally**
✅ **vercel.json simplified (framework auto-detection)**
✅ **Ready for dashboard deployment**

---

## Next Action

👉 **Go to Vercel Dashboard**: https://vercel.com/new

Follow Part 1 above to deploy marketing site!

The deployment via dashboard will work smoothly because Vercel automatically detects and handles pnpm monorepos when you set the root directory correctly.
