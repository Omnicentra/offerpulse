/**
 * Discount Detector API — v3 response shape.
 *
 * Pipeline: (1) Firecrawl /map for same-origin URL discovery, (2) /scrape on a capped,
 * prioritized URL list + HTML/heuristic extraction (offers only — no promo codes),
 * (3) optional simple fetch fallback, (4) capped screenshot scrapes for evidence URLs.
 * Bump DISCOUNT_DETECTOR_RESPONSE_VERSION when changing JSON fields consumers rely on.
 */

import { NextResponse } from "next/server";
import { env } from "@/env";
import { logger } from "@/lib/logger";
import { discountDetectorRequestSchema } from "@/lib/validators";
import { extractDiscountDetectorFindings } from "@/lib/tools/discount-detector-extraction";
import { runDiscountDetectorMapScrape } from "@/lib/tools/discount-detector-map-scrape";
import {
  pickDiscountDetectorScreenshotUrls,
  scrapeDiscountDetectorScreenshots,
  type DiscountDetectorPageScreenshot,
} from "@/lib/tools/discount-detector-screenshots";
import { fetchStoreHtml } from "@/lib/tools/scraper";
import { rateLimiter, getClientIdentifier } from "@/lib/tools/rate-limit";
import type {
  DetectedDiscountOffer,
  DiscountDetectorFindings,
  DiscountDetectorSummary,
} from "@/lib/tools/discount-detector-extraction";

export type { DetectedDiscountOffer, DiscountDetectorSummary };

/** Increment when `DiscountDetectorResponse` fields or pipeline outputs change meaningfully. */
export const DISCOUNT_DETECTOR_RESPONSE_VERSION = 3;

const DEFAULT_MAP_LIMIT = 100;
const DEFAULT_SCRAPE_PAGES = 10;

function hasAnyFindings(f: DiscountDetectorFindings): boolean {
  return f.offers.length > 0;
}

export interface DiscountDetectorResponse {
  schemaVersion: number;
  url: string;
  timestamp: string;
  offers: DetectedDiscountOffer[];
  summary: DiscountDetectorSummary;
  pageScreenshots: DiscountDetectorPageScreenshot[];
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

    const mapLimit = env.DISCOUNT_DETECTOR_MAP_LIMIT ?? DEFAULT_MAP_LIMIT;
    const maxScrapePages = env.DISCOUNT_DETECTOR_SCRAPE_PAGES ?? DEFAULT_SCRAPE_PAGES;
    const regexFallbackEnabled = env.DISCOUNT_DETECTOR_REGEX_FALLBACK === "true";

    const warnings: string[] = [];

    const mapScrape = await runDiscountDetectorMapScrape({
      storeUrl,
      mapLimit,
      maxScrapePages,
    });
    warnings.push(...mapScrape.warnings);

    let findings: DiscountDetectorFindings = mapScrape.findings;

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
        warnings.push("Used direct HTML fetch + heuristics because map/scrape found no offers.");
      } catch (fallbackErr) {
        const m = fallbackErr instanceof Error ? fallbackErr.message : "Fallback fetch failed";
        warnings.push(m);
        logger.error("[discount-detector] regex fallback failed", { storeUrl, error: fallbackErr });
      }
    }

    const screenshotUrls = pickDiscountDetectorScreenshotUrls(storeUrl, findings);
    const pageScreenshots =
      screenshotUrls.length > 0 ? await scrapeDiscountDetectorScreenshots(screenshotUrls) : [];

    let firecrawlCreditsUsed = mapScrape.firecrawlCreditsUsed;
    if (pageScreenshots.length > 0) {
      firecrawlCreditsUsed += pageScreenshots.length;
    }

    const result: DiscountDetectorResponse = {
      schemaVersion: DISCOUNT_DETECTOR_RESPONSE_VERSION,
      url: storeUrl,
      timestamp: new Date().toISOString(),
      offers: findings.offers,
      summary: findings.summary,
      pageScreenshots,
      warnings,
    };

    logger.debug("[discount-detector] success", {
      url: storeUrl,
      totalMs: Date.now() - startTime,
      ...findings.summary,
      screenshots: pageScreenshots.length,
      firecrawlCreditsUsed,
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
