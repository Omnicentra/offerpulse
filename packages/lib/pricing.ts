/**
 * Central pricing configuration - single source of truth
 * All prices in GBP (£)
 */

export interface PlanFeature {
  text: string;
  included: boolean;
  comingSoon?: boolean;
}

export type PlanId = "starter" | "growth" | "agency";

export interface PricingPlan {
  id: PlanId;
  name: string;
  tagline: string;
  monthlyPrice: number;
  yearlyPrice: number;
  stripeLookupKeyMonthly: string;
  stripeLookupKeyYearly: string;
  maxWorkspaces: number;
  popular?: boolean;
  features: PlanFeature[];
  limits: {
    competitors: number;
    checkFrequency: "daily" | "twice-daily" | "high-frequency";
    offerCategories: number | "all";
    historyDays: number;
    seats: number;
    alerts: string[];
    shopifyIntegration: boolean;
    syncFrequencyHours: number | null;
  };
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    tagline: "For serious Shopify operators",
    monthlyPrice: 49,
    yearlyPrice: 490,
    stripeLookupKeyMonthly: "starter_monthly",
    stripeLookupKeyYearly: "starter_yearly",
    maxWorkspaces: 1,
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
      shopifyIntegration: false,
      syncFrequencyHours: null,
    },
  },
  {
    id: "growth",
    name: "Growth",
    tagline: "More coverage, faster monitoring",
    monthlyPrice: 99,
    yearlyPrice: 990,
    stripeLookupKeyMonthly: "growth_monthly",
    stripeLookupKeyYearly: "growth_yearly",
    maxWorkspaces: 1,
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
      shopifyIntegration: true,
      syncFrequencyHours: 6,
    },
  },
  {
    id: "agency",
    name: "Agency",
    tagline: "For agencies managing multiple client stores",
    monthlyPrice: 199,
    yearlyPrice: 1990,
    stripeLookupKeyMonthly: "agency_monthly",
    stripeLookupKeyYearly: "agency_yearly",
    maxWorkspaces: 5,
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
      shopifyIntegration: true,
      syncFrequencyHours: 3,
    },
  },
];

export function getPlanById(id: PlanId): PricingPlan | undefined {
  return PRICING_PLANS.find((plan) => plan.id === id);
}

export function getPlanByLookupKey(lookupKey: string): PricingPlan | undefined {
  return PRICING_PLANS.find(
    (plan) =>
      plan.stripeLookupKeyMonthly === lookupKey ||
      plan.stripeLookupKeyYearly === lookupKey
  );
}

export function parseLookupKey(lookupKey: string): { planId: PlanId; interval: "month" | "year" } | null {
  const match = lookupKey.match(/^(starter|growth|agency)_(monthly|yearly)$/);
  if (!match) return null;
  return {
    planId: match[1] as PlanId,
    interval: match[2] === "monthly" ? "month" : "year",
  };
}

export const TRIAL_PERIOD_DAYS = 14;

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
