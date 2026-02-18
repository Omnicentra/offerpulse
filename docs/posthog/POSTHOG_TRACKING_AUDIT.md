# PostHog Tracking Implementation Audit

**Date:** February 18, 2026  
**Project:** OfferPulse  
**PostHog Project:** https://eu.posthog.com/project/127268

## Executive Summary

This audit reviews PostHog tracking for two dashboards:
1. **Landing Page Conversion Funnel** (Dashboard 526943)
2. **Analytics basics** (Dashboard 525618)

### Critical Issue Identified

**Mock Auth Pages Tracking Fake Signups/Logins**

- Marketing app (`apps/marketing`) has mock auth pages that track `signup_completed` and `signin_completed` events
- These pages don't create real accounts - they're UI mockups
- Real authentication happens in Dashboard app (`apps/app`) which has NO PostHog tracking
- **Result:** PostHog is currently tracking fake signups/logins, not real ones

---

## Dashboard 1: Landing Page Conversion Funnel

**Dashboard URL:** https://eu.posthog.com/project/127268/dashboard/526943

### Expected Events (7 total)

| Event | Status | Location | Notes |
|-------|--------|----------|-------|
| `landing_page_viewed` | ✅ **IMPLEMENTED** | `apps/marketing/app/(marketing)/page.tsx:83` | Tracks homepage views |
| `landing_input_focused` | ✅ **IMPLEMENTED** | `apps/marketing/components/offer-snapshot-form.tsx:103` | Tracks input focus |
| `landing_competitor_url_entered` | ✅ **IMPLEMENTED** | `apps/marketing/components/offer-snapshot-form.tsx:114` | Tracks 10+ char entry |
| `landing_competitor_url_submitted` | ✅ **IMPLEMENTED** | `apps/marketing/components/offer-snapshot-form.tsx:54` | Tracks form submission |
| `signup_page_viewed` | ✅ **IMPLEMENTED** | `apps/marketing/app/auth/sign-up/page.tsx:36` | Tracks signup page views |
| `signup_form_submitted` | ❌ **TRACKING FAKE DATA** | `apps/marketing/app/auth/sign-up/page.tsx:58` | Mock page, not real signup |
| `signup_completed` | ❌ **TRACKING FAKE DATA** | `apps/marketing/app/auth/sign-up/page.tsx:79` | Mock page, not real signup |

### Free Tools Events

| Event | Status | Location |
|-------|--------|----------|
| `landing_free_tool_clicked` | ⚠️ **NOT VERIFIED** | Implementation not found in code review |
| `landing_cta_clicked` | ⚠️ **NOT VERIFIED** | Implementation not found in code review |
| `free_tools_page_viewed` | ⚠️ **NOT VERIFIED** | Implementation not found in code review |
| `free_tool_opened` | ⚠️ **NOT VERIFIED** | Implementation not found in code review |

### Verdict: 🟡 PARTIALLY IMPLEMENTED

- **Landing page tracking:** ✅ Complete
- **Input engagement:** ✅ Complete
- **Signup tracking:** ❌ Tracking fake data from mock pages

---

## Dashboard 2: Analytics basics

**Dashboard URL:** https://eu.posthog.com/project/127268/dashboard/525618

### Expected Events (11 total)

| Event | Status | Location | Notes |
|-------|--------|----------|-------|
| `checkout_initiated` | ✅ **IMPLEMENTED** | `apps/marketing/app/(marketing)/snapshot/page.tsx:162` | Stripe checkout start |
| `checkout_completed` | ✅ **IMPLEMENTED** | `apps/marketing/app/api/webhooks/stripe/route.ts:153` | Server-side webhook |
| `checkout_expired` | ✅ **IMPLEMENTED** | `apps/marketing/app/api/webhooks/stripe/route.ts:202` | Server-side webhook |
| `payment_failed` | ✅ **IMPLEMENTED** | `apps/marketing/app/api/webhooks/stripe/route.ts:228` | Server-side webhook |
| `waitlist_joined` | ✅ **IMPLEMENTED** | `apps/marketing/app/api/early-access/free-queue/route.ts:58` | Server-side tracking |
| `signup_form_submitted` | ❌ **TRACKING FAKE DATA** | `apps/marketing/app/auth/sign-up/page.tsx:58` | Mock page |
| `signup_completed` | ❌ **TRACKING FAKE DATA** | `apps/marketing/app/auth/sign-up/page.tsx:79` | Mock page |
| `signin_form_submitted` | ❌ **TRACKING FAKE DATA** | `apps/marketing/app/auth/sign-in/page.tsx:41` | Mock page |
| `signin_completed` | ❌ **TRACKING FAKE DATA** | `apps/marketing/app/auth/sign-in/page.tsx:57` | Mock page |
| `offer_tool_analyzed` | ✅ **IMPLEMENTED** | `apps/marketing/app/(marketing)/free-tools/[slug]/tool/page.tsx:96` | Free tool usage |
| `offer_tool_error` | ✅ **IMPLEMENTED** | `apps/marketing/app/(marketing)/free-tools/[slug]/tool/page.tsx:111` | Free tool errors |

### Additional Events Found

| Event | Status | Location |
|-------|--------|----------|
| `pricing_plan_selected` | ✅ **IMPLEMENTED** | `apps/marketing/components/pricing-cards.tsx:33` | User selects plan |
| `cta_clicked` | ✅ **IMPLEMENTED** | `apps/marketing/components/cta-section.tsx:29` | CTA button clicks |

### Verdict: 🟡 PARTIALLY IMPLEMENTED

- **Checkout/payment tracking:** ✅ Complete and accurate
- **Tool usage tracking:** ✅ Complete
- **Auth tracking:** ❌ Completely fake (mock pages only)

---

## Critical Problem: Mock vs Real Auth Pages

### Mock Auth Pages (Marketing App)

**Location:** `apps/marketing/app/auth/`

- `sign-in/page.tsx` - Mock login page (lines 40-59)
- `sign-up/page.tsx` - Mock signup page (lines 57-83)

**Behavior:**
- Displays forms that look real
- Tracks PostHog events (`signup_completed`, `signin_completed`)
- **DOES NOT create real accounts** - just simulates with `setTimeout`
- Redirects to marketing homepage after "signup"
- Uses `posthog.identify()` with fake user data

**Example Code (Mock Signup):**
```typescript
// This is FAKE - just simulates an API call
await new Promise((resolve) => setTimeout(resolve, 1500))

// This tracks a FAKE signup
posthog.capture("signup_completed", {
  email: data.email,
  has_store_url: !!data.storeUrl,
  has_competitor_url: !!data.competitorUrl,
})
```

### Real Auth Pages (Dashboard App)

**Location:** `apps/app/app/(auth)/`

- `login/page.tsx` - Real login with Better Auth
- `signup/page.tsx` - Real signup with Better Auth

**Behavior:**
- Creates real user accounts in database via Better Auth
- **NO PostHog tracking** - events not captured
- Redirects to `/overview` dashboard after successful auth
- Actually calls `signIn.email()` and `signUp.email()` from Better Auth

**Example Code (Real Signup):**
```typescript
// This is REAL - creates account in database
const { error } = await signUp.email({
  name: data.name,
  email: data.email,
  password: data.password,
})

// NO PostHog tracking here! ❌
```

---

## Impact Analysis

### Current State

**What PostHog sees:**
- "Signups" from marketing app mock pages (fake accounts)
- No signups from dashboard app real auth (real accounts)

**Data Quality:**
- ❌ **Conversion funnels are inaccurate** - showing mock signups, not real ones
- ❌ **User identification is wrong** - identifying fake users instead of real users
- ❌ **Can't track user journey** from landing → real signup → product usage
- ❌ **Attribution is broken** - can't connect marketing campaigns to real conversions

### Business Impact

- **Marketing:** Can't measure true conversion rates
- **Product:** Can't track user onboarding journey
- **Analytics:** Dashboards show fake data
- **Revenue:** Can't connect signups to paid conversions

---

## Recommended Solutions

### Option 1: Track Only Real Signups (RECOMMENDED)

**Remove tracking from mock pages, add to real auth pages**

#### Step 1: Remove Fake Tracking from Marketing App

```typescript
// apps/marketing/app/auth/sign-up/page.tsx
// apps/marketing/app/auth/sign-in/page.tsx

// REMOVE these PostHog tracking calls:
// - posthog.capture("signup_form_submitted")
// - posthog.capture("signup_completed")
// - posthog.capture("signin_form_submitted")  
// - posthog.capture("signin_completed")
// - posthog.identify(...)
```

#### Step 2: Add Real Tracking to Dashboard App

```typescript
// apps/app/app/(auth)/signup/page.tsx

import posthog from "posthog-js";

const onSubmit = async (data: SignupForm) => {
  setIsLoading(true);
  
  // Track form submission
  posthog.capture("signup_form_submitted", {
    has_name: !!data.name,
  });
  
  try {
    const { error } = await signUp.email({
      name: data.name,
      email: data.email,
      password: data.password,
    });

    if (error) {
      // Track error
      posthog.capture("signup_error", {
        error_message: error.message,
      });
      return;
    }

    // Track successful signup and identify user
    posthog.identify(data.email, {
      email: data.email,
      name: data.name,
      signed_up_at: new Date().toISOString(),
    });
    
    posthog.capture("signup_completed", {
      email: data.email,
      source: "dashboard_app",
    });

    router.push("/overview");
  } finally {
    setIsLoading(false);
  }
};
```

#### Step 3: Update Login Page Similarly

```typescript
// apps/app/app/(auth)/login/page.tsx

import posthog from "posthog-js";

const onSubmit = async (data: LoginForm) => {
  setIsLoading(true);
  
  // Track form submission
  posthog.capture("signin_form_submitted");
  
  try {
    const { error } = await signIn.email({
      email: data.email,
      password: data.password,
    });

    if (error) {
      // Track error
      posthog.capture("signin_error", {
        error_message: error.message,
      });
      return;
    }

    // Track successful signin and identify user
    posthog.identify(data.email, {
      email: data.email,
      last_signed_in_at: new Date().toISOString(),
    });
    
    posthog.capture("signin_completed", {
      email: data.email,
    });

    router.push("/overview");
  } finally {
    setIsLoading(false);
  }
};
```

### Option 2: Keep Mock Pages But Tag as Test Data

**Add environment/test flags to distinguish fake vs real signups**

```typescript
// Mock pages - tag as test data
posthog.capture("signup_completed", {
  email: data.email,
  is_mock: true,
  source: "marketing_demo",
})

// Real pages - tag as production
posthog.capture("signup_completed", {
  email: data.email,
  is_mock: false,
  source: "dashboard_app",
})
```

Then filter in PostHog: `is_mock = false`

**Pros:** Keeps demo functionality  
**Cons:** Still pollutes data, requires filters everywhere

### Option 3: Separate PostHog Projects

**Use different PostHog project keys for marketing vs product**

- Marketing app (mockups): Use separate test project
- Dashboard app (real): Use production project

**Pros:** Complete data separation  
**Cons:** Can't track cross-app journey (landing → signup → product)

---

## Recommended Implementation Plan

### Phase 1: Stop Fake Data (Immediate)

1. **Remove PostHog tracking from mock auth pages**
   - Comment out all `posthog.capture()` and `posthog.identify()` calls
   - In: `apps/marketing/app/auth/sign-in/page.tsx`
   - In: `apps/marketing/app/auth/sign-up/page.tsx`

2. **Add PostHog tracking to real auth pages**
   - Import PostHog in dashboard app auth pages
   - Add tracking to successful signup/signin
   - Add user identification with Better Auth user data

3. **Deploy and verify**
   - Test real signup flow in dashboard app
   - Verify events appear in PostHog
   - Check user identification works correctly

### Phase 2: Complete Landing Funnel (Next)

1. **Verify missing events are implemented:**
   - `landing_free_tool_clicked`
   - `landing_cta_clicked`
   - `free_tools_page_viewed`
   - `free_tool_opened`

2. **Add tracking for product usage in dashboard app:**
   - `competitor_added`
   - `snapshot_captured`
   - `alert_configured`
   - `recommendation_viewed`

3. **Create end-to-end funnel:**
   - Landing page → Real signup → First competitor added → First alert

### Phase 3: Clean Historical Data (Later)

1. **Identify fake signup events** in PostHog
   - Filter by source or date range
   - Export for backup if needed

2. **Consider data cleanup options:**
   - Delete fake events via PostHog API
   - Or just filter them out in insights going forward

---

## Verification Checklist

After implementing fixes:

### Dashboard App (Real Auth)

- [ ] PostHog initialized in dashboard app
- [ ] `signup_form_submitted` tracked on real signup page
- [ ] `signup_completed` tracked after successful account creation
- [ ] `posthog.identify()` called with real user email from Better Auth
- [ ] `signin_form_submitted` tracked on real login page
- [ ] `signin_completed` tracked after successful login
- [ ] Events appear in PostHog with correct properties
- [ ] User identified correctly (check in PostHog People tab)

### Marketing App (Mock Pages)

- [ ] No PostHog events fired from mock signup page
- [ ] No PostHog events fired from mock signin page
- [ ] Pages still render correctly (just don't track)
- [ ] OR pages removed/redirected to real dashboard app auth

### PostHog Dashboards

- [ ] "Landing Page Conversion Funnel" shows real signups only
- [ ] "Analytics basics" shows real auth events only
- [ ] New signups appear in real-time
- [ ] User identification connects landing page → signup → product usage
- [ ] Conversion rates are accurate (much lower than fake data!)

---

## Additional Recommendations

### 1. Remove Mock Auth Pages Entirely

**Why:** They serve no real purpose and cause confusion

- Marketing site doesn't need auth pages
- Users should go directly to dashboard app for signup/login
- Mock pages just create fake analytics data

**Action:**
- Delete `apps/marketing/app/auth/sign-in/`
- Delete `apps/marketing/app/auth/sign-up/`
- Update marketing site CTAs to link to dashboard app auth:
  - "Sign up" → `https://app.offerpulse.io/signup`
  - "Sign in" → `https://app.offerpulse.io/login`

### 2. Add Cross-App User Tracking

**Challenge:** Users start on marketing site, sign up in dashboard app

**Solution:** Use PostHog's `$device_id` to connect sessions

```typescript
// Marketing site - pass anonymous ID to signup
const deviceId = posthog.get_distinct_id();
const signupUrl = `${DASHBOARD_URL}/signup?ref=${deviceId}`;

// Dashboard app - connect to marketing session
const urlParams = new URLSearchParams(window.location.search);
const marketingRef = urlParams.get('ref');

if (marketingRef) {
  posthog.alias(marketingRef); // Merge with marketing session
}
```

### 3. Track Complete User Journey

Add events in dashboard app to complete the funnel:

```typescript
// After signup
"signup_completed" → 
"onboarding_started" →
"first_competitor_added" →
"first_snapshot_captured" →
"first_alert_configured" →
"activation_completed"
```

This allows measuring:
- Time to value (signup → first competitor)
- Activation rate (% who add competitor)
- Feature adoption (alerts, recommendations)

---

## Files to Modify

### Remove Fake Tracking

- [ ] `apps/marketing/app/auth/sign-in/page.tsx` (lines 40-59)
- [ ] `apps/marketing/app/auth/sign-up/page.tsx` (lines 57-83)

### Add Real Tracking

- [ ] `apps/app/app/(auth)/login/page.tsx` (add PostHog import and tracking)
- [ ] `apps/app/app/(auth)/signup/page.tsx` (add PostHog import and tracking)

### Update Links (Optional)

- [ ] `apps/marketing/components/navbar.tsx` (signup/signin links)
- [ ] `apps/marketing/components/cta-section.tsx` (CTA links)
- [ ] `apps/marketing/app/(marketing)/page.tsx` (hero CTA links)

---

## Conclusion

**Current Status:** 🟡 PostHog tracking is partially implemented but tracking fake data for critical conversion events

**Priority:** 🔴 HIGH - Fix immediately to get accurate analytics

**Estimated Effort:** 2-3 hours
- 30 min: Remove fake tracking from mock pages
- 1 hour: Add real tracking to dashboard app auth
- 30 min: Test and verify
- 30 min: Update marketing site links (optional)

**Impact:** 🎯 Critical for accurate funnel analysis and user attribution

Once fixed, you'll have:
- ✅ Accurate conversion rates
- ✅ Real user identification
- ✅ Complete landing → signup → product journey
- ✅ Reliable data for marketing optimization
