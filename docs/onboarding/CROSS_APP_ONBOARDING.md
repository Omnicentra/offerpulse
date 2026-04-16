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

### Flow A: Competitor Offer Snapshot tool → Signup → Dashboard
1. User runs the free tool and views the report on **marketing** (`apps/marketing`).
2. **Start monitoring** calls `POST /api/tools/offer-snapshot/pending`, which stores a **capped JSON payload** in **Upstash Redis** (7-day TTL) under `pending:offer-snapshot:{id}`.
3. The browser is redirected to the **dashboard** origin:
   `GET /api/onboarding/pending-bootstrap?pendingId=…&next=/signup&competitorUrl=…` (plus optional UTM / PostHog params).
4. That route verifies the pending key exists, sets an **HttpOnly signed cookie** (`offerpulse_pending_snapshot`), and redirects to `/signup` (query params preserved for UX).
5. After **email/password signup** or **login**, the client calls `POST /api/onboarding/consume-pending-snapshot` (session cookie + pending cookie). The server:
   - Validates the cookie signature
   - **GET+DEL** the Redis payload (consume-once)
   - Creates **competitor + monitor settings**, inserts a **`marketing_tool`** snapshot row, stores trimmed JSON in `marketing_tool_payload`, queues **`competitor/capture`** (canonical `product_capture` snapshot)
   - Clears the pending cookie
6. The user is sent to **`/competitors/{id}?welcome=1`** (or the existing competitor if the domain already exists).

### Flow B: Navbar / hero without a pending snapshot
1. **Marketing** may still use `sessionStorage` (`offerpulse_competitor_url`) and `buildAppSignupUrl()` to open `/signup` with query params only.
2. After signup/login, `consume-pending` is a no-op when no pending cookie exists; the user lands on `/` (or wherever the client fallback sends them).

### Flow C: Optional Shopify onboarding
1. **`/onboarding/shopify`** is optional: connect a Shopify store or skip.
2. Competitor provisioning from the free tool **does not** depend on this page; it runs from the consume API above.

## Implementation Details

### Environment Variables

**Both apps need:**
```env
NEXT_PUBLIC_MARKETING_APP_URL=http://localhost:3000
NEXT_PUBLIC_DASHBOARD_APP_URL=http://localhost:3001
UPSTASH_REDIS_REST_URL=…
UPSTASH_REDIS_REST_TOKEN=…
```

**Production:**
```env
NEXT_PUBLIC_MARKETING_APP_URL=https://offerpulse.com
NEXT_PUBLIC_DASHBOARD_APP_URL=https://app.offerpulse.com
```

### Storage Keys

**SessionStorage (Marketing):**
- `offerpulse_competitor_url` - Fallback storage for competitor URL

**Redis (shared, Upstash):**
- `pending:offer-snapshot:{id}` - Serialized pending handoff (TTL 7 days)

**HttpOnly cookie (Dashboard origin):**
- `offerpulse_pending_snapshot` - Signed `{pendingId}.{hmac}` until consumed or expired

### API / server entrypoints

- **`POST apps/marketing/.../api/tools/offer-snapshot/pending`** – validate body, enforce max size, `SET` Redis with TTL.
- **`GET apps/app/.../api/onboarding/pending-bootstrap`** – verify pending id, allowlisted `next`, set cookie, redirect.
- **`POST apps/app/.../api/onboarding/consume-pending-snapshot`** – authenticated consume + DB provision + Inngest capture + clear cookie.
- **`GET /auth/after-sign-in`** (dashboard) – Google OAuth `callbackURL`; runs consume then `router.replace`.

### Error Handling

**Edge Cases Handled:**
1. Invalid or expired pending id on bootstrap → 400 from `pending-bootstrap`.
2. Not authenticated on onboarding page - Redirect to `/login`.
3. Pending cookie without Redis payload → consume clears cookie and returns `next: /`.
4. Duplicate competitor domain in workspace → consume clears state and redirects to existing competitor.
5. Already authenticated hitting signup - Redirect to `/` (middleware).

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
