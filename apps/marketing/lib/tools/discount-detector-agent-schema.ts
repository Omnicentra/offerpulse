/**
 * Zod schemas for Firecrawl Agent structured output (Discount & Code Detector).
 * Used as the Agent `schema` parameter and to validate `data` from AgentStatusResponse.
 * Bump DISCOUNT_DETECTOR_RESPONSE_VERSION in the API route when this shape changes.
 */

import { z } from "zod";
import type {
  DetectedDiscountOffer,
  DetectedPromoCode,
  DiscountDetectorFindings,
  DiscountDetectorSummary,
  PromoCodeConfidence,
} from "@/lib/tools/discount-detector-extraction";

const confidenceSchema = z.enum(["high", "medium", "low"]).optional();

const optionalUrlLike = z
  .string()
  .optional()
  .transform((s) => (typeof s === "string" && s.trim().length > 0 ? s.trim() : undefined));

const percentageRowSchema = z.object({
  value: z.coerce.number().finite(),
  evidenceText: z.string().min(1),
  locationHint: z.string().optional().default("Page content"),
  sourceUrl: optionalUrlLike,
  associatedCode: z.string().optional(),
});

const fixedRowSchema = z.object({
  value: z.coerce.number().finite(),
  currency: z.string().min(1).default("$"),
  evidenceText: z.string().min(1),
  locationHint: z.string().optional().default("Page content"),
  sourceUrl: optionalUrlLike,
  associatedCode: z.string().optional(),
});

const promoRowSchema = z.object({
  code: z.string().min(1),
  evidenceText: z.string().min(1),
  locationHint: z.string().optional().default("Page content"),
  sourceUrl: optionalUrlLike,
  confidence: confidenceSchema,
});

const bundleRowSchema = z.object({
  evidenceText: z.string().min(1),
  locationHint: z.string().optional().default("Page content"),
  sourceUrl: optionalUrlLike,
});

/**
 * Root schema passed to Firecrawl Agent — keep field names stable for the model.
 */
export const discountDetectorAgentOutputSchema = z.object({
  percentageOffers: z.array(percentageRowSchema).default([]),
  fixedAmountOffers: z.array(fixedRowSchema).default([]),
  promoCodes: z.array(promoRowSchema).default([]),
  bundleHints: z.array(bundleRowSchema).default([]),
});

export type DiscountDetectorAgentOutput = z.infer<typeof discountDetectorAgentOutputSchema>;

function safeConfidence(v: string | undefined): PromoCodeConfidence | undefined {
  if (v === "high" || v === "medium" || v === "low") return v;
  return undefined;
}

/** Resolve agent-provided URLs to absolute same-origin links only (SSRF-safe for screenshot follow-up). */
export function resolveSameOriginSourceUrl(storeUrl: string, candidate?: string): string | undefined {
  if (!candidate?.trim()) return undefined;
  try {
    const base = new URL(storeUrl);
    const resolved = new URL(candidate.trim(), base);
    if (resolved.origin !== base.origin) return undefined;
    return resolved.href;
  } catch {
    return undefined;
  }
}

/**
 * Parse unknown Agent `data` with tolerant defaults; records row-level issues in warnings.
 */
export function parseDiscountDetectorAgentData(
  data: unknown,
): { output: DiscountDetectorAgentOutput; warnings: string[] } {
  const warnings: string[] = [];
  const parsed = discountDetectorAgentOutputSchema.safeParse(data);
  if (!parsed.success) {
    warnings.push("Agent returned data that did not match the expected schema; results may be partial.");
    return {
      output: {
        percentageOffers: [],
        fixedAmountOffers: [],
        promoCodes: [],
        bundleHints: [],
      },
      warnings,
    };
  }
  return { output: parsed.data, warnings };
}

export function agentOutputToFindings(
  output: DiscountDetectorAgentOutput,
  storeUrl: string,
): DiscountDetectorFindings {
  const offers: DetectedDiscountOffer[] = [
    ...output.percentageOffers.map(
      (r): DetectedDiscountOffer => ({
        kind: "percentage",
        value: r.value,
        evidenceText: r.evidenceText.trim().slice(0, 500),
        locationHint: r.locationHint ?? "Page content",
        associatedCode: r.associatedCode?.trim(),
        sourceUrl: resolveSameOriginSourceUrl(storeUrl, r.sourceUrl),
      }),
    ),
    ...output.fixedAmountOffers.map(
      (r): DetectedDiscountOffer => ({
        kind: "fixed_amount",
        value: r.value,
        currency: r.currency.trim().slice(0, 8),
        evidenceText: r.evidenceText.trim().slice(0, 500),
        locationHint: r.locationHint ?? "Page content",
        associatedCode: r.associatedCode?.trim(),
        sourceUrl: resolveSameOriginSourceUrl(storeUrl, r.sourceUrl),
      }),
    ),
    ...output.bundleHints.map(
      (r): DetectedDiscountOffer => ({
        kind: "bundle_hint",
        evidenceText: r.evidenceText.trim().slice(0, 500),
        locationHint: r.locationHint ?? "Page content",
        sourceUrl: resolveSameOriginSourceUrl(storeUrl, r.sourceUrl),
      }),
    ),
  ];

  const promoCodes: DetectedPromoCode[] = output.promoCodes.map((r) => ({
    code: r.code.trim().toUpperCase().slice(0, 64),
    evidenceText: r.evidenceText.trim().slice(0, 500),
    locationHint: r.locationHint ?? "Page content",
    confidence: safeConfidence(r.confidence),
    sourceUrl: resolveSameOriginSourceUrl(storeUrl, r.sourceUrl),
  }));

  const summary: DiscountDetectorSummary = {
    percentageCount: output.percentageOffers.length,
    fixedAmountCount: output.fixedAmountOffers.length,
    promoCodeCount: promoCodes.length,
    bundleHintCount: output.bundleHints.length,
  };

  return { offers, promoCodes, summary };
}
