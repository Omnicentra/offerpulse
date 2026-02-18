# PostHog Waitlist Funnel Update Guide

**Date**: February 18, 2026  
**Dashboard**: Landing Page Conversion Funnel (ID: 526943)  
**Insight to Update**: "Landing → Signup → User (Detailed Funnel)" (short_id: Y4kseedd)

## Overview

The current 7-step signup funnel needs to be replaced with a simpler 3-4 step early access funnel that tracks users from landing to either:
- **Path A**: Joining the free waitlist
- **Path B**: Paying £19 for immediate early access

## Current vs New Funnel

### Current Funnel (7 steps - TO BE REPLACED)
1. `landing_page_viewed` - Landing Page View
2. `landing_input_focused` - Input Focused
3. `landing_competitor_url_entered` - URL Entered
4. `landing_competitor_url_submitted` - URL Submitted
5. `signup_page_viewed` - Signup Page View ❌ (no longer relevant)
6. `signup_form_submitted` - Form Submitted ❌ (no longer relevant)
7. `signup_completed` - Signup Complete ❌ (no longer relevant)

### New Funnel Option 1: Paid Conversion (3 steps - RECOMMENDED)
```
Landing → Submit URL → Pay £19
```

**Events**:
1. `landing_page_viewed` - User lands on homepage
2. `landing_competitor_url_submitted` - User submits competitor URL
3. `checkout_completed` - User completes £19 purchase

### New Funnel Option 2: Waitlist Conversion (3 steps)
```
Landing → Submit URL → Join Waitlist
```

**Events**:
1. `landing_page_viewed` - User lands on homepage
2. `landing_competitor_url_submitted` - User submits competitor URL
3. `waitlist_joined` - User joins free waitlist

### New Funnel Option 3: Combined Conversion (4 steps with OR logic)
```
Landing → Submit URL → View Snapshot → Convert (Paid OR Waitlist)
```

**Events**:
1. `landing_page_viewed` - User lands on homepage
2. `landing_competitor_url_submitted` - User submits competitor URL
3. `$pageview` with `$current_url` contains `/snapshot` - User views snapshot page
4. `checkout_completed` OR `waitlist_joined` - User converts either way

## Events Currently Tracked

### ✅ Already Tracked Events

| Event | Location | Properties | Status |
|-------|----------|-----------|---------|
| `landing_page_viewed` | `apps/marketing/app/(marketing)/page.tsx` | `page`, `referrer` | ✅ Active |
| `landing_input_focused` | `apps/marketing/components/offer-snapshot-form.tsx` | `source: "hero"` | ✅ Active |
| `landing_competitor_url_entered` | `apps/marketing/components/offer-snapshot-form.tsx` | `source: "hero"`, `partial_url` | ✅ Active |
| `landing_competitor_url_submitted` | `apps/marketing/components/offer-snapshot-form.tsx` | `url`, `domain` | ✅ Active |
| `checkout_initiated` | `apps/marketing/app/(marketing)/snapshot/page.tsx` | `email`, `competitor_url`, `utm_source` | ✅ Active |
| `checkout_completed` | `apps/marketing/app/api/webhooks/stripe/route.ts` | `email`, `amount`, `currency`, `stripe_session_id` | ✅ Active (server-side) |
| `checkout_error` | `apps/marketing/app/(marketing)/snapshot/page.tsx` | `error`, `source` | ✅ Active |
| `waitlist_joined` | `apps/marketing/app/api/early-access/free-queue/route.ts` + `apps/marketing/app/(marketing)/snapshot/page.tsx` | `email`, `competitor_url`, `source`, `waitlist_joined_at` | ✅ Active (client + server) |
| `waitlist_form_submitted` | `apps/marketing/app/(marketing)/snapshot/page.tsx` | `email`, `competitor_url`, `utm_source`, `utm_medium`, `utm_campaign` | ✅ Active (NEW) |
| `waitlist_error` | `apps/marketing/app/(marketing)/snapshot/page.tsx` | `error_message`, `email`, `source` | ✅ Active (NEW) |

### ⚠️ Events NOT Needed for New Funnel

| Event | Reason |
|-------|--------|
| `signup_page_viewed` | No longer tracking signup - focusing on waitlist/early access |
| `signup_form_submitted` | No longer tracking signup |
| `signup_completed` | No longer tracking signup |

## Implementation Steps

### Step 1: Update the PostHog Insight

Navigate to PostHog dashboard and edit the insight "Landing → Signup → User (Detailed Funnel)":

**URL**: https://eu.posthog.com/project/127268/insights/Y4kseedd

#### Option A: Simple Paid Conversion Funnel (Recommended)

```json
{
  "kind": "FunnelsQuery",
  "series": [
    {
      "kind": "EventsNode",
      "event": "landing_page_viewed",
      "custom_name": "1. Landing Page"
    },
    {
      "kind": "EventsNode",
      "event": "landing_competitor_url_submitted",
      "custom_name": "2. URL Submitted"
    },
    {
      "kind": "EventsNode",
      "event": "checkout_completed",
      "custom_name": "3. Paid £19"
    }
  ],
  "dateRange": {
    "date_from": "-30d",
    "date_to": null
  },
  "funnelsFilter": {
    "funnelVizType": "steps",
    "funnelOrderType": "ordered",
    "funnelStepReference": "total",
    "funnelWindowInterval": 7,
    "funnelWindowIntervalUnit": "day"
  },
  "breakdownFilter": {
    "breakdown": "$environment",
    "breakdown_type": "event"
  },
  "filterTestAccounts": false
}
```

**New Name**: "Landing → URL → Paid Early Access"  
**New Description**: "Track users from landing to £19 early access purchase"

#### Option B: Create TWO Separate Funnels

##### Funnel 1: Paid Conversion
- Name: "Landing → URL → Paid £19"
- Events: `landing_page_viewed` → `landing_competitor_url_submitted` → `checkout_completed`

##### Funnel 2: Waitlist Conversion
- Name: "Landing → URL → Free Waitlist"
- Events: `landing_page_viewed` → `landing_competitor_url_submitted` → `waitlist_joined`

### Step 2: Update Dashboard Metadata

Edit the insight and update:
- **Name**: "Landing → URL → Early Access (Paid)"
- **Description**: "Track conversion from landing page through competitor URL submission to £19 early access purchase"
- **Tags**: Add "early_access", "waitlist_flow"

### Step 3: Create New Insights (Optional)

Create additional insights to track the funnel in detail:

#### A. Checkout Funnel Detail
```
Events:
1. landing_competitor_url_submitted
2. checkout_initiated
3. checkout_completed
```

#### B. Waitlist Funnel Detail
```
Events:
1. landing_competitor_url_submitted
2. $pageview (url contains /snapshot)
3. waitlist_joined
```

#### C. Conversion Comparison Trend
Create a trends chart showing both conversion paths over time:
- Event: `checkout_completed` (label: "Paid £19")
- Event: `waitlist_joined` (label: "Free Waitlist")
- Breakdown by: `$environment`

### Step 4: Update Dashboard Layout

Recommended layout for the "Landing Page Conversion Funnel" dashboard:

```
Row 1:
- [Existing] Landing Page Views Over Time
- [Existing] Daily Signups by Environment (rename to "Daily Conversions")

Row 2:
- [NEW] Landing → URL → Paid £19 (main funnel)
- [NEW] Landing → URL → Free Waitlist (secondary funnel)

Row 3:
- [Existing] Input Engagement Funnel
- [NEW] Checkout Detail Funnel

Row 4:
- [Existing] CTA Click Performance
- [NEW] Conversion Type Comparison (Paid vs Free)
```

## Testing the Funnel

### 1. Test Paid Conversion Path
```bash
# In browser console with PostHog debug enabled
1. Visit homepage → Check for "landing_page_viewed"
2. Enter competitor URL → Check for "landing_competitor_url_submitted"
3. Click "Get my first report for £19" → Check for "checkout_initiated"
4. Complete Stripe checkout → Check for "checkout_completed" (server-side)
```

### 2. Test Waitlist Path
```bash
1. Visit homepage → Check for "landing_page_viewed"
2. Enter competitor URL → Check for "landing_competitor_url_submitted"
3. Enter email in waitlist form → Check for "waitlist_joined" (server-side)
```

### 3. Verify in PostHog
- Go to PostHog Live Events: https://eu.posthog.com/project/127268/events
- Filter by events: `landing_page_viewed`, `landing_competitor_url_submitted`, `checkout_completed`, `waitlist_joined`
- Verify properties are populated correctly

## Expected Results

### Conversion Metrics

With the new funnel, you can track:

1. **Overall Conversion Rate**: `landing_page_viewed` → `landing_competitor_url_submitted`
2. **Paid Conversion Rate**: `landing_competitor_url_submitted` → `checkout_completed`
3. **Waitlist Conversion Rate**: `landing_competitor_url_submitted` → `waitlist_joined`
4. **Combined Conversion Rate**: `landing_competitor_url_submitted` → (`checkout_completed` OR `waitlist_joined`)

### Sample Results (Expected)
```
Step 1: Landing Page Viewed     1,000 users (100%)
Step 2: URL Submitted              200 users (20%)
Step 3a: Paid £19                   15 users (7.5% of step 2, 1.5% of step 1)
Step 3b: Waitlist Joined            50 users (25% of step 2, 5% of step 1)
```

## SQL Query for Custom Analysis

To analyze both conversion paths together in PostHog:

```sql
SELECT
  COUNT(DISTINCT CASE WHEN event = 'landing_page_viewed' THEN distinct_id END) as landing_views,
  COUNT(DISTINCT CASE WHEN event = 'landing_competitor_url_submitted' THEN distinct_id END) as url_submitted,
  COUNT(DISTINCT CASE WHEN event = 'checkout_completed' THEN distinct_id END) as paid_conversions,
  COUNT(DISTINCT CASE WHEN event = 'waitlist_joined' THEN distinct_id END) as waitlist_conversions,
  ROUND(
    100.0 * COUNT(DISTINCT CASE WHEN event = 'checkout_completed' THEN distinct_id END) / 
    NULLIF(COUNT(DISTINCT CASE WHEN event = 'landing_competitor_url_submitted' THEN distinct_id END), 0),
    2
  ) as paid_conversion_rate,
  ROUND(
    100.0 * COUNT(DISTINCT CASE WHEN event = 'waitlist_joined' THEN distinct_id END) / 
    NULLIF(COUNT(DISTINCT CASE WHEN event = 'landing_competitor_url_submitted' THEN distinct_id END), 0),
    2
  ) as waitlist_conversion_rate
FROM events
WHERE timestamp >= now() - interval '30 days'
  AND properties.$environment = 'prd'
```

## PostHog UI Steps (Manual)

### To Update the Existing Funnel

1. **Navigate to the insight**:
   - Go to: https://eu.posthog.com/project/127268/insights/Y4kseedd
   - Or find it in dashboard 526943

2. **Edit the funnel**:
   - Click "Edit" button in top right
   - Remove steps 5, 6, 7 (signup-related events)
   - Update step names:
     - Step 1: "1. Landing Page" (keep as is)
     - Step 2: "2. URL Submitted" (keep as is)  
     - Step 3: Change event to `checkout_completed`, name "3. Paid £19"
   
3. **Update metadata**:
   - Name: "Landing → URL → Paid Early Access"
   - Description: "Track conversion from landing page to £19 early access purchase via competitor URL submission"

4. **Adjust funnel settings**:
   - Keep window: 7 days
   - Keep breakdown: `$environment`
   - Keep order: ordered

5. **Save changes**

### To Create New Waitlist Funnel

1. **Duplicate the existing funnel** or create new
2. **Change step 3** to `waitlist_joined`
3. **Update name**: "Landing → URL → Free Waitlist"
4. **Update description**: "Track conversion from landing page to free waitlist signup"
5. **Add to dashboard** 526943

## Summary

✅ **Simplified from 7 steps to 3 steps**  
✅ **Focused on actual business goal** (early access conversion)  
✅ **Two clear conversion paths** (paid £19 OR free waitlist)  
✅ **All events already tracked** (no code changes needed)  
✅ **Easier to understand and optimize**

The new funnel provides clearer insights into the early access waitlist flow without the complexity of tracking full user signups, which aren't the current focus of the marketing page.
