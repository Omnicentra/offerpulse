# Final Deployment Instructions

## The Core Issue

Your app is building successfully but returning 404s because Vercel isn't running the Next.js server - it's just serving static files.

## The Only Solution That Will Work

You **must** update the Vercel project settings in the dashboard. The CLI cannot do this programmatically.

### Go to Vercel Dashboard

1. Open: **https://vercel.com/olas-projects-9ef54fc0/offerpulse/settings**

2. Click **Build and Deployment** in the left sidebar

3. Update these settings:
   - **Root Directory**: Set to **`apps/marketing`**
   - **Framework Preset**: Will auto-detect as **Next.js** (leave it)
   - **Build Command**: Clear it (leave empty)
   - **Output Directory**: Clear it (leave empty)  
   - **Install Command**: Clear it (leave empty)

4. Click **Save**

### Why This Works

- **Root Directory = `apps/marketing`**: Vercel deploys only the marketing app
- **Framework = Next.js**: Vercel runs the Next.js server (not just static files)
- **Empty commands**: Vercel's Next.js detection handles everything automatically

The `apps/marketing/vercel.json` file I just created will handle the monorepo install when Vercel builds from that subdirectory.

### Deploy

After updating settings:

```bash
vercel --prod
```

## Why Manual Settings Are Required

Vercel's API/CLI **cannot** change project settings like Root Directory or Framework Preset. These can only be changed through the web dashboard. This is a Vercel platform limitation, not a configuration issue.

Once you set Root Directory to `apps/marketing`, the deployment will work correctly and the site will load without 404s.
