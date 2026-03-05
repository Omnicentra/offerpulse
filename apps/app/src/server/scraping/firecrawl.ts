/**
 * Firecrawl integration for competitor change tracking
 * Uses Firecrawl's change tracking API with JSON mode for structured offer extraction
 * @see https://docs.firecrawl.dev/features/change-tracking
 * @see https://docs.firecrawl.dev/features/enhanced-mode
 */

import Firecrawl from "@mendable/firecrawl-js";
import { logger } from "@offerpulse/lib";
import { env } from "@/env";
import type { ExtractedSignals } from "./extractor";

// Map monitor frequency to Firecrawl change tracking tag
export type FirecrawlFrequencyTag = "daily" | "twice-daily" | "high-frequency";

export function frequencyToTag(
  frequency: "1h" | "6h" | "daily"
): FirecrawlFrequencyTag {
  switch (frequency) {
    case "1h":
      return "high-frequency";
    case "6h":
      return "twice-daily";
    case "daily":
    default:
      return "daily";
  }
}

// JSON schema for offer extraction (Firecrawl JSON mode)
// Covers promo, shipping, bundle, cart, delivery/returns
const OFFER_SCHEMA = {
  type: "object",
  properties: {
    // Promo fields
    discount_percentage: { type: "string" },
    promo_code: { type: "string" },
    promo_text: { type: "string" },
    promo_expiry: { type: "string" },

    // Shipping fields
    free_shipping_threshold: { type: "string" },
    shipping_cost: { type: "string" },
    delivery_time: { type: "string" },

    // Bundle fields
    bundle_title: { type: "string" },
    bundle_products: { type: "string" },
    bundle_discount: { type: "string" },

    // Cart fields
    cart_incentive_text: { type: "string" },
    minimum_order_value: { type: "string" },
    cart_discount: { type: "string" },

    // Delivery & returns
    delivery_text: { type: "string" },
    returns_text: { type: "string" },
  },
} as const;

export interface FirecrawlChangeTracking {
  previousScrapeAt: string | null;
  changeStatus: "new" | "same" | "changed" | "removed";
  visibility: "visible" | "hidden";
  diff?: { text: string; json?: unknown };
  json?: Record<string, { previous?: unknown; current?: unknown }>;
}

export interface FirecrawlScrapeResult {
  success: boolean;
  url: string;
  markdown?: string;
  screenshot?: string;
  changeTracking?: FirecrawlChangeTracking;
  error?: string;
  metadata?: { statusCode?: number };
  duration: number;
}

/**
 * Scrape a URL with Firecrawl change tracking (JSON mode).
 * Retries with enhanced proxy on 401, 403, 500 per Firecrawl docs.
 */
export async function scrapeWithChangeTracking({
  url,
  competitorId,
  frequency,
}: {
  url: string;
  competitorId: string;
  frequency: "1h" | "6h" | "daily";
}): Promise<FirecrawlScrapeResult> {
  const startTime = Date.now();
  const tag = frequencyToTag(frequency);

  logger.debug("[firecrawl] scrapeWithChangeTracking started", {
    url,
    competitorId,
    frequency,
    tag,
  });

  const firecrawl = new Firecrawl({ apiKey: env.FIRECRAWL_API_KEY });

  const scrapeOptions = {
    formats: [
      "markdown" as const,
      {
        type: "screenshot" as const,
        fullPage: true,
        quality: 80,
        viewport: {
          width: 1280,
          height: 720,
        }
      },
      {
        type: "changeTracking" as const,
        modes: ["json" as const] as const,
        tag,
        schema: OFFER_SCHEMA as Record<string, unknown>,
      },
    ],
    timeout: 60000,
    proxy: "auto" as const, // Try basic first, retry with enhanced on failure
  };

  try {
    const result = await firecrawl.scrape(url, scrapeOptions);
    const duration = Date.now() - startTime;
    const statusCode = (result.metadata as { statusCode?: number })?.statusCode;
    const changeStatus = (
      result.changeTracking as unknown as FirecrawlChangeTracking | undefined
    )?.changeStatus;

    logger.debug("[firecrawl] Initial scrape completed", {
      url,
      competitorId,
      durationMs: duration,
      statusCode,
      changeStatus,
    });

    // Check for blocking status codes - retry with enhanced proxy
    if (statusCode && [401, 403, 500].includes(statusCode)) {
      logger.warn(
        "[firecrawl] Retrying with enhanced proxy (blocking status code)",
        { url, competitorId, statusCode }
      );
      const retryResult = await firecrawl.scrape(url, {
        ...scrapeOptions,
        proxy: "enhanced",
      });
      const retryDuration = Date.now() - startTime;
      logger.debug("[firecrawl] Enhanced proxy retry succeeded", {
        url,
        competitorId,
        durationMs: retryDuration,
      });
      return {
        success: true,
        url,
        markdown: retryResult.markdown,
        screenshot: retryResult.screenshot,
        changeTracking: retryResult.changeTracking as unknown as FirecrawlChangeTracking,
        metadata: retryResult.metadata as { statusCode?: number },
        duration: retryDuration,
      };
    }

    logger.debug("[firecrawl] Scrape succeeded (no retry needed)", {
      url,
      competitorId,
      durationMs: duration,
      changeStatus,
    });
    return {
      success: true,
      url,
      markdown: result.markdown,
      screenshot: result.screenshot,
        changeTracking: result.changeTracking as unknown as FirecrawlChangeTracking,
      metadata: result.metadata as { statusCode?: number },
      duration,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown Firecrawl error";
    logger.error("[firecrawl] Scrape failed, retrying with enhanced proxy", {
      url,
      competitorId,
      error: errorMessage,
    });

    // Retry with enhanced proxy on exception
    try {
      const retryResult = await firecrawl.scrape(url, {
        ...scrapeOptions,
        proxy: "enhanced",
      });
      logger.debug("[firecrawl] Enhanced proxy retry succeeded after initial failure", {
        url,
        competitorId,
        durationMs: Date.now() - startTime,
      });
      return {
        success: true,
        url,
        markdown: retryResult.markdown,
        screenshot: retryResult.screenshot,
        changeTracking: retryResult.changeTracking as unknown as FirecrawlChangeTracking,
        metadata: retryResult.metadata as { statusCode?: number },
        duration: Date.now() - startTime,
      };
    } catch (retryError) {
      logger.error("[firecrawl] Enhanced proxy retry also failed", {
        url,
        competitorId,
        error: retryError instanceof Error ? retryError.message : "Unknown error",
      });
      return {
        success: false,
        url,
        error:
          retryError instanceof Error
            ? retryError.message
            : "Enhanced proxy retry failed",
        duration: Date.now() - startTime,
      };
    }
  }
}

/**
 * Convert Firecrawl JSON change data to legacy ExtractedSignals format.
 * Used for backward compatibility during transition.
 */
export function extractSignalsFromFirecrawl(
  firecrawlJson?: Record<string, { previous?: unknown; current?: unknown }> | null
): ExtractedSignals {
  const signals: ExtractedSignals = { confidence: "low" };

  if (!firecrawlJson) return signals;

  const getCurrent = (key: string): string | undefined => {
    const val = firecrawlJson[key]?.current;
    return val != null ? String(val) : undefined;
  };

  signals.promoText = getCurrent("promo_text");
  const discountStr = getCurrent("discount_percentage");
  if (discountStr) {
    const num = parseFloat(discountStr.replace(/\D/g, ""));
    if (!isNaN(num)) signals.discountPercent = num;
  }
  signals.discountCode = getCurrent("promo_code");

  const thresholdStr = getCurrent("free_shipping_threshold");
  if (thresholdStr) {
    const num = parseFloat(thresholdStr.replace(/\D/g, ""));
    if (!isNaN(num)) signals.shippingThreshold = num;
  }
  signals.shippingText = getCurrent("shipping_cost") ?? getCurrent("delivery_time");

  signals.bundleText =
    getCurrent("bundle_title") ??
    getCurrent("bundle_products") ??
    getCurrent("bundle_discount");

  signals.cartIncentiveText =
    getCurrent("cart_incentive_text") ??
    getCurrent("minimum_order_value") ??
    getCurrent("cart_discount");

  signals.deliveryText = getCurrent("delivery_text");
  signals.returnsText = getCurrent("returns_text");

  // Set confidence based on fields found
  const fieldCount = [
    signals.promoText,
    signals.discountPercent,
    signals.discountCode,
    signals.shippingThreshold,
    signals.shippingText,
    signals.bundleText,
    signals.cartIncentiveText,
    signals.deliveryText,
    signals.returnsText,
  ].filter(Boolean).length;

  if (fieldCount >= 3) signals.confidence = "high";
  else if (fieldCount >= 1) signals.confidence = "medium";

  return signals;
}

export interface BatchScrapeCompetitor {
  url: string;
  id: string;
}

export interface BatchScrapeResultItem {
  url: string;
  competitorId: string;
  success: boolean;
  markdown?: string;
  screenshot?: string;
  changeTracking?: FirecrawlChangeTracking;
  error?: string;
}

/**
 * Batch scrape multiple competitors using Firecrawl batch API.
 * More efficient than individual scrapes for scheduled monitoring.
 */
export async function batchScrapeCompetitors(
  competitors: BatchScrapeCompetitor[],
  frequency: "1h" | "6h" | "daily"
): Promise<BatchScrapeResultItem[]> {
  if (competitors.length === 0) {
    logger.debug("[firecrawl] batchScrapeCompetitors skipped (no competitors)");
    return [];
  }

  const tag = frequencyToTag(frequency);
  const urls = competitors.map((c) => c.url);

  logger.debug("[firecrawl] batchScrapeCompetitors started", {
    competitorCount: competitors.length,
    frequency,
    tag,
    urlCount: urls.length,
  });

  const firecrawl = new Firecrawl({ apiKey: env.FIRECRAWL_API_KEY });

  try {
    const job = await firecrawl.batchScrape(urls, {
      options: {
        formats: [
          "markdown" as const,
          {
            type: "screenshot" as const,
            fullPage: true,
            quality: 80,
            viewport: {
              width: 1280,
              height: 720,
            },
          },
          {
            type: "changeTracking" as const,
            modes: ["json" as const] as const,
            tag,
            schema: OFFER_SCHEMA as Record<string, unknown>,
          },
        ],
        timeout: 60000,
        proxy: "auto",
      },
      pollInterval: 2,
      timeout: 300, // 5 minutes
    });

    logger.debug("[firecrawl] Batch scrape job completed", {
      status: job.status,
      completed: job.completed,
      total: job.total,
      creditsUsed: job.creditsUsed,
      dataCount: job.data?.length ?? 0,
    });

    if (job.status === "failed" || job.status === "cancelled") {
      logger.error("[firecrawl] Batch scrape job failed or cancelled", {
        status: job.status,
        total: job.total,
      });
      return competitors.map((c) => ({
        url: c.url,
        competitorId: c.id,
        success: false,
        error: `Batch job ${job.status}`,
      }));
    }

    const results: BatchScrapeResultItem[] = [];
    const data = job.data ?? [];

    // Build URL -> doc map (normalize URLs for matching)
    const normalizeUrl = (u: string) => u.replace(/\/$/, "") || u;
    const docByUrl = new Map<string, (typeof data)[0]>();
    for (const doc of data) {
      const url = (doc.metadata as { url?: string })?.url;
      if (url) docByUrl.set(normalizeUrl(url), doc);
    }

    logger.debug("[firecrawl] Mapped batch results to competitors", {
      docCount: docByUrl.size,
      competitorCount: competitors.length,
    });

    for (const competitor of competitors) {
      const doc = docByUrl.get(normalizeUrl(competitor.url));

      if (!doc) {
        logger.debug("[firecrawl] Competitor missing from batch response", {
          url: competitor.url,
          competitorId: competitor.id,
        });
        results.push({
          url: competitor.url,
          competitorId: competitor.id,
          success: false,
          error: "No result in batch response",
        });
        continue;
      }

      const changeTracking = doc.changeTracking as unknown as
        | FirecrawlChangeTracking
        | undefined;

      const changeStatus = changeTracking?.changeStatus;
      logger.debug("[firecrawl] Batch result for competitor", {
        url: competitor.url,
        competitorId: competitor.id,
        changeStatus,
        hasMarkdown: !!doc.markdown,
        hasScreenshot: !!doc.screenshot,
      });
      results.push({
        url: competitor.url,
        competitorId: competitor.id,
        success: true,
        markdown: doc.markdown,
        screenshot: doc.screenshot,
        changeTracking,
      });
    }

    const successCount = results.filter((r) => r.success).length;
    logger.debug("[firecrawl] batchScrapeCompetitors finished", {
      successCount,
      failedCount: results.length - successCount,
      total: results.length,
    });
    return results;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Batch scrape failed";
    logger.error("[firecrawl] Batch scrape error", { error: errorMessage });

    return competitors.map((c) => ({
      url: c.url,
      competitorId: c.id,
      success: false,
      error: errorMessage,
    }));
  }
}
