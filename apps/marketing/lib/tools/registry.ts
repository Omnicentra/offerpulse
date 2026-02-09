/**
 * Central registry for all free tools
 * Defines structure, metadata, and relationships
 */

import {
  Camera,
  Truck,
  Percent,
  CheckCircle,
  ShoppingCart,
  TrendingUp,
  Calendar,
  Package,
  BarChart3,
  Lightbulb,
} from "lucide-react";

export interface Tool {
  slug: string;
  name: string;
  shortDescription: string;
  longDescription: string;
  metaTitle: string;
  metaDescription: string;
  icon: any;
  category: "extraction" | "analysis" | "planning" | "ideas";
  topic: string; // Topic slug
  relatedTools: string[]; // Tool slugs
  relatedResources: string[]; // Resource slugs
  faqs: Array<{ question: string; answer: string }>;
  features: string[];
  useCases: string[];
  isFeatured?: boolean;
}

export const tools: Tool[] = [
  {
    slug: "offer-snapshot",
    name: "Competitor Offer Snapshot",
    shortDescription: "Capture and analyse all visible offers from any store instantly",
    longDescription:
      "Get a complete snapshot of all promotional offers, discounts, shipping thresholds, bundle deals, and cart incentives visible on any competitor's store. Our tool scans homepage, headers, banners, and key content areas to extract offer details in seconds.",
    metaTitle: "Free Competitor Offer Snapshot Tool | OfferPulse",
    metaDescription:
      "Analyse competitor offers instantly. Detect discounts, free shipping thresholds, bundles, and cart incentives from any Shopify or ecommerce store. Free tool by OfferPulse.",
    icon: Camera,
    category: "extraction",
    topic: "competitor-tracking",
    relatedTools: ["discount-detector", "free-shipping-threshold", "cart-incentives"],
    relatedResources: ["offer-teardown-guide", "competitive-monitoring-101"],
    isFeatured: true,
    features: [
      "Detects free shipping thresholds automatically",
      "Extracts discount percentages and promo codes",
      "Identifies bundle offers (BOGO, multi-buy)",
      "Finds gift with purchase offers",
      "Spots cart progress incentives",
    ],
    useCases: [
      "Benchmark your offers against competitors",
      "Discover what promotions competitors are running",
      "Identify gaps in your promotional strategy",
      "Find promotional code patterns",
    ],
    faqs: [
      {
        question: "How does the offer snapshot tool work?",
        answer:
          "We fetch the public HTML of the competitor store and use pattern matching to detect common offer formats like percentage discounts, free shipping thresholds, bundle deals, and promotional codes. Results appear within seconds.",
      },
      {
        question: "Does this work on any ecommerce platform?",
        answer:
          "Yes. The tool works on Shopify, WooCommerce, Magento, and most ecommerce platforms since it analyses publicly visible content. Some stores with heavy JavaScript rendering may show partial results.",
      },
      {
        question: "Is this legal to use?",
        answer:
          "Yes. This tool only accesses publicly available information that any visitor can see. We respect robots.txt and recommend using results ethically for competitive research.",
      },
      {
        question: "How accurate are the results?",
        answer:
          "Accuracy depends on how clearly offers are displayed. Obvious banner offers (e.g., '20% OFF SITEWIDE') are detected with high confidence. Dynamic or cart-specific offers may require manual verification.",
      },
    ],
  },
  {
    slug: "free-shipping-threshold",
    name: "Free Shipping Threshold Finder",
    shortDescription: "Detect competitor free shipping requirements automatically",
    longDescription:
      "Find out exactly what free shipping threshold your competitors are using. This tool detects advertised free shipping amounts from store headers, banners, and shipping policy pages.",
    metaTitle: "Free Shipping Threshold Finder | Free Tool by OfferPulse",
    metaDescription:
      "Discover competitor free shipping thresholds instantly. Analyse Shopify stores to find their free delivery requirements. Free tool for ecommerce research.",
    icon: Truck,
    category: "extraction",
    topic: "competitor-tracking",
    relatedTools: ["offer-snapshot", "cart-incentives"],
    relatedResources: ["shipping-strategy-guide"],
    features: [
      "Detects advertised thresholds (e.g., 'Free shipping over £50')",
      "Identifies currency and amount",
      "Shows exact text and location",
      "Confidence rating for each detection",
    ],
    useCases: [
      "Benchmark your shipping threshold",
      "Identify if you're uncompetitive on shipping",
      "Plan shipping promotions",
    ],
    faqs: [
      {
        question: "What if the store doesn't show a threshold?",
        answer:
          "The tool will indicate 'No advertised threshold detected'. Some stores offer free shipping on all orders or use dynamic thresholds shown only in cart.",
      },
      {
        question: "Can I check multiple competitors at once?",
        answer:
          "Currently, this free tool analyses one store at a time. Upgrade to OfferPulse Pro to monitor multiple competitors automatically.",
      },
    ],
  },
  {
    slug: "discount-detector",
    name: "Discount & Code Detector",
    shortDescription: "Find all active discounts and promotional codes on any store",
    longDescription:
      "Automatically detect percentage discounts, fixed amount offers, and promotional codes visible on competitor stores. Useful for competitive pricing research and promotional benchmarking.",
    metaTitle: "Discount & Promo Code Detector | Free OfferPulse Tool",
    metaDescription:
      "Find active discount codes and promotions on any ecommerce store. Detect percentage off, fixed discounts, and promo codes instantly. Free competitive research tool.",
    icon: Percent,
    category: "extraction",
    topic: "competitor-tracking",
    relatedTools: ["offer-snapshot", "bundle-detector"],
    relatedResources: ["discount-strategy-playbook"],
    features: [
      "Detects percentage discounts (10% off, 25% off)",
      "Finds fixed amount discounts (£10 off, $20 off)",
      "Extracts promotional codes from visible text",
      "Identifies BOGO and multi-buy offers",
    ],
    useCases: [
      "Track competitor promotional intensity",
      "Find inspiration for your next sale",
      "Benchmark discount levels in your category",
    ],
    faqs: [
      {
        question: "Will this find hidden or email-exclusive codes?",
        answer:
          "No. This tool only detects codes and discounts visible on public pages. Email-exclusive or member-only codes won't appear unless publicly advertised.",
      },
      {
        question: "How often should I check competitors?",
        answer:
          "For manual checks, weekly is reasonable. For real-time monitoring, upgrade to OfferPulse which automatically tracks changes and alerts you within minutes.",
      },
    ],
  },
  {
    slug: "offer-clarity-check",
    name: "Offer Clarity Checker",
    shortDescription: "Score your store's offer visibility and get actionable improvements",
    longDescription:
      "Audit your own store's promotional clarity. This tool scores how clearly your offers are presented and provides specific improvements to increase conversion.",
    metaTitle: "Free Offer Clarity Checker for Shopify | OfferPulse",
    metaDescription:
      "Score your ecommerce store's offer visibility. Get actionable recommendations to improve promotional clarity and boost conversions. Free Shopify audit tool.",
    icon: CheckCircle,
    category: "analysis",
    topic: "conversion-optimisation",
    relatedTools: ["cart-incentives", "offer-snapshot"],
    relatedResources: ["offer-clarity-guide"],
    features: [
      "Scores offer visibility (0-10)",
      "Checks above-the-fold positioning",
      "Audits shipping and returns messaging",
      "Evaluates CTA clarity",
      "Provides top 5 fixes",
    ],
    useCases: [
      "Improve your promotional clarity",
      "Identify why offers aren't converting",
      "Benchmark against competitors",
    ],
    faqs: [
      {
        question: "What makes an offer 'clear'?",
        answer:
          "A clear offer is visible above the fold, uses specific language (not vague), includes all details (amount, conditions), and has a strong call-to-action. Our tool checks for these elements.",
      },
      {
        question: "Can I use this on my own store?",
        answer:
          "Absolutely. This tool is designed to audit your own store's promotional clarity. Enter your URL and get a scored report with improvements.",
      },
    ],
  },
  {
    slug: "cart-incentives",
    name: "Cart Incentive Analyser",
    shortDescription: "Detect cart progress bars, unlock thresholds, and gift incentives",
    longDescription:
      "Discover what cart incentives competitors use to increase average order value. Detect progress bars, unlock messaging, and threshold-based offers.",
    metaTitle: "Cart Incentive Analyser | Free AOV Tool by OfferPulse",
    metaDescription:
      "Analyse competitor cart incentives and AOV strategies. Detect progress bars, unlock thresholds, and gift offers. Free tool for ecommerce AOV optimisation.",
    icon: ShoppingCart,
    category: "extraction",
    topic: "aov-optimisation",
    relatedTools: ["offer-snapshot", "free-shipping-threshold"],
    relatedResources: ["cart-incentive-playbook"],
    features: [
      "Detects 'spend X more' messaging",
      "Finds unlock thresholds (free shipping, gift)",
      "Identifies progress bar patterns",
      "Extracts gift with purchase offers",
    ],
    useCases: [
      "Benchmark your cart incentive strategy",
      "Find AOV optimisation ideas",
      "Discover what thresholds competitors use",
    ],
    faqs: [
      {
        question: "Can this detect cart-specific messaging?",
        answer:
          "This tool detects cart incentive patterns visible on the homepage or product pages. Cart-only messaging (e.g., dynamic progress bars) may not be fully captured without cart simulation.",
      },
    ],
  },
  {
    slug: "change-feed",
    name: "Competitor Change Feed (Demo)",
    shortDescription: "See real examples of detected competitor offer changes",
    longDescription:
      "Browse a live demo feed of offer changes detected across real Shopify stores. See examples of price drops, shipping updates, new discounts, and bundle launches.",
    metaTitle: "Competitor Offer Change Feed Demo | OfferPulse",
    metaDescription:
      "See real examples of competitor offer changes. Demo feed showing detected price drops, discounts, shipping updates, and bundle offers from Shopify stores.",
    icon: TrendingUp,
    category: "analysis",
    topic: "competitor-tracking",
    relatedTools: ["offer-snapshot"],
    relatedResources: [],
    features: ["Real change event examples", "Confidence ratings", "Before/after comparison"],
    useCases: ["Understand what changes to watch for", "See OfferPulse detection quality"],
    faqs: [],
  },
  {
    slug: "monitoring-planner",
    name: "Competitor Monitoring Planner",
    shortDescription: "Get a personalised plan for which competitors and offers to track",
    longDescription:
      "Answer a few questions about your business and get a customised competitor monitoring plan including which offers to track, how often to check, and what alerts to set up.",
    metaTitle: "Free Competitor Monitoring Planner | OfferPulse",
    metaDescription:
      "Get a personalised competitor tracking plan. Find out which offers to monitor, check frequency, and alert setup for your ecommerce business. Free planning tool.",
    icon: Calendar,
    category: "planning",
    topic: "competitor-tracking",
    relatedTools: ["offer-snapshot"],
    relatedResources: ["competitive-monitoring-101"],
    features: [
      "Personalised tracking recommendations",
      "Suggested check frequency",
      "Alert setup guidance",
      "Category-specific advice",
    ],
    useCases: [
      "Start competitor monitoring effectively",
      "Avoid tracking irrelevant metrics",
      "Build a monitoring schedule",
    ],
    faqs: [],
  },
  {
    slug: "match-recommendations",
    name: "What Should I Match?",
    shortDescription: "Compare your offers vs competitors and get strategic recommendations",
    longDescription:
      "Enter your store URL and a competitor URL. Get side-by-side comparison and strategic recommendations on what to match, what to counter, and what to ignore.",
    metaTitle: "Offer Matching Strategy Tool | Free by OfferPulse",
    metaDescription:
      "Compare your offers vs competitors. Get strategic recommendations on what to match, counter, or ignore. Free competitive strategy tool for Shopify stores.",
    icon: Lightbulb,
    category: "analysis",
    topic: "competitive-strategy",
    relatedTools: ["offer-snapshot", "discount-detector"],
    relatedResources: ["match-vs-counter-guide"],
    features: [
      "Side-by-side offer comparison",
      "Match/counter/ignore recommendations",
      "Impact assessment",
      "Strategic rationale for each move",
    ],
    useCases: [
      "Decide which competitor moves to respond to",
      "Avoid reactive pricing mistakes",
      "Build a strategic response plan",
    ],
    faqs: [],
  },
  {
    slug: "promo-calendar",
    name: "Seasonal Promo Calendar Generator",
    shortDescription: "Generate a monthly promotional calendar for your category",
    longDescription:
      "Get a pre-built promotional calendar template tailored to your industry with suggested timing, offer types, and seasonal themes. Download as CSV or copy to Notion.",
    metaTitle: "Free Seasonal Promo Calendar Generator | OfferPulse",
    metaDescription:
      "Generate a 12-week promotional calendar for your ecommerce store. Seasonal themes, offer ideas, and timing recommendations. Free marketing planning tool.",
    icon: BarChart3,
    category: "planning",
    topic: "promotional-planning",
    relatedTools: ["bundle-ideas", "monitoring-planner"],
    relatedResources: ["seasonal-promo-guide"],
    features: [
      "12-week promotional calendar",
      "Category-specific suggestions",
      "Seasonal theme ideas",
      "Export to CSV or Notion",
    ],
    useCases: [
      "Plan your promotional calendar",
      "Never miss seasonal opportunities",
      "Coordinate marketing campaigns",
    ],
    faqs: [],
  },
  {
    slug: "bundle-ideas",
    name: "Bundle Ideas Generator",
    shortDescription: "Get bundle offer ideas based on your category and margins",
    longDescription:
      "Generate 10-20 bundle offer ideas tailored to your product category, average order value, and profit margins. Includes classic bundles, cross-sells, and urgency-based offers.",
    metaTitle: "Bundle Offer Ideas Generator | Free Tool by OfferPulse",
    metaDescription:
      "Generate bundle offer ideas for your ecommerce store. Get personalised suggestions based on category, AOV, and margins. Free promotional ideas tool.",
    icon: Package,
    category: "ideas",
    topic: "promotional-planning",
    relatedTools: ["promo-calendar", "offer-snapshot"],
    relatedResources: ["bundle-offer-playbook"],
    features: [
      "10-20 tailored bundle ideas",
      "Category-specific suggestions",
      "Margin-aware recommendations",
      "Copy-paste ready offer text",
    ],
    useCases: [
      "Find bundle offer inspiration",
      "Increase average order value",
      "Create compelling multi-buy deals",
    ],
    faqs: [],
  },
];

export function getToolBySlug(slug: string): Tool | null {
  return tools.find((t) => t.slug === slug) || null;
}

export function getToolsByCategory(category: Tool["category"]): Tool[] {
  return tools.filter((t) => t.category === category);
}

export function getToolsByTopic(topic: string): Tool[] {
  return tools.filter((t) => t.topic === topic);
}

export function getFeaturedTools(): Tool[] {
  return tools.filter((t) => t.isFeatured);
}

export function getAllToolSlugs(): string[] {
  return tools.map((t) => t.slug);
}

export function generateToolListSchema(toolList: Tool[], url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    url,
    numberOfItems: toolList.length,
    itemListElement: toolList.map((tool, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "SoftwareApplication",
        name: tool.name,
        description: tool.shortDescription,
        applicationCategory: "BusinessApplication",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "GBP",
        },
      },
    })),
  };
}
