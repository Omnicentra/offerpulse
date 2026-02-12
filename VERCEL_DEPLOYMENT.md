# Vercel Deployment Guide - OfferPulse

## Overview
This guide covers the optimal deployment strategy for the OfferPulse monorepo with two separate Next.js apps:
- **Marketing Site** → `offerpulse.com` (root domain)
- **Dashboard App** → `app.offerpulse.com` (subdomain)

## Deployment Strategy

### Recommended Approach: Two Separate Vercel Projects

**Why separate projects?**
- ✅ Independent deployments and rollbacks
- ✅ Clearer separation of concerns
- ✅ Better control over environment variables
- ✅ Isolated build and deploy pipelines
- ✅ Different team access controls
- ✅ Separate analytics and monitoring

## Prerequisites

1. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
2. **Domain** - You'll need `offerpulse.com` (or your domain)
3. **GitHub Repository** - Push your code to GitHub
4. **Environment Variables** - Prepare your production URLs

## Step 1: Prepare Configuration Files

### A. Create `vercel.json` for Marketing Site

Create `/apps/marketing/vercel.json`:

```json
{
  "buildCommand": "cd ../.. && pnpm install && pnpm --filter marketing build",
  "outputDirectory": ".next",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "NEXT_PUBLIC_MARKETING_APP_URL": "https://offerpulse.com",
    "NEXT_PUBLIC_DASHBOARD_APP_URL": "https://app.offerpulse.com"
  }
}
```

### B. Create `vercel.json` for Dashboard App

Create `/apps/app/vercel.json`:

```json
{
  "buildCommand": "cd ../.. && pnpm install && pnpm --filter app build",
  "outputDirectory": ".next",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "NEXT_PUBLIC_MARKETING_APP_URL": "https://offerpulse.com",
    "NEXT_PUBLIC_DASHBOARD_APP_URL": "https://app.offerpulse.com"
  }
}
```

### C. Update Root Package.json

Ensure your root `package.json` has these scripts:

```json
{
  "scripts": {
    "build:marketing": "pnpm --filter marketing build",
    "build:app": "pnpm --filter app build",
    "build": "pnpm install && pnpm build:marketing && pnpm build:app"
  }
}
```

## Step 2: Deploy Marketing Site

### Via Vercel Dashboard

1. **Go to Vercel Dashboard** → https://vercel.com/new
2. **Import Git Repository**
   - Select your GitHub repository
   - Click "Import"

3. **Configure Project**
   - **Project Name**: `offerpulse-marketing`
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/marketing`
   - **Build Command**: Leave default or use:
     ```
     cd ../.. && pnpm install && pnpm --filter marketing build
     ```
   - **Output Directory**: `.next`
   - **Install Command**: `pnpm install`

4. **Environment Variables**
   Add these in the Vercel dashboard:
   ```
   NEXT_PUBLIC_MARKETING_APP_URL=https://offerpulse.com
   NEXT_PUBLIC_DASHBOARD_APP_URL=https://app.offerpulse.com
   ```

5. **Deploy** - Click "Deploy"

### Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to marketing app
cd apps/marketing

# Deploy
vercel

# Follow prompts:
# - Link to existing project or create new
# - Set root directory to apps/marketing
# - Accept default settings

# Deploy to production
vercel --prod
```

## Step 3: Deploy Dashboard App

### Via Vercel Dashboard

1. **Go to Vercel Dashboard** → https://vercel.com/new
2. **Import Same Repository Again**
3. **Configure Project**
   - **Project Name**: `offerpulse-dashboard`
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/app`
   - **Build Command**: 
     ```
     cd ../.. && pnpm install && pnpm --filter app build
     ```
   - **Output Directory**: `.next`
   - **Install Command**: `pnpm install`

4. **Environment Variables**
   ```
   NEXT_PUBLIC_MARKETING_APP_URL=https://offerpulse.com
   NEXT_PUBLIC_DASHBOARD_APP_URL=https://app.offerpulse.com
   ```

5. **Deploy** - Click "Deploy"

## Step 4: Configure Custom Domains

### A. Marketing Site (Root Domain)

1. Go to your marketing project settings
2. Navigate to **Domains**
3. Add domain: `offerpulse.com`
4. Also add: `www.offerpulse.com` (redirect to root)
5. Follow DNS configuration instructions:
   ```
   Type: A
   Name: @
   Value: 76.76.21.21
   
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

### B. Dashboard App (Subdomain)

1. Go to your dashboard project settings
2. Navigate to **Domains**
3. Add domain: `app.offerpulse.com`
4. DNS configuration:
   ```
   Type: CNAME
   Name: app
   Value: cname.vercel-dns.com
   ```

### C. Verify DNS Propagation

```bash
# Check root domain
dig offerpulse.com

# Check subdomain
dig app.offerpulse.com

# Or use online tool
# https://www.whatsmydns.net/
```

## Step 5: Update Environment Variables (Production)

After domains are configured, update environment variables in both projects:

### Marketing Project
```
NEXT_PUBLIC_MARKETING_APP_URL=https://offerpulse.com
NEXT_PUBLIC_DASHBOARD_APP_URL=https://app.offerpulse.com
```

### Dashboard Project
```
NEXT_PUBLIC_MARKETING_APP_URL=https://offerpulse.com
NEXT_PUBLIC_DASHBOARD_APP_URL=https://app.offerpulse.com
```

**Trigger redeployment** after updating env vars.

## Step 6: Continuous Deployment Setup

### GitHub Integration (Automatic)

Vercel automatically deploys:
- **Production**: When you push to `main` branch
- **Preview**: When you create a PR

### Configure Branch Deployments

In each project's **Git** settings:
- **Production Branch**: `main`
- **Preview Deployments**: Enable for all branches
- **Automatic Deployments**: Enable

## Monorepo Build Optimization

### A. Create `.vercelignore` for Marketing

`/apps/marketing/.vercelignore`:
```
# Dashboard app
../app

# Root level non-essential
../../.github
../../docs
../../*.md
```

### B. Create `.vercelignore` for Dashboard

`/apps/app/.vercelignore`:
```
# Marketing app
../marketing

# Root level non-essential
../../.github
../../docs
../../*.md
```

### C. Optimize Package Installation

In each `vercel.json`, use focused install:
```json
{
  "installCommand": "pnpm install --filter {apps/marketing}... --frozen-lockfile"
}
```

## Troubleshooting

### Build Fails - "Cannot find module"

**Solution**: Ensure build command includes workspace setup:
```bash
cd ../.. && pnpm install && pnpm --filter [app-name] build
```

### Environment Variables Not Working

**Solution**:
1. Verify variables are set in Vercel dashboard
2. Redeploy after changing env vars
3. Check that variables start with `NEXT_PUBLIC_` for client-side access

### Subdomain Not Resolving

**Solution**:
1. Verify CNAME record is correct
2. Wait for DNS propagation (can take up to 48 hours)
3. Use `dig app.offerpulse.com` to check DNS
4. Clear browser cache

### Cross-App Routing Not Working

**Solution**:
1. Verify both apps have correct `NEXT_PUBLIC_DASHBOARD_APP_URL` and `NEXT_PUBLIC_MARKETING_APP_URL`
2. Check that domains match exactly (https://, no trailing slash)
3. Test routing with production URLs

## Testing Production Deployment

### Test Cross-App Flow

1. Visit `https://offerpulse.com`
2. Enter competitor URL in hero
3. Click "Generate snapshot"
4. Should redirect to `https://app.offerpulse.com/signup?competitorUrl=...`
5. Complete signup
6. Should route to `/onboarding/shopify`
7. Complete onboarding
8. Should land on competitor detail page

### Test Direct Navigation

- ✅ `https://offerpulse.com` → Marketing home
- ✅ `https://offerpulse.com/pricing` → Pricing page
- ✅ `https://app.offerpulse.com` → Redirects to login
- ✅ `https://app.offerpulse.com/signup` → Signup page
- ✅ `https://app.offerpulse.com/overview` → Dashboard (requires auth)

## Performance Optimization

### Enable Edge Functions (Optional)

In each `vercel.json`:
```json
{
  "functions": {
    "app/(dashboard)/**": {
      "runtime": "edge"
    }
  }
}
```

### Configure Caching

```json
{
  "headers": [
    {
      "source": "/images/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### Enable Image Optimization

Next.js Image Optimization works automatically on Vercel. Ensure you're using `next/image`:

```tsx
import Image from 'next/image'

<Image 
  src="/logo.svg" 
  width={200} 
  height={50} 
  alt="Logo"
/>
```

## Security Considerations

### Environment Variables

- ✅ Use `NEXT_PUBLIC_` prefix only for client-side variables
- ✅ Never commit sensitive keys to git
- ✅ Use Vercel's environment variable encryption

### Domain Security

- ✅ Enable SSL (automatic with Vercel)
- ✅ Set up HSTS headers
- ✅ Configure CSP headers if needed

### Rate Limiting

Consider adding rate limiting for API routes:
```typescript
// app/api/route.ts
import { Ratelimit } from "@upstash/ratelimit"

const ratelimit = new Ratelimit({
  // Configure rate limiting
})
```

## Monitoring & Analytics

### Vercel Analytics

Enable in project settings:
1. Go to **Analytics** tab
2. Enable Web Analytics
3. Add to both projects

### Custom Monitoring

Add monitoring to your apps:
```bash
pnpm add @vercel/analytics
```

```tsx
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

## Cost Optimization

### Vercel Pricing Tiers

- **Hobby**: Free (good for testing)
  - 100GB bandwidth
  - Unlimited deployments
  - 1 member

- **Pro**: $20/month (recommended for production)
  - 1TB bandwidth
  - Unlimited team members
  - Advanced analytics

### Tips to Reduce Costs

1. **Use static generation** where possible
2. **Optimize images** with `next/image`
3. **Enable caching** for static assets
4. **Use Edge functions** for faster responses
5. **Implement ISR** for dynamic content

## Rollback Strategy

### Quick Rollback

If deployment fails:
1. Go to **Deployments** in Vercel dashboard
2. Find previous successful deployment
3. Click "..." → "Promote to Production"

### Gradual Rollout (Pro Plan)

Use Vercel's deployment protection:
1. Enable protection in project settings
2. Deploy to staging first
3. Promote to production after testing

## Alternative: Single Project Approach

If you prefer a single Vercel project (not recommended for production):

### Pros
- Single dashboard
- Shared settings

### Cons
- ❌ Both apps redeploy on any change
- ❌ Harder to manage environment variables
- ❌ No independent rollbacks
- ❌ More complex configuration

### Configuration

`/vercel.json` (root):
```json
{
  "builds": [
    {
      "src": "apps/marketing/package.json",
      "use": "@vercel/next"
    },
    {
      "src": "apps/app/package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/app/(.*)",
      "dest": "apps/app/$1"
    },
    {
      "src": "/(.*)",
      "dest": "apps/marketing/$1"
    }
  ]
}
```

## Deployment Checklist

Before going live:

- [ ] Both apps build successfully locally
- [ ] Environment variables configured in Vercel
- [ ] Custom domains added and verified
- [ ] DNS records configured correctly
- [ ] Cross-app routing tested
- [ ] SSL certificates active (automatic)
- [ ] Analytics enabled
- [ ] Error monitoring set up
- [ ] Performance tested
- [ ] Mobile responsiveness verified
- [ ] SEO meta tags configured
- [ ] Robots.txt and sitemap.xml present

## Post-Deployment

1. **Test thoroughly** - All user flows
2. **Monitor errors** - Check Vercel logs
3. **Set up alerts** - For downtime or errors
4. **Document** - Keep deployment notes
5. **Train team** - On deployment process

## Support Resources

- **Vercel Documentation**: https://vercel.com/docs
- **Next.js on Vercel**: https://vercel.com/docs/frameworks/nextjs
- **Monorepo Guide**: https://vercel.com/docs/monorepos
- **Community**: https://github.com/vercel/vercel/discussions

---

## Quick Deploy Commands

```bash
# Deploy marketing to production
cd apps/marketing
vercel --prod

# Deploy dashboard to production
cd apps/app
vercel --prod

# Deploy both (from root)
vercel --prod --scope marketing
vercel --prod --scope dashboard
```

**Status**: Ready for deployment
**Last Updated**: 2026-02-06
