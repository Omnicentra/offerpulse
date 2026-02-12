# Quick Deploy Guide - OfferPulse

## TL;DR - Deploy in 10 Minutes

### 1. Prerequisites
- Vercel account
- Domain (e.g., `offerpulse.com`)
- GitHub repo pushed

### 2. Deploy Marketing Site

**Via Vercel Dashboard:**
1. Go to https://vercel.com/new
2. Import your GitHub repo
3. Configure:
   - **Root Directory**: `apps/marketing`
   - **Build Command**: `cd ../.. && pnpm install && pnpm --filter marketing build`
4. Add Environment Variables:
   ```
   NEXT_PUBLIC_MARKETING_APP_URL=https://offerpulse.com
   NEXT_PUBLIC_DASHBOARD_APP_URL=https://app.offerpulse.com
   ```
5. Click Deploy

**Via CLI:**
```bash
cd apps/marketing
vercel --prod
```

### 3. Deploy Dashboard App

**Via Vercel Dashboard:**
1. Go to https://vercel.com/new (again)
2. Import same repo
3. Configure:
   - **Root Directory**: `apps/app`
   - **Build Command**: `cd ../.. && pnpm install && pnpm --filter app build`
4. Add Environment Variables:
   ```
   NEXT_PUBLIC_MARKETING_APP_URL=https://offerpulse.com
   NEXT_PUBLIC_DASHBOARD_APP_URL=https://app.offerpulse.com
   ```
5. Click Deploy

**Via CLI:**
```bash
cd apps/app
vercel --prod
```

### 4. Configure Domains

**Marketing Project:**
- Add domain: `offerpulse.com`
- Add domain: `www.offerpulse.com` (redirects to root)

**Dashboard Project:**
- Add domain: `app.offerpulse.com`

**DNS Settings:**
```
# Root domain (@ record)
Type: A
Name: @
Value: 76.76.21.21

# WWW subdomain
Type: CNAME
Name: www
Value: cname.vercel-dns.com

# App subdomain
Type: CNAME
Name: app
Value: cname.vercel-dns.com
```

### 5. Test

1. Visit `https://offerpulse.com`
2. Enter competitor URL
3. Should redirect to `https://app.offerpulse.com/signup?competitorUrl=...`
4. Complete signup and onboarding
5. ✅ Done!

## Files Already Created

- ✅ `apps/marketing/vercel.json`
- ✅ `apps/app/vercel.json`
- ✅ `apps/marketing/.vercelignore`
- ✅ `apps/app/.vercelignore`
- ✅ Environment variable examples

## Important Notes

- **Two separate projects** (recommended for production)
- **Independent deployments** for each app
- **Environment variables** must be set in Vercel dashboard
- **DNS propagation** can take up to 48 hours

## Troubleshooting

**Build fails?**
```bash
# Test locally first
pnpm --filter marketing build
pnpm --filter app build
```

**Routing not working?**
- Check environment variables match exactly
- Redeploy after changing env vars

**Domain not resolving?**
- Wait for DNS propagation
- Use `dig offerpulse.com` to check

## Full Documentation

See `VERCEL_DEPLOYMENT.md` for complete guide.
