/**
 * Central pricing configuration - single source of truth
 * All prices in GBP (£)
 */

export interface PlanFeature {
  text: string;
  included: boolean;
  comingSoon?: boolean;
}

export interface PricingPlan {
  id: "lite" | "starter" | "growth" | "agency";
  name: string;
  tagline: string;
  monthlyPrice: number;
  yearlyPrice: number;
  stripePriceIdMonthly?: string; // To be configured
  stripePriceIdYearly?: string; // To be configured
  popular?: boolean;
  features: PlanFeature[];
  limits: {
    competitors: number;
    checkFrequency: "daily" | "twice-daily" | "high-frequency";
    offerCategories: number | "all";
    historyDays: number;
    seats: number;
    alerts: string[];
  };
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "lite",
    name: "Lite",
    tagline: "Try OfferPulse on a small set of competitors",
    monthlyPrice: 19,
    yearlyPrice: 190, // 10 months (2 months free)
    stripePriceIdMonthly: process.env.NEXT_PUBLIC_STRIPE_LITE_MONTHLY,
    stripePriceIdYearly: process.env.NEXT_PUBLIC_STRIPE_LITE_YEARLY,
    features: [
      { text: "Track 2 competitors", included: true },
      { text: "Daily checks", included: true },
      { text: "Weekly digest email", included: true },
      { text: "1 offer category", included: true },
      { text: "Basic alerts", included: true },
      { text: "Change history", included: false },
      { text: "Exports", included: false },
      { text: "1 seat", included: true },
    ],
    limits: {
      competitors: 2,
      checkFrequency: "daily",
      offerCategories: 1,
      historyDays: 0,
      seats: 1,
      alerts: ["email-basic"],
    },
  },
  {
    id: "starter",
    name: "Starter",
    tagline: "For serious Shopify operators",
    monthlyPrice: 49,
    yearlyPrice: 490,
    stripePriceIdMonthly: process.env.NEXT_PUBLIC_STRIPE_STARTER_MONTHLY,
    stripePriceIdYearly: process.env.NEXT_PUBLIC_STRIPE_STARTER_YEARLY,
    popular: true,
    features: [
      { text: "Track 5 competitors", included: true },
      { text: "Twice daily checks", included: true },
      { text: "Instant email alerts", included: true },
      { text: "All offer types tracked", included: true },
      { text: "30-day change history", included: true },
      { text: "Shareable snapshots", included: true },
      { text: "Filter by offer type", included: true },
      { text: "1 seat", included: true },
    ],
    limits: {
      competitors: 5,
      checkFrequency: "twice-daily",
      offerCategories: "all",
      historyDays: 30,
      seats: 1,
      alerts: ["email"],
    },
  },
  {
    id: "growth",
    name: "Growth",
    tagline: "More coverage, faster monitoring",
    monthlyPrice: 99,
    yearlyPrice: 990,
    stripePriceIdMonthly: process.env.NEXT_PUBLIC_STRIPE_GROWTH_MONTHLY,
    stripePriceIdYearly: process.env.NEXT_PUBLIC_STRIPE_GROWTH_YEARLY,
    features: [
      { text: "Track 15 competitors", included: true },
      { text: "High-frequency monitoring (2-4 hours)", included: true },
      { text: "Email + Slack alerts", included: true },
      { text: "90-day change history", included: true },
      { text: "Offer categories & tagging", included: true },
      { text: "CSV export", included: true, comingSoon: true },
      { text: "Suggested actions", included: true },
      { text: "2 seats", included: true },
    ],
    limits: {
      competitors: 15,
      checkFrequency: "high-frequency",
      offerCategories: "all",
      historyDays: 90,
      seats: 2,
      alerts: ["email", "slack"],
    },
  },
  {
    id: "agency",
    name: "Agency",
    tagline: "For agencies managing multiple client stores",
    monthlyPrice: 199,
    yearlyPrice: 1990,
    stripePriceIdMonthly: process.env.NEXT_PUBLIC_STRIPE_AGENCY_MONTHLY,
    stripePriceIdYearly: process.env.NEXT_PUBLIC_STRIPE_AGENCY_YEARLY,
    features: [
      { text: "5 client stores/workspaces", included: true, comingSoon: true },
      { text: "10 competitors per store", included: true },
      { text: "High-frequency monitoring", included: true },
      { text: "5 team seats", included: true },
      { text: "Client-ready reporting", included: true },
      { text: "Share links", included: true },
      { text: "Priority support", included: true },
      { text: "PDF reports", included: true, comingSoon: true },
    ],
    limits: {
      competitors: 10,
      checkFrequency: "high-frequency",
      offerCategories: "all",
      historyDays: 90,
      seats: 5,
      alerts: ["email", "slack"],
    },
  },
];

export function getPlanById(id: PricingPlan["id"]): PricingPlan | undefined {
  return PRICING_PLANS.find((plan) => plan.id === id);
}

export function formatPrice(price: number): string {
  return `£${price}`;
}

export function formatMonthlyPrice(price: number): string {
  return `£${price}/mo`;
}

export function formatYearlyPrice(price: number): string {
  return `£${price}/yr`;
}

export const PRICING_NOTES = {
  vat: "Prices exclude VAT (if applicable)",
  yearlyDiscount: "2 months free",
  trialPeriod: "14 days",
  currency: "GBP",
};
