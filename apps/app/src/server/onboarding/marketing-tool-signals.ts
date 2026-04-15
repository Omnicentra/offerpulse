import type { ExtractedSignals } from "../scraping/extractor";

interface MarketingToolOfferDiscount {
  value?: number;
  code?: string;
  evidenceText?: string;
}

interface MarketingToolOffers {
  discounts?: MarketingToolOfferDiscount[];
  shippingThreshold?: {
    amount?: number;
    currency?: string;
    evidenceText?: string;
  };
  bundles?: { evidenceText?: string }[];
  cartIncentives?: { evidenceText?: string }[];
}

/**
 * Map free-tool aggregated offers into dashboard ExtractedSignals for a marketing_tool snapshot row.
 */
export function extractSignalsFromMarketingToolPayload(
  toolPayload: Record<string, unknown>
): ExtractedSignals {
  const offers = toolPayload.offers as MarketingToolOffers | undefined;
  const signals: ExtractedSignals = { confidence: "low" };

  if (!offers) return signals;

  const firstDiscount = offers.discounts?.[0];
  if (firstDiscount) {
    if (typeof firstDiscount.value === "number") {
      signals.discountPercent = firstDiscount.value;
    }
    if (firstDiscount.code) signals.discountCode = firstDiscount.code;
    if (firstDiscount.evidenceText) signals.promoText = firstDiscount.evidenceText;
  }

  const ship = offers.shippingThreshold;
  if (ship) {
    if (typeof ship.amount === "number") signals.shippingThreshold = ship.amount;
    if (ship.currency) signals.shippingCurrency = ship.currency;
    if (ship.evidenceText) signals.shippingText = ship.evidenceText;
  }

  const bundle = offers.bundles?.[0];
  if (bundle?.evidenceText) signals.bundleText = bundle.evidenceText;

  const cart = offers.cartIncentives?.[0];
  if (cart?.evidenceText) signals.cartIncentiveText = cart.evidenceText;

  const fieldCount = [
    signals.promoText,
    signals.discountPercent,
    signals.discountCode,
    signals.shippingThreshold,
    signals.shippingText,
    signals.bundleText,
    signals.cartIncentiveText,
  ].filter(Boolean).length;

  if (fieldCount >= 3) signals.confidence = "high";
  else if (fieldCount >= 1) signals.confidence = "medium";

  return signals;
}
