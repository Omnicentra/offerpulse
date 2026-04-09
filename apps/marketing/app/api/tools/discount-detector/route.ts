/**
 * Discount & Code Detector API — v1 response shape.
 *
 * Pipeline: (1) Firecrawl Agent (structured JSON), (2) optional regex/HTML fallback,
 * (3) capped screenshot scrapes for same-origin evidence URLs.
 * Bump DISCOUNT_DETECTOR_RESPONSE_VERSION when changing JSON fields consumers rely on.
 */

import { NextResponse } from "next/server";
import { env } from "@/env";
import { logger } from "@/lib/logger";
import { discountDetectorRequestSchema } from "@/lib/validators";
import {
  agentOutputToFindings,
  parseDiscountDetectorAgentData,
} from "@/lib/tools/discount-detector-agent-schema";
import { extractDiscountDetectorFindings } from "@/lib/tools/discount-detector-extraction";
import {
  pickDiscountDetectorScreenshotUrls,
  scrapeDiscountDetectorScreenshots,
  type DiscountDetectorPageScreenshot,
} from "@/lib/tools/discount-detector-screenshots";
import { runDiscountDetectorAgent } from "@/lib/tools/firecrawl-discount-agent";
import { fetchStoreHtml } from "@/lib/tools/scraper";
import { rateLimiter, getClientIdentifier } from "@/lib/tools/rate-limit";
import type {
  DetectedDiscountOffer,
  DetectedPromoCode,
  DiscountDetectorFindings,
  DiscountDetectorSummary,
} from "@/lib/tools/discount-detector-extraction";

export type { DetectedDiscountOffer, DetectedPromoCode, DiscountDetectorSummary };

/** Increment when `DiscountDetectorResponse` fields or Agent output mapping change meaningfully. */
export const DISCOUNT_DETECTOR_RESPONSE_VERSION = 1;

const DEFAULT_AGENT_MAX_CREDITS = 400;

function emptyFindings(): DiscountDetectorFindings {
  return {
    offers: [],
    promoCodes: [],
    summary: {
      percentageCount: 0,
      fixedAmountCount: 0,
      promoCodeCount: 0,
      bundleHintCount: 0,
    },
  };
}

function hasAnyFindings(f: DiscountDetectorFindings): boolean {
  return f.offers.length > 0 || f.promoCodes.length > 0;
}

export interface DiscountDetectorResponse {
  schemaVersion: number;
  url: string;
  timestamp: string;
  offers: DetectedDiscountOffer[];
  promoCodes: DetectedPromoCode[];
  summary: DiscountDetectorSummary;
  pageScreenshots: DiscountDetectorPageScreenshot[];
  agentCreditsUsed?: number;
  warnings: string[];
}

export async function POST(request: Request) {
  const startTime = Date.now();
  logger.debug("discount-detector started");

  const identifier = getClientIdentifier(request);
  logger.debug("[discount-detector] client identifier", { identifier });

  const rateLimitResult = await rateLimiter.checkLimit(identifier);

  const headers = new Headers({
    "X-RateLimit-Limit": rateLimitResult.limit.toString(),
    "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
    "X-RateLimit-Reset": new Date(rateLimitResult.reset).toISOString(),
  });

  if (!rateLimitResult.success) {
    logger.debug("[discount-detector] rate limited", {
      identifier,
      remaining: rateLimitResult.remaining,
      reset: new Date(rateLimitResult.reset).toISOString(),
    });
    return NextResponse.json(
      {
        error: "Rate limit exceeded. Please try again later.",
        resetAt: new Date(rateLimitResult.reset).toISOString(),
      },
      { status: 429, headers },
    );
  }

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      logger.debug("[discount-detector] invalid JSON body");
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400, headers });
    }

    const parsed = discountDetectorRequestSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid request";
      logger.debug("[discount-detector] validation failed", { message });
      return NextResponse.json({ error: message }, { status: 400, headers });
    }

    const storeUrl = parsed.data.url;
    logger.debug("[discount-detector] target url", { url: storeUrl });

    const maxCredits = env.DISCOUNT_DETECTOR_AGENT_MAX_CREDITS ?? DEFAULT_AGENT_MAX_CREDITS;
    const regexFallbackEnabled = env.DISCOUNT_DETECTOR_REGEX_FALLBACK === "true";

    const warnings: string[] = [];
    let agentCreditsUsed: number | undefined;
    let findings: DiscountDetectorFindings = emptyFindings();

    const agentResult = await runDiscountDetectorAgent({
      storeUrl,
      maxCredits,
      timeoutSeconds: 180,
    });

    if (agentResult.creditsUsed !== undefined) {
      agentCreditsUsed = agentResult.creditsUsed;
    }

    if (agentResult.ok && agentResult.data !== undefined && agentResult.data !== null) {
      const { output, warnings: parseWarnings } = parseDiscountDetectorAgentData(agentResult.data);
      warnings.push(...parseWarnings);
      findings = agentOutputToFindings(output, storeUrl);
    } else {
      const msg = agentResult.error ?? "Firecrawl Agent did not return usable data.";
      warnings.push(msg);
      logger.warn("[discount-detector] agent path incomplete", { storeUrl, error: msg });
    }

    if (!hasAnyFindings(findings) && regexFallbackEnabled) {
      try {
        const fetchStart = Date.now();
        const { html, finalUrl } = await fetchStoreHtml(storeUrl, { includeScreenshot: false });
        logger.debug("[discount-detector] regex fallback fetchStoreHtml", {
          finalUrl,
          htmlLength: html?.length,
          fetchMs: Date.now() - fetchStart,
        });
        findings = extractDiscountDetectorFindings(html, finalUrl);
        warnings.push("Used HTML/regex fallback because Agent returned no structured results or failed.");
      } catch (fallbackErr) {
        const m = fallbackErr instanceof Error ? fallbackErr.message : "Fallback scrape failed";
        warnings.push(m);
        logger.error("[discount-detector] regex fallback failed", { storeUrl, error: fallbackErr });
      }
    }

    const screenshotUrls = pickDiscountDetectorScreenshotUrls(storeUrl, findings);
    const pageScreenshots =
      screenshotUrls.length > 0 ? await scrapeDiscountDetectorScreenshots(screenshotUrls) : [];

    const result: DiscountDetectorResponse = {
      schemaVersion: DISCOUNT_DETECTOR_RESPONSE_VERSION,
      url: storeUrl,
      timestamp: new Date().toISOString(),
      offers: findings.offers,
      promoCodes: findings.promoCodes,
      summary: findings.summary,
      pageScreenshots,
      agentCreditsUsed,
      warnings,
    };

    logger.debug("[discount-detector] success", {
      url: storeUrl,
      totalMs: Date.now() - startTime,
      ...findings.summary,
      screenshots: pageScreenshots.length,
    });

    return NextResponse.json(result, { headers });
  } catch (error) {
    const elapsed = Date.now() - startTime;
    logger.error("[discount-detector] API error", { error, elapsedMs: elapsed });

    if (error instanceof Error) {
      logger.debug("[discount-detector] error details", {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to analyse discounts",
      },
      { status: 500 },
    );
  }
}
