# PostHog Waitlist Funnel - Implementation Summary

**Date**: February 18, 2026  
**Status**: ✅ Complete - Ready for PostHog Dashboard Update

## What Was Done

### 1. Added Client-Side Tracking for Waitlist Flow

Previously, the waitlist join event was only tracked server-side, which could cause funnel attribution issues. Now tracking happens both client and server-side.

#### Changes Made

**File**: `apps/marketing/app/(marketing)/snapshot/page.tsx`

**New Events Added**:
1. ✅ `waitlist_form_submitted` - Tracks when user submits waitlist form (before API call)
2. ✅ `waitlist_joined` - Tracks successful waitlist join (client-side, immediate feedback)
3. ✅ `waitlist_error` - Tracks when waitlist submission fails

**Implementation**:
```typescript
// When user submits waitlist form
posthog.capture("waitlist_form_submitted", {
  email,
  competitor_url: url,
  utm_source,
  utm_medium,
  utm_campaign,
});

// On successful API response
posthog.capture("waitlist_joined", {
  email,
  competitor_url: url,
  source: "snapshot_page",
});

// Identify user
posthog.identify(email, {
  email,
  waitlist_joined_at: new Date().toISOString(),
});

// On error
posthog.capture("waitlist_error", {
  error_message,
  email,
  source: "snapshot_page",
});
```

### 2. Created Comprehensive Funnel Documentation

**File**: `POSTHOG_WAITLIST_FUNNEL_UPDATE.md`

This document provides:
- Complete event inventory
- Three funnel options (Paid, Waitlist, Combined)
- Step-by-step PostHog UI update instructions
- Testing procedures
- SQL queries for custom analysis

## New Funnel Structure

### Recommended: Two Separate Funnels

#### Funnel A: Paid Conversion (3 steps)
```
1. landing_page_viewed (User lands on homepage)
   ↓
2. landing_competitor_url_submitted (User submits competitor URL)
   ↓
3. checkout_completed (User pays £19 for early access)
```

**Conversion Rate**: Step 2 → Step 3 shows % of URL submitters who pay

#### Funnel B: Waitlist Conversion (3 steps)
```
1. landing_page_viewed (User lands on homepage)
   ↓
2. landing_competitor_url_submitted (User submits competitor URL)
   ↓
3. waitlist_joined (User joins free waitlist)
```

**Conversion Rate**: Step 2 → Step 3 shows % of URL submitters who join waitlist

### Alternative: Detailed Checkout Funnel (4 steps)
```
1. landing_competitor_url_submitted
   ↓
2. checkout_initiated (User clicks "Get my first report for £19")
   ↓
3. checkout_completed (User completes Stripe payment)
```

## Complete Event Flow

### Landing Page → URL Submission
1. User lands on homepage
   - Event: `landing_page_viewed`
   - Properties: `page`, `referrer`

2. User focuses on input
   - Event: `landing_input_focused`
   - Properties: `source: "hero"`

3. User types URL
   - Event: `landing_competitor_url_entered` (at 10+ characters)
   - Properties: `source: "hero"`, `partial_url`

4. User submits URL
   - Event: `landing_competitor_url_submitted`
   - Properties: `url`, `domain`
   - **Redirect**: → `/snapshot?url=...`

### Snapshot Page → Conversion

#### Path A: Paid £19
5a. User views snapshot page
   - Event: `$pageview` with `/snapshot` URL

6a. User clicks "Get my first report for £19"
   - Event: `checkout_initiated`
   - Properties: `email`, `competitor_url`, `utm_source`

7a. User completes Stripe checkout
   - Event: `checkout_completed` (server-side via webhook)
   - Properties: `email`, `amount: 19`, `currency: "GBP"`, `stripe_session_id`

#### Path B: Free Waitlist
5b. User views snapshot page
   - Event: `$pageview` with `/snapshot` URL

6b. User enters email and clicks "Join waitlist"
   - Event: `waitlist_form_submitted` (NEW)
   - Properties: `email`, `competitor_url`, `utm_*`

7b. API successfully processes request
   - Events: 
     - `waitlist_joined` (client-side) (UPDATED)
     - `waitlist_joined` (server-side) (existing)
   - Properties: `email`, `competitor_url`, `source`, `waitlist_joined_at`

## Event Tracking Status

| Event | Client | Server | Files |
|-------|--------|--------|-------|
| `landing_page_viewed` | ✅ | ❌ | `apps/marketing/app/(marketing)/page.tsx` |
| `landing_input_focused` | ✅ | ❌ | `apps/marketing/components/offer-snapshot-form.tsx` |
| `landing_competitor_url_entered` | ✅ | ❌ | `apps/marketing/components/offer-snapshot-form.tsx` |
| `landing_competitor_url_submitted` | ✅ | ❌ | `apps/marketing/components/offer-snapshot-form.tsx` |
| `checkout_initiated` | ✅ | ❌ | `apps/marketing/app/(marketing)/snapshot/page.tsx` |
| `checkout_completed` | ❌ | ✅ | `apps/marketing/app/api/webhooks/stripe/route.ts` |
| `checkout_error` | ✅ | ❌ | `apps/marketing/app/(marketing)/snapshot/page.tsx` |
| `waitlist_form_submitted` | ✅ | ❌ | `apps/marketing/app/(marketing)/snapshot/page.tsx` (NEW) |
| `waitlist_joined` | ✅ | ✅ | Both (UPDATED) |
| `waitlist_error` | ✅ | ❌ | `apps/marketing/app/(marketing)/snapshot/page.tsx` (NEW) |

## Next Steps: Update PostHog Dashboard

### Step 1: Navigate to PostHog
Go to: https://eu.posthog.com/project/127268/insights/Y4kseedd

### Step 2: Edit the Funnel

**Current funnel to replace**: "Landing → Signup → User (Detailed Funnel)"

**Option A: Replace with Paid Funnel**
1. Click "Edit" in top right
2. Remove steps 3-7 (keep only steps 1-2)
3. Change step 3 event to `checkout_completed`
4. Update names:
   - Step 1: "1. Landing Page" (landing_page_viewed)
   - Step 2: "2. URL Submitted" (landing_competitor_url_submitted)
   - Step 3: "3. Paid £19" (checkout_completed)
5. Update insight name: "Landing → URL → Paid £19"
6. Update description: "Track conversion from landing to £19 early access purchase"
7. Save

**Option B: Create Both Funnels**
1. Duplicate existing insight
2. Create "Landing → URL → Paid £19" (steps above)
3. Create "Landing → URL → Free Waitlist" (same but step 3 = `waitlist_joined`)
4. Add both to dashboard

### Step 3: Create Additional Insights (Optional)

#### Conversion Comparison Chart
**Type**: Trends  
**Events**:
- `checkout_completed` (label: "Paid £19")
- `waitlist_joined` (label: "Free Waitlist")

**Breakdown**: `$environment`  
**Time**: Last 30 days

#### Checkout Detail Funnel
**Type**: Funnel  
**Steps**:
1. `landing_competitor_url_submitted`
2. `checkout_initiated`
3. `checkout_completed`

### Step 4: Update Dashboard Layout

Recommended organization for dashboard 526943:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
│ Landing Page Conversion Funnel Dashboard     │
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Row 1: Overview
┌─────────────────────────┬─────────────────────────┐
│ Landing Page Views      │ Daily Conversions       │
│ (over time)             │ (Paid + Waitlist)       │
└─────────────────────────┴─────────────────────────┘

Row 2: Main Funnels  
┌─────────────────────────┬─────────────────────────┐
│ Landing → URL → Paid    │ Landing → URL → Wait    │
│ (3 steps)               │ (3 steps)               │
└─────────────────────────┴─────────────────────────┘

Row 3: Engagement Details
┌─────────────────────────┬─────────────────────────┐
│ Input Engagement        │ Checkout Funnel Detail  │
│ (focus → enter → submit)│ (URL → Init → Complete) │
└─────────────────────────┴─────────────────────────┘

Row 4: CTA & Trends
┌─────────────────────────┬─────────────────────────┐
│ CTA Click Performance   │ Conversion Type Trend   │
│ (by action)             │ (Paid vs Waitlist)      │
└─────────────────────────┴─────────────────────────┘
```

## Testing the Updated Funnel

### Local Testing (Development)

1. **Start development servers**:
```bash
pnpm dev
```

2. **Enable PostHog debug mode** (in browser console):
```javascript
posthog.debug()
```

3. **Test Paid Conversion Path**:
   - Visit http://localhost:3000
   - Check console: `landing_page_viewed` ✓
   - Enter competitor URL
   - Check console: `landing_competitor_url_submitted` ✓
   - Click "Get my first report for £19"
   - Check console: `checkout_initiated` ✓
   - Complete Stripe checkout (use test card: 4242 4242 4242 4242)
   - Check Stripe webhook logs for `checkout_completed` ✓

4. **Test Waitlist Path**:
   - Visit http://localhost:3000
   - Check console: `landing_page_viewed` ✓
   - Enter competitor URL
   - Check console: `landing_competitor_url_submitted` ✓
   - Enter email in waitlist form
   - Click "Join waitlist"
   - Check console: `waitlist_form_submitted` ✓
   - Check console: `waitlist_joined` ✓

### Production Verification

1. **Check PostHog Live Events**:
   - Go to: https://eu.posthog.com/project/127268/events
   - Filter by: `landing_page_viewed`, `landing_competitor_url_submitted`, `checkout_completed`, `waitlist_joined`
   - Verify properties are correct
   - Verify `$environment` property is set

2. **Check Funnel Data**:
   - Wait 5-10 minutes for data to populate
   - View funnel insights
   - Verify conversion rates are calculating
   - Check breakdown by environment works

## Expected Results

### Sample Funnel Data (After 30 Days)

#### Paid Conversion Funnel
```
Step 1: Landing Page Viewed          1,000 users (100%)
        ↓ 20% convert
Step 2: URL Submitted                   200 users (20%)
        ↓ 7.5% convert  
Step 3: Paid £19                         15 users (1.5% of total)
```

**Key Metrics**:
- Landing → URL: 20% (input engagement)
- URL → Paid: 7.5% (payment conversion)
- Overall: 1.5% (landing to paid)

#### Waitlist Conversion Funnel
```
Step 1: Landing Page Viewed          1,000 users (100%)
        ↓ 20% convert
Step 2: URL Submitted                   200 users (20%)
        ↓ 25% convert
Step 3: Joined Waitlist                  50 users (5% of total)
```

**Key Metrics**:
- Landing → URL: 20% (same as paid)
- URL → Waitlist: 25% (higher than paid - expected)
- Overall: 5% (landing to waitlist)

#### Combined Analysis
```
Total Conversions: 65 users (15 paid + 50 waitlist)
Combined Rate: 32.5% of URL submitters convert (either path)
Revenue: £285 (15 × £19)
```

## Files Modified

### Code Changes
1. ✅ `apps/marketing/app/(marketing)/snapshot/page.tsx`
   - Added `waitlist_form_submitted` event
   - Added client-side `waitlist_joined` event
   - Added `waitlist_error` event
   - Added user identification

### Documentation Created
2. ✅ `POSTHOG_WAITLIST_FUNNEL_UPDATE.md` - Complete funnel refactoring guide
3. ✅ `POSTHOG_WAITLIST_IMPLEMENTATION_SUMMARY.md` - This file
4. ✅ `POSTHOG_FUNNEL_COMPATIBILITY.md` - Previous funnel compatibility doc
5. ✅ `LANDING_PAGE_CTA_TRACKING.md` - CTA tracking documentation

## Summary

✅ **Simplified funnel** from 7 steps to 3 steps  
✅ **Two clear conversion paths** (paid £19 or free waitlist)  
✅ **Client-side tracking added** for better attribution  
✅ **Error tracking added** for debugging  
✅ **User identification** on conversion  
✅ **All events properly tracked** with rich properties  
✅ **Ready for PostHog dashboard update** (manual step required)

## Advantages of New Funnel

1. **Simpler to understand**: 3 steps vs 7 steps
2. **Focused on business goal**: Early access conversion, not full signup
3. **Better attribution**: Client + server tracking for waitlist
4. **Two clear paths**: Can optimize each independently
5. **Easier to debug**: Clear event flow with error tracking
6. **Actionable insights**: See which path converts better

The new funnel provides clearer insights into the early access waitlist flow and makes it easy to track and optimize both conversion paths (paid £19 and free waitlist).
