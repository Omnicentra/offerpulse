import { NextResponse } from "next/server";
import { env } from "@/env";
import { fetchStoreHtml, isValidStoreUrl } from "@/lib/tools/scraper";
import {
  extractOffers,
  mergeExtractedOffers,
} from "@/lib/tools/extractor";
import { extractOffersFromImage } from "@/lib/tools/openrouter";
import { toolCache } from "@/lib/tools/cache";
import { rateLimiter, getClientIdentifier } from "@/lib/tools/rate-limit";
import {
  uploadScreenshot,
  generateScreenshotFilename,
} from "@/lib/tools/screenshot-upload";
import { logger } from "@/lib/logger";
import { discoverDomainUrls, extractDomain } from "@/lib/tools/firecrawl";
import { filterRelevantUrls } from "@/lib/tools/url-filter";
import {
  aggregateOffers,
  getAggregationStats,
  type PageOffers,
  type AggregatedOffer,
} from "@/lib/tools/aggregator";

export interface PageResult {
  url: string;
  title?: string;
  scrapedSuccessfully: boolean;
  offersFound: number;
  error?: string;
}

export interface OfferSnapshotResponse {
  url: string;
  domain: string;
  offers: AggregatedOffer;
  pagesAnalyzed: PageResult[];
  screenshotUrl?: string;
  timestamp: string;
  cached: boolean;
  stats?: {
    totalPages: number;
    successfulPages: number;
    failedPages: number;
    deduplicationRate: number;
  };
}

export async function POST(request: Request) {
  const startTime = Date.now();
  logger.debug("offer-snapshot started (multi-page mode)");

  try {
    // Rate limiting
    const identifier = getClientIdentifier(request);
    logger.debug("[offer-snapshot] client identifier", identifier);

    if (await rateLimiter.isRateLimited(identifier)) {
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

    const domain = extractDomain(url);
    const cacheKey = toolCache.getCacheKey(domain, "multi-page-extract");
    const cached = toolCache.get(cacheKey);

    if (cached) {
      logger.debug("[offer-snapshot] cache hit", { domain, elapsed: Date.now() - startTime });
      return NextResponse.json({ ...cached, cached: true });
    }

    logger.debug("[offer-snapshot] cache miss, starting multi-page discovery", {
      elapsed: Date.now() - startTime,
    });

    // PHASE 1: URL Discovery using Firecrawl
    const discoveryStart = Date.now();
    const discoveredUrls = await discoverDomainUrls(domain, {
      limit: 100,
      ignoreSitemap: false,
    });
    logger.debug("[offer-snapshot] URL discovery completed", {
      discoveredUrls: discoveredUrls.length,
      discoveryMs: Date.now() - discoveryStart,
    });

    // PHASE 2: Smart URL Filtering
    const filterStart = Date.now();
    const filteredUrls = filterRelevantUrls(discoveredUrls, {
      limit: 20, // Target 15-25 pages
      includeHomepage: true,
    });
    logger.debug("[offer-snapshot] URL filtering completed", {
      filteredUrls: filteredUrls.length,
      filterMs: Date.now() - filterStart,
      topUrls: filteredUrls.slice(0, 5).map((u) => ({
        url: u.url,
        score: u.score,
        reason: u.reason,
      })),
    });

    // PHASE 3: Scraping with concurrency limit (Browserless free plan = 2 concurrent)
    const BROWSERLESS_CONCURRENCY = 2;
    const scrapeStart = Date.now();
    logger.debug("[offer-snapshot] starting scraping with concurrency limit", {
      urlCount: filteredUrls.length,
      concurrency: BROWSERLESS_CONCURRENCY,
    });

    const scrapeOnePage = async (
      urlInfo: (typeof filteredUrls)[0]
    ): Promise<PageOffers> => {
      try {
        const { html, finalUrl, screenshotBuffer } = await fetchStoreHtml(
          urlInfo.url
        );

        // Extract offers from rendered HTML
        let offers = extractOffers(html, finalUrl);

        // Visual extraction for homepage only (to save costs)
        const isHomepage = new URL(finalUrl).pathname === "/";
        if (screenshotBuffer && isHomepage) {
          try {
            const visualOffers = await extractOffersFromImage(
              screenshotBuffer,
              env.OPENROUTER_API_KEY
            );
            offers = mergeExtractedOffers(offers, visualOffers);
          } catch (visionError) {
            logger.error("[offer-snapshot] Visual extraction failed", {
              url: finalUrl,
              error: visionError,
            });
          }
        }

        // Upload screenshot for homepage only
        let screenshotUrl: string | undefined;
        if (screenshotBuffer && isHomepage) {
          try {
            const filename = generateScreenshotFilename(finalUrl);
            screenshotUrl = await uploadScreenshot(screenshotBuffer, filename);
          } catch (uploadError) {
            logger.error("[offer-snapshot] Screenshot upload failed", {
              url: finalUrl,
              error: uploadError,
            });
          }
        }

        return {
          url: finalUrl,
          title: urlInfo.title,
          offers,
          scrapedSuccessfully: true,
          screenshotUrl,
        };
      } catch (error) {
        logger.error("[offer-snapshot] Failed to scrape page", {
          url: urlInfo.url,
          error: error instanceof Error ? error.message : "Unknown error",
        });
        return {
          url: urlInfo.url,
          title: urlInfo.title,
          offers: {
            discounts: [],
            bundles: [],
            gifts: [],
            cartIncentives: [],
            announcements: [],
          },
          scrapedSuccessfully: false,
          error: error instanceof Error ? error.message : "Scraping failed",
        };
      }
    };

    // Process URLs in batches of BROWSERLESS_CONCURRENCY to respect Browserless limit
    const pageOffers: PageOffers[] = [];
    for (let i = 0; i < filteredUrls.length; i += BROWSERLESS_CONCURRENCY) {
      const batch = filteredUrls.slice(i, i + BROWSERLESS_CONCURRENCY);
      const batchResults = await Promise.allSettled(
        batch.map((urlInfo) => scrapeOnePage(urlInfo))
      );
      for (const result of batchResults) {
        if (result.status === "fulfilled") {
          pageOffers.push(result.value);
        }
      }
    }

    logger.debug("[offer-snapshot] scraping completed", {
      totalPages: filteredUrls.length,
      successfulPages: pageOffers.filter((p) => p.scrapedSuccessfully).length,
      scrapeMs: Date.now() - scrapeStart,
    });

    // PHASE 4: Aggregate and deduplicate offers across all pages
    const aggregateStart = Date.now();
    const aggregatedOffers = aggregateOffers(pageOffers);
    const stats = getAggregationStats(pageOffers, aggregatedOffers);
    logger.debug("[offer-snapshot] aggregation completed", {
      ...stats,
      aggregateMs: Date.now() - aggregateStart,
    });

    // Build page results for response
    const pagesAnalyzed: PageResult[] = pageOffers.map((page) => {
      const offerCount = page.scrapedSuccessfully
        ? page.offers.discounts.length +
          page.offers.bundles.length +
          page.offers.gifts.length +
          page.offers.cartIncentives.length +
          page.offers.announcements.length +
          (page.offers.shippingThreshold ? 1 : 0)
        : 0;

      return {
        url: page.url,
        title: page.title,
        scrapedSuccessfully: page.scrapedSuccessfully,
        offersFound: offerCount,
        error: page.error,
      };
    });

    // Find homepage screenshot URL
    const homepageResult = pageOffers.find((p) => {
      try {
        const parsed = new URL(p.url);
        return parsed.pathname === "/" || parsed.pathname === "";
      } catch {
        return false;
      }
    });
    const screenshotUrl = homepageResult?.screenshotUrl;

    const result: OfferSnapshotResponse = {
      url,
      domain,
      offers: aggregatedOffers,
      pagesAnalyzed,
      screenshotUrl,
      timestamp: new Date().toISOString(),
      cached: false,
      stats,
    };

    // Cache result (24 hour cache for multi-page results)
    toolCache.set(cacheKey, result, 24 * 60 * 60 * 1000);

    logger.debug("[offer-snapshot] success (multi-page)", {
      domain,
      totalMs: Date.now() - startTime,
      pagesAnalyzed: pagesAnalyzed.length,
      totalOffers:
        aggregatedOffers.discounts.length +
        aggregatedOffers.bundles.length +
        aggregatedOffers.gifts.length +
        aggregatedOffers.cartIncentives.length +
        aggregatedOffers.announcements.length,
    });

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
        error:
          error instanceof Error ? error.message : "Failed to extract offers",
      },
      { status: 500 }
    );
  }
}
