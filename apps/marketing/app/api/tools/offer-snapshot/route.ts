import { NextResponse } from "next/server";
import { env } from "@/env";
import { fetchStoreHtml, isValidStoreUrl } from "@/lib/tools/scraper";
import {
  extractOffers,
  mergeExtractedOffers,
} from "@/lib/tools/extractor";
import { extractOffersFromImage } from "@/lib/tools/openrouter";
import { rateLimiter, getClientIdentifier } from "@/lib/tools/rate-limit";
import {
  uploadScreenshot,
  generateScreenshotFilename,
} from "@/lib/tools/screenshot-upload";
import { logger } from "@/lib/logger";
import {
  discoverDomainUrls,
  extractDomain,
  scrapeWithFirecrawl,
  buildScrollActions,
  buildCheckoutFlowActions,
  FIRECRAWL_CONCURRENCY,
} from "@/lib/tools/firecrawl";
import { filterRelevantUrls, pickProductUrl } from "@/lib/tools/url-filter";
import {
  aggregateOffers,
  getAggregationStats,
  type PageOffers,
  type AggregatedOffer,
} from "@/lib/tools/aggregator";

export type AdvancedFlow = "scroll" | "checkout";

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
    logger.debug("[offer-snapshot] client identifier", { identifier });

    const rateLimitResult = await rateLimiter.checkLimit(identifier);
    
    // Always include rate limit headers for transparency
    const headers = new Headers({
      "X-RateLimit-Limit": rateLimitResult.limit.toString(),
      "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
      "X-RateLimit-Reset": new Date(rateLimitResult.reset).toISOString(),
    });

    if (!rateLimitResult.success) {
      logger.debug("[offer-snapshot] rate limited", {
        identifier,
        remaining: rateLimitResult.remaining,
        reset: new Date(rateLimitResult.reset).toISOString(),
      });
      return NextResponse.json(
        { 
          error: "Rate limit exceeded. Please try again later.",
          resetAt: new Date(rateLimitResult.reset).toISOString(),
        },
        { status: 429, headers }
      );
    }

    const body = await request.json();
    const { url, flows: rawFlows } = body as {
      url?: string;
      flows?: AdvancedFlow[];
    };

    if (!url || typeof url !== "string") {
      logger.debug("[offer-snapshot] missing or invalid url in body");
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const flows: AdvancedFlow[] = Array.isArray(rawFlows)
      ? rawFlows.filter((f): f is AdvancedFlow => f === "scroll" || f === "checkout")
      : [];

    logger.debug("[offer-snapshot] target url", { url, flows });

    if (!isValidStoreUrl(url)) {
      logger.debug("[offer-snapshot] url failed validation");
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }

    const domain = extractDomain(url);

    logger.debug("[offer-snapshot] starting multi-page discovery", {
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

    // PHASE 3: Scraping with concurrency limit (Firecrawl API)
    const scrapeStart = Date.now();
    logger.debug("[offer-snapshot] starting scraping with concurrency limit", {
      urlCount: filteredUrls.length,
      concurrency: FIRECRAWL_CONCURRENCY,
    });

    const scrapeOnePage = async (
      urlInfo: (typeof filteredUrls)[0]
    ): Promise<PageOffers> => {
      try {
        const { html, finalUrl, screenshotBuffer, screenshotUrl: firecrawlScreenshotUrl } = await fetchStoreHtml(
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

        // Use Firecrawl screenshot URL directly for homepage (same as dashboard pipeline).
        // Fallback to R2 upload only if we don't receive Firecrawl screenshot URL.
        let screenshotUrl: string | undefined;
        if (isHomepage && firecrawlScreenshotUrl) {
          screenshotUrl = firecrawlScreenshotUrl;
        } else if (screenshotBuffer && isHomepage) {
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

    // Process URLs in batches to avoid overloading the scraping provider
    const pageOffers: PageOffers[] = [];
    for (let i = 0; i < filteredUrls.length; i += FIRECRAWL_CONCURRENCY) {
      const batch = filteredUrls.slice(i, i + FIRECRAWL_CONCURRENCY);
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

    // PHASE 3b: Advanced flows (Firecrawl with browser actions)
    if (flows.length > 0) {
      const advancedStart = Date.now();
      logger.debug("[offer-snapshot] starting advanced flows", { flows });

      const advancedPromises: Promise<PageOffers | null>[] = [];

      // Scroll flow: re-scrape homepage with scroll actions to reveal lazy-loaded promos
      if (flows.includes("scroll")) {
        const homepageUrl = filteredUrls.find((u) => {
          try { return new URL(u.url).pathname === "/"; } catch { return false; }
        });
        if (homepageUrl) {
          advancedPromises.push(
            (async (): Promise<PageOffers | null> => {
              try {
                const scrollResult = await scrapeWithFirecrawl(homepageUrl.url, {
                  formats: ["html"],
                  actions: buildScrollActions(),
                  timeout: 60_000,
                });
                if (scrollResult.error || !scrollResult.html) {
                  logger.error("[offer-snapshot] scroll flow failed", {
                    url: homepageUrl.url,
                    error: scrollResult.error,
                  });
                  return null;
                }
                const offers = extractOffers(scrollResult.html, homepageUrl.url);
                return {
                  url: homepageUrl.url,
                  title: "Homepage (after scroll)",
                  offers,
                  scrapedSuccessfully: true,
                };
              } catch (err) {
                logger.error("[offer-snapshot] scroll flow error", {
                  url: homepageUrl.url,
                  error: err instanceof Error ? err.message : "Unknown error",
                });
                return null;
              }
            })(),
          );
        }
      }

      // Checkout flow: add-to-cart → cart/checkout on a product page
      if (flows.includes("checkout")) {
        const productUrl = pickProductUrl(filteredUrls);
        if (productUrl) {
          advancedPromises.push(
            (async (): Promise<PageOffers | null> => {
              try {
                const checkoutResult = await scrapeWithFirecrawl(productUrl.url, {
                  formats: ["html"],
                  actions: buildCheckoutFlowActions(),
                  timeout: 120_000,
                });

                if (checkoutResult.error) {
                  logger.error("[offer-snapshot] checkout flow failed", {
                    url: productUrl.url,
                    error: checkoutResult.error,
                  });
                  return null;
                }

                // Prefer the scrape action result (captures cart/checkout page)
                const checkoutHtml =
                  checkoutResult.actionScrapes?.[0]?.html ?? checkoutResult.html;
                const checkoutUrl =
                  checkoutResult.actionScrapes?.[0]?.url ?? productUrl.url;

                if (!checkoutHtml) return null;

                const offers = extractOffers(checkoutHtml, checkoutUrl);
                return {
                  url: checkoutUrl,
                  title: "Checkout (via add-to-cart flow)",
                  offers,
                  scrapedSuccessfully: true,
                };
              } catch (err) {
                logger.error("[offer-snapshot] checkout flow error", {
                  url: productUrl.url,
                  error: err instanceof Error ? err.message : "Unknown error",
                });
                return null;
              }
            })(),
          );
        } else {
          logger.debug("[offer-snapshot] no product URL found for checkout flow");
        }
      }

      const advancedResults = await Promise.allSettled(advancedPromises);
      for (const result of advancedResults) {
        if (result.status === "fulfilled" && result.value) {
          pageOffers.push(result.value);
        }
      }

      logger.debug("[offer-snapshot] advanced flows completed", {
        flows,
        additionalPages: advancedResults.filter(
          (r) => r.status === "fulfilled" && r.value,
        ).length,
        advancedMs: Date.now() - advancedStart,
      });
    }

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
      stats,
    };

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

    return NextResponse.json(result, { headers });
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
