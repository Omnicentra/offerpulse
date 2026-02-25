import { NextResponse } from "next/server";
import { env } from "@/env";
import { fetchStoreHtml, isValidStoreUrl } from "@/lib/tools/scraper";
import {
  extractOffers,
  mergeExtractedOffers,
  type ExtractedOffer,
} from "@/lib/tools/extractor";
import { extractOffersFromImage } from "@/lib/tools/openrouter";
import { toolCache } from "@/lib/tools/cache";
import { rateLimiter, getClientIdentifier } from "@/lib/tools/rate-limit";
import {
  uploadScreenshot,
  generateScreenshotFilename,
} from "@/lib/tools/screenshot-upload";
import { logger } from "@/lib/logger";

export interface OfferSnapshotResponse {
  url: string;
  offers: ExtractedOffer;
  screenshotUrl?: string;
  timestamp: string;
  cached: boolean;
}

export async function POST(request: Request) {
  const startTime = Date.now();
  logger.debug("offer-snapshot started");

  try {
    // Rate limiting
    const identifier = getClientIdentifier(request);
    logger.debug("[offer-snapshot] client identifier", identifier);

    if (rateLimiter.isRateLimited(identifier)) {
      logger.debug("[offer-snapshot] rate limited");
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { url } = body as { url?: string };

    if (!url || typeof url !== "string") {
      logger.debug("[offer-snapshot] missing or invalid url in body");
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    logger.debug("[offer-snapshot] target url", url);

    if (!isValidStoreUrl(url)) {
      logger.debug("[offer-snapshot] url failed validation");
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }

    const cacheKey = toolCache.getCacheKey(url, "extract");
    const cached = toolCache.get(cacheKey);

    if (cached) {
      logger.debug("[offer-snapshot] cache hit", { url, elapsed: Date.now() - startTime });
      return NextResponse.json({ ...cached, cached: true });
    }

    logger.debug("[offer-snapshot] cache miss, calling fetchStoreHtml", { elapsed: Date.now() - startTime });

    // Fetch rendered HTML + screenshot using Browserless
    const fetchStart = Date.now();
    const { html, finalUrl, screenshotBuffer } = await fetchStoreHtml(url);

    logger.debug("[offer-snapshot] fetchStoreHtml completed", { finalUrl, htmlLength: html?.length, hasScreenshot: !!screenshotBuffer, fetchMs: Date.now() - fetchStart });
    
    // Extract offers from rendered HTML (regex + patterns)
    let offers = extractOffers(html, finalUrl);

    // Visual extraction: use GPT-4o-mini vision on screenshot to catch offers in images/banners
    if (screenshotBuffer) {
      try {
        const visualOffers = await extractOffersFromImage(
          screenshotBuffer,
          env.OPENROUTER_API_KEY
        );
        offers = mergeExtractedOffers(offers, visualOffers);
        logger.debug("[offer-snapshot] visual extraction merged", {
          discounts: offers.discounts.length,
          bundles: offers.bundles.length,
          gifts: offers.gifts.length,
          cartIncentives: offers.cartIncentives.length,
          announcements: offers.announcements.length,
        });
      } catch (visionError) {
        logger.error("[offer-snapshot] Visual offer extraction failed", {
          error: visionError,
          url: finalUrl,
        });
        // Continue with regex-only offers
      }
    }

    // Upload screenshot to R2
    let screenshotUrl: string | undefined;
    if (screenshotBuffer) {
      try {
        const filename = generateScreenshotFilename(finalUrl);
        screenshotUrl = await uploadScreenshot(screenshotBuffer, filename);
      } catch (uploadError) {
        console.error("Screenshot upload failed:", uploadError);
      }
    }

    const result: OfferSnapshotResponse = {
      url: finalUrl,
      offers,
      screenshotUrl,
      timestamp: new Date().toISOString(),
      cached: false,
    };

    // Cache result
    toolCache.set(cacheKey, result);

    logger.debug("[offer-snapshot] success", { url: finalUrl, totalMs: Date.now() - startTime });
    return NextResponse.json(result);
  } catch (error) {
    const elapsed = Date.now() - startTime;
    logger.error("[offer-snapshot] API error", { error, elapsedMs: elapsed });

    if (error instanceof Error) {
      logger.debug("[offer-snapshot] error details", {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to extract offers",
      },
      { status: 500 }
    );
  }
}
