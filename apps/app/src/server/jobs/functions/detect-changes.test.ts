import { describe, expect, it } from "vitest";
import { analyzeFieldChanges } from "./detect-changes";

describe("analyzeFieldChanges", () => {
  it("detects promo code change with medium confidence", () => {
    const changes = analyzeFieldChanges({
      promo_code: { previous: "SAVE10", current: "SAVE20" },
    });

    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({
      type: "PROMO",
      confidence: "medium",
    });
  });

  it("detects shipping threshold change", () => {
    const changes = analyzeFieldChanges({
      free_shipping_threshold: { previous: 50, current: 75 },
    });

    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({
      type: "SHIPPING",
      confidence: "low",
      summary: "Free shipping threshold: 50 → 75",
    });
  });

  it("assigns high confidence when multiple promo fields change", () => {
    const changes = analyzeFieldChanges({
      promo_code: { previous: "SAVE10", current: "SAVE20" },
      discount_percentage: { previous: 10, current: 20 },
    });

    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({
      type: "PROMO",
      confidence: "high",
    });
  });

  it("returns no changes when values are identical", () => {
    const changes = analyzeFieldChanges({
      promo_code: { previous: "SAVE10", current: "SAVE10" },
      free_shipping_threshold: { previous: 60, current: 60 },
    });

    expect(changes).toEqual([]);
  });

  it("detects multiple categories in one comparison", () => {
    const changes = analyzeFieldChanges({
      promo_code: { previous: "SAVE10", current: "SAVE20" },
      free_shipping_threshold: { previous: 50, current: 100 },
      bundle_title: { previous: "Buy 2 Get 1", current: "3 for 2" },
      cart_incentive_text: { previous: "Free gift at $50", current: "Free gift at $75" },
      returns_text: { previous: "30 day returns", current: "60 day returns" },
    });

    expect(changes.map((c) => c.type).sort()).toEqual([
      "BUNDLE",
      "CART_INCENTIVE",
      "DELIVERY_RETURNS",
      "PROMO",
      "SHIPPING",
    ]);
  });
});
