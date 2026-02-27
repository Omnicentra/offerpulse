/**
 * Scoring logic for offer snapshots
 * Deterministic heuristic scoring (no ML)
 */

import type { ExtractedOffer } from "./extractor";
import type { AggregatedOffer } from "./aggregator";

export interface OfferScore {
  total: number; // 0-100
  grade: string; // A+, A, A-, B, etc.
  confidence: "high" | "medium" | "low";
  breakdown: {
    discounts: number;
    shipping: number;
    bundles: number;
    gifts: number;
    cartIncentives: number;
    stacking: number;
  };
}

export function calculateOfferScore(offers: ExtractedOffer | AggregatedOffer): OfferScore {
  let score = 0;
  const breakdown = {
    discounts: 0,
    shipping: 0,
    bundles: 0,
    gifts: 0,
    cartIncentives: 0,
    stacking: 0,
  };

  // Discount mechanics
  if (offers.discounts.length > 0) {
    breakdown.discounts = 15;
    score += 15;
  }

  // Free shipping threshold
  if (offers.shippingThreshold) {
    breakdown.shipping = 15;
    score += 15;
  }

  // Bundle offers
  if (offers.bundles.length > 0) {
    breakdown.bundles = 12;
    score += 12;
  }

  // Gift with purchase
  if (offers.gifts.length > 0) {
    breakdown.gifts = 12;
    score += 12;
  }

  // Cart incentives
  if (offers.cartIncentives.length > 0) {
    breakdown.cartIncentives = 12;
    score += 12;
  }

  // Multi-mechanic stacking bonus
  const mechanicCount =
    (offers.discounts.length > 0 ? 1 : 0) +
    (offers.shippingThreshold ? 1 : 0) +
    (offers.bundles.length > 0 ? 1 : 0) +
    (offers.gifts.length > 0 ? 1 : 0) +
    (offers.cartIncentives.length > 0 ? 1 : 0);

  if (mechanicCount >= 3) {
    breakdown.stacking = 10;
    score += 10;
  }

  // Cap at 100
  score = Math.min(100, score);

  // Calculate grade
  const grade = getGrade(score);

  // Calculate confidence
  const confidence = getConfidence(offers);

  return {
    total: score,
    grade,
    confidence,
    breakdown,
  };
}

function getGrade(score: number): string {
  if (score >= 95) return "A+";
  if (score >= 90) return "A";
  if (score >= 85) return "A-";
  if (score >= 80) return "B+";
  if (score >= 70) return "B";
  if (score >= 60) return "B-";
  if (score >= 50) return "C";
  return "D";
}

function getConfidence(offers: ExtractedOffer | AggregatedOffer): "high" | "medium" | "low" {
  const mechanicCount =
    (offers.discounts.length > 0 ? 1 : 0) +
    (offers.shippingThreshold ? 1 : 0) +
    (offers.bundles.length > 0 ? 1 : 0) +
    (offers.gifts.length > 0 ? 1 : 0) +
    (offers.cartIncentives.length > 0 ? 1 : 0);

  const evidenceCount =
    offers.discounts.length +
    (offers.shippingThreshold ? 1 : 0) +
    offers.bundles.length +
    offers.gifts.length +
    offers.cartIncentives.length;

  if (mechanicCount >= 4 && evidenceCount >= 5) return "high";
  if (mechanicCount >= 2 && evidenceCount >= 3) return "medium";
  return "low";
}

export function getScoreInterpretation(score: number): string {
  if (score >= 90) return "Highly promotional store with multiple offer mechanics active";
  if (score >= 70) return "Strong promotional approach with several active incentives";
  if (score >= 50) return "Moderate promotional activity detected";
  if (score >= 30) return "Light promotional approach with few active mechanics";
  return "Minimal promotional activity detected on public pages";
}

export function getMechanicCount(offers: ExtractedOffer | AggregatedOffer): number {
  let count = 0;
  if (offers.discounts.length > 0) count++;
  if (offers.shippingThreshold) count++;
  if (offers.bundles.length > 0) count++;
  if (offers.gifts.length > 0) count++;
  if (offers.cartIncentives.length > 0) count++;
  return count;
}
