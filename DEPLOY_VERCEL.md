# Deploy to Vercel

## One-time setup (Marketing project)

The **marketing** project is already linked. For the build to succeed:

1. Open: https://vercel.com/olas-projects-9ef54fc0/marketing/settings
2. Go to **Build and Deployment**.
3. Set **Framework Preset** to **Other** (so Vercel uses our custom build instead of detecting Next.js at repo root).
4. Save.

Root Directory should stay **.** (repo root). The root `vercel.json` already has:

- **Install Command:** `pnpm install`
- **Build Command:** `pnpm run build:marketing`
- **Output Directory:** `apps/marketing/.next`

## Deploy

From the repo root:

```bash
vercel --prod
```

This deploys the **marketing** app. Production URL: https://marketing-olas-projects-9ef54fc0.vercel.app (or your custom domain).

## Deploy the dashboard app (second project)

1. In Vercel: **Add New** → **Project** → import the same repo.
2. Name the project e.g. `offerpulse-app`.
3. **Root Directory:** `.` (repo root).
4. **Framework Preset:** **Other**.
5. **Build Command:** `pnpm run build:app`
6. **Output Directory:** `apps/app/.next`
7. **Install Command:** `pnpm install`
8. Add env vars: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`.
9. Deploy.

## Summary

- **Marketing:** Set Framework to **Other** in project settings, then run `vercel --prod` from repo root.
- **Dashboard:** Create a second project with Root `.`, Framework **Other**, and the build/output/install above.
