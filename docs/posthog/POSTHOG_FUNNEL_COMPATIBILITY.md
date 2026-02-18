# PostHog Funnel Compatibility Report

**Date**: February 18, 2026  
**Dashboard**: Landing Page Conversion Funnel (ID: 526943)  
**Status**: ✅ **COMPATIBLE** (after fixes applied)

## Executive Summary

The recent PostHog tracking changes are now fully compatible with the "Landing Page Conversion Funnel" dashboard after adding the missing `signup_page_viewed` event.

## Dashboard Funnels

### 1. Landing → Signup → User (Detailed 7-Step Funnel)

**Purpose**: Complete conversion funnel showing drop-off at each stage  
**Window**: 7 days  
**Breakdown**: By environment (dev, stg, prd)

| Step | Event | Tracked In | Status |
|------|-------|-----------|--------|
| 1 | `landing_page_viewed` | Marketing app (`page.tsx`) | ✅ |
| 2 | `landing_input_focused` | Marketing app (`offer-snapshot-form.tsx`) | ✅ |
| 3 | `landing_competitor_url_entered` | Marketing app (`offer-snapshot-form.tsx`) | ✅ |
| 4 | `landing_competitor_url_submitted` | Marketing app (`offer-snapshot-form.tsx`) | ✅ |
| 5 | `signup_page_viewed` | Dashboard app (`signup/page.tsx`) | ✅ **FIXED** |
| 6 | `signup_form_submitted` | Dashboard app (`signup/page.tsx`) | ✅ |
| 7 | `signup_completed` | Dashboard app (`signup/page.tsx`) | ✅ |

### 2. Landing → Signup (Simplified 3-Step Funnel)

**Purpose**: Quick overview of main conversion points  
**Window**: 7 days  
**Breakdown**: By environment

| Step | Event | Status |
|------|-------|--------|
| 1 | `landing_page_viewed` | ✅ |
| 2 | `landing_competitor_url_submitted` | ✅ |
| 3 | `signup_completed` | ✅ |

### 3. Input Engagement Funnel

**Purpose**: Track user engagement with competitor URL input  
**Window**: 1 day  
**Breakdown**: By environment

| Step | Event | Status |
|------|-------|--------|
| 1 | `landing_input_focused` | ✅ |
| 2 | `landing_competitor_url_entered` | ✅ |
| 3 | `landing_competitor_url_submitted` | ✅ |

## Additional Insights

### 4. Daily Signups by Environment

**Event**: `signup_completed`  
**Status**: ✅ Tracked

### 5. CTA Click Performance

**Event**: `landing_cta_clicked`  
**Status**: ⚠️ Not verified (may be tracked elsewhere)

### 6. Free Tools Engagement

**Events**: 
- `landing_free_tool_clicked`
- `free_tool_opened`

**Status**: ⚠️ Not verified (may be tracked elsewhere)

## New Events Added (Non-Breaking)

These events were added in the recent changes and **do not affect** existing funnels:

### Signup Flow
- ✅ `signup_page_viewed` - Page view tracking (now required for funnel)
- ✅ `signup_form_submitted` - Form submission (already existed)
- ✅ `signup_completed` - Successful signup (already existed)
- 🆕 `signup_error` - Error tracking (new, not in funnel)

### Signin Flow (New)
- 🆕 `signin_page_viewed` - Page view tracking
- 🆕 `signin_form_submitted` - Form submission
- 🆕 `signin_completed` - Successful signin
- 🆕 `signin_error` - Error tracking

### Cross-Domain Tracking (New)
- 🆕 `cross_domain_tracking_connected` - Verification that device ID aliasing worked

## Implementation Details

### Dashboard App (apps/app)

**Signup Page** (`app/(auth)/signup/page.tsx`):
```typescript
// On page load
posthog.capture("signup_page_viewed")

// On form submit
posthog.capture("signup_form_submitted", { has_name: !!data.name })

// On success
posthog.identify(data.email, { email, name, signed_up_at })
posthog.capture("signup_completed", { email, source: "dashboard_app" })

// On error
posthog.capture("signup_error", { error_message })
```

**Login Page** (`app/(auth)/login/page.tsx`):
```typescript
// On page load
posthog.capture("signin_page_viewed")

// On form submit
posthog.capture("signin_form_submitted")

// On success
posthog.identify(data.email, { email, last_signed_in_at })
posthog.capture("signin_completed", { email })

// On error
posthog.capture("signin_error", { error_message })
```

### Marketing App (apps/marketing)

All landing page events remain unchanged and functional:
- `landing_page_viewed` - Page component mount
- `landing_input_focused` - Input focus event
- `landing_competitor_url_entered` - Input change with 10+ characters
- `landing_competitor_url_submitted` - Form submission

## Cross-Domain Tracking

Both signup and login pages now support cross-domain tracking via the `ph_device_id` query parameter:

1. Marketing app passes device ID in signup/login URLs
2. Dashboard app aliases the device ID on page load
3. Tracks `cross_domain_tracking_connected` event for verification

**URL Format**:
```
https://app.offerpulse.com/signup?ph_device_id={posthog_device_id}&competitorUrl={url}
https://app.offerpulse.com/login?ph_device_id={posthog_device_id}
```

## Testing Recommendations

### 1. Verify Funnel Data Flow
- Check that all 7 steps in the detailed funnel show data
- Verify conversion rates are calculating correctly
- Confirm environment breakdown is working

### 2. Test Cross-Domain Tracking
- Navigate from marketing → signup
- Verify `cross_domain_tracking_connected` event fires
- Confirm user journey is tracked under single device ID

### 3. Monitor Error Events
- Check that `signup_error` and `signin_error` events are captured
- Verify error messages are helpful for debugging

### 4. Environment Separation
- Confirm `$environment` property is set correctly (dev, stg, prd)
- Verify person profiles are configured correctly:
  - Production: `identified_only`
  - Dev/Staging: `always`

## Conclusion

✅ **All funnel-critical events are now properly tracked**  
✅ **Cross-domain tracking is implemented**  
✅ **Error tracking added for debugging**  
✅ **No breaking changes to existing funnels**

The changes maintain full compatibility with the Landing Page Conversion Funnel dashboard while adding enhanced tracking capabilities.
