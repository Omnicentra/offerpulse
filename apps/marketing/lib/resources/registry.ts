/**
 * Content resources registry
 * Defines all articles, guides, and educational content
 */

export type ResourceType = "teardown" | "guide" | "playbook" | "case-study" | "swipe-file";

export interface Resource {
  slug: string;
  title: string;
  description: string;
  type: ResourceType;
  topic: string; // Topic slug
  publishedAt: string;
  updatedAt: string;
  readingTime: number; // minutes
  author: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  relatedTools: string[];
  relatedResources: string[];
  content: string; // Markdown content
  keyTakeaways: string[];
}

export const resources: Resource[] = [
  {
    slug: "competitive-monitoring-101",
    title: "Competitive Monitoring 101: What to Track and Why",
    description:
      "A practical guide to setting up competitor monitoring for your Shopify store. Learn which metrics matter and how to respond to changes.",
    type: "guide",
    topic: "competitor-tracking",
    publishedAt: "2026-01-15",
    updatedAt: "2026-02-01",
    readingTime: 8,
    author: "OfferPulse Team",
    metaTitle: "Competitive Monitoring Guide for Shopify | OfferPulse",
    metaDescription:
      "Learn how to monitor competitors effectively. What to track, tools to use, and how to respond to competitive changes. Practical guide for Shopify merchants.",
    keywords: [
      "competitor monitoring",
      "competitive intelligence",
      "shopify competitors",
      "price tracking",
    ],
    relatedTools: ["offer-snapshot", "monitoring-planner"],
    relatedResources: ["offer-teardown-guide"],
    keyTakeaways: [
      "Track 3-5 direct competitors max to stay focused",
      "Monitor offers (shipping, discounts, bundles) over pricing",
      "Set up weekly checks minimum, daily for fast-moving categories",
      "React strategically: not every change needs a response",
    ],
    content: `# Introduction

Competitive monitoring isn't about copying everything your competitors do. It's about staying informed so you can make strategic decisions quickly when it matters.

## What to Track

**Prioritise offers over pricing:**
- Free shipping thresholds
- Discount promotions (%, fixed amount, codes)
- Bundle offers
- Cart incentives
- Gift with purchase

**Why offers matter more than price:**
Price changes are noisy and often temporary. Offer structure changes signal strategic shifts and directly impact how customers compare value.

## How Often to Check

- **Fashion/Seasonal**: Daily during peak seasons
- **Stable Categories**: Weekly
- **Fast-moving/Flash Sales**: Multiple times daily

## Strategic Response Framework

Not every competitor move deserves a response. Ask:
1. Is this a real strategic change or a test?
2. Does this affect our positioning?
3. Can we counter without eroding margins?

Use the [Offer Snapshot tool](/free-tools/offer-snapshot) to quickly check competitors and the [Monitoring Planner](/free-tools/monitoring-planner) to build your tracking schedule.
`,
  },
  {
    slug: "offer-teardown-guide",
    title: "How to Analyse Competitor Offers (Teardown Framework)",
    description:
      "Step-by-step framework for deconstructing competitor promotions to understand strategy, positioning, and tactical execution.",
    type: "teardown",
    topic: "competitor-tracking",
    publishedAt: "2026-01-20",
    updatedAt: "2026-01-20",
    readingTime: 10,
    author: "OfferPulse Team",
    metaTitle: "Competitor Offer Teardown Framework | OfferPulse",
    metaDescription:
      "Learn how to analyse and deconstruct competitor promotions. Strategic teardown framework for understanding promotional tactics and positioning.",
    keywords: ["offer analysis", "competitor teardown", "promotional strategy", "ecommerce tactics"],
    relatedTools: ["offer-snapshot", "discount-detector"],
    relatedResources: ["competitive-monitoring-101"],
    keyTakeaways: [
      "Analyse offer structure, not just the headline discount",
      "Look for threshold psychology (£49 vs £50)",
      "Identify urgency tactics (scarcity, countdown, limited time)",
      "Map offer types to business goals (acquisition vs AOV vs clearance)",
    ],
    content: `# The Teardown Framework

When you see a competitor offer, don't just note "20% off". Deconstruct it:

## 1. Offer Mechanics
- What's the actual value? (%, fixed, bundle, gift)
- Are there conditions? (minimum spend, specific products, first order)
- What's the trigger? (code, automatic, cart threshold)

## 2. Positioning & Messaging
- Where is it displayed? (banner, popup, cart)
- What's the urgency language? ("Limited time", "While stocks last")
- What's the CTA copy?

## 3. Strategic Intent
- **Acquisition**: New customer discounts, first order offers
- **AOV**: Spend thresholds, bundles, free shipping tiers
- **Clearance**: Seasonal sales, stock clearance, end-of-line
- **Retention**: Loyalty codes, member-exclusive

## 4. Competitive Context
- Is this aggressive or defensive?
- How does it compare to their usual offers?
- What customer segment are they targeting?

Use the [Discount Detector](/free-tools/discount-detector) to extract offer details automatically.
`,
  },
  {
    slug: "cart-incentive-playbook",
    title: "Cart Incentive Playbook: 12 Proven Tactics to Increase AOV",
    description:
      "Practical playbook of cart incentive strategies with implementation guidance, expected lift, and when to use each tactic.",
    type: "playbook",
    topic: "aov-optimisation",
    publishedAt: "2026-01-25",
    updatedAt: "2026-01-25",
    readingTime: 12,
    author: "OfferPulse Team",
    metaTitle: "Cart Incentive Playbook: 12 Tactics to Increase AOV | OfferPulse",
    metaDescription:
      "Proven cart incentive strategies to boost average order value. Free shipping thresholds, progress bars, gift unlocks, and more. Practical AOV playbook.",
    keywords: ["cart incentives", "aov optimisation", "average order value", "shopify aov"],
    relatedTools: ["cart-incentives", "bundle-ideas"],
    relatedResources: ["bundle-offer-playbook"],
    keyTakeaways: [
      "Progress bars increase AOV by 15-25% on average",
      "Free shipping threshold is the #1 lever for most stores",
      "Gift unlock works better than discount unlock for premium brands",
      "Test threshold placement: £49 often outperforms £50",
    ],
    content: `# 12 Cart Incentive Tactics

## Tier 1: Proven Winners

### 1. Free Shipping Threshold
**What**: "Free shipping on orders over £X"
**Expected AOV lift**: 15-20%
**Best for**: All stores
**Set threshold**: 20-30% above current AOV

### 2. Progress Bar
**What**: Visual cart progress showing "£15 away from free shipping"
**Expected AOV lift**: 10-15%
**Best for**: Stores with clear shipping threshold
**Implementation**: Cart sidebar or header

### 3. Gift with Purchase
**What**: "Free gift when you spend £X"
**Expected AOV lift**: 12-18%
**Best for**: Beauty, lifestyle, premium brands

## Tier 2: Advanced Tactics

### 4. Tiered Incentives
**What**: "Spend £50: Free shipping | £75: Free gift | £100: Free express"
**Expected AOV lift**: 20-30%
**Best for**: Established brands with strong AOV

Analyse your competitors' cart incentives using the [Cart Incentive Analyser](/free-tools/cart-incentives).
`,
  },
];

export function getResourceBySlug(slug: string): Resource | null {
  return resources.find((r) => r.slug === slug) || null;
}

export function getResourcesByType(type: ResourceType): Resource[] {
  return resources.filter((r) => r.type === type);
}

export function getResourcesByTopic(topic: string): Resource[] {
  return resources.filter((r) => r.topic === topic);
}

export function getAllResourceSlugs(): string[] {
  return resources.map((r) => r.slug);
}
