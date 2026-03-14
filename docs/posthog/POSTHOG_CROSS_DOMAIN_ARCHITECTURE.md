# PostHog Cross-Domain Tracking Architecture

## Overview

This document explains how PostHog tracking works across your two separate Vercel deployments and domains.

## Domain Architecture

```
offerpulse.io (marketing)     → Vercel project: offerpulse-marketing
app.offerpulse.io (dashboard) → Vercel project: offerpulse-app
```

**Key Point:** Even though these are subdomains, browsers treat them as **different origins** for cookies and storage.

## Why Cross-Domain Tracking is Needed

### The Cookie Problem

PostHog stores the user's `device_id` in a cookie:

```
Cookie on offerpulse.io:
  Name: ph_phc_1TA8mL9rtySeLmQDx3KFUOz7Fh8QmBCdzuYVvFaT93W_posthog
  Domain: .offerpulse.io
  Value: {"distinct_id": "abc-123-def"}

Cookie on app.offerpulse.io:
  Name: ph_phc_1TA8mL9rtySeLmQDx3KFUOz7Fh8QmBCdzuYVvFaT93W_posthog
  Domain: .app.offerpulse.io
  Value: {"distinct_id": "xyz-789-ghi"}  ← DIFFERENT!
```

Without cross-domain tracking, PostHog sees these as **two different users**.

### The Solution: URL Parameter + Bootstrap

1. **Marketing site** passes both `distinct_id` and `session_id` via URL parameters
2. **Dashboard app** extracts IDs and bootstraps PostHog initialization with them
3. **PostHog** continues the same session seamlessly across domains

## Implementation Details

### Step 1: Capture IDs on Marketing Site

When user clicks signup/login CTA on marketing site:

```typescript
// packages/lib/routing.ts
export function buildAppSignupUrl(params = {}) {
  const url = new URL('/signup', 'https://app.offerpulse.io');
  
  // Get PostHog distinct_id and session_id from current session
  const distinctId = posthog.get_distinct_id(); // "abc-123-def"
  const sessionId = posthog.get_session_id(); // "session-456"
  
  // Pass both as URL parameters
  url.searchParams.set('ph_distinct_id', distinctId);
  url.searchParams.set('ph_session_id', sessionId);
  
  return url.toString();
  // Returns: https://app.offerpulse.io/signup?ph_distinct_id=abc-123-def&ph_session_id=session-456
}
```

### Step 2: Bootstrap on Dashboard App

PostHog initialization extracts IDs from URL and bootstraps them:

```typescript
// apps/app/instrumentation-client.ts
// Extract PostHog IDs from URL BEFORE initialization
const urlParams = new URLSearchParams(window.location.search);
const distinctId = urlParams.get('ph_distinct_id');
const sessionId = urlParams.get('ph_session_id');

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  api_host: "/ingest",
  ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  // Bootstrap with IDs from marketing site
  bootstrap: {
    distinctID: distinctId,
    sessionID: sessionId,
  },
  loaded: (posthogInstance) => {
    // Track successful cross-domain connection
    if (distinctId || sessionId) {
      posthogInstance.capture("cross_domain_tracking_connected", {
        from_domain: "marketing",
        method: "bootstrap"
      });
    }
  },
});
```

### Step 3: Identify After Signup

After successful signup, identify the user:

```typescript
// apps/app/app/(auth)/signup/page.tsx
const { error } = await signUp.email({ name, email, password });

if (!error) {
  // Associate the session with user's email
  posthog.identify(email, {
    email: email,
    name: name,
    signed_up_at: new Date().toISOString(),
  });
  
  // Track completion
  posthog.capture("signup_completed", {
    email: email,
    source: "dashboard_app",
  });
}
```

## PostHog's View of the User Journey

### Before Alias (Broken)

```
Person 1 (device_id: abc-123-def)
  - landing_page_viewed
  - landing_input_focused
  - landing_url_submitted

Person 2 (device_id: xyz-789-ghi)  ← DIFFERENT PERSON!
  - signup_form_submitted
  - signup_completed
```

**Result:** Funnel breaks, can't connect landing → signup

### After Bootstrap (Fixed)

```
Person 1 (distinct_id: test@example.com)
  Device ID: abc-123-def (same across both domains)
  Session ID: session-456 (same across both domains)
  
  Timeline:
  1. landing_page_viewed (from offerpulse.io, session: session-456)
  2. landing_input_focused (from offerpulse.io, session: session-456)
  3. landing_url_submitted (from offerpulse.io, session: session-456)
  4. cross_domain_tracking_connected (from app.offerpulse.io, session: session-456)
  5. signup_form_submitted (from app.offerpulse.io, session: session-456)
  6. signup_completed (from app.offerpulse.io, session: session-456)
  7. [identified as test@example.com]
```

**Result:** Complete funnel, single user profile, seamless session replay continuity

## Shared PostHog Credentials

Both apps use the **same PostHog project:**

```bash
# Same credentials in both apps
NEXT_PUBLIC_POSTHOG_KEY=phc_1TA8mL9rtySeLmQDx3KFUOz7Fh8QmBCdzuYVvFaT93W
NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
```

This is **correct and necessary** because:
- Both apps track to same PostHog project
- Events from both domains appear in same dashboards
- Person profiles merge events from both sources
- Funnels can span across domains

## Why This Architecture Works

### 1. Clean Separation

- **Marketing app:** No database, no auth logic, just marketing content
- **Dashboard app:** Owns auth, database, user data

### 2. Single Source of Truth

- All auth logic in one place (dashboard)
- Better Auth only configured in dashboard app
- No session sync complexity

### 3. Standard Pattern

This is how many SaaS products handle cross-domain tracking:
- Stripe (stripe.com → checkout.stripe.com)
- Shopify (shopify.com → admin.shopify.com)
- Salesforce (salesforce.com → lightning.force.com)

### 4. Robust Tracking

- Works even if cookies blocked (URL parameter fallback)
- Graceful degradation (alias fails silently)
- No impact on user experience

## Edge Cases Handled

### Case 1: User Bookmarks Signup Page

**Scenario:** User bookmarks `https://app.offerpulse.io/signup` directly

**Behavior:**
- No `ph_device_id` in URL
- Alias not called
- New device_id created
- Signup still tracked correctly
- Just missing pre-signup landing events

**Impact:** Minor - still get signup data, just no landing page attribution

### Case 2: User Clicks Multiple CTAs

**Scenario:** User clicks signup CTA, goes back, clicks another CTA

**Behavior:**
- Each CTA call passes same device_id
- Dashboard alias called multiple times with same ID
- PostHog handles this gracefully (no-op after first alias)

**Impact:** None - works correctly

### Case 3: PostHog Not Initialized

**Scenario:** PostHog fails to initialize on marketing site

**Behavior:**
- `getPostHogDeviceId()` returns null
- URL parameter not added
- Dashboard creates new device_id
- Signup still tracked

**Impact:** No cross-domain attribution, but signup still captured

### Case 4: Ad Blocker Blocks PostHog

**Scenario:** User has ad blocker that blocks PostHog

**Behavior:**
- Events sent to `/ingest` (proxied through your domain)
- Ad blockers typically don't block first-party requests
- Tracking should work

**Impact:** Minimal - reverse proxy helps bypass most blockers

## Security & Privacy

### Cookie Isolation

- Marketing cookies stay on offerpulse.io domain
- Dashboard cookies stay on app.offerpulse.io domain
- No security risk from shared PostHog project key

### Data Privacy

- Device ID is anonymous identifier
- Only passed to your own dashboard app
- Identified only after user signs up voluntarily
- Compliant with GDPR/privacy laws

### No Sensitive Data in URLs

- `ph_device_id` is anonymous (not personally identifiable)
- No email, password, or sensitive data in URL parameters
- Safe to pass across domains

## Monitoring & Maintenance

### Key Metrics

Monitor these to ensure cross-domain tracking works:

1. **Cross-domain success rate:**
   ```
   Count of cross_domain_tracking_connected events
   ÷ 
   Count of signup_completed events
   
   Target: > 95%
   ```

2. **Person profile completeness:**
   - % of users with both landing AND signup events
   - Target: > 90%

3. **Funnel completion visibility:**
   - Landing → Signup funnel shows reasonable conversion
   - Target: 2-5%

### Alerts to Set Up

1. **Cross-domain tracking drops below 90%**
   - Indicates: Device ID not being passed or alias failing
   - Action: Check routing.ts and auth page alias logic

2. **Signup events without landing events > 20%**
   - Indicates: Users bookmarking signup page or direct traffic
   - Action: This is normal, but monitor the percentage

3. **No signup events for 24 hours (production)**
   - Indicates: Tracking broken or deployment issue
   - Action: Check Vercel env vars, redeploy, check console errors

## Technical Notes

### Why Bootstrap vs Alias?

**Bootstrap (Current Implementation):**
- Continues the **same session** across domains
- IDs are set during PostHog initialization
- Maintains session replay continuity
- More reliable for feature flags
- Recommended by PostHog for cross-domain tracking

**Alias (Alternative):**
- Merges two **different anonymous** device IDs after initialization
- Use when you can't bootstrap (e.g., can't access URL during init)
- Doesn't maintain session replay continuity

**Identify:**
- Associates anonymous session with **known** user ID
- Use AFTER user signs up/logs in
- Tells PostHog: "this device belongs to user@example.com"

**Correct order with Bootstrap:**
1. `posthog.init({ bootstrap: { distinctID, sessionID } })` - continue session
2. `posthog.identify(email, props)` - identify user after signup

### Why Not Use Single Domain?

**Option A: offerpulse.io for everything**
- Pros: No cross-domain tracking needed
- Cons: Marketing + product in one app, complex routing

**Option B: Separate domains with cross-domain tracking** ✅ (Current)
- Pros: Clean separation, independent deployments, clear ownership
- Cons: Requires cross-domain tracking (now implemented!)

**Option C: Functional auth on marketing site**
- Pros: Same domain for landing → signup
- Cons: Still need cross-domain for signup → product, auth complexity in marketing app

**Verdict:** Option B is the cleanest architecture with proper cross-domain tracking.

## Future Enhancements

### 1. Track Product Onboarding

Add events in dashboard app for complete user journey:

```typescript
signup_completed →
onboarding_started →
first_competitor_added →
first_snapshot_captured →
first_alert_configured →
activation_completed
```

### 2. Add UTM Persistence

Store UTM parameters across domains:

```typescript
// Marketing site
localStorage.setItem('utm_params', JSON.stringify(utmParams));

// Dashboard app
const utmParams = localStorage.getItem('utm_params');
// Attribute signup to campaign
```

### 3. Track Return Visits

Monitor when users return to dashboard:

```typescript
// On dashboard app load
if (user.isAuthenticated) {
  posthog.capture("dashboard_session_started");
}
```

## Conclusion

Your PostHog tracking is now properly configured for:

✅ Real signup/login tracking (not fake mock data)  
✅ Cross-domain funnel attribution  
✅ Complete user journey visibility  
✅ Accurate conversion metrics  
✅ Proper user identification  

The implementation is production-ready and follows PostHog best practices for multi-domain SaaS applications.
