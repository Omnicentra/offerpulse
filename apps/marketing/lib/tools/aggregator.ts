/**
 * Aggregate and deduplicate offers from multiple pages
 * Tracks source pages for each offer and prioritizes by reliability
 */

import type { ExtractedOffer } from "./extractor";
import { logger } from "@/lib/logger";

export interface PageOffers {
  url: string;
  title?: string;
  offers: ExtractedOffer;
  scrapedSuccessfully: boolean;
  error?: string;
  /** Homepage screenshot URL when this page is the homepage */
  screenshotUrl?: string;
}

export interface AggregatedOffer {
  // Each offer item now includes source pages
  discounts: Array<
    ExtractedOffer["discounts"][0] & { sourcePages: string[] }
  >;
  bundles: Array<ExtractedOffer["bundles"][0] & { sourcePages: string[] }>;
  gifts: Array<ExtractedOffer["gifts"][0] & { sourcePages: string[] }>;
  cartIncentives: Array<
    ExtractedOffer["cartIncentives"][0] & { sourcePages: string[] }
  >;
  announcements: Array<{ text: string; sourcePages: string[] }>;
  shippingThreshold?: ExtractedOffer["shippingThreshold"] & {
    sourcePages: string[];
  };
  metaTitle?: string;
  metaDescription?: string;
}

/**
 * Aggregate offers from multiple pages
 * Deduplicates identical offers and tracks source pages
 */
export function aggregateOffers(
  pageOffers: PageOffers[]
): AggregatedOffer {
  const startTime = Date.now();
  logger.debug("[aggregator] aggregateOffers started", {
    totalPages: pageOffers.length,
    successfulPages: pageOffers.filter((p) => p.scrapedSuccessfully).length,
  });

  const aggregated: AggregatedOffer = {
    discounts: [],
    bundles: [],
    gifts: [],
    cartIncentives: [],
    announcements: [],
  };

  // Maps to deduplicate by normalized evidence text
  const discountsMap = new Map<
    string,
    AggregatedOffer["discounts"][0]
  >();
  const bundlesMap = new Map<
    string,
    AggregatedOffer["bundles"][0]
  >();
  const giftsMap = new Map<string, AggregatedOffer["gifts"][0]>();
  const cartIncentivesMap = new Map<
    string,
    AggregatedOffer["cartIncentives"][0]
  >();
  const announcementsMap = new Map<
    string,
    AggregatedOffer["announcements"][0]
  >();
  const shippingThresholdMap = new Map<
    string,
    NonNullable<AggregatedOffer["shippingThreshold"]>
  >();

  // Process each page's offers
  for (const page of pageOffers) {
    if (!page.scrapedSuccessfully || !page.offers) continue;

    const pageLabel = getPageLabel(page);
    const offers = page.offers;

    // Aggregate discounts
    for (const discount of offers.discounts) {
      const key = normalizeEvidence(discount.evidenceText);
      const existing = discountsMap.get(key);
      if (existing) {
        if (!existing.sourcePages.includes(pageLabel)) {
          existing.sourcePages.push(pageLabel);
        }
      } else {
        discountsMap.set(key, {
          ...discount,
          sourcePages: [pageLabel],
        });
      }
    }

    // Aggregate bundles
    for (const bundle of offers.bundles) {
      const key = normalizeEvidence(bundle.evidenceText);
      const existing = bundlesMap.get(key);
      if (existing) {
        if (!existing.sourcePages.includes(pageLabel)) {
          existing.sourcePages.push(pageLabel);
        }
      } else {
        bundlesMap.set(key, {
          ...bundle,
          sourcePages: [pageLabel],
        });
      }
    }

    // Aggregate gifts
    for (const gift of offers.gifts) {
      const key = normalizeEvidence(gift.evidenceText);
      const existing = giftsMap.get(key);
      if (existing) {
        if (!existing.sourcePages.includes(pageLabel)) {
          existing.sourcePages.push(pageLabel);
        }
      } else {
        giftsMap.set(key, {
          ...gift,
          sourcePages: [pageLabel],
        });
      }
    }

    // Aggregate cart incentives
    for (const incentive of offers.cartIncentives) {
      const key = normalizeEvidence(incentive.evidenceText);
      const existing = cartIncentivesMap.get(key);
      if (existing) {
        if (!existing.sourcePages.includes(pageLabel)) {
          existing.sourcePages.push(pageLabel);
        }
      } else {
        cartIncentivesMap.set(key, {
          ...incentive,
          sourcePages: [pageLabel],
        });
      }
    }

    // Aggregate announcements
    for (const announcement of offers.announcements) {
      const key = normalizeEvidence(announcement);
      const existing = announcementsMap.get(key);
      if (existing) {
        if (!existing.sourcePages.includes(pageLabel)) {
          existing.sourcePages.push(pageLabel);
        }
      } else {
        announcementsMap.set(key, {
          text: announcement,
          sourcePages: [pageLabel],
        });
      }
    }

    // Aggregate shipping threshold (prioritize shipping-specific pages)
    if (offers.shippingThreshold) {
      const key = `${offers.shippingThreshold.currency}${offers.shippingThreshold.amount}`;
      const existing = shippingThresholdMap.get(key);
      
      if (existing) {
        if (!existing.sourcePages.includes(pageLabel)) {
          existing.sourcePages.push(pageLabel);
        }
        // Prioritize evidence from shipping-specific pages
        if (isShippingPage(page.url) && !isShippingPage(existing.evidenceText)) {
          existing.evidenceText = offers.shippingThreshold.evidenceText;
          existing.locationHint = offers.shippingThreshold.locationHint;
        }
      } else {
        shippingThresholdMap.set(key, {
          ...offers.shippingThreshold,
          sourcePages: [pageLabel],
        });
      }
    }

    // Keep first meta title/description found
    if (offers.metaTitle && !aggregated.metaTitle) {
      aggregated.metaTitle = offers.metaTitle;
    }
    if (offers.metaDescription && !aggregated.metaDescription) {
      aggregated.metaDescription = offers.metaDescription;
    }
  }

  // Convert maps to arrays
  aggregated.discounts = Array.from(discountsMap.values());
  aggregated.bundles = Array.from(bundlesMap.values());
  aggregated.gifts = Array.from(giftsMap.values());
  aggregated.cartIncentives = Array.from(cartIncentivesMap.values());
  aggregated.announcements = Array.from(announcementsMap.values());

  // Pick the most reliable shipping threshold (prefer shipping page > others)
  const shippingThresholds = Array.from(shippingThresholdMap.values());
  if (shippingThresholds.length > 0) {
    // Sort by: shipping page first, then by most source pages
    shippingThresholds.sort((a, b) => {
      const aIsShipping = a.sourcePages.some((p) =>
        /shipping/i.test(p)
      );
      const bIsShipping = b.sourcePages.some((p) =>
        /shipping/i.test(p)
      );
      if (aIsShipping && !bIsShipping) return -1;
      if (!aIsShipping && bIsShipping) return 1;
      return b.sourcePages.length - a.sourcePages.length;
    });
    aggregated.shippingThreshold = shippingThresholds[0];
  }

  logger.debug("[aggregator] aggregateOffers completed", {
    elapsedMs: Date.now() - startTime,
    discounts: aggregated.discounts.length,
    bundles: aggregated.bundles.length,
    gifts: aggregated.gifts.length,
    cartIncentives: aggregated.cartIncentives.length,
    announcements: aggregated.announcements.length,
    hasShipping: !!aggregated.shippingThreshold,
  });

  return aggregated;
}

/**
 * Normalize evidence text for deduplication
 */
function normalizeEvidence(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s%$£€]/g, ""); // Remove special chars except common offer symbols
}

/**
 * Get a human-readable label for a page
 */
function getPageLabel(page: PageOffers): string {
  const url = new URL(page.url);
  const path = url.pathname;

  // Try to extract a meaningful label from URL
  if (path === "/" || path === "") return "Homepage";
  if (/shipping|delivery/i.test(path)) return "Shipping page";
  if (/returns?|refund/i.test(path)) return "Returns page";
  if (/faq|help|support/i.test(path)) return "FAQ page";
  if (/cart|basket|checkout/i.test(path)) return "Cart page";
  if (/products?|collections?|shop/i.test(path)) return "Product page";
  if (/policies|terms|warranty/i.test(path)) return "Policy page";
  if (/sale|deals|offers/i.test(path)) return "Sale page";
  if (/about/i.test(path)) return "About page";
  if (/contact/i.test(path)) return "Contact page";

  // Use title if available
  if (page.title) {
    const shortTitle = page.title.slice(0, 30);
    return shortTitle + (page.title.length > 30 ? "..." : "");
  }

  // Fallback to last path segment
  const segments = path.split("/").filter(Boolean);
  if (segments.length > 0) {
    return segments[segments.length - 1]
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  return "Page";
}

/**
 * Check if URL is a shipping-related page
 */
function isShippingPage(url: string): boolean {
  return /shipping|delivery|postage/i.test(url);
}

/**
 * Calculate aggregation statistics
 */
export function getAggregationStats(
  pageOffers: PageOffers[],
  aggregated: AggregatedOffer
) {
  const totalPages = pageOffers.length;
  const successfulPages = pageOffers.filter((p) => p.scrapedSuccessfully).length;
  const failedPages = totalPages - successfulPages;

  const totalOffersBeforeAggregation = pageOffers.reduce((sum, page) => {
    if (!page.scrapedSuccessfully) return sum;
    const offers = page.offers;
    return (
      sum +
      offers.discounts.length +
      offers.bundles.length +
      offers.gifts.length +
      offers.cartIncentives.length +
      offers.announcements.length +
      (offers.shippingThreshold ? 1 : 0)
    );
  }, 0);

  const totalOffersAfterAggregation =
    aggregated.discounts.length +
    aggregated.bundles.length +
    aggregated.gifts.length +
    aggregated.cartIncentives.length +
    aggregated.announcements.length +
    (aggregated.shippingThreshold ? 1 : 0);

  return {
    totalPages,
    successfulPages,
    failedPages,
    totalOffersBeforeAggregation,
    totalOffersAfterAggregation,
    deduplicationRate:
      totalOffersBeforeAggregation > 0
        ? Math.round(
            ((totalOffersBeforeAggregation - totalOffersAfterAggregation) /
              totalOffersBeforeAggregation) *
              100
          )
        : 0,
  };
}
