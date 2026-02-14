/**
 * Helper functions for generating unique comparison page content
 */

import type { Competitor } from "./competitors";

export function generateVsPageFAQs(competitor: Competitor) {
  return [
    {
      question: `What's the main difference between OfferPulse and ${competitor.name}?`,
      answer: `OfferPulse focuses on promotional offer intelligence (discounts, bundles, free shipping thresholds, cart incentives) specifically for Shopify stores. ${competitor.name} ${getCompetitorFocusDescription(competitor)}. The choice depends on whether you need promotional strategy insights or ${competitor.category === "price-monitoring" ? "product pricing data" : "general website monitoring"}.`,
    },
    {
      question: `Is ${competitor.name} better for large enterprises?`,
      answer: competitor.audience.includes("Enterprise") || competitor.audience.includes("enterprise")
        ? `${competitor.name} is typically designed for enterprise teams with ${getEnterpriseFeatureDescription(competitor)}. OfferPulse is built for Shopify store operators and SMBs who need actionable promotional intelligence without enterprise complexity.`
        : `Both tools serve different markets. ${competitor.name} targets ${competitor.audience.toLowerCase()}, while OfferPulse is designed specifically for Shopify store owners needing promotional monitoring.`,
    },
    {
      question: `Does ${competitor.name} track free shipping thresholds and bundles?`,
      answer:
        competitor.category === "promo-intelligence"
          ? `${competitor.name} may track some promotional elements as part of broader market intelligence. OfferPulse specializes in detecting specific offer mechanics: free shipping thresholds, bundle structures, gift-with-purchase, and cart incentives with evidence and context.`
          : `${competitor.name} focuses on ${competitor.category === "price-monitoring" ? "price changes" : "visual webpage changes"}, not offer-specific details like free shipping thresholds or bundle structures. OfferPulse is purpose-built for these promotional mechanics.`,
    },
    {
      question: `Can I use both ${competitor.name} and OfferPulse together?`,
      answer: `Yes, they can complement each other if you need both ${competitor.category === "price-monitoring" ? "price-level data" : "broader monitoring"} and promotional offer intelligence. Many stores use OfferPulse for offer monitoring and ${competitor.name} for ${getComplementaryUseCase(competitor)}.`,
    },
    {
      question: `Which is more affordable for small Shopify stores?`,
      answer: getAffordabilityComparison(competitor),
    },
  ];
}

function getCompetitorFocusDescription(competitor: Competitor): string {
  if (competitor.category === "promo-intelligence") {
    return "typically provides broader market intelligence for enterprise teams";
  }
  if (competitor.category === "price-monitoring") {
    return "focuses on product-level price changes and repricing";
  }
  return "monitors general webpage changes across any website";
}

function getEnterpriseFeatureDescription(competitor: Competitor): string {
  if (competitor.category === "promo-intelligence") {
    return "dedicated account management, custom analytics, and multi-market coverage";
  }
  return "extensive data coverage and custom integrations";
}

function getComplementaryUseCase(competitor: Competitor): string {
  if (competitor.category === "price-monitoring") {
    return "SKU-level price tracking";
  }
  if (competitor.category === "website-monitoring") {
    return "general website change detection";
  }
  return "broader market intelligence";
}

function getAffordabilityComparison(competitor: Competitor): string {
  if (competitor.pricingModel.includes("Enterprise") || competitor.pricingModel.includes("custom")) {
    return `${competitor.name} typically requires enterprise pricing and sales engagement. OfferPulse starts at £19/mo with transparent pricing, making it more accessible for small Shopify stores.`;
  }
  if (competitor.pricingModel.includes("Free") || competitor.slug === "distill") {
    return `${competitor.name} has a free tier for basic monitoring. OfferPulse starts at £19/mo but provides targeted promotional intelligence rather than generic change detection, which may be more valuable for conversion-focused stores.`;
  }
  return `Both offer subscription pricing. ${competitor.name} ${competitor.pricingModel.toLowerCase()}. OfferPulse starts at £19/mo for 2 competitors with clear, transparent pricing.`;
}

export function generateAlternativesPageFAQs(competitor: Competitor) {
  return [
    {
      question: `What are the best ${competitor.name} alternatives?`,
      answer: `The best alternative depends on your needs. For Shopify promo monitoring, OfferPulse is purpose-built. For price monitoring, consider Prisync or Price2Spy. For general website monitoring, Visualping or Hexowatch work well. Choose based on whether you need promotional intelligence or ${competitor.category === "price-monitoring" ? "price data" : "general change detection"}.`,
    },
    {
      question: `Is there a free alternative to ${competitor.name}?`,
      answer: `For basic competitor checking, use free tools like OfferPulse's free snapshot tool or Distill.io's free tier. For automated monitoring with alerts, most tools including OfferPulse require paid plans (starting £19/mo).`,
    },
    {
      question: `What's the cheapest ${competitor.name} alternative?`,
      answer: `OfferPulse Lite (£19/mo) and Price2Spy (~$30/mo) are among the most affordable for automated competitive monitoring. However, "cheapest" isn't always best—consider whether the tool tracks what you actually need (offers vs prices).`,
    },
  ];
}

export function generateReviewPageFAQs(competitor: Competitor) {
  return [
    {
      question: `Is ${competitor.name} worth it?`,
      answer: `${competitor.name} is worth it if ${competitor.bestFor[0]?.toLowerCase() || "you need " + competitor.positioning.toLowerCase()}. For Shopify stores focused on promotional strategy (bundles, shipping thresholds, cart incentives), OfferPulse may be a better fit.`,
    },
    {
      question: `What are ${competitor.name}'s main limitations?`,
      answer: competitor.limitations.slice(0, 2).join(". ") + ".",
    },
    {
      question: `Does ${competitor.name} work for Shopify stores?`,
      answer:
        competitor.slug === "prisync"
          ? `Yes, ${competitor.name} has a Shopify app and works well for price monitoring on Shopify.`
          : `${competitor.name} can work with Shopify stores but isn't Shopify-specific. OfferPulse is purpose-built for Shopify promotional monitoring.`,
    },
    {
      question: `How does ${competitor.name} pricing work?`,
      answer: competitor.pricingModel,
    },
  ];
}

export function getCategoryDescription(category: Competitor["category"]): string {
  const descriptions = {
    "promo-intelligence": "promotional and competitive intelligence",
    "price-monitoring": "competitor price tracking",
    "website-monitoring": "general website change detection",
  };
  return descriptions[category];
}
