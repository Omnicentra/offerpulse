/**
 * Competitor registry for comparison pages
 * Must be truthful and based on publicly available information
 */

export interface Competitor {
  slug: string;
  name: string;
  category: "promo-intelligence" | "price-monitoring" | "website-monitoring";
  positioning: string; // What they focus on
  audience: string; // Who they target
  pricingModel: string;
  strengths: string[];
  limitations: string[];
  bestFor: string[];
  notIdealFor: string[];
  sourceUrls: Array<{ label: string; url: string }>;
  lastUpdated: string;
}

export const COMPETITORS: Competitor[] = [
  {
    slug: "minderest",
    name: "Minderest",
    category: "promo-intelligence",
    positioning: "Enterprise promotional intelligence and competitive pricing platform",
    audience: "Large retailers and brands with complex pricing strategies",
    pricingModel: "Enterprise pricing (demo-based, not publicly listed)",
    strengths: [
      "Comprehensive market data coverage",
      "Advanced analytics and reporting",
      "Enterprise-grade infrastructure",
      "Multi-market support",
    ],
    limitations: [
      "Enterprise pricing (may be costly for SMBs)",
      "Typically requires sales process and demos",
      "May be complex for small teams",
    ],
    bestFor: [
      "Large enterprises with dedicated pricing teams",
      "Multi-market retailers",
      "Brands needing extensive market intelligence",
    ],
    notIdealFor: [
      "Small Shopify stores",
      "Solo operators",
      "Businesses wanting instant self-serve setup",
    ],
    sourceUrls: [
      { label: "Minderest Official Site", url: "https://www.minderest.com" },
    ],
    lastUpdated: "2026-02-10",
  },
  {
    slug: "dataweave",
    name: "DataWeave",
    category: "promo-intelligence",
    positioning: "AI-powered competitive intelligence for enterprise retail",
    audience: "Enterprise retailers and consumer brands",
    pricingModel: "Enterprise (custom pricing)",
    strengths: [
      "AI-powered data extraction",
      "Large-scale competitive monitoring",
      "Detailed market analytics",
      "SKU-level tracking",
    ],
    limitations: [
      "Enterprise-only (not for small businesses)",
      "Complex setup and onboarding",
      "Higher price point",
    ],
    bestFor: [
      "Enterprise retailers",
      "Brands with large SKU catalogs",
      "Teams needing deep competitive analytics",
    ],
    notIdealFor: [
      "Shopify SMBs",
      "Solo store owners",
      "Businesses wanting simple offer monitoring",
    ],
    sourceUrls: [
      { label: "DataWeave Official Site", url: "https://www.dataweave.com" },
    ],
    lastUpdated: "2026-02-10",
  },
  {
    slug: "prisync",
    name: "Prisync",
    category: "price-monitoring",
    positioning: "Price monitoring for ecommerce stores",
    audience: "SMBs and mid-market ecommerce",
    pricingModel: "Subscription-based (from ~$99/mo depending on competitors tracked)",
    strengths: [
      "Shopify app integration",
      "Dynamic pricing rules",
      "Competitor price tracking",
      "Historical price data",
    ],
    limitations: [
      "Focuses on price, not promotional offers",
      "Doesn't track free shipping thresholds or bundles",
      "Limited promo structure detection",
    ],
    bestFor: [
      "Stores competing primarily on price",
      "Electronics and commodity categories",
      "Businesses needing automated repricing",
    ],
    notIdealFor: [
      "Brands focused on promotional strategy",
      "Stores where offers matter more than price",
      "Monitoring cart incentives or bundles",
    ],
    sourceUrls: [
      { label: "Prisync Official Site", url: "https://prisync.com" },
    ],
    lastUpdated: "2026-02-10",
  },
  {
    slug: "price2spy",
    name: "Price2Spy",
    category: "price-monitoring",
    positioning: "Price monitoring and comparison service",
    audience: "SMBs to mid-market",
    pricingModel: "Tiered subscriptions (from ~$30/mo)",
    strengths: [
      "Affordable price monitoring",
      "Repricing suggestions",
      "Basic competitor tracking",
      "MAP (Minimum Advertised Price) monitoring",
    ],
    limitations: [
      "Price-focused (misses promotional offers)",
      "Limited to product-level price changes",
      "Doesn't detect offer structure changes",
    ],
    bestFor: [
      "Budget-conscious SMBs",
      "Price-sensitive categories",
      "MAP compliance monitoring",
    ],
    notIdealFor: [
      "Promotional strategy monitoring",
      "Bundle and GWP tracking",
      "Free shipping threshold monitoring",
    ],
    sourceUrls: [
      { label: "Price2Spy Official Site", url: "https://www.price2spy.com" },
    ],
    lastUpdated: "2026-02-10",
  },
  {
    slug: "visualping",
    name: "Visualping",
    category: "website-monitoring",
    positioning: "Visual website change detection",
    audience: "General website monitoring (not ecommerce-specific)",
    pricingModel: "Freemium (from free to ~$10/mo)",
    strengths: [
      "Visual change detection",
      "Simple setup",
      "Affordable",
      "Works on any website",
    ],
    limitations: [
      "Generic (not tailored for ecommerce offers)",
      "Alerts on any visual change (noisy for promo tracking)",
      "No offer-specific extraction or context",
    ],
    bestFor: [
      "General website monitoring",
      "Tracking static page changes",
      "Budget-friendly change alerts",
    ],
    notIdealFor: [
      "Specifically tracking promotional offers",
      "Understanding offer context (free shipping thresholds, bundle details)",
      "Strategic competitive intelligence",
    ],
    sourceUrls: [
      { label: "Visualping Official Site", url: "https://visualping.io" },
    ],
    lastUpdated: "2026-02-10",
  },
  {
    slug: "hexowatch",
    name: "Hexowatch",
    category: "website-monitoring",
    positioning: "AI-powered website monitoring",
    audience: "General website change detection",
    pricingModel: "Subscription ($9-$79/mo depending on checks)",
    strengths: [
      "Visual, content, and technology monitoring",
      "AI detection",
      "Broad monitoring capabilities",
      "Screenshot archives",
    ],
    limitations: [
      "Not ecommerce-focused",
      "No offer structure intelligence",
      "Generic change detection (noisy)",
    ],
    bestFor: [
      "General website change tracking",
      "Monitoring multiple sites",
      "Technology stack monitoring",
    ],
    notIdealFor: [
      "Shopify promo-specific monitoring",
      "Offer context understanding",
      "Strategic promotional intelligence",
    ],
    sourceUrls: [
      { label: "Hexowatch Official Site", url: "https://hexowatch.com" },
    ],
    lastUpdated: "2026-02-10",
  },
  {
    slug: "distill",
    name: "Distill.io",
    category: "website-monitoring",
    positioning: "Web page change monitoring and alerts",
    audience: "General users and businesses",
    pricingModel: "Free and paid tiers",
    strengths: [
      "Free tier available",
      "Browser extension",
      "Simple setup",
      "Email alerts",
    ],
    limitations: [
      "Not ecommerce-optimized",
      "No promotional context",
      "Manual setup for each check",
    ],
    bestFor: [
      "Personal website monitoring",
      "Simple change alerts",
      "Price-conscious users",
    ],
    notIdealFor: [
      "Automated offer intelligence",
      "Understanding promotional strategy",
      "Shopify-specific monitoring",
    ],
    sourceUrls: [
      { label: "Distill.io Official Site", url: "https://distill.io" },
    ],
    lastUpdated: "2026-02-10",
  },
  {
    slug: "watchful",
    name: "Watchful",
    category: "promo-intelligence",
    positioning: "Promotional intelligence for enterprise marketing teams",
    audience: "Enterprise marketing and ecommerce teams",
    pricingModel: "Enterprise (custom pricing)",
    strengths: [
      "Promotional campaign tracking",
      "Marketing intelligence",
      "Competitive benchmarking",
      "Multi-channel monitoring",
    ],
    limitations: [
      "Enterprise pricing and setup",
      "May be overkill for SMBs",
      "Requires dedicated team resources",
    ],
    bestFor: [
      "Large marketing teams",
      "Multi-brand enterprises",
      "Comprehensive campaign intelligence",
    ],
    notIdealFor: [
      "Small Shopify stores",
      "Solo operators",
      "Simple offer monitoring needs",
    ],
    sourceUrls: [
      { label: "Watchful Information", url: "https://www.watchful.ai" },
    ],
    lastUpdated: "2026-02-10",
  },
  {
    slug: "skuuudle",
    name: "Skuuudle",
    category: "price-monitoring",
    positioning: "Pricing and promotional intelligence",
    audience: "Mid-market to enterprise retailers",
    pricingModel: "Custom enterprise pricing",
    strengths: [
      "Price and promo tracking combined",
      "Category analytics",
      "Market intelligence",
      "Regional pricing support",
    ],
    limitations: [
      "Enterprise-focused",
      "Complex for small businesses",
      "May track more than needed for SMBs",
    ],
    bestFor: [
      "Mid to large retailers",
      "Multi-category stores",
      "Regional pricing strategies",
    ],
    notIdealFor: [
      "Small Shopify stores",
      "Simple promo monitoring",
      "Budget-conscious businesses",
    ],
    sourceUrls: [
      { label: "Skuuudle Information", url: "https://www.skuuudle.com" },
    ],
    lastUpdated: "2026-02-10",
  },
];

export function getCompetitorBySlug(slug: string): Competitor | null {
  return COMPETITORS.find((c) => c.slug === slug) || null;
}

export function getAllCompetitorSlugs(): string[] {
  return COMPETITORS.map((c) => c.slug);
}

export function getCompetitorsByCategory(category: Competitor["category"]): Competitor[] {
  return COMPETITORS.filter((c) => c.category === category);
}
