import { NextResponse } from "next/server";
import { fetchStoreHtml, isValidStoreUrl } from "@/lib/tools/scraper";
import { extractOffers } from "@/lib/tools/extractor";
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
    const { url } = body;

    if (!url || typeof url !== "string") {
      logger.debug("[extract] missing or invalid url in body");
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    logger.debug("[extract] target url", url);

    if (!isValidStoreUrl(url)) {
      logger.debug("[extract] url failed validation");
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }

    // Check cache first
    const cacheKey = toolCache.getCacheKey(url, "extract");
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
    
    // Extract offers from rendered HTML
    const offers = extractOffers(html, finalUrl);

    // Upload screenshot to R2 if captured
    let screenshotUrl: string | undefined;
    if (screenshotBuffer) {
      try {
        const filename = generateScreenshotFilename(finalUrl);
        screenshotUrl = await uploadScreenshot(screenshotBuffer, filename);
      } catch (uploadError) {
        console.error("Screenshot upload failed:", uploadError);
        // Continue without screenshot URL
      }
    }

    const result = {
      url: finalUrl,
      offers,
      screenshotUrl,
      timestamp: new Date().toISOString(),
      cached: false,
    };

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
