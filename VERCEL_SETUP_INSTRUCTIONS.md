# Vercel Deployment Instructions - OfferPulse Monorepo

## Problem
The CLI deployment is failing because Vercel's build system doesn't handle pnpm monorepos well when deploying from a subdirectory.

## Solution: Deploy via Vercel Dashboard (Recommended)

### Marketing Site Deployment

#### Step 1: Go to Vercel Dashboard
1. Visit https://vercel.com/new
2. Import your GitHub repository
3. Click "Import"

#### Step 2: Configure Project
**Important:** These settings are critical for monorepo deployments

| Setting | Value |
|---------|-------|
| **Project Name** | `offerpulse-marketing` |
| **Framework Preset** | `Next.js` |
| **Root Directory** | `apps/marketing` ✅ |
| **Build Command** | `cd ../.. && pnpm install && pnpm --filter marketing build` |
| **Output Directory** | `.next` |
| **Install Command** | (leave empty - will be handled by build command) |

#### Step 3: Environment Variables
Click "Add Environment Variable" and add:

```
NEXT_PUBLIC_MARKETING_APP_URL=https://offerpulse-marketing.vercel.app
NEXT_PUBLIC_DASHBOARD_APP_URL=https://offerpulse-dashboard.vercel.app
```

**Note:** Use your actual Vercel URLs first, then update to custom domains later.

#### Step 4: Deploy
Click "Deploy" button

---

### Dashboard App Deployment

#### Step 1: Create New Project
1. Go to https://vercel.com/new (again)
2. Import the **same GitHub repository**
3. Click "Import"

#### Step 2: Configure Project

| Setting | Value |
|---------|-------|
| **Project Name** | `offerpulse-dashboard` |
| **Framework Preset** | `Next.js` |
| **Root Directory** | `apps/app` ✅ |
| **Build Command** | `cd ../.. && pnpm install && pnpm --filter app build` |
| **Output Directory** | `.next` |
| **Install Command** | (leave empty) |

#### Step 3: Environment Variables
```
NEXT_PUBLIC_MARKETING_APP_URL=https://offerpulse-marketing.vercel.app
NEXT_PUBLIC_DASHBOARD_APP_URL=https://offerpulse-dashboard.vercel.app
```

#### Step 4: Deploy
Click "Deploy" button

---

## After Initial Deployment

### 1. Get Your Vercel URLs
After both deployments complete, you'll have:
- Marketing: `https://offerpulse-marketing-xxx.vercel.app`
- Dashboard: `https://offerpulse-dashboard-xxx.vercel.app`

### 2. Update Environment Variables
Update the URLs in **both projects** to use the actual deployed URLs:

**Marketing Project:**
```
NEXT_PUBLIC_MARKETING_APP_URL=https://offerpulse-marketing-xxx.vercel.app
NEXT_PUBLIC_DASHBOARD_APP_URL=https://offerpulse-dashboard-xxx.vercel.app
```

**Dashboard Project:**
```
NEXT_PUBLIC_MARKETING_APP_URL=https://offerpulse-marketing-xxx.vercel.app
NEXT_PUBLIC_DASHBOARD_APP_URL=https://offerpulse-dashboard-xxx.vercel.app
```

### 3. Redeploy Both Projects
After updating env vars:
- Go to each project's "Deployments" tab
- Click "Redeploy" on the latest deployment
- Select "Use existing Build Cache"

### 4. Test Cross-App Flow
1. Visit your marketing URL
2. Enter a competitor URL in the hero
3. Click "Generate snapshot"
4. Should redirect to dashboard signup with URL preserved ✅

---

## Configure Custom Domains (Production)

### Marketing Site → `offerpulse.com`

**In Vercel Dashboard (Marketing Project):**
1. Go to Settings → Domains
2. Add domain: `offerpulse.com`
3. Add domain: `www.offerpulse.com`
4. Follow DNS instructions (shown in Vercel)

**Typical DNS Config:**
```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### Dashboard App → `app.offerpulse.com`

**In Vercel Dashboard (Dashboard Project):**
1. Go to Settings → Domains
2. Add domain: `app.offerpulse.com`

**DNS Config:**
```
Type: CNAME
Name: app
Value: cname.vercel-dns.com
```

### Update Environment Variables (Final)
After custom domains are active, update env vars one last time:

**Both Projects:**
```
NEXT_PUBLIC_MARKETING_APP_URL=https://offerpulse.com
NEXT_PUBLIC_DASHBOARD_APP_URL=https://app.offerpulse.com
```

Then redeploy both.

---

## Why Dashboard Deployment is Better Than CLI

For pnpm monorepos:
- ✅ Better handling of workspace dependencies
- ✅ Visual configuration (less error-prone)
- ✅ Easier to troubleshoot
- ✅ Better cache management
- ✅ Clear project settings interface

---

## Checklist

### Initial Setup
- [ ] Deploy marketing via Vercel dashboard
- [ ] Deploy dashboard via Vercel dashboard
- [ ] Update env vars with Vercel URLs
- [ ] Redeploy both projects
- [ ] Test cross-app routing

### Custom Domains (When Ready)
- [ ] Add `offerpulse.com` to marketing project
- [ ] Add `app.offerpulse.com` to dashboard project
- [ ] Configure DNS records
- [ ] Wait for DNS propagation
- [ ] Update env vars with custom domains
- [ ] Redeploy both projects
- [ ] Test production URLs

### Post-Launch
- [ ] Enable Vercel Analytics
- [ ] Set up error monitoring
- [ ] Configure deployment notifications
- [ ] Test all user flows
- [ ] Monitor performance

---

## Quick Commands

```bash
# Check if build works locally
cd /Users/olaoladapo/offerpulse
pnpm --filter marketing build
pnpm --filter app build

# View Vercel projects
vercel ls

# Check deployment status
vercel inspect [deployment-url]
```

---

## Next Step Right Now

**Go to Vercel Dashboard and deploy using the settings above:**

👉 https://vercel.com/new

1. Import your repo
2. Set **Root Directory** to `apps/marketing`
3. Set **Build Command** to `cd ../.. && pnpm install && pnpm --filter marketing build`
4. Deploy!

This will work much better than CLI for the initial setup. 🚀
