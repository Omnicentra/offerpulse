/**
 * Keyword targeting map - single source of truth for SEO strategy
 * Maps keywords to pages and tracks intent/priority
 */

export interface KeywordCluster {
  id: string;
  primaryKeyword: string;
  synonyms: string[];
  longTail: string[];
  intent: "buy" | "compare" | "learn" | "free-tool";
  pagesToTarget: string[];
}

export interface CompetitorTarget {
  name: string;
  slug: string;
  category: "price-monitoring" | "general-monitoring" | "analytics";
}

// Core buy-intent clusters
export const PRIMARY_CLUSTERS: KeywordCluster[] = [
  {
    id: "competitor-offer-monitoring",
    primaryKeyword: "competitor offer monitoring",
    synonyms: [
      "competitor offer tracker",
      "competitor promo tracker",
      "competitor promotion tracker",
      "promotion monitoring software",
      "competitor promotions tracking",
    ],
    longTail: [
      "competitor offer monitoring for shopify",
      "track competitor offers automatically",
      "monitor competitor promotions",
    ],
    intent: "buy",
    pagesToTarget: ["/", "/solutions/competitor-offer-monitoring"],
  },
  {
    id: "shopify-competitor-monitoring",
    primaryKeyword: "shopify competitor monitoring",
    synonyms: [
      "shopify competitor analysis tool",
      "shopify competitive intelligence",
      "shopify competitor tracking",
    ],
    longTail: [
      "competitor monitoring for shopify stores",
      "shopify competitor price tracking",
      "track shopify competitors",
    ],
    intent: "buy",
    pagesToTarget: ["/", "/solutions/shopify-competitor-monitoring"],
  },
  {
    id: "free-shipping-threshold-tracking",
    primaryKeyword: "free shipping threshold tracker",
    synonyms: [
      "track competitor free shipping",
      "competitor shipping monitoring",
      "shipping threshold tracker",
    ],
    longTail: [
      "monitor competitor free shipping thresholds",
      "track when competitors change shipping",
    ],
    intent: "buy",
    pagesToTarget: ["/solutions/free-shipping-threshold-monitoring", "/free-tools/free-shipping-threshold"],
  },
  {
    id: "discount-code-tracking",
    primaryKeyword: "competitor discount code tracker",
    synonyms: [
      "track competitor discounts",
      "discount monitoring tool",
      "competitor promo code tracker",
    ],
    longTail: [
      "track competitor discount codes",
      "monitor competitor promotions and codes",
    ],
    intent: "buy",
    pagesToTarget: ["/solutions/discount-code-monitoring", "/free-tools/discount-detector"],
  },
  {
    id: "bundle-offer-tracking",
    primaryKeyword: "bundle offer tracker",
    synonyms: [
      "track competitor bundles",
      "bundle monitoring tool",
      "competitor bundle tracker",
    ],
    longTail: [
      "monitor competitor bundle deals",
      "track bogo offers competitors",
    ],
    intent: "buy",
    pagesToTarget: ["/solutions/bundle-offer-monitoring", "/free-tools/bundle-ideas"],
  },
  {
    id: "cart-incentive-tracking",
    primaryKeyword: "cart incentive tracker",
    synonyms: [
      "track competitor cart incentives",
      "cart progress bar monitoring",
    ],
    longTail: [
      "monitor competitor aov tactics",
      "track competitor cart unlocks",
    ],
    intent: "buy",
    pagesToTarget: ["/solutions/cart-incentive-monitoring", "/free-tools/cart-incentives"],
  },
];

// Free tool intent keywords
export const FREE_TOOL_KEYWORDS = [
  "free competitor offer audit",
  "competitor offer snapshot",
  "free competitor promotion checker",
  "free free-shipping threshold checker",
  "free discount code finder",
  "bundle checker",
  "cart incentive checker",
];

// Competitor comparison targets
export const COMPETITOR_TARGETS: CompetitorTarget[] = [
  { name: "Prisync", slug: "prisync", category: "price-monitoring" },
  { name: "Price2Spy", slug: "price2spy", category: "price-monitoring" },
  { name: "Visualping", slug: "visualping", category: "general-monitoring" },
  { name: "Wiser", slug: "wiser", category: "price-monitoring" },
  { name: "Competera", slug: "competera", category: "price-monitoring" },
  { name: "Intelligence Node", slug: "intelligence-node", category: "analytics" },
];

// Common question queries for FAQ optimization
export const QUESTION_QUERIES = [
  "how do i track competitor prices",
  "how to monitor competitor promotions",
  "how to track competitor free shipping",
  "what is competitor offer monitoring",
  "how to track competitor discounts on shopify",
  "how often should i check competitor prices",
  "best way to track competitor promos",
  "how to get alerted when competitors change prices",
  "competitor monitoring for small business",
  "free competitor tracking tools",
];

// Solution page configurations
export const SOLUTION_PAGES = [
  {
    slug: "competitor-offer-monitoring",
    title: "Competitor Offer Monitoring",
    h1: "Automatic Competitor Offer Monitoring for Shopify Stores",
    metaTitle: "Competitor Offer Monitoring & Alerts | OfferPulse",
    metaDescription:
      "Track competitor offers automatically. Get instant alerts when they change discounts, bundles, shipping, or cart incentives. Built for Shopify stores.",
    keywords: ["competitor offer monitoring", "competitor offer tracker", "competitor promo tracker"],
    relatedTools: ["offer-snapshot", "monitoring-planner"],
    relatedBlogPosts: ["monitor-competitor-promos-without-spreadsheets"],
  },
  {
    slug: "shopify-competitor-monitoring",
    title: "Shopify Competitor Monitoring",
    h1: "Competitor Monitoring for Shopify Stores",
    metaTitle: "Shopify Competitor Monitoring Tool | OfferPulse",
    metaDescription:
      "Monitor Shopify competitor offers, promotions, and pricing automatically. Real-time alerts when competitors change their strategies.",
    keywords: ["shopify competitor monitoring", "shopify competitor analysis", "shopify competitive intelligence"],
    relatedTools: ["offer-snapshot", "discount-detector"],
    relatedBlogPosts: ["monitor-competitor-promos-without-spreadsheets"],
  },
  {
    slug: "free-shipping-threshold-monitoring",
    title: "Free Shipping Threshold Monitoring",
    h1: "Track Competitor Free Shipping Thresholds Automatically",
    metaTitle: "Free Shipping Threshold Monitoring | OfferPulse",
    metaDescription:
      "Monitor competitor free shipping requirements and get alerted when they change. Optimise your own threshold to stay competitive.",
    keywords: ["free shipping threshold tracker", "track competitor shipping", "shipping monitoring"],
    relatedTools: ["free-shipping-threshold", "cart-incentives"],
    relatedBlogPosts: ["free-shipping-thresholds-shopify-benchmarks"],
  },
  {
    slug: "discount-code-monitoring",
    title: "Discount Code Monitoring",
    h1: "Monitor Competitor Discount Codes & Promotions",
    metaTitle: "Competitor Discount Code Monitoring | OfferPulse",
    metaDescription:
      "Track competitor discount codes, promotional offers, and percentage discounts automatically. Never miss a competitor sale.",
    keywords: ["discount code tracker", "track competitor discounts", "promotion monitoring"],
    relatedTools: ["discount-detector", "offer-snapshot"],
    relatedBlogPosts: ["monitor-competitor-promos-without-spreadsheets"],
  },
  {
    slug: "bundle-offer-monitoring",
    title: "Bundle Offer Monitoring",
    h1: "Track Competitor Bundle Offers & Multi-Buy Deals",
    metaTitle: "Bundle Offer Monitoring for Ecommerce | OfferPulse",
    metaDescription:
      "Monitor competitor bundle offers, BOGO deals, and multi-buy promotions. Get alerts when they launch new bundle strategies.",
    keywords: ["bundle offer tracker", "track competitor bundles", "bogo monitoring"],
    relatedTools: ["bundle-ideas", "offer-snapshot"],
    relatedBlogPosts: ["bundles-vs-discounts-protecting-margin"],
  },
  {
    slug: "cart-incentive-monitoring",
    title: "Cart Incentive Monitoring",
    h1: "Monitor Competitor Cart Incentives & AOV Tactics",
    metaTitle: "Cart Incentive Monitoring Tool | OfferPulse",
    metaDescription:
      "Track competitor cart progress bars, unlock thresholds, and gift-with-purchase offers. Optimise your own AOV strategy.",
    keywords: ["cart incentive tracker", "aov monitoring", "cart unlock tracker"],
    relatedTools: ["cart-incentives", "free-shipping-threshold"],
    relatedBlogPosts: ["free-shipping-thresholds-shopify-benchmarks"],
  },
];

export function getSolutionBySlug(slug: string) {
  return SOLUTION_PAGES.find((s) => s.slug === slug) || null;
}

export function getAllSolutionSlugs(): string[] {
  return SOLUTION_PAGES.map((s) => s.slug);
}

export function getCompetitorBySlug(slug: string) {
  return COMPETITOR_TARGETS.find((c) => c.slug === slug) || null;
}

export function getAllCompetitorSlugs(): string[] {
  return COMPETITOR_TARGETS.map((c) => c.slug);
}
