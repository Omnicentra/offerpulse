# PostHog Production Setup Guide

## Issue Summary
Client-side PostHog tracking wasn't working in production because environment variables weren't configured in Vercel.

## What Was Fixed

### 1. Removed Invalid `defaults` Configuration
Both `apps/marketing/instrumentation-client.ts` and `apps/app/instrumentation-client.ts` had an invalid `defaults: "2026-01-30"` option that was causing PostHog initialization errors.

### 2. Made PostHog Required in Dashboard App
Changed `apps/app/env.ts` to make PostHog environment variables required (they were optional before), ensuring PostHog always initializes.

### 3. Removed Conditional Initialization
Updated `apps/app/instrumentation-client.ts` to always initialize PostHog without checking if variables exist (since they're now required).

## Vercel Environment Variables Setup

### For Both Projects (offerpulse-marketing & offerpulse-app)

You need to set these environment variables in your Vercel project settings:

#### Production Environment
```bash
NEXT_PUBLIC_POSTHOG_KEY=phc_1TA8mL9rtySeLmQDx3KFUOz7Fh8QmBCdzuYVvFaT93W
NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
NEXT_PUBLIC_ENVIRONMENT=prd
```

#### Preview/Staging Environment (optional)
```bash
NEXT_PUBLIC_POSTHOG_KEY=phc_1TA8mL9rtySeLmQDx3KFUOz7Fh8QmBCdzuYVvFaT93W
NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
NEXT_PUBLIC_ENVIRONMENT=stg
```

### How to Set Environment Variables in Vercel

1. **Via Vercel Dashboard:**
   - Go to https://vercel.com/omnicentra/offerpulse-marketing/settings/environment-variables
   - Go to https://vercel.com/omnicentra/offerpulse-app/settings/environment-variables
   - Add each variable and select "Production" environment
   - Click "Save"

2. **Via Vercel CLI:**
   ```bash
   # For marketing app
   cd apps/marketing
   vercel env add NEXT_PUBLIC_POSTHOG_KEY production
   vercel env add NEXT_PUBLIC_POSTHOG_HOST production
   vercel env add NEXT_PUBLIC_ENVIRONMENT production
   
   # For dashboard app
   cd apps/app
   vercel env add NEXT_PUBLIC_POSTHOG_KEY production
   vercel env add NEXT_PUBLIC_POSTHOG_HOST production
   vercel env add NEXT_PUBLIC_ENVIRONMENT production
   ```

### After Setting Variables

**Redeploy both apps** for the environment variables to take effect:

```bash
# Option 1: Push to main branch (triggers automatic deployment)
git add .
git commit -m "fix: PostHog production tracking configuration"
git push origin main

# Option 2: Manual redeploy from Vercel dashboard
# Go to Deployments tab and click "Redeploy" on the latest production deployment
```

## Verification

### 1. Check Environment Variables Are Set
After deployment, verify the variables are present:

```bash
# Check via Vercel CLI (from app directory)
vercel env ls
```

### 2. Test in Production
1. Open your production site (https://www.offerpulse.io or https://app.offerpulse.io)
2. Open browser DevTools → Console
3. Type `posthog` and press Enter
4. You should see the PostHog object (not `undefined`)
5. Check for initialization errors in the console

### 3. Verify Events in PostHog Dashboard
1. Go to https://eu.posthog.com/project/127268
2. Navigate to "Events" or "Live Events"
3. Filter by `$environment = "prd"`
4. Interact with your production site (click buttons, navigate pages)
5. Events should appear within a few seconds

### 4. Check Network Requests
1. Open DevTools → Network tab
2. Filter by "ingest"
3. You should see successful POST requests to `/ingest/e/` (status 200)
4. If you see 400 errors, check the console for PostHog initialization errors

## Common Issues

### Issue: "posthog is not defined" in Production
**Solution:** Environment variables aren't set in Vercel. Follow the setup steps above.

### Issue: Events Show Wrong Environment
**Solution:** Make sure `NEXT_PUBLIC_ENVIRONMENT=prd` is set for production deployments.

### Issue: 400 Bad Request Errors
**Solution:** This was caused by the invalid `defaults` option, which has been removed.

### Issue: Events Not Appearing in PostHog
**Possible causes:**
1. PostHog project key is incorrect
2. Network requests are being blocked (check browser console)
3. Ad blockers or privacy extensions are blocking PostHog
4. CORS issues (the `/ingest` proxy should prevent this)

### Issue: Domain Redirect Affecting Tracking
Your setup redirects `offerpulse.io` → `www.offerpulse.io`. This is fine! The PostHog tracking will work on `www.offerpulse.io` as long as:
1. The environment variables are set in Vercel
2. The `/ingest` rewrite is working (it is, per your next.config.mjs)

## Architecture

### How PostHog Tracking Works

```
Browser → PostHog.init() → Sends events to /ingest → Next.js rewrite → https://eu.i.posthog.com
```

1. **Client-side initialization** (`instrumentation-client.ts`):
   - Runs on page load
   - Initializes PostHog with project key and host
   - Uses `/ingest` as api_host to proxy requests through your domain

2. **Next.js rewrites** (`next.config.mjs`):
   - Proxies `/ingest/*` requests to `https://eu.i.posthog.com/*`
   - Prevents CORS issues and ad blocker interference

3. **Environment tagging**:
   - All events automatically tagged with `$environment: "prd"` in production
   - Allows filtering events by environment in PostHog

## Testing Locally

Your local setup is already correct:
```bash
# .env.local files have PostHog variables set to "dev"
NEXT_PUBLIC_POSTHOG_KEY=phc_1TA8mL9rtySeLmQDx3KFUOz7Fh8QmBCdzuYVvFaT93W
NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
NEXT_PUBLIC_ENVIRONMENT=dev
```

Run locally and verify events are tagged with `$environment: "dev"`:
```bash
pnpm dev
# Open http://localhost:3000 and http://localhost:3001
# Check browser console for PostHog logs
```

## Next Steps

1. ✅ Code fixes are complete
2. ⏳ Set environment variables in Vercel (see instructions above)
3. ⏳ Redeploy both apps
4. ⏳ Verify events appear in PostHog with `$environment = "prd"`
5. ⏳ Update any other deployment environments (staging/preview) if needed

## Related Files Changed

- `apps/marketing/instrumentation-client.ts` - Removed invalid `defaults` option
- `apps/app/instrumentation-client.ts` - Removed invalid `defaults` option and conditional init
- `apps/app/env.ts` - Made PostHog variables required
- `apps/app/.env.local` - Updated comment to reflect PostHog is required
- `apps/app/.env.local.example` - Updated comment to reflect PostHog is required
