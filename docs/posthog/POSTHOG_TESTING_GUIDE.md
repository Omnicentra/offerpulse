# PostHog Cross-Domain Tracking - Testing Guide

**Date:** February 18, 2026  
**Changes:** Real signup tracking + cross-domain tracking implementation

## What Changed

### 1. Removed Fake Tracking
- Mock auth pages in marketing app no longer track fake signups
- Pages now redirect to real dashboard app auth

### 2. Added Real Tracking
- Dashboard app `/signup` and `/login` now track real authentication events
- Proper `posthog.identify()` calls with actual user data from Better Auth

### 3. Implemented Cross-Domain Tracking
- Marketing site passes PostHog `distinct_id` and `session_id` when redirecting to dashboard
- Dashboard app bootstraps PostHog initialization with these IDs to continue the same session
- Complete funnel: offerpulse.io → app.offerpulse.io tracked as one user with session continuity

## Local Testing

### Prerequisites

1. **Start both apps:**
   ```bash
   pnpm dev
   # Marketing: http://localhost:3000
   # Dashboard: http://localhost:3001
   ```

2. **Verify environment variables in both apps:**
   ```bash
   # Both .env.local files should have:
   NEXT_PUBLIC_POSTHOG_KEY=phc_...
   NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
   NEXT_PUBLIC_ENVIRONMENT=dev
   ```

3. **Clear browser state:**
   - Open DevTools → Application → Clear site data
   - Or use Incognito/Private window

### Test Scenario: Complete User Journey

#### Step 1: Landing Page Visit

1. Go to `http://localhost:3000`
2. Open DevTools → Console
3. Type: `posthog.get_distinct_id()` and `posthog.get_session_id()`
4. **Record both IDs** (e.g., distinct_id: "abc-123-def", session_id: "session-456")

**Expected:**
- PostHog initialized
- Both distinct_id and session_id created
- `landing_page_viewed` event tracked

**Verify in PostHog:**
- Go to https://eu.posthog.com/project/127268
- Navigate to "Live Events"
- Filter: `$environment = dev`
- Look for `landing_page_viewed` with your device ID

#### Step 2: Input Interaction

1. Focus on competitor URL input
2. Type a URL (at least 10 characters)
3. Submit the form

**Expected events:**
- `landing_input_focused`
- `landing_competitor_url_entered`
- `landing_competitor_url_submitted`

**Verify in Console:**
```javascript
// Check that all events are tracked
// Network tab should show requests to /ingest/e/
```

#### Step 3: Cross-Domain Redirect

1. Click a "Start free trial" button (e.g., from snapshot result)
2. **Before page loads**, check the redirect URL in Network tab

**Expected URL format:**
```
http://localhost:3001/signup?ph_distinct_id=abc-123-def&ph_session_id=session-456&competitorUrl=...&source=...
```

**Verify:**
- URL contains both `ph_distinct_id` and `ph_session_id` parameters
- Values match the IDs from Step 1

#### Step 4: Dashboard App Bootstrap

1. Page loads on `http://localhost:3001/signup`
2. Open DevTools → Console
3. Type: `posthog.get_distinct_id()` and `posthog.get_session_id()`

**Expected:**
- Both distinct_id and session_id match Step 1 (bootstrapped from URL)
- `cross_domain_tracking_connected` event tracked
- Session continues seamlessly from marketing site

**Verify in Console:**
```javascript
posthog.get_distinct_id()
// Should return: "abc-123-def" (same as marketing site)

posthog.get_session_id()
// Should return: "session-456" (same session as marketing site)
```

#### Step 5: Real Signup

1. Fill in signup form:
   - Name: Test User
   - Email: test@example.com
   - Password: test123

2. Submit form

**Expected events (in order):**
- `signup_form_submitted`
- Either `signup_completed` (success) OR `signup_error` (failure)
- `posthog.identify("test@example.com", {...})` called

**Verify in Console:**
```javascript
// After successful signup
posthog.get_distinct_id()
// Should return: "test@example.com" (now identified)
```

#### Step 6: Verify Complete Funnel

1. Go to PostHog: https://eu.posthog.com/project/127268
2. Navigate to People → Recent
3. Find your user (test@example.com)
4. Click to view person profile

**Expected in profile:**
- **Events from BOTH domains:**
  - `landing_page_viewed` (from localhost:3000)
  - `landing_input_focused` (from localhost:3000)
  - `landing_competitor_url_submitted` (from localhost:3000)
  - `cross_domain_tracking_connected` (from localhost:3001)
  - `signup_form_submitted` (from localhost:3001)
  - `signup_completed` (from localhost:3001)

- **Properties:**
  - Email: test@example.com
  - Name: Test User
  - Environment: dev

**Verify funnel:**
- Go to "Landing Page Conversion Funnel" dashboard
- Filter: `$environment = dev`
- Your test user should appear in ALL funnel steps
- Conversion rate should be 100% (since you completed all steps)

### Test Scenario: Login Journey

1. **Clear browser state** (new session)
2. Visit `http://localhost:3000`
3. Record PostHog device ID
4. Try to navigate to `/auth/sign-in`
5. **Verify redirect to** `http://localhost:3001/login?ph_device_id=...`
6. Complete login with test@example.com
7. Verify events:
   - `signin_form_submitted`
   - `signin_completed`
   - Session continued from marketing site (same distinct_id and session_id)

## Production Testing

### Prerequisites

1. **Set Vercel environment variables:**

   **For offerpulse-marketing:**
   ```bash
   NEXT_PUBLIC_POSTHOG_KEY=phc_1TA8mL9rtySeLmQDx3KFUOz7Fh8QmBCdzuYVvFaT93W
   NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
   NEXT_PUBLIC_ENVIRONMENT=prd
   NEXT_PUBLIC_DASHBOARD_APP_URL=https://app.offerpulse.io
   NEXT_PUBLIC_MARKETING_APP_URL=https://www.offerpulse.io
   ```

   **For offerpulse-app:**
   ```bash
   NEXT_PUBLIC_POSTHOG_KEY=phc_1TA8mL9rtySeLmQDx3KFUOz7Fh8QmBCdzuYVvFaT93W
   NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
   NEXT_PUBLIC_ENVIRONMENT=prd
   NEXT_PUBLIC_DASHBOARD_APP_URL=https://app.offerpulse.io
   NEXT_PUBLIC_MARKETING_APP_URL=https://www.offerpulse.io
   ```

2. **Deploy both apps:**
   ```bash
   git add .
   git commit -m "fix: implement real PostHog tracking with cross-domain support"
   git push origin main
   ```

3. **Wait for deployments to complete**

### Test in Production

Follow the same steps as local testing, but with production URLs:

1. **Landing:** `https://www.offerpulse.io`
2. **Dashboard:** `https://app.offerpulse.io`
3. **Filter PostHog by:** `$environment = prd`

**IMPORTANT:** Use a real email or test email for production testing

### Verification Checklist

- [ ] Marketing site PostHog initialized (check console: `window.posthog`)
- [ ] Dashboard app PostHog initialized (check console: `window.posthog`)
- [ ] Both distinct_id and session_id captured on marketing site
- [ ] Redirect URL contains both `ph_distinct_id` and `ph_session_id` parameters
- [ ] Dashboard app bootstraps with IDs from URL (same distinct_id and session_id)
- [ ] `cross_domain_tracking_connected` event tracked
- [ ] Real signup creates `signup_completed` event (not mock)
- [ ] User identified with email in PostHog
- [ ] Person profile shows events from both domains
- [ ] Funnel shows complete user journey with session continuity

## Debugging

### Issue: Device ID Not Passed in URL

**Symptom:** Signup URL doesn't contain `?ph_device_id=...`

**Possible causes:**
1. PostHog not initialized on marketing site
2. `window.posthog` not available when `buildAppSignupUrl()` called
3. Environment variables missing

**Debug:**
```javascript
// In marketing site console
window.posthog
// Should return object, not undefined

posthog.get_distinct_id()
// Should return device ID string
```

**Fix:**
- Verify PostHog env vars are set
- Check browser console for initialization errors
- Ensure instrumentation-client.ts loaded

### Issue: Bootstrap Not Working

**Symptom:** Dashboard shows different distinct_id or session_id than marketing

**Possible causes:**
1. `ph_distinct_id` or `ph_session_id` parameters missing from URL
2. Bootstrap config not applied during initialization
3. IDs extracted incorrectly from URL

**Debug:**
```javascript
// In dashboard app console
const urlParams = new URLSearchParams(window.location.search);
console.log('Distinct ID from URL:', urlParams.get('ph_distinct_id'));
console.log('Session ID from URL:', urlParams.get('ph_session_id'));

// Check PostHog
posthog.get_distinct_id()
// Should match URL parameter

posthog.get_session_id()
// Should match URL parameter
```

**Fix:**
- Check `instrumentation-client.ts` extracts IDs before `posthog.init()`
- Verify bootstrap config is spread into init options
- Check for errors in console during initialization

### Issue: Events from Different Users

**Symptom:** PostHog shows landing events and signup events as 2 different people

**Possible causes:**
1. Alias not called or failed
2. `ph_device_id` not passed in URL
3. Different PostHog instances/projects

**Debug:**
1. Check person profile for both device IDs
2. Look for `cross_domain_tracking_connected` event
3. Verify both apps use same PostHog project key

**Fix:**
- Follow debugging steps above
- Ensure both apps use same `NEXT_PUBLIC_POSTHOG_KEY`
- Check that bootstrap config is applied during initialization

### Issue: No Events Appearing

**Symptom:** PostHog doesn't show any events

**Possible causes:**
1. Environment variables not set
2. PostHog not initialized
3. Network requests blocked
4. Wrong environment filter

**Debug:**
```javascript
// Check initialization
window.posthog
// Should return object

// Check if events are being sent
// Network tab → filter by "ingest"
// Should see POST requests to /ingest/e/
```

**Fix:**
- Verify all env vars set in Vercel
- Redeploy after setting env vars
- Check browser console for errors
- Disable ad blockers (they may block PostHog)

## PostHog Dashboard Verification

### Events to Monitor

| Event | Source Domain | Notes |
|-------|---------------|-------|
| `landing_page_viewed` | offerpulse.io | Landing page visits |
| `landing_input_focused` | offerpulse.io | Input engagement |
| `landing_competitor_url_entered` | offerpulse.io | User typed URL |
| `landing_competitor_url_submitted` | offerpulse.io | Form submitted |
| `cross_domain_tracking_connected` | app.offerpulse.io | Bootstrap successful |
| `signup_form_submitted` | app.offerpulse.io | Real signup attempt |
| `signup_completed` | app.offerpulse.io | Real signup success |
| `signup_error` | app.offerpulse.io | Signup failed |
| `signin_form_submitted` | app.offerpulse.io | Real login attempt |
| `signin_completed` | app.offerpulse.io | Real login success |
| `signin_error` | app.offerpulse.io | Login failed |

### Funnel Analysis

#### Landing Page Conversion Funnel

**Dashboard:** https://eu.posthog.com/project/127268/dashboard/526943

**Steps to verify:**
1. Open dashboard
2. Filter: `$environment = prd`
3. Check funnel shows realistic conversion rates

**Expected conversion rates (realistic):**
- Landing view → Input focused: 15-30%
- Input focused → URL submitted: 30-50%
- URL submitted → Signup page: 70-90%
- Signup page → Signup completed: 40-70%
- **Overall landing → signup: 2-5%** (realistic!)

**If rates are much higher:**
- Check for fake data from old mock pages
- Verify `source: "dashboard_app"` in signup_completed events
- Check that events have proper person identification

#### Analytics Basics Dashboard

**Dashboard:** https://eu.posthog.com/project/127268/dashboard/525618

**Events to verify:**
- Signup funnel shows real data
- Checkout events still working
- No duplicate/fake signups

### Person Profile Verification

1. **Find a test user:**
   - PostHog → People → Search by email
   - Or use "Recent" to find latest signups

2. **Check event timeline:**
   - Should show events from BOTH domains
   - Timeline should be chronological
   - No gaps or missing events

3. **Verify properties:**
   - Email, name set correctly
   - `signed_up_at` timestamp
   - Custom properties from signup flow

4. **Check distinct IDs:**
   - Person may have multiple distinct IDs (from alias)
   - All IDs should merge into single person profile

## Monitoring & Alerts

### Key Metrics to Monitor

1. **Cross-domain tracking success rate:**
   - Count of `cross_domain_tracking_connected` events
   - Should be ~100% of signups coming from marketing site

2. **Real vs fake signups:**
   - Filter `signup_completed` by `source = "dashboard_app"`
   - Should see only real signups going forward

3. **Funnel completion:**
   - Check "Landing Page Conversion Funnel"
   - Verify realistic conversion rates (2-5%)

### Set Up Alerts

Create PostHog alerts for:

1. **Zero signups for 24 hours** (production issue)
2. **Cross-domain tracking success < 90%** (tracking broken)
3. **Signup error rate > 10%** (auth issues)
4. **Funnel conversion drops > 50%** (marketing/product issue)

## Common Issues & Solutions

### Issue: Redirect Loop

**Symptom:** Page keeps redirecting between marketing and dashboard

**Cause:** Misconfigured redirect URLs

**Fix:**
- Check `NEXT_PUBLIC_DASHBOARD_APP_URL` is set correctly
- Verify no middleware interfering with auth routes
- Check Next.js config for conflicting redirects

### Issue: "posthog is not defined"

**Symptom:** Console error when calling `posthog.get_distinct_id()`

**Cause:** PostHog not initialized

**Fix:**
- Verify env vars set in Vercel/local .env
- Check instrumentation-client.ts loaded
- Look for PostHog initialization errors in console

### Issue: TypeScript Errors

**Symptom:** Build fails with TypeScript errors about posthog import

**Cause:** posthog-js type definitions

**Fix:**
- Ensure `posthog-js` installed in dashboard app
- Check package.json has latest version
- Run `pnpm install` to update dependencies

### Issue: Bootstrap Not Merging Sessions

**Symptom:** Events from two domains shown as different people or different sessions

**Possible causes:**
1. `ph_distinct_id` or `ph_session_id` missing from URL
2. Bootstrap config not applied during initialization
3. PostHog configuration issue

**Fix:**
- Check IDs are extracted from URL BEFORE posthog.init()
- Verify bootstrap config is spread into init options
- Ensure both IDs are passed in URL from marketing site

## Success Criteria

### Functional Requirements

- [ ] Mock auth pages redirect to real dashboard auth
- [ ] Dashboard signup creates real accounts (Better Auth)
- [ ] Dashboard login authenticates real users
- [ ] Cross-domain redirects preserve competitor URL and UTM params
- [ ] PostHog device ID passed in all cross-domain URLs

### Tracking Requirements

- [ ] No fake `signup_completed` events from marketing mock pages
- [ ] Real `signup_completed` events from dashboard app only
- [ ] `posthog.identify()` called with actual Better Auth user data
- [ ] `cross_domain_tracking_connected` event tracked
- [ ] Signup/signin errors tracked properly

### Funnel Requirements

- [ ] Landing → Signup funnel shows complete user journey
- [ ] Same user/person across both domains
- [ ] Realistic conversion rates (not artificially high)
- [ ] Person profiles show events from both domains
- [ ] Funnel attribution works (can trace user from landing to signup)

## Next Steps After Verification

### 1. Clean Historical Data (Optional)

If you have fake signup data from before:

**Option A:** Delete old fake events
- Use PostHog API or support to clean up
- Filter by date range (before fix deployment)

**Option B:** Filter in insights
- Add filter: `source = "dashboard_app"` to all signup insights
- This excludes fake data from mock pages

### 2. Update Dashboard Insights

Update existing insights to:
- Add `source = "dashboard_app"` filter to signup events
- Verify conversion funnels use correct event sources
- Set up alerts for key metrics

### 3. Monitor for 48 Hours

Watch for:
- Any fake signup events still appearing
- Cross-domain tracking success rate
- Funnel conversion rates stabilizing
- No errors in browser console

### 4. Document New Baselines

After 48 hours of real data:
- Record baseline conversion rates
- Set up alerts for significant deviations
- Share metrics with team

## Files Modified Summary

### Marketing App
- `apps/marketing/app/auth/sign-up/page.tsx` - Now redirects to dashboard signup
- `apps/marketing/app/auth/sign-in/page.tsx` - Now redirects to dashboard login
- `apps/marketing/app/(marketing)/page.tsx` - Updated to use buildAppSignupUrl()

### Dashboard App
- `apps/app/app/(auth)/signup/page.tsx` - Added PostHog tracking + removed alias logic (bootstrap handles it)
- `apps/app/app/(auth)/login/page.tsx` - Added PostHog tracking + removed alias logic (bootstrap handles it)
- `apps/app/env.ts` - Made PostHog vars required (previously done)
- `apps/app/instrumentation-client.ts` - Added bootstrap logic to extract IDs from URL and initialize with them

### Shared Package
- `packages/lib/routing.ts` - Updated to pass both PostHog distinct_id and session_id in URLs

### Documentation
- `POSTHOG_TRACKING_AUDIT.md` - Comprehensive audit report
- `POSTHOG_PRODUCTION_SETUP.md` - Production setup guide
- `POSTHOG_TESTING_GUIDE.md` - This testing guide

## Support Resources

- PostHog Cross-Domain Tracking: https://posthog.com/tutorials/cross-domain-tracking
- PostHog Bootstrap Method: https://posthog.com/docs/libraries/js#bootstrap
- PostHog Identifying Users: https://posthog.com/docs/product-analytics/identify

## Contact

If you encounter issues:
1. Check browser console for errors
2. Verify environment variables in Vercel
3. Review PostHog Live Events for real-time debugging
4. Check Network tab for failed /ingest requests
