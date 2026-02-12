/**
 * Blog post registry with full content
 * Each post is 900-1200 words for 5-minute reading
 */

export interface BlogPost {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  category: "Strategy" | "Research" | "Analysis";
  publishedAt: string;
  updatedAt: string;
  readingTime: number;
  author: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  featuredImage: string; // Path to image in /public
  relatedTools: string[];
  content: string; // Markdown content
  faqs: Array<{ question: string; answer: string }>;
}

export const blogPosts: BlogPost[] = [
  {
    slug: "monitor-competitor-promos-without-spreadsheets",
    title: "How to Monitor Competitor Promos Without Spreadsheets",
    subtitle: "Stop manually tracking competitor offers. Here's a better system.",
    description:
      "Most Shopify sellers track competitors using spreadsheets. Here's why that doesn't scale and what to do instead.",
    category: "Strategy",
    publishedAt: "2026-01-15",
    updatedAt: "2026-02-01",
    readingTime: 5,
    author: "OfferPulse Team",
    metaTitle: "How to Monitor Competitor Promos Without Spreadsheets | OfferPulse",
    metaDescription:
      "Stop using spreadsheets to track competitor offers. Learn a systematic approach to monitoring Shopify competitor promotions, discounts, and shipping thresholds.",
    keywords: [
      "competitor monitoring",
      "shopify competition",
      "promotional tracking",
      "ecommerce strategy",
    ],
    featuredImage: "/blog/monitor-competitor-promos.png",
    relatedTools: ["offer-snapshot", "monitoring-planner", "change-feed"],
    content: `
## The Spreadsheet Problem

Most Shopify store owners I speak with track competitors the same way: they create a spreadsheet, add competitor URLs, and manually check each store once a week (or when they remember). They note down any promotions they see, compare to last week, and try to spot patterns.

This breaks down fast. Here's why:

**Manual checking doesn't scale.** Checking five competitors takes 20-30 minutes. You only catch changes on the day you check—if a competitor launched a flash sale on Tuesday and you check on Friday, you've already missed the opportunity window.

**Spreadsheets become stale.** After a few weeks of inconsistent updates, your data has gaps. You forget what their previous offer was, so you can't tell if "20% off" is new or ongoing. You can't confidently identify trends.

**You miss the context.** A spreadsheet tells you they're offering free shipping, but not where it's displayed, what the exact threshold is, or what the messaging says. These details matter when deciding whether to match or counter.

## A Better System

Instead of manual spreadsheet tracking, you need three things:

### 1. Consistent Capture Schedule

Set specific times to check competitors. Not "when you remember", but actual calendar blocks. For most categories, checking Monday and Thursday is sufficient. For fast-moving categories (fashion, electronics during sales periods), daily checks work better.

The key is consistency. If you check every Monday at 10 AM, you build a reliable baseline. You know if something changed between Monday and the previous Monday.

### 2. Structured Evidence Collection

Don't just write "20% off sale". Capture:
- Exact offer text (e.g., "20% OFF SITEWIDE")
- Location (banner, popup, product page)
- Code if applicable (SAVE20)
- Start/end dates if visible
- Additional context (minimum spend, exclusions)

This structured approach lets you compare offers properly. You can spot patterns like "they run 20% off every third Monday" or "their threshold is always £15 below ours".

If you want to see what offers a competitor is running right now, [generate a free snapshot](/free-tools/offer-snapshot) to extract all visible promotional details automatically.

### 3. Decision Framework

Collecting data isn't useful unless you act on it. For each change you detect, ask:

**Is this strategic or tactical?** A one-day flash sale is tactical. Permanently dropping their free shipping threshold from £75 to £50 is strategic.

**Does this affect our positioning?** If a competitor in a different price segment changes their offer, it may not matter to your customers. If your closest competitor makes a move, it likely does.

**Can we respond without eroding margin?** Matching every discount isn't sustainable. Sometimes the right move is to counter with a different offer type (bundle instead of discount, gift instead of free shipping).

Use the [offer clarity checker](/free-tools/offer-clarity-check) to see if your current offers are competitive and clearly presented.

## Practical Implementation

Here's a system that works without spreadsheets:

**Week 1: Set Up Baseline**
1. List your 3-5 closest competitors
2. Capture their current state using the [competitor offer snapshot tool](/free-tools/offer-snapshot)
3. Note what offers they're running and where

**Ongoing: Regular Checks**
1. Monday morning: Check all competitors
2. Thursday afternoon: Check all competitors
3. Note any changes from previous check
4. Flag significant changes for analysis

**Monthly: Review Patterns**
1. What offer types are they using? (discount vs bundle vs threshold)
2. What's their promotional frequency? (always on vs event-driven)
3. How does our positioning compare?
4. What should we test this month?

## What About Automation?

Manual checking with this structure is infinitely better than ad hoc spreadsheet updates. But it still requires discipline and time.

If you're checking 5+ competitors more than twice weekly, or if you need to react within hours (not days), automation makes sense. That's what OfferPulse does—it checks competitors on a schedule you set, detects changes automatically, and alerts you with the before/after details plus suggested responses.

**OfferPulse in 30 seconds:** Automatic monitoring of competitor offers (discounts, bundles, free shipping, cart incentives) with instant alerts when anything changes. Built for Shopify store owners who need to stay competitive without manual checking. [Try the free snapshot tool](/free-tools/offer-snapshot).

## Next Steps Checklist

- [ ] List your 3-5 closest competitors
- [ ] Capture their current offer state using the [snapshot tool](/free-tools/offer-snapshot)
- [ ] Set up recurring calendar blocks for checks (Mon/Thu recommended)
- [ ] After 2 weeks of consistent checks, review for patterns
- [ ] Decide if manual tracking is sustainable or if automation makes sense
`,
    faqs: [
      {
        question: "How often should I check competitors?",
        answer:
          "For most categories, twice weekly (Monday and Thursday) provides good coverage without excessive time investment. Fast-moving categories (fashion during sales, electronics) benefit from daily checks. The key is consistency—checking every Monday is better than checking randomly.",
      },
      {
        question: "Which competitors should I track?",
        answer:
          "Track 3-5 direct competitors maximum. These should be stores targeting the same customer segment, similar price range, and overlapping product categories. Tracking too many competitors creates noise; too few and you miss important signals.",
      },
      {
        question: "What if I miss a competitor change between checks?",
        answer:
          "With manual checking, you'll miss changes that happen and revert between your check schedule. For critical competitors or fast-moving periods, either increase check frequency or use automated monitoring like OfferPulse to detect changes as they happen.",
      },
      {
        question: "Should I match every competitor offer?",
        answer:
          "No. Matching every offer erodes margin and positions you as a follower. Use a framework: match when necessary for defensive positioning, counter with alternative value when possible, and ignore when it doesn't affect your core customer segment.",
      },
    ],
  },
  {
    slug: "free-shipping-thresholds-shopify-benchmarks",
    title: "Free Shipping Thresholds: What Top Shopify Brands Do",
    subtitle: "Data on optimal free shipping thresholds and when to adjust yours",
    description:
      "Analysing free shipping strategies from successful Shopify stores and what threshold actually works for conversion.",
    category: "Research",
    publishedAt: "2026-01-22",
    updatedAt: "2026-01-22",
    readingTime: 5,
    author: "OfferPulse Team",
    metaTitle: "Free Shipping Threshold Benchmarks for Shopify Stores | OfferPulse",
    metaDescription:
      "What free shipping thresholds do successful Shopify stores use? Benchmark data and strategy guide for setting competitive shipping thresholds.",
    keywords: [
      "free shipping threshold",
      "shopify shipping strategy",
      "ecommerce shipping",
      "aov optimisation",
    ],
    featuredImage: "/blog/shipping-thresholds.png",
    relatedTools: ["free-shipping-threshold", "offer-snapshot", "cart-incentives"],
    content: `
## Why Free Shipping Threshold Matters

Free shipping threshold is the single most powerful AOV lever for most ecommerce stores. Set it too low and you erode margin. Set it too high and customers abandon cart or add filler items (which often get returned). Get it right and you increase average order value by 15-25% while maintaining healthy margins.

The threshold also signals positioning. A £25 threshold says "accessible, volume play". A £75 threshold says "premium, considered purchase". Your threshold should align with your brand positioning and category norms.

## Common Threshold Ranges by Category

Based on observable patterns from Shopify stores:

**Fashion & Apparel:** £40-£60 most common. Fast fashion leans toward £35-£45. Premium fashion uses £60-£100.

**Beauty & Cosmetics:** £30-£50 typical. Prestige beauty often £50-£75. Drugstore beauty £25-£35.

**Home & Lifestyle:** £50-£75 common. Larger items justify higher thresholds. Smaller decor items use £35-£50.

**Electronics & Tech:** £50-£100. Higher AOV categories support higher thresholds. Accessories-focused stores use £30-£50.

**Food & Beverage:** £30-£50 typical, but heavy items (bulk orders) use £50-£75 to offset shipping cost.

These aren't rules. They're starting points based on observable behaviour in each category. Your optimal threshold depends on your AOV, margin, shipping costs, and competitive context.

If you want to see what specific competitors in your category are using, the [free shipping threshold finder](/free-tools/free-shipping-threshold) extracts advertised thresholds from any store instantly.

## The Mathematics of Threshold Setting

Here's a simplified approach:

**Start with your current AOV.** If your average order value is £45, a threshold at £45 does nothing (customers already hit it). A threshold at £60 creates a £15 gap—enough to encourage adding another item but not so high it feels unreachable.

**Rule of thumb:** Set threshold 20-30% above current AOV. If AOV is £50, test £60-£65.

**Factor in shipping cost.** If you're absorbing £4.99 shipping on orders over £50, and your margin is 40%, you need roughly £12.50 in additional revenue to break even on shipping (£4.99 / 0.4). So the threshold makes sense if it lifts AOV by £12.50+. A £50 threshold when current AOV is £45 gives you a £5 lift—not enough. But if it moves average cart from £45 to £58, that £13 lift covers the shipping cost and adds margin.

**Monitor competitors.** If you're at £75 and three competitors are at £50, you're likely bleeding customers on the comparison. Either match their £50 or counter with a different value (faster delivery, better returns, free gift) to justify the £75.

## When to Adjust Your Threshold

**Scenario 1: Competitor undercuts significantly**
If a close competitor drops from £75 to £50, and you're at £75, you have three options:
- Match: move to £50 (defensive, protects share)
- Partial match: move to £60 (middle ground)
- Counter: stay at £75 but add "Free gift with orders over £50" (differentiate)

**Scenario 2: Your AOV increases**
If your AOV climbs from £50 to £60 (perhaps due to upsells or higher-ticket products), your £50 threshold is now below AOV. Consider moving to £65-£70 to regain the incentive effect.

**Scenario 3: Margin pressure**
If shipping costs increase or margin tightens, you may need to raise the threshold. Do this gradually (£50 → £55 → £60) rather than a big jump. Monitor cart abandonment rate during the transition.

**Scenario 4: Seasonal**
During peak seasons (Black Friday, Christmas), many stores temporarily lower thresholds (£60 → £40) to capture volume. This can work if the volume increase offsets the margin hit. Revert after the season.

Use the [monitoring planner](/free-tools/monitoring-planner) to create a schedule for checking competitor thresholds and deciding when to adjust.

## Implementation Tips

**Be transparent.** Display the threshold clearly above the fold. "Free shipping on orders over £X" in the header or banner. Hidden thresholds (only shown in cart) frustrate customers.

**Use progress indicators.** In cart, show "£15 away from free shipping" with a visual progress bar. This increases the percentage of customers who add another item to reach threshold.

**Communicate the benefit.** Don't just say "Free shipping over £50". Say "Add £15 more to unlock free delivery" (in cart) or "Free 2-day delivery on orders over £50" (if delivery speed is a benefit).

**Test threshold psychology.** £49 feels significantly lower than £50 to many customers, even though it's £1 difference. Test £49, £55, £59, £65 thresholds—round numbers aren't always optimal.

**OfferPulse in 30 seconds:** OfferPulse monitors competitor shipping thresholds automatically and alerts you when they change, so you can adjust your strategy without manual checking. [See what a competitor's threshold is right now](/free-tools/free-shipping-threshold).

## Next Steps Checklist

- [ ] Calculate your current AOV
- [ ] Check 3-5 competitors' thresholds using the [threshold finder](/free-tools/free-shipping-threshold)
- [ ] Set your threshold at AOV + 20-30%
- [ ] Ensure threshold is displayed above fold
- [ ] Add cart progress indicator
- [ ] Monitor conversion rate for 2 weeks
- [ ] Adjust if cart abandonment increases >5%
`,
    faqs: [
      {
        question: "Should I offer free shipping on all orders?",
        answer:
          "Only if your margins support it or your category demands it (e.g., premium beauty where competitors all offer it). Free shipping on all orders removes a conversion lever (the threshold incentive to add more) and directly reduces margin. Test the impact before committing.",
      },
      {
        question: "What if my AOV is too low for a realistic threshold?",
        answer:
          "If your AOV is £15 and you can't afford free shipping until £40, the gap may be too wide to be effective. Consider alternatives: flat-rate shipping (£2.99), free shipping on specific products/categories, or bundle offers to lift basket size before introducing a threshold.",
      },
      {
        question: "How do I know if my threshold is working?",
        answer:
          "Track two metrics: percentage of orders above threshold (should be 40-60% for optimal threshold) and average basket size for orders that would have been below threshold. If 80% of orders exceed threshold naturally, it's set too low. If only 10% reach it, it's too high to motivate.",
      },
    ],
  },
  {
    slug: "bundles-vs-discounts-protecting-margin",
    title: "Bundles vs Discounts: Protecting Margin While Staying Competitive",
    subtitle: "Why smart brands use bundles to compete without discounting",
    description:
      "Percentage discounts erode margin fast. Here's when to use bundles instead and how to structure them for maximum effect.",
    category: "Analysis",
    publishedAt: "2026-01-28",
    updatedAt: "2026-01-28",
    readingTime: 6,
    author: "OfferPulse Team",
    metaTitle: "Bundles vs Discounts: Margin Protection Strategy | OfferPulse",
    metaDescription:
      "Learn when to use bundle offers instead of percentage discounts. Protect your margins while staying competitive. Strategic guide for Shopify merchants.",
    keywords: [
      "bundle offers",
      "discount strategy",
      "margin protection",
      "ecommerce pricing",
    ],
    featuredImage: "/blog/bundles-vs-discounts.png",
    relatedTools: ["bundle-ideas", "discount-detector", "offer-snapshot"],
    content: `
## The Discount Trap

When a competitor launches "20% off", the instinctive response is to match with your own 20% discount. But percentage discounts directly erode gross margin, and they condition customers to wait for sales.

Here's the maths: if you sell a £100 product with 50% margin (£50 gross profit), a 20% discount (selling at £80) reduces your margin to £30. You've given up 40% of your profit.

To maintain the same total profit, you'd need to sell 67% more units. That's not a small lift. And if competitors are also discounting, you're not gaining share—you're all just shrinking margins together.

There's a better way: structured offers that feel valuable to customers without flatly discounting everything.

## Why Bundles Protect Margin

A bundle offer (e.g., "Buy 2, get 1 free" or "Bundle and save £15") controls what you discount and by how much. Unlike "20% off sitewide", which applies to your best-selling full-price items, bundles let you:

**Control the discount depth.** "Buy 2 get 1 free" is effectively 33% off if customers buy three items. But many buy just two (0% discount) or four (25% average discount). You control the effective discount rate through behaviour.

**Move specific inventory.** Bundles let you pair fast-sellers with slow-sellers. "Buy this hero product, get 50% off this slower SKU" moves inventory strategically. Sitewide discounts don't distinguish.

**Create perceived value without deep discounts.** "Buy 2 save £10" feels specific and valuable. It's not a percentage—customers can't easily calculate if they're getting a better deal than "15% off". But if the items cost £40 each, £10 off £80 is only 12.5%. You've created perceived value while giving less discount.

**Increase basket size naturally.** "Buy 3 for £99" (normally £40 each = £120) encourages larger baskets. The discount is built into volume. Compare this to "20% off" where a customer buys one item for £32 (20% off £40). You've discounted without increasing basket size.

If a competitor is running heavy discounts and you want an alternative strategy, use the [bundle ideas generator](/free-tools/bundle-ideas) to create bundle offers tailored to your product mix and margins.

## Bundle Types and When to Use Each

### Type 1: Multi-Buy (BOGO, Buy 2 Get 1, Buy 3 for £X)

**Best for:** Products with repeat purchase behaviour (consumables, basics, gifts).

**Margin impact:** Moderate. You control depth by setting the quantity requirement.

**Example:** Buy 3 candles for £45 (normally £20 each = £60). Effective discount: 25%.

**When to use:** When customers already buy multiple items, or when you want to move volume during clearance.

### Type 2: Product Pairing (Main + Add-on)

**Best for:** Hero products + accessories, base + extras.

**Margin impact:** Low to moderate. You choose which add-on to discount.

**Example:** Buy any dress, get 30% off matching belt. Or: Buy skincare set, get travel size free.

**When to use:** Cross-sell slower movers, increase attachment rate, create perceived value.

### Type 3: Threshold Bundles (Spend £X, Build Your Bundle)

**Best for:** Gift sets, customisable bundles, higher AOV categories.

**Margin impact:** Controlled. Customer builds bundle, you set the total threshold and effective discount.

**Example:** Build your bundle: Choose 3 items for £75 (individual prices £30 each = £90 value).

**When to use:** When you want structured choice, gift-giving occasions, or need to lift AOV significantly.

## When Discounts Still Make Sense

Bundles aren't always the answer. Flat percentage discounts work better when:

**Acquisition is the goal.** New customer discounts ("15% off your first order") are hard to replicate with bundles. The goal is trial, and a simple discount is clearest.

**Clearance / end-of-season.** If you need to move old stock fast, sitewide or category-level discounts ("30% off winter collection") work better than trying to bundle old stock.

**Matching a major event.** During Black Friday, customer expectation is percentage off. Bundles can work, but percentages are often clearer and more competitive in that context.

**Flash urgency.** 24-hour "20% off flash sale" creates time-bound urgency that's harder to replicate with bundle mechanics.

The key is intentional use. Don't default to percentage discounts just because a competitor does. Consider if a bundle achieves the same goal with less margin erosion.

## Competitive Response Framework

When a competitor launches an offer:

**Step 1: Categorise the offer type**
- Percentage discount?
- Fixed amount off?
- Bundle/multi-buy?
- Threshold (free shipping, free gift)?
- Other?

**Step 2: Assess intent**
- Acquisition (new customer focused)?
- AOV lift (threshold/bundle)?
- Clearance (seasonal/old stock)?
- Defensive (matching another competitor)?

**Step 3: Decide response**
- **Match:** Same offer type and depth
- **Counter:** Different offer type, similar perceived value
- **Ignore:** Not relevant to our positioning
- **Test:** Try their approach as an experiment

Use the [offer snapshot tool](/free-tools/offer-snapshot) to see exactly what offers competitors are running, then use the [match recommendations tool](/free-tools/match-recommendations) to compare your offers and get strategic guidance.

**OfferPulse in 30 seconds:** OfferPulse automatically detects competitor offer changes (discounts, bundles, shipping) and suggests whether to match, counter, or ignore based on your positioning. [Try the free competitor snapshot](/free-tools/offer-snapshot).

## Next Steps Checklist

- [ ] Review your current promotional strategy (discounts vs bundles ratio)
- [ ] Check 3 competitors' offers using the [snapshot tool](/free-tools/offer-snapshot)
- [ ] Calculate your margin impact: current discount strategy vs potential bundles
- [ ] Test one bundle offer against your usual discount (A/B test for 2 weeks)
- [ ] Monitor: revenue, margin %, units per order, cart abandonment
- [ ] Decide: scale the winner or iterate
`,
    faqs: [
      {
        question: "Are bundles harder for customers to understand than simple discounts?",
        answer:
          "Well-structured bundles are easy to understand ('Buy 2 get 1 free' is clear). Overly complex bundles ('Buy 3 from category A and 2 from category B for 15% off') create friction. Keep bundle mechanics simple for best results.",
      },
      {
        question: "Can I run discounts and bundles at the same time?",
        answer:
          "Yes, but be careful with stacking. If you offer '20% off sitewide' and also 'Buy 2 get 1 free', customers may expect both. Clearly state if offers don't stack, or design them for different product sets (discounts on category A, bundles on category B).",
      },
      {
        question: "How do I know which customers prefer bundles vs discounts?",
        answer:
          "Test both and measure not just revenue but also margin per order. Bundles often have lower conversion rates but higher margin and AOV. Discounts convert better but erode margin. The best metric is profit per visitor, not just conversion rate.",
      },
    ],
  },
];

export function getBlogPostBySlug(slug: string): BlogPost | null {
  return blogPosts.find((post) => post.slug === slug) || null;
}

export function getAllBlogPostSlugs(): string[] {
  return blogPosts.map((post) => post.slug);
}

export function getBlogPostsByCategory(category: BlogPost["category"]): BlogPost[] {
  return blogPosts.filter((post) => post.category === category);
}

export function getAllBlogPosts(): BlogPost[] {
  return blogPosts.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}
