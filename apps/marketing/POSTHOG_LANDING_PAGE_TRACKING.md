# PostHog Landing Page Conversion Tracking

## 📊 Overview

This document describes the comprehensive PostHog tracking implementation for OfferPulse's landing page conversion funnel across three environments (dev, stg, prd).

## 🎯 What's Being Tracked

### Landing Page Journey

1. **Landing page views** (`landing_page_viewed`)
   - When users first arrive at the homepage
   - Properties: `page`, `referrer`, `$environment`

2. **Input interactions** (`landing_input_focused`)
   - When users click/focus on the competitor URL input
   - Properties: `source` (always "hero"), `$environment`

3. **URL entry** (`landing_competitor_url_entered`)
   - When users type meaningful text (10+ characters)
   - Properties: `source`, `partial_url`, `$environment`

4. **URL submission** (`landing_competitor_url_submitted`)
   - When users submit the competitor URL form
   - Properties: `url`, `domain`, `$environment`

5. **Free tool clicks** (`landing_free_tool_clicked`)
   - When users click on free tool cards from landing page
   - Properties: `tool_link`, `hook_text`, `$environment`

6. **CTA clicks** (`landing_cta_clicked`)
   - When users click any CTA button (start trial, view pricing)
   - Properties: `source`, `competitor_url`, `action`, `$environment`

### Signup Flow

7. **Signup page views** (`signup_page_viewed`)
   - When users land on the signup page
   - Properties: `has_competitor_url`, `competitor_url`, `referrer`, `$environment`

8. **Signup form submission** (`signup_form_submitted`)
   - When users submit the signup form
   - Properties: `has_store_url`, `has_competitor_url`, `source`, `$environment`

9. **Signup completion** (`signup_completed`)
   - When signup is successful
   - Properties: `email`, `has_store_url`, `has_competitor_url`, `$environment`

### Free Tools

10. **Free tools page views** (`free_tools_page_viewed`)
    - When users view the free tools directory
    - Properties: `referrer`, `$environment`

11. **Free tool opened** (`free_tool_opened`)
    - When users open a specific free tool
    - Properties: `tool_name`, `tool_slug`, `is_featured`, `$environment`

## 🌍 Environment Tracking

All events automatically include the `$environment` property:

- **`dev`** - localhost (http://localhost:3000)
- **`stg`** - staging (https://dev.offerpulse.io)
- **`prd`** - production (https://offerpulse.io)

### Configuration

Environment is determined by:
1. `NEXT_PUBLIC_ENVIRONMENT` env var (if set)
2. Falls back to `DOPPLER_ENVIRONMENT` env var
3. Defaults to `"dev"`

Set in your Doppler configs or .env files:
```bash
# For staging
NEXT_PUBLIC_ENVIRONMENT=stg

# For production
NEXT_PUBLIC_ENVIRONMENT=prd
```

## 📁 Files Modified

### Core Analytics
- `lib/analytics.ts` - Updated to use PostHog for all tracking
- `instrumentation-client.ts` - Already configured with environment tracking
- `lib/posthog-server.ts` - Server-side PostHog client with environment

### Landing Page
- `app/(marketing)/page.tsx` - Added landing page view tracking
- `components/offer-snapshot-form.tsx` - Added input focus, URL entry, and submission tracking

### Signup Flow
- `app/auth/sign-up/page.tsx` - Added signup page view tracking (already had form tracking)

### Free Tools
- `app/(marketing)/free-tools/page.tsx` - Added page view and tool click tracking

### Configuration
- `.env.local.example` - Added PostHog and environment variables

## 📊 Creating the PostHog Dashboard

### Step 1: Create Conversion Funnel Insights

Go to your PostHog project and create the following insights:

#### 1. Landing → Signup → User Conversion (Full Funnel)

**Type:** Funnel
**Steps:**
1. `landing_page_viewed`
2. `landing_input_focused`
3. `landing_competitor_url_entered`
4. `landing_competitor_url_submitted`
5. `signup_page_viewed`
6. `signup_form_submitted`
7. `signup_completed`

**Settings:**
- Conversion window: 7 days
- Breakdown by: `$environment`
- Name: "Landing to Active User Conversion (Detailed)"

#### 2. Simplified Landing → Signup Funnel

**Type:** Funnel
**Steps:**
1. `landing_page_viewed`
2. `landing_competitor_url_submitted`
3. `signup_completed`

**Settings:**
- Conversion window: 7 days
- Breakdown by: `$environment`
- Name: "Landing → Signup (Simplified)"

#### 3. Landing Page Views Over Time

**Type:** Trend
**Event:** `landing_page_viewed`
**Settings:**
- Breakdown by: `$environment`
- Date range: Last 30 days
- Name: "Landing Page Views"

#### 4. Input Engagement Rate

**Type:** Trend
**Events:**
- `landing_input_focused`
- `landing_competitor_url_entered`
- `landing_competitor_url_submitted`

**Formula:** 
- Engagement rate = (landing_competitor_url_submitted / landing_input_focused) * 100

**Settings:**
- Breakdown by: `$environment`
- Name: "Input Engagement Rate"

#### 5. Free Tools Engagement

**Type:** Trend
**Events:**
- `landing_free_tool_clicked`
- `free_tools_page_viewed`
- `free_tool_opened`

**Settings:**
- Breakdown by: `tool_name` or `tool_slug`
- Name: "Free Tools Engagement"

#### 6. CTA Performance

**Type:** Trend
**Event:** `landing_cta_clicked`
**Settings:**
- Breakdown by: `action`
- Name: "CTA Click Performance"

#### 7. Daily Signups by Source

**Type:** Trend
**Event:** `signup_completed`
**Settings:**
- Breakdown by: `$environment`
- Show: Daily active
- Name: "Daily Signups"

### Step 2: Create Dashboard

1. Go to **Dashboards** in PostHog
2. Click **New Dashboard**
3. Name it: "Landing Page Conversion Funnel"
4. Add all the insights created above
5. Arrange them in a logical order

### Suggested Dashboard Layout

```
Row 1: Key Metrics
┌─────────────────────────────────────────────────────────┐
│ Landing to Active User Conversion (Detailed)            │
│ [Full 7-step funnel visualization]                      │
└─────────────────────────────────────────────────────────┘

Row 2: Simplified View
┌───────────────────────────────┬─────────────────────────┐
│ Landing → Signup (Simplified) │ Daily Signups           │
│ [3-step funnel]               │ [Trend chart]           │
└───────────────────────────────┴─────────────────────────┘

Row 3: Engagement Metrics
┌───────────────────────────────┬─────────────────────────┐
│ Landing Page Views            │ Input Engagement Rate   │
│ [Trend over time]             │ [% conversion]          │
└───────────────────────────────┴─────────────────────────┘

Row 4: Features & Tools
┌───────────────────────────────┬─────────────────────────┐
│ Free Tools Engagement         │ CTA Click Performance   │
│ [Tool breakdown]              │ [Action breakdown]      │
└───────────────────────────────┴─────────────────────────┘
```

## 🎨 Filtering by Environment

All insights support filtering by environment:

1. In any insight, click **Add filter**
2. Select **$environment**
3. Choose: `dev`, `stg`, or `prd`

This allows you to:
- Compare conversion rates across environments
- Isolate production data
- Monitor staging before deploying to production
- Debug issues in development

## 🔍 Key Metrics to Monitor

### Overall Conversion Rate
- **Landing page → Signup**: % of visitors who complete signup
- **Input → Submit**: % of users who focus input that submit URL
- **Signup view → Complete**: % of signup page viewers who complete

### Engagement Signals
- **Input focus rate**: % of landing page viewers who interact with input
- **URL entry rate**: % of focused users who enter meaningful text
- **Free tool clicks**: Which tools are most appealing from landing page

### Drop-off Points
- Between landing page view and input focus
- Between input focus and URL submission
- Between signup page view and form submission

## 📈 Sample Queries

### Find conversion rates by environment
```sql
SELECT 
  $environment,
  COUNT(DISTINCT person_id) as total_visitors,
  COUNT(DISTINCT IF(event = 'signup_completed', person_id, NULL)) as signups,
  (signups / total_visitors * 100) as conversion_rate
FROM events
WHERE event IN ('landing_page_viewed', 'signup_completed')
GROUP BY $environment
```

### Track time to conversion
```sql
SELECT
  $environment,
  AVG(TIMESTAMPDIFF(SECOND, 
    MIN(IF(event = 'landing_page_viewed', timestamp, NULL)),
    MAX(IF(event = 'signup_completed', timestamp, NULL))
  )) / 60 as avg_minutes_to_convert
FROM events
WHERE event IN ('landing_page_viewed', 'signup_completed')
GROUP BY person_id, $environment
```

## 🚀 Next Steps

1. **Set environment variables** in your Doppler configs:
   ```bash
   # Staging
   NEXT_PUBLIC_ENVIRONMENT=stg
   
   # Production  
   NEXT_PUBLIC_ENVIRONMENT=prd
   ```

2. **Deploy to staging** first to test tracking

3. **Verify events** are coming through in PostHog

4. **Create the dashboard** using the instructions above

5. **Set up alerts** for:
   - Conversion rate drops below threshold
   - Spike in errors on landing page
   - Zero signups for extended period

6. **Monitor for 48 hours** to establish baseline metrics

7. **Iterate on insights** based on what you learn

## 💡 Pro Tips

- Use the environment filter to compare stg vs prd performance
- Create cohorts based on `has_competitor_url` to track qualified leads
- Set up retention analysis to see if users from landing page stick around
- Use session recordings filtered by funnel drop-off points to see what went wrong
- Track `$referrer` property to understand traffic sources

## 🐛 Troubleshooting

### Events not showing up
- Check PostHog is initialized: Look for `posthog` in browser console
- Verify `NEXT_PUBLIC_POSTHOG_KEY` is set correctly
- Check browser network tab for requests to `/ingest/`
- Ensure environment variables are available in browser (start with `NEXT_PUBLIC_`)

### Wrong environment showing
- Verify `NEXT_PUBLIC_ENVIRONMENT` or `DOPPLER_ENVIRONMENT` is set
- Check the value in PostHog's event properties
- Restart dev server after changing env vars

### Funnel not converting
- Check all event names match exactly
- Verify conversion window (7 days) is long enough
- Ensure user identity is consistent across events

## 📚 Additional Resources

- [PostHog Funnels Documentation](https://posthog.com/docs/user-guides/funnels)
- [PostHog Trends Documentation](https://posthog.com/docs/user-guides/trends)
- [PostHog Cohorts Documentation](https://posthog.com/docs/user-guides/cohorts)
- [Environment-based Filtering](https://posthog.com/docs/user-guides/properties)
