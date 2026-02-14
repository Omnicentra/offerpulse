/**
 * Free vs Paid gating logic for snapshot reports
 */

export const FREE_LIMITS = {
  expandedOfferItemsTotal: 2,
  evidenceItemsShown: 1,
  recommendationsShown: 1,
  checkoutMechanicsDetails: false,
  pdfExport: false,
  rescanPerDay: 1,
  fullCodeDetails: false,
  fullThresholdDetails: false,
};

export function redactPromoCode(code: string): string {
  if (code.length <= 2) return code;
  return code.substring(0, 2) + "***";
}

export function redactThreshold(amount: number, currency: string): string {
  // Show range instead of exact amount
  const ranges = [
    { min: 0, max: 30, label: "£25-£30" },
    { min: 30, max: 50, label: "£30-£50" },
    { min: 50, max: 75, label: "£50-£75" },
    { min: 75, max: 100, label: "£75-£100" },
    { min: 100, max: Infinity, label: "£100+" },
  ];

  const range = ranges.find((r) => amount > r.min && amount <= r.max);
  return `Free shipping threshold detected (${range?.label || "approx range"})`;
}

export function redactGift(giftText: string): string {
  return "Gift-with-purchase detected (item details locked)";
}

export function redactBundle(bundleText: string): string {
  return "Multi-buy bundle detected (structure locked)";
}

export function redactCartIncentive(incentiveText: string): string {
  return "Cart threshold incentive detected (details locked)";
}

export function truncateEvidence(text: string, wordLimit: number = 12): string {
  const words = text.split(" ");
  if (words.length <= wordLimit) return text;
  return words.slice(0, wordLimit).join(" ") + "...";
}

export function useAccess() {
  // In production, check actual auth/subscription status
  // For now, assume free for all
  const isPaid = false;

  return {
    isPaid,
    limits: FREE_LIMITS,
    can: (action: keyof typeof FREE_LIMITS) => {
      if (isPaid) return true;
      return FREE_LIMITS[action] !== false;
    },
  };
}
