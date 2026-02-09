/**
 * Topic clusters for content organisation and SEO
 */

export interface Topic {
  slug: string;
  name: string;
  description: string;
  metaTitle: string;
  metaDescription: string;
  relatedTools: string[];
  relatedResources: string[];
}

export const topics: Topic[] = [
  {
    slug: "competitor-tracking",
    name: "Competitor Offer Tracking",
    description:
      "Monitor competitor promotions, pricing, and offers. Learn how to track changes, detect patterns, and respond strategically to competitive moves.",
    metaTitle: "Competitor Offer Tracking Guide & Tools | OfferPulse",
    metaDescription:
      "Complete guide to tracking competitor offers, promotions, and pricing. Free tools, strategies, and best practices for ecommerce competitive intelligence.",
    relatedTools: ["offer-snapshot", "discount-detector", "free-shipping-threshold", "change-feed"],
    relatedResources: ["competitive-monitoring-101", "offer-teardown-guide"],
  },
  {
    slug: "conversion-optimisation",
    name: "Offer & Conversion Optimisation",
    description:
      "Improve how you present offers to increase conversion rates. Learn clarity best practices, urgency tactics, and positioning strategies.",
    metaTitle: "Offer Optimisation & Conversion Tips | OfferPulse",
    metaDescription:
      "Optimise your ecommerce offers for higher conversion. Clarity tactics, positioning strategies, and urgency best practices from OfferPulse.",
    relatedTools: ["offer-clarity-check"],
    relatedResources: ["offer-clarity-guide"],
  },
  {
    slug: "aov-optimisation",
    name: "Average Order Value (AOV) Optimisation",
    description:
      "Strategies and tools to increase your average order value through cart incentives, bundles, thresholds, and upsells.",
    metaTitle: "AOV Optimisation Strategies & Tools | OfferPulse",
    metaDescription:
      "Increase average order value with proven cart incentive strategies. Bundle offers, thresholds, and upsell tactics for Shopify stores.",
    relatedTools: ["cart-incentives", "bundle-ideas"],
    relatedResources: ["cart-incentive-playbook", "bundle-offer-playbook"],
  },
  {
    slug: "promotional-planning",
    name: "Promotional Planning & Calendars",
    description:
      "Plan your promotional calendar, seasonal campaigns, and offer launches. Templates, timelines, and coordination strategies.",
    metaTitle: "Promotional Planning Tools & Templates | OfferPulse",
    metaDescription:
      "Plan your ecommerce promotional calendar. Seasonal templates, offer ideas, and campaign coordination tools for online stores.",
    relatedTools: ["promo-calendar", "bundle-ideas", "monitoring-planner"],
    relatedResources: ["seasonal-promo-guide"],
  },
  {
    slug: "competitive-strategy",
    name: "Competitive Strategy & Positioning",
    description:
      "Learn when to match competitors, when to counter, and when to ignore. Strategic frameworks for competitive response.",
    metaTitle: "Competitive Strategy for Ecommerce | OfferPulse",
    metaDescription:
      "Master competitive strategy for ecommerce. Learn when to match, counter, or ignore competitor moves. Strategic frameworks and decision tools.",
    relatedTools: ["match-recommendations", "offer-snapshot"],
    relatedResources: ["match-vs-counter-guide", "competitive-positioning"],
  },
];

export function getTopicBySlug(slug: string): Topic | null {
  return topics.find((t) => t.slug === slug) || null;
}

export function getAllTopicSlugs(): string[] {
  return topics.map((t) => t.slug);
}
