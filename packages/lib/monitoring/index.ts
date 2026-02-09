/**
 * Monitoring pipeline utilities
 * 
 * This module provides interfaces and utilities for the monitoring pipeline.
 * The actual scraping implementation can be swapped out later.
 */

import { ChangeType, Confidence } from "../constants";

export interface ExtractedSignals {
  freeShippingThreshold?: number | null;
  promoBanner?: string | null;
  discountPercent?: number | null;
  bundleOffer?: string | null;
  cartIncentive?: string | null;
  sitewideMessage?: string | null;
  detectedAt: Date;
}

export interface SnapshotData {
  competitorId: string;
  capturedAt: Date;
  htmlHash: string;
  screenshotUrl?: string;
  extractedSignals: ExtractedSignals;
}

export interface ChangeEventData {
  competitorId: string;
  detectedAt: Date;
  type: ChangeType;
  confidence: Confidence;
  summary: string;
  before: ExtractedSignals;
  after: ExtractedSignals;
  snapshotBeforeId?: string;
  snapshotAfterId?: string;
}

export interface RecommendationData {
  changeEventId: string;
  strategyType: "match" | "counter" | "ignore" | "enhance";
  explanation: string;
  estimatedImpact: "low" | "medium" | "high";
  difficulty: "easy" | "medium" | "hard";
  actions: string[];
}

/**
 * Compare two snapshots and detect changes
 */
export function detectChanges(
  before: ExtractedSignals,
  after: ExtractedSignals
): ChangeEventData[] {
  const changes: ChangeEventData[] = [];

  // Shipping threshold change
  if (before.freeShippingThreshold !== after.freeShippingThreshold) {
    const thresholdBefore = before.freeShippingThreshold ?? null;
    const thresholdAfter = after.freeShippingThreshold ?? null;

    let summary = "";
    let confidence: Confidence = Confidence.MEDIUM;

    if (thresholdBefore === null && thresholdAfter !== null) {
      summary = `Free shipping threshold added: £${thresholdAfter}`;
      confidence = Confidence.HIGH;
    } else if (thresholdBefore !== null && thresholdAfter === null) {
      summary = `Free shipping threshold removed (was £${thresholdBefore})`;
      confidence = Confidence.HIGH;
    } else if (thresholdBefore && thresholdAfter) {
      if (thresholdAfter < thresholdBefore) {
        summary = `Free shipping threshold decreased from £${thresholdBefore} to £${thresholdAfter}`;
        confidence = Confidence.HIGH;
      } else {
        summary = `Free shipping threshold increased from £${thresholdBefore} to £${thresholdAfter}`;
        confidence = Confidence.MEDIUM;
      }
    }

    changes.push({
      competitorId: "", // Will be set by caller
      detectedAt: new Date(),
      type: ChangeType.SHIPPING_THRESHOLD,
      confidence,
      summary,
      before,
      after,
    });
  }

  // Promo banner change
  if (before.promoBanner !== after.promoBanner) {
    const beforeText = before.promoBanner || "None";
    const afterText = after.promoBanner || "None";

    changes.push({
      competitorId: "",
      detectedAt: new Date(),
      type: ChangeType.PROMO_BANNER,
      confidence: Confidence.HIGH,
      summary: `Promo banner changed: "${beforeText}" → "${afterText}"`,
      before,
      after,
    });
  }

  // Discount change
  if (before.discountPercent !== after.discountPercent) {
    const beforeDiscount = before.discountPercent ?? 0;
    const afterDiscount = after.discountPercent ?? 0;

    if (afterDiscount > beforeDiscount) {
      changes.push({
        competitorId: "",
        detectedAt: new Date(),
        type: ChangeType.DISCOUNT,
        confidence: Confidence.HIGH,
        summary: `Discount increased from ${beforeDiscount}% to ${afterDiscount}%`,
        before,
        after,
      });
    } else if (afterDiscount < beforeDiscount && afterDiscount > 0) {
      changes.push({
        competitorId: "",
        detectedAt: new Date(),
        type: ChangeType.DISCOUNT,
        confidence: Confidence.MEDIUM,
        summary: `Discount decreased from ${beforeDiscount}% to ${afterDiscount}%`,
        before,
        after,
      });
    }
  }

  // Bundle offer change
  if (before.bundleOffer !== after.bundleOffer) {
    const beforeText = before.bundleOffer || "None";
    const afterText = after.bundleOffer || "None";

    changes.push({
      competitorId: "",
      detectedAt: new Date(),
      type: ChangeType.BUNDLE,
      confidence: Confidence.MEDIUM,
      summary: `Bundle offer changed: "${beforeText}" → "${afterText}"`,
      before,
      after,
    });
  }

  // Sitewide message change
  if (before.sitewideMessage !== after.sitewideMessage) {
    const beforeText = before.sitewideMessage || "None";
    const afterText = after.sitewideMessage || "None";

    changes.push({
      competitorId: "",
      detectedAt: new Date(),
      type: ChangeType.SITEWIDE_MESSAGE,
      confidence: Confidence.HIGH,
      summary: `Sitewide message changed: "${beforeText}" → "${afterText}"`,
      before,
      after,
    });
  }

  return changes;
}

/**
 * Generate recommendations based on change event
 */
export function generateRecommendation(
  change: ChangeEventData
): RecommendationData {
  const actions: string[] = [];
  let strategyType: RecommendationData["strategyType"] = "ignore";
  let explanation = "";
  let estimatedImpact: RecommendationData["estimatedImpact"] = "low";
  let difficulty: RecommendationData["difficulty"] = "medium";

  switch (change.type) {
    case ChangeType.SHIPPING_THRESHOLD: {
      const beforeThreshold = change.before.freeShippingThreshold ?? null;
      const afterThreshold = change.after.freeShippingThreshold ?? null;

      if (afterThreshold !== null && beforeThreshold !== null) {
        if (afterThreshold < beforeThreshold) {
          // Competitor lowered threshold
          strategyType = "match";
          explanation = "Competitor lowered their free shipping threshold. Consider matching to stay competitive.";
          estimatedImpact = "high";
          difficulty = "easy";
          actions.push("Update free shipping threshold in Shopify settings");
          actions.push("Update site messaging to reflect new threshold");
        } else {
          strategyType = "enhance";
          explanation = "Competitor increased their threshold. This may be an opportunity to offer better value.";
          estimatedImpact = "medium";
          difficulty = "easy";
          actions.push("Highlight your lower threshold in marketing");
        }
      } else if (afterThreshold !== null && beforeThreshold === null) {
        strategyType = "counter";
        explanation = "Competitor added a free shipping threshold. Consider offering free shipping at a lower threshold or sitewide.";
        estimatedImpact = "high";
        difficulty = "medium";
        actions.push("Evaluate your shipping strategy");
        actions.push("Consider promotional messaging");
      }
      break;
    }

    case ChangeType.DISCOUNT: {
      const beforeDiscount = change.before.discountPercent ?? 0;
      const afterDiscount = change.after.discountPercent ?? 0;

      if (afterDiscount > beforeDiscount) {
        strategyType = "counter";
        explanation = `Competitor increased discount to ${afterDiscount}%. Consider a counter-offer or bundle strategy.`;
        estimatedImpact = "high";
        difficulty = "medium";
        actions.push("Review pricing strategy");
        actions.push("Consider bundle offers instead of direct discount");
      }
      break;
    }

    case ChangeType.PROMO_BANNER:
    case ChangeType.SITEWIDE_MESSAGE: {
      strategyType = "match";
      explanation = "Competitor updated promotional messaging. Review if similar messaging would work for your brand.";
      estimatedImpact = "medium";
      difficulty = "easy";
      actions.push("Review competitor messaging tone");
      actions.push("Consider A/B testing similar messaging");
      break;
    }

    case ChangeType.BUNDLE: {
      strategyType = "enhance";
      explanation = "Competitor introduced a bundle offer. Consider creating a complementary bundle or enhancing existing bundles.";
      estimatedImpact = "medium";
      difficulty = "hard";
      actions.push("Review product bundles");
      actions.push("Consider cross-sell opportunities");
      break;
    }

    default:
      strategyType = "ignore";
      explanation = "Change detected but no specific recommendation at this time.";
      estimatedImpact = "low";
      difficulty = "easy";
  }

  return {
    changeEventId: "", // Will be set by caller
    strategyType,
    explanation,
    estimatedImpact,
    difficulty,
    actions,
  };
}

/**
 * Mock snapshot capture (for MVP)
 * In production, this would use Playwright/Puppeteer
 */
export async function captureSnapshotMock(
  url: string
): Promise<ExtractedSignals> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Generate mock data with some randomness
  const hasShipping = Math.random() > 0.3;
  const hasPromo = Math.random() > 0.4;
  const hasDiscount = Math.random() > 0.5;

  return {
    freeShippingThreshold: hasShipping
      ? Math.floor(Math.random() * 50) + 30
      : null,
    promoBanner: hasPromo
      ? ["20% off ends tonight", "Free shipping on orders over £50", "Buy 2 Get 1 Free"][
          Math.floor(Math.random() * 3)
        ]
      : null,
    discountPercent: hasDiscount ? Math.floor(Math.random() * 30) + 10 : null,
    bundleOffer: Math.random() > 0.7 ? "Buy 2 Get 1 Free" : null,
    cartIncentive: Math.random() > 0.8 ? "Add £10 more for free shipping" : null,
    sitewideMessage: Math.random() > 0.6
      ? "Limited time offer - Shop now!"
      : null,
    detectedAt: new Date(),
  };
}
