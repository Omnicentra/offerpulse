# Landing Page CTA Tracking Summary

**Date**: February 18, 2026  
**Page**: Marketing Landing Page (`apps/marketing/app/(marketing)/page.tsx`)  
**Event**: `landing_cta_clicked`  
**Dashboard Chart**: CTA Click Performance

## Overview

All CTAs (Call-To-Action buttons/links) on the landing page now track `landing_cta_clicked` events with detailed properties for granular analysis in PostHog.

## Complete CTA Tracking List

### 1. Snapshot Result Overlay CTAs

#### Start Free Trial Button
**Location**: `page.tsx` lines 208-226  
**Trigger**: After user submits competitor URL and sees snapshot result  
**Properties**:
```typescript
{
  source: "snapshot_result",
  action: "start_trial",
  competitor_url: string // The URL user submitted
}
```

#### View Pricing Button
**Location**: `page.tsx` lines 227-241  
**Trigger**: After user submits competitor URL and sees snapshot result  
**Properties**:
```typescript
{
  source: "snapshot_result",
  action: "view_pricing",
  competitor_url: string // The URL user submitted
}
```

---

### 2. How It Works Section

#### Learn More Button
**Location**: `page.tsx` lines 451-466  
**Destination**: `/how-it-works`  
**Properties**:
```typescript
{
  source: "how_it_works_section",
  action: "learn_more",
  destination: "/how-it-works"
}
```

---

### 3. Pricing Preview Section

#### Pricing Card CTAs (3 cards: Starter, Growth, Pro)
**Location**: `pricing-cards.tsx` lines 135-142  
**Trigger**: User clicks "Start free trial" or "Get started" on any pricing card  
**Properties**:
```typescript
{
  source: "pricing_cards",
  action: "select_plan",
  plan_name: string, // "Starter" | "Growth" | "Pro"
  billing_period: "monthly" | "annual",
  price: number // Monthly price
}
```

#### View Full Pricing Details Button
**Location**: `page.tsx` lines 575-593  
**Destination**: `/pricing`  
**Properties**:
```typescript
{
  source: "pricing_preview_section",
  action: "view_full_pricing",
  destination: "/pricing"
}
```

---

### 4. FAQ Section

#### View All FAQs Button
**Location**: `page.tsx` lines 607-625  
**Destination**: `/faq`  
**Properties**:
```typescript
{
  source: "faq_section",
  action: "view_all_faqs",
  destination: "/faq"
}
```

---

### 5. Bottom CTA Section

#### Primary CTA Button
**Location**: `cta-section.tsx` lines 54-58  
**Default**: "Start your free trial" → `/snapshot`  
**Properties**:
```typescript
{
  source: "cta_section",
  action: "primary_cta",
  cta_text: string, // "Start your free trial" (customizable)
  destination: string // "/snapshot" (customizable)
}
```
**Note**: Also tracks legacy `cta_signup_clicked` event for backward compatibility

#### Secondary CTA Button
**Location**: `cta-section.tsx` lines 60-62  
**Default**: "View pricing" → `/pricing`  
**Properties**:
```typescript
{
  source: "cta_section",
  action: "secondary_cta",
  cta_text: string, // "View pricing" (customizable)
  destination: string // "/pricing" (customizable)
}
```

---

## Additional Landing Page Events (Not CTAs)

These events are tracked but are NOT CTAs:

### Hook Cards - Free Tools
**Location**: `page.tsx` lines 659-679  
**Event**: `landing_free_tool_clicked` (different event name)  
**Count**: 6 cards
**Properties**:
```typescript
{
  tool_link: string, // e.g., "/free-tools/offer-snapshot"
  hook_text: string  // The card's hook text
}
```

---

## PostHog Dashboard Compatibility

### CTA Click Performance Chart

**Event Tracked**: `landing_cta_clicked`  
**Breakdown By**: `action` property  
**Time Range**: Last 30 days  
**Display**: Bar chart showing count by action type

**Expected Actions in Chart**:
- `start_trial` (from snapshot result)
- `view_pricing` (from snapshot result & CTA section)
- `learn_more` (from how it works section)
- `select_plan` (from pricing cards)
- `view_full_pricing` (from pricing preview)
- `view_all_faqs` (from FAQ section)
- `primary_cta` (from bottom CTA section)
- `secondary_cta` (from bottom CTA section)

---

## Implementation Notes

### 1. Consistent Event Naming
All CTAs use the same event name (`landing_cta_clicked`) with different properties to distinguish them. This allows for:
- Single funnel/chart for all landing page CTAs
- Easy filtering by source, action, or destination
- Consistent analytics across the landing page

### 2. Property Structure
All events include:
- **source**: Where on the page the CTA is located
- **action**: What type of action the CTA represents
- **destination** (optional): Where the CTA links to
- Additional context (e.g., `plan_name`, `competitor_url`, `price`)

### 3. Backward Compatibility
Some CTAs maintain legacy event tracking:
- `cta_signup_clicked` - Still tracked alongside `landing_cta_clicked`
- `pricing_plan_selected` - Still tracked for pricing card clicks

---

## Testing Checklist

To verify all tracking is working:

1. **Load landing page** → Check console for `landing_page_viewed`
2. **Submit competitor URL** → Click "Start free trial" → Verify `landing_cta_clicked` with `action: "start_trial"`
3. **Submit competitor URL** → Click "View pricing" → Verify `landing_cta_clicked` with `action: "view_pricing"`
4. **Scroll to How It Works** → Click "Learn more" → Verify `landing_cta_clicked` with `action: "learn_more"`
5. **Scroll to Pricing** → Click any pricing card → Verify `landing_cta_clicked` with `action: "select_plan"`
6. **In Pricing section** → Click "View full pricing details" → Verify `landing_cta_clicked` with `action: "view_full_pricing"`
7. **Scroll to FAQ** → Click "View all FAQs" → Verify `landing_cta_clicked` with `action: "view_all_faqs"`
8. **Scroll to bottom** → Click primary CTA → Verify `landing_cta_clicked` with `action: "primary_cta"`
9. **Scroll to bottom** → Click secondary CTA → Verify `landing_cta_clicked` with `action: "secondary_cta"`

---

## PostHog Query Example

To see all CTA clicks in PostHog:

```sql
SELECT 
  properties.source,
  properties.action,
  properties.destination,
  COUNT(*) as clicks
FROM events
WHERE event = 'landing_cta_clicked'
  AND timestamp >= now() - interval '30 days'
GROUP BY 
  properties.source,
  properties.action,
  properties.destination
ORDER BY clicks DESC
```

---

## Summary

✅ **8 unique CTA types** now tracked  
✅ **10+ individual CTAs** with tracking (including 3 pricing cards)  
✅ **Consistent event structure** across all CTAs  
✅ **Granular properties** for detailed analysis  
✅ **Backward compatible** with existing events  
✅ **Dashboard ready** for CTA Click Performance chart

All CTAs on the landing page are now comprehensively tracked and compatible with the PostHog "CTA Click Performance" dashboard chart.
