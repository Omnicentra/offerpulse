# Fix 404 on offerpulse-iota.vercel.app

The 404 happens because the project is built from the **repo root** with a custom output directory. Vercel then serves the `.next` folder as static files and does **not** run the Next.js server, so every route returns 404.

## Fix (one-time)

1. Open your **offerpulse** project on Vercel:  
   https://vercel.com/olas-projects-9ef54fc0/offerpulse/settings

2. Go to **Build and Deployment**.

3. Set **Root Directory** to **`apps/marketing`** (click “Edit”, enter `apps/marketing`, save).

4. Leave **Framework Preset** as **Next.js** (auto-detected from `apps/marketing`).

5. **Redeploy**: from the repo root run:
   ```bash
   vercel --prod
   ```

With Root Directory = `apps/marketing`, Vercel will:

- Use `apps/marketing/vercel.json` (install from monorepo root, then `pnpm run build`)
- Detect Next.js and run the app correctly so routes work.

No code changes required; only this project setting.
