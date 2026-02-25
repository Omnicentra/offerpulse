import { NextResponse } from "next/server";
import { env } from "@/env";
import { fetchStoreHtml, isValidStoreUrl } from "@/lib/tools/scraper";
import {
  extractOffers,
  mergeExtractedOffers,
  calculateOfferClarity,
  formatOffersSummary,
} from "@/lib/tools/extractor";
import { suggestClarityFixes, extractOffersFromImage } from "@/lib/tools/openrouter";
import { toolCache } from "@/lib/tools/cache";
import { rateLimiter, getClientIdentifier } from "@/lib/tools/rate-limit";
import {
  uploadScreenshot,
  generateScreenshotFilename,
} from "@/lib/tools/screenshot-upload";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  const startTime = Date.now();
  logger.debug("[extract] POST /api/tools/extract started");

  try {
    // Rate limiting
    const identifier = getClientIdentifier(request);
    logger.debug("[extract] client identifier", identifier);

    if (rateLimiter.isRateLimited(identifier)) {
      logger.debug("[extract] rate limited");
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { url, tool: toolSlug } = body as { url?: string; tool?: string };

    if (!url || typeof url !== "string") {
      logger.debug("[extract] missing or invalid url in body");
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    logger.debug("[extract] target url", url);

    if (!isValidStoreUrl(url)) {
      logger.debug("[extract] url failed validation");
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }

    const isClarityCheck = toolSlug === "offer-clarity-check";
    const cacheKey = toolCache.getCacheKey(
      url,
      isClarityCheck ? "clarity" : "extract"
    );
    const cached = toolCache.get(cacheKey);

    if (cached) {
      logger.debug("[extract] cache hit", { url, elapsed: Date.now() - startTime });
      return NextResponse.json({ ...cached, cached: true });
    }

    logger.debug("[extract] cache miss, calling fetchStoreHtml", { elapsed: Date.now() - startTime });

    // Fetch rendered HTML + screenshot using Browserless
    const fetchStart = Date.now();
    const { html, finalUrl, screenshotBuffer } = await fetchStoreHtml(url);

    logger.debug("[extract] fetchStoreHtml completed", { finalUrl, htmlLength: html?.length, hasScreenshot: !!screenshotBuffer, fetchMs: Date.now() - fetchStart });
    
    // Extract offers from rendered HTML (regex + patterns)
    let offers = extractOffers(html, finalUrl);

    // Visual extraction: use GPT-4o-mini vision on screenshot to catch offers in images/banners
    if (screenshotBuffer && !isClarityCheck) {
      try {
        const visualOffers = await extractOffersFromImage(
          screenshotBuffer,
          env.OPENROUTER_API_KEY
        );
        offers = mergeExtractedOffers(offers, visualOffers);
        logger.debug("[extract] visual extraction merged", {
          discounts: offers.discounts.length,
          bundles: offers.bundles.length,
          gifts: offers.gifts.length,
          cartIncentives: offers.cartIncentives.length,
          announcements: offers.announcements.length,
        });
      } catch (visionError) {
        logger.error("[extract] Visual offer extraction failed", {
          error: visionError,
          url: finalUrl,
        });
        // Continue with regex-only offers
      }
    }

    // Upload screenshot to R2 if captured (for extract/snapshot; clarity can omit to save cost)
    let screenshotUrl: string | undefined;
    if (screenshotBuffer && !isClarityCheck) {
      try {
        const filename = generateScreenshotFilename(finalUrl);
        screenshotUrl = await uploadScreenshot(screenshotBuffer, filename);
      } catch (uploadError) {
        console.error("Screenshot upload failed:", uploadError);
      }
    }

    const result: {
      url: string;
      offers: ReturnType<typeof extractOffers>;
      screenshotUrl?: string;
      timestamp: string;
      cached: boolean;
      clarity?: {
        score: number;
        issues: string[];
        strengths: string[];
        suggestions: Array<{ title: string; description: string; priority: "high" | "medium" | "low" }>;
      };
    } = {
      url: finalUrl,
      offers,
      screenshotUrl,
      timestamp: new Date().toISOString(),
      cached: false,
    };

    if (isClarityCheck) {
      const clarity = calculateOfferClarity(html);
      const offersSummary = formatOffersSummary(offers);
      try {
        const suggestions = await suggestClarityFixes(
          {
            url: finalUrl,
            score: clarity.score,
            issues: clarity.issues,
            strengths: clarity.strengths,
            offersSummary,
          },
          env.OPENROUTER_API_KEY
        );
        result.clarity = {
          score: clarity.score,
          issues: clarity.issues,
          strengths: clarity.strengths,
          suggestions,
        };
      } catch (openRouterError) {
        logger.error("[extract] OpenRouter clarity suggestions failed", {
          error: openRouterError,
          url: finalUrl,
        });
        result.clarity = {
          score: clarity.score,
          issues: clarity.issues,
          strengths: clarity.strengths,
          suggestions: [],
        };
      }
    }

    // Cache result
    toolCache.set(cacheKey, result);

    logger.debug("[extract] success", { url: finalUrl, totalMs: Date.now() - startTime });
    return NextResponse.json(result);
  } catch (error) {
    const elapsed = Date.now() - startTime;
    logger.error("[extract] Extract API error", { error, elapsedMs: elapsed });

    if (error instanceof Error) {
      logger.debug("[extract] error details", {
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
