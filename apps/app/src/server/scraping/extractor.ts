export interface ExtractedSignals {
  confidence: "low" | "medium" | "high";
  // Promotion signals
  promoText?: string;
  discountPercent?: number;
  discountCode?: string;
  // Shipping signals
  shippingThreshold?: number;
  shippingText?: string;
  shippingCurrency?: string;
  // Bundle signals
  bundleText?: string;
  bundleType?: string;
  // Cart incentives
  cartIncentiveText?: string;
  cartIncentiveType?: string;
  // Delivery & returns
  deliveryText?: string;
  deliveryDays?: number;
  returnsText?: string;
  returnsDays?: number;
  // Badge signals
  badgeTexts?: string[];
  urgencySignals?: string[];
}
