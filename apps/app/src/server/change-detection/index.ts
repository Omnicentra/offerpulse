import { ExtractedSignals } from "../scraping/extractor";

export interface ChangeDetectionResult {
  hasChange: boolean;
  changeType?: ChangeType;
  confidence: "low" | "medium" | "high";
  changes: ChangeDetail[];
  summary: string;
}

export type ChangeType =
  | "PROMO"
  | "SHIPPING"
  | "BUNDLE"
  | "CART_INCENTIVE"
  | "DELIVERY_RETURNS";

export interface ChangeDetail {
  field: string;
  before: any;
  after: any;
  significance: "major" | "minor";
  description: string;
}

/**
 * Sophisticated change detection algorithm
 * Compares two snapshots and identifies meaningful changes
 */
export function detectChanges(
  previous: ExtractedSignals,
  current: ExtractedSignals
): ChangeDetectionResult {
  const changes: ChangeDetail[] = [];

  // 1. Check promotion changes
  if (current.promoText !== previous.promoText) {
    changes.push({
      field: "promoText",
      before: previous.promoText,
      after: current.promoText,
      significance: "major",
      description: current.promoText
        ? `New promotion: "${current.promoText}"`
        : "Promotion removed",
    });
  }

  if (current.discountPercent !== previous.discountPercent) {
    const change = {
      field: "discountPercent",
      before: previous.discountPercent,
      after: current.discountPercent,
      significance: "major" as const,
      description: "",
    };

    if (!previous.discountPercent && current.discountPercent) {
      change.description = `New discount: ${current.discountPercent}% off`;
    } else if (previous.discountPercent && !current.discountPercent) {
      change.description = `${previous.discountPercent}% discount removed`;
    } else if (previous.discountPercent && current.discountPercent) {
      const diff = current.discountPercent - previous.discountPercent;
      change.description = `Discount changed: ${previous.discountPercent}% → ${current.discountPercent}% (${diff > 0 ? "+" : ""}${diff}%)`;
    }

    changes.push(change);
  }

  if (current.discountCode !== previous.discountCode) {
    changes.push({
      field: "discountCode",
      before: previous.discountCode,
      after: current.discountCode,
      significance: "major",
      description: current.discountCode
        ? `New discount code: ${current.discountCode}`
        : "Discount code removed",
    });
  }

  // 2. Check shipping changes
  if (current.shippingThreshold !== previous.shippingThreshold) {
    const change = {
      field: "shippingThreshold",
      before: previous.shippingThreshold,
      after: current.shippingThreshold,
      significance: "major" as const,
      description: "",
    };

    if (!previous.shippingThreshold && current.shippingThreshold) {
      change.description = `Free shipping now available over ${current.shippingCurrency || ""}${current.shippingThreshold}`;
    } else if (previous.shippingThreshold && !current.shippingThreshold) {
      change.description = "Free shipping threshold removed";
    } else if (previous.shippingThreshold && current.shippingThreshold) {
      const diff = current.shippingThreshold - previous.shippingThreshold;
      const currency = current.shippingCurrency || previous.shippingCurrency || "";
      change.description = `Free shipping threshold: ${currency}${previous.shippingThreshold} → ${currency}${current.shippingThreshold} (${diff > 0 ? "increased" : "decreased"} by ${currency}${Math.abs(diff)})`;
    }

    changes.push(change);
  }

  if (current.shippingText !== previous.shippingText) {
    changes.push({
      field: "shippingText",
      before: previous.shippingText,
      after: current.shippingText,
      significance: "minor",
      description: "Shipping messaging updated",
    });
  }

  // 3. Check bundle changes
  if (current.bundleText !== previous.bundleText) {
    changes.push({
      field: "bundleText",
      before: previous.bundleText,
      after: current.bundleText,
      significance: "major",
      description: current.bundleText ? `New bundle offer: ${current.bundleText}` : "Bundle offer removed",
    });
  }

  if (current.bundleType !== previous.bundleType) {
    changes.push({
      field: "bundleType",
      before: previous.bundleType,
      after: current.bundleType,
      significance: "major",
      description: current.bundleType ? `Bundle type changed to: ${current.bundleType}` : "Bundle type removed",
    });
  }

  // 4. Check cart incentive changes
  if (current.cartIncentiveText !== previous.cartIncentiveText) {
    changes.push({
      field: "cartIncentiveText",
      before: previous.cartIncentiveText,
      after: current.cartIncentiveText,
      significance: "major",
      description: current.cartIncentiveText
        ? `New cart incentive: ${current.cartIncentiveText}`
        : "Cart incentive removed",
    });
  }

  // 5. Check delivery & returns changes
  if (current.deliveryDays !== previous.deliveryDays) {
    changes.push({
      field: "deliveryDays",
      before: previous.deliveryDays,
      after: current.deliveryDays,
      significance: "minor",
      description: current.deliveryDays
        ? `Delivery time changed: ${previous.deliveryDays || "N/A"} → ${current.deliveryDays} days`
        : "Delivery time removed",
    });
  }

  if (current.returnsDays !== previous.returnsDays) {
    changes.push({
      field: "returnsDays",
      before: previous.returnsDays,
      after: current.returnsDays,
      significance: "minor",
      description: current.returnsDays
        ? `Returns policy changed: ${previous.returnsDays || "N/A"} → ${current.returnsDays} days`
        : "Returns policy removed",
    });
  }

  // 6. Check urgency signals
  const previousUrgency = new Set(previous.urgencySignals || []);
  const currentUrgency = new Set(current.urgencySignals || []);
  const newUrgencySignals = [...currentUrgency].filter((s) => !previousUrgency.has(s));
  const removedUrgencySignals = [...previousUrgency].filter((s) => !currentUrgency.has(s));

  if (newUrgencySignals.length > 0) {
    changes.push({
      field: "urgencySignals",
      before: previous.urgencySignals,
      after: current.urgencySignals,
      significance: "minor",
      description: `New urgency signals: ${newUrgencySignals.join(", ")}`,
    });
  }

  if (removedUrgencySignals.length > 0) {
    changes.push({
      field: "urgencySignals",
      before: previous.urgencySignals,
      after: current.urgencySignals,
      significance: "minor",
      description: `Removed urgency signals: ${removedUrgencySignals.join(", ")}`,
    });
  }

  // Determine if there are meaningful changes
  const hasChange = changes.length > 0;

  if (!hasChange) {
    return {
      hasChange: false,
      confidence: "high",
      changes: [],
      summary: "No changes detected",
    };
  }

  // Determine primary change type based on most significant change
  const majorChanges = changes.filter((c) => c.significance === "major");
  let changeType: ChangeType | undefined;

  if (majorChanges.length > 0) {
    const firstMajor = majorChanges[0];
    if (["promoText", "discountPercent", "discountCode"].includes(firstMajor.field)) {
      changeType = "PROMO";
    } else if (["shippingThreshold", "shippingText"].includes(firstMajor.field)) {
      changeType = "SHIPPING";
    } else if (["bundleText", "bundleType"].includes(firstMajor.field)) {
      changeType = "BUNDLE";
    } else if (["cartIncentiveText"].includes(firstMajor.field)) {
      changeType = "CART_INCENTIVE";
    } else if (["deliveryDays", "returnsDays"].includes(firstMajor.field)) {
      changeType = "DELIVERY_RETURNS";
    }
  }

  // Determine confidence
  let confidence: "low" | "medium" | "high";
  const majorCount = majorChanges.length;
  const currentConfidence = current.confidence;
  const previousConfidence = previous.confidence;

  if (majorCount >= 2 && currentConfidence === "high" && previousConfidence === "high") {
    confidence = "high";
  } else if (majorCount >= 1 && (currentConfidence === "high" || previousConfidence === "high")) {
    confidence = "high";
  } else if (majorCount >= 1) {
    confidence = "medium";
  } else {
    confidence = "low";
  }

  // Generate summary
  const summary = generateSummary(changes, changeType);

  return {
    hasChange: true,
    changeType,
    confidence,
    changes,
    summary,
  };
}

function generateSummary(changes: ChangeDetail[], changeType?: ChangeType): string {
  const majorChanges = changes.filter((c) => c.significance === "major");

  if (majorChanges.length === 0) {
    return `${changes.length} minor change${changes.length > 1 ? "s" : ""} detected`;
  }

  if (majorChanges.length === 1) {
    return majorChanges[0].description;
  }

  // Multiple major changes
  const changeTypeLabel = changeType?.toLowerCase().replace("_", " ") || "offer";
  return `${majorChanges.length} major ${changeTypeLabel} changes detected`;
}

/**
 * Calculate similarity score between two snapshots (0-1)
 * Useful for determining if snapshots are essentially the same
 */
export function calculateSimilarity(
  previous: ExtractedSignals,
  current: ExtractedSignals
): number {
  let matchCount = 0;
  let totalFields = 0;

  const compareFields = [
    "promoText",
    "discountPercent",
    "discountCode",
    "shippingThreshold",
    "shippingText",
    "bundleText",
    "bundleType",
    "cartIncentiveText",
    "deliveryDays",
    "returnsDays",
  ];

  for (const field of compareFields) {
    totalFields++;
    const prevValue = previous[field as keyof ExtractedSignals];
    const currValue = current[field as keyof ExtractedSignals];

    if (prevValue === currValue) {
      matchCount++;
    } else if (
      typeof prevValue === "string" &&
      typeof currValue === "string" &&
      prevValue.toLowerCase() === currValue.toLowerCase()
    ) {
      matchCount += 0.9; // Almost match for case differences
    }
  }

  return totalFields > 0 ? matchCount / totalFields : 1;
}
