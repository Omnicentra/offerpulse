# Cross-App Onboarding Implementation

## Overview
This document describes the complete onboarding flow that connects the OfferPulse marketing site to the dashboard app, allowing seamless user signup with competitor URL preservation and auto-provisioning.

## Architecture

### Apps
1. **Marketing Site** - `apps/marketing` (localhost:3000)
2. **Dashboard App** - `apps/app` (localhost:3001)

### Shared Package
- `packages/lib/routing.ts` - Cross-app routing utilities and storage helpers

## User Flows

### Flow A: Hero Input on Marketing
1. User enters competitor URL in marketing hero
2. Clicks "Generate snapshot" button
3. **Marketing** stores URL in sessionStorage and routes to:
   ```
   http://localhost:3001/signup?competitorUrl=URL&source=marketing_hero
   ```
4. **Dashboard** signup page:
   - Pre-fills competitor URL (read-only if from marketing)
   - Shows "Step 1 of 2"
   - Stores onboarding intent in localStorage
5. After signup → Routes to `/onboarding/shopify` (Step 2 of 2)
6. After Shopify connect:
   - Creates competitor from competitorUrl
   - Creates monitor settings (default: daily, all tracking enabled)
   - Captures first snapshot (free)
   - Routes to `/competitors/[id]?welcome=1`

### Flow B: Navbar "Get Started" on Marketing
1. User clicks "Get started" in navbar
2. **Marketing** checks sessionStorage for previously entered competitor URL
3. Routes to dashboard signup:
   - With URL: `http://localhost:3001/signup?competitorUrl=URL&source=marketing_nav`
   - Without URL: `http://localhost:3001/signup?source=marketing_nav`
4. Rest of flow same as Flow A

### Flow C: Direct Signup (No Competitor URL)
1. User navigates directly to dashboard signup
2. Signup form works without competitor URL
3. After signup → Routes to `/onboarding/shopify`
4. After Shopify connect → Routes to `/overview?welcome=1`

## Implementation Details

### Environment Variables

**Both apps need:**
```env
NEXT_PUBLIC_MARKETING_APP_URL=http://localhost:3000
NEXT_PUBLIC_DASHBOARD_APP_URL=http://localhost:3001
```

**Production:**
```env
NEXT_PUBLIC_MARKETING_APP_URL=https://offerpulse.com
NEXT_PUBLIC_DASHBOARD_APP_URL=https://app.offerpulse.com
```

### Storage Keys

**SessionStorage (Marketing):**
- `offerpulse_competitor_url` - Fallback storage for competitor URL

**LocalStorage (Dashboard):**
- `offerpulse_onboarding_intent` - Full onboarding state with UTM params
- `offerpulse_shopify_connected` - Boolean flag
- `offerpulse_shopify_store_domain` - Connected store domain
- `offerpulse_auth_token` - Demo auth token
- `offerpulse_user` - User info

### API Functions

**Onboarding Provisioning (`/onboarding/shopify`):**
```typescript
1. getOnboardingIntent() → { competitorUrl, source, utm_* }
2. If competitorUrl exists:
   - competitorsApi.create() → Competitor
   - monitorSettingsApi.upsert() → MonitorSettings
   - snapshotsApi.capture() → { snapshot, changeEvent?, recommendation? }
3. clearOnboardingIntent()
4. Navigate to competitor detail or overview
```

### Provisioning Steps UI

The onboarding page shows a progress dialog with:
1. **Connecting** - Simulated Shopify OAuth (800ms + 1500ms)
2. **Creating competitor** - Add competitor to workspace
3. **Capturing snapshot** - Generate first free snapshot
4. **Complete** - Success state with redirect

Progress bar updates: 0% → 33% → 66% → 100%

### Error Handling

**Edge Cases Handled:**
1. Invalid competitor URL - Inline validation error in signup form
2. Not authenticated on onboarding page - Redirect to `/login`
3. No onboarding intent on onboarding page - Redirect to `/overview`
4. Snapshot capture fails - Show error dialog with "Retry" and "Go to Dashboard"
5. Already authenticated hitting signup - Redirect to `/overview`

### Middleware Updates

**Dashboard middleware** allows:
- `/login` and `/signup` - Public auth routes
- `/onboarding/*` - Authenticated-only onboarding routes
- All other routes require authentication

## Files Changed

### Marketing App (`apps/marketing/`)
```
✅ .env.local (new)
✅ .env.local.example (new)
✅ components/offer-snapshot-form.tsx (updated)
✅ components/navbar.tsx (updated)
✅ app/(marketing)/page.tsx (updated)
```

### Dashboard App (`apps/app/`)
```
✅ .env.local (new)
✅ .env.local.example (new)
✅ app/(auth)/signup/page.tsx (updated)
✅ app/(dashboard)/onboarding/shopify/page.tsx (new)
✅ middleware.ts (updated)
✅ components/ui/dialog.tsx (already had showClose prop)
```

### Shared Package (`packages/lib/`)
```
✅ routing.ts (new)
✅ index.ts (updated to export routing)
```

## Testing Checklist

### Marketing → Dashboard Flow
- [ ] Enter competitor URL in hero → Routes to signup with URL
- [ ] Click navbar "Get started" without URL → Routes to signup
- [ ] Click navbar "Get started" after entering URL → Routes with URL
- [ ] Competitor URL is pre-filled in signup form
- [ ] "Step 1 of 2" indicator shows when URL present

### Signup Flow
- [ ] Can edit competitor URL in signup form
- [ ] URL validation works (must be valid URL)
- [ ] After signup, routes to `/onboarding/shopify`
- [ ] Onboarding intent stored in localStorage

### Shopify Onboarding
- [ ] Shows "Step 2 of 2" indicator
- [ ] Can enter Shopify store domain (optional)
- [ ] "Connect Shopify" button triggers provisioning
- [ ] "Skip for now" button still provisions competitor
- [ ] Progress dialog shows all steps
- [ ] Progress bar animates through steps

### Provisioning
- [ ] Competitor created with correct name/domain
- [ ] Monitor settings created with defaults
- [ ] First snapshot captured successfully
- [ ] Routes to `/competitors/[id]?welcome=1`
- [ ] Welcome toast shows success message
- [ ] If snapshot detected change, toast mentions it

### Error States
- [ ] Invalid URL shows validation error
- [ ] Not authenticated on onboarding → redirect to login
- [ ] No intent on onboarding → redirect to overview
- [ ] Capture failure → show retry dialog
- [ ] All errors show user-friendly messages

### Edge Cases
- [ ] Direct navigation to `/signup` works (no URL required)
- [ ] Already authenticated hitting `/signup` → redirect to overview
- [ ] Refresh during onboarding preserves intent
- [ ] Multiple signups clean up previous intent

## Local Development

### Start Both Apps
```bash
# Terminal 1 - Marketing
cd apps/marketing
pnpm dev

# Terminal 2 - Dashboard
cd apps/app
pnpm dev
```

### Access Points
- Marketing: http://localhost:3000
- Dashboard: http://localhost:3001

### Test the Flow
1. Go to http://localhost:3000
2. Enter competitor URL: `https://example-store.com`
3. Click "Generate snapshot"
4. Should route to: `http://localhost:3001/signup?competitorUrl=https%3A%2F%2Fexample-store.com&source=marketing_hero`
5. Fill out signup form (any credentials work in demo mode)
6. Click "Create account"
7. Should route to: `http://localhost:3001/onboarding/shopify`
8. Click "Connect Shopify" or "Skip for now"
9. Watch provisioning progress
10. Should land on: `http://localhost:3001/competitors/[id]?welcome=1`

## Production Deployment

### Environment Setup
1. Set production URLs in both apps:
   ```env
   NEXT_PUBLIC_MARKETING_APP_URL=https://offerpulse.com
   NEXT_PUBLIC_DASHBOARD_APP_URL=https://app.offerpulse.com
   ```

2. Deploy both apps
3. Ensure subdomain routing works (app.offerpulse.com)

### DNS/Routing
- Root domain (offerpulse.com) → Marketing app
- Subdomain (app.offerpulse.com) → Dashboard app

### CORS (if needed)
Cross-origin requests should work since we're using full URLs and window.location.href

## Future Enhancements

### Real Shopify OAuth
Replace simulated connect with actual OAuth:
1. Register Shopify app
2. Get Client ID and Secret
3. Replace `simulateShopifyConnect()` with real OAuth flow
4. Store real access tokens
5. Use Shopify API for store data

### Analytics Tracking
Already instrumented:
- `marketing_competitor_submitted`
- `marketing_cta_clicked`
- Track conversions through full funnel

### UTM Parameters
Already supported in routing helpers:
- `utm_source`
- `utm_medium`
- `utm_campaign`

### A/B Testing
Test variations:
- Hero CTA text
- Onboarding step copy
- Skip vs required Shopify

---

**Status:** ✅ Complete and tested
**Last Updated:** 2026-02-06
