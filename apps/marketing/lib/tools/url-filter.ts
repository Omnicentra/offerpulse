/**
 * Smart URL filtering for ecommerce offer discovery
 * Prioritizes pages most likely to contain offer information
 */

import type { DiscoveredUrl } from "./firecrawl";
import { logger } from "@/lib/logger";

export interface ScoredUrl extends DiscoveredUrl {
  score: number;
  reason: string;
}

/**
 * Filter and prioritize URLs based on relevance for offer detection
 * Returns top N URLs ordered by relevance score
 */
export function filterRelevantUrls(
  urls: DiscoveredUrl[],
  options: {
    limit?: number;
    includeHomepage?: boolean;
  } = {}
): ScoredUrl[] {
  const { limit = 20, includeHomepage = true } = options;

  logger.debug("[url-filter] filterRelevantUrls started", {
    totalUrls: urls.length,
    limit,
  });

  const scoredUrls: ScoredUrl[] = urls.map((url) => ({
    ...url,
    score: scoreUrl(url),
    reason: getScoreReason(url),
  }));

  // Sort by score descending
  scoredUrls.sort((a, b) => b.score - a.score);

  // If homepage is not in top results but includeHomepage is true, ensure it's included
  if (includeHomepage) {
    const hasHomepage = scoredUrls
      .slice(0, limit)
      .some((u) => isHomepage(u.url));
    if (!hasHomepage) {
      const homepage = scoredUrls.find((u) => isHomepage(u.url));
      if (homepage) {
        // Remove homepage from its current position and add to top
        const filtered = scoredUrls.filter((u) => u.url !== homepage.url);
        scoredUrls.splice(0, 0, homepage);
      }
    }
  }

  const filtered = scoredUrls.slice(0, limit);

  logger.debug("[url-filter] filterRelevantUrls completed", {
    totalUrls: urls.length,
    filteredUrls: filtered.length,
    topScores: filtered.slice(0, 5).map((u) => ({
      url: u.url,
      score: u.score,
      reason: u.reason,
    })),
  });

  return filtered;
}

/**
 * Score a URL based on relevance for offer detection
 * Higher score = more likely to contain valuable offer information
 */
function scoreUrl(url: DiscoveredUrl): number {
  const urlLower = url.url.toLowerCase();
  const titleLower = url.title?.toLowerCase() || "";
  const descLower = url.description?.toLowerCase() || "";
  const combinedText = `${urlLower} ${titleLower} ${descLower}`;

  let score = 0;

  // HIGH PRIORITY PATTERNS (Score: 100+)
  // Shipping & delivery pages
  if (
    /\/(shipping|delivery|postage|freight)/.test(urlLower) ||
    /(shipping|delivery|postage) (policy|information|info)/.test(combinedText)
  ) {
    score += 100;
  }

  // Returns & refund pages
  if (
    /\/(returns?|refunds?|guarantee)/.test(urlLower) ||
    /(returns?|refunds?) (policy|information)/.test(combinedText)
  ) {
    score += 95;
  }

  // FAQ & help pages
  if (
    /\/(faq|help|support|customer-service)/.test(urlLower) ||
    /(frequently asked|faq|help center)/.test(combinedText)
  ) {
    score += 90;
  }

  // Cart & checkout pages
  if (
    /\/(cart|basket|checkout|bag)/.test(urlLower) ||
    /(shopping cart|checkout|basket)/.test(combinedText)
  ) {
    score += 95;
  }

  // Product & collection pages
  if (
    /\/(products?|collections?|shop|catalogue|catalog)/.test(urlLower) ||
    /(shop all|all products|collections)/.test(combinedText)
  ) {
    score += 85;
  }

  // Policy pages (terms, warranty, etc)
  if (
    /\/(policies|terms|warranty|conditions)/.test(urlLower) ||
    /(terms and conditions|privacy policy|warranty)/.test(combinedText)
  ) {
    score += 80;
  }

  // Sale & promotion pages
  if (
    /\/(sale|deals|offers|promotions?|discounts?)/.test(urlLower) ||
    /(sale|deals|special offer|promotion)/.test(combinedText)
  ) {
    score += 90;
  }

  // MEDIUM PRIORITY PATTERNS (Score: 40-60)
  // Homepage
  if (isHomepage(url.url)) {
    score += 60;
  }

  // About pages
  if (
    /\/(about|our-story|who-we-are)/.test(urlLower) ||
    /about us/i.test(combinedText)
  ) {
    score += 40;
  }

  // Contact pages
  if (
    /\/(contact|get-in-touch|reach-us)/.test(urlLower) ||
    /contact us/i.test(combinedText)
  ) {
    score += 35;
  }

  // LOW PRIORITY PATTERNS (Score: 10-20)
  // Blog & news
  if (
    /\/(blog|news|articles?|press)/.test(urlLower) ||
    /(blog|news|article)/.test(combinedText)
  ) {
    score += 15;
  }

  // Careers
  if (/\/(careers?|jobs|work-with-us)/.test(urlLower)) {
    score += 10;
  }

  // EXCLUSIONS (Score: -100, effectively removed)
  // Login, account, auth pages
  if (
    /\/(login|signin|sign-in|register|signup|sign-up|account|my-account|profile)/.test(
      urlLower
    )
  ) {
    score = -100;
  }

  // Media files
  if (/\.(pdf|jpg|jpeg|png|gif|svg|webp|mp4|mov|avi)$/i.test(urlLower)) {
    score = -100;
  }

  // Admin, API, or system pages
  if (
    /\/(admin|api|wp-admin|wp-json|\.well-known)/.test(urlLower) ||
    /\/_(next|nuxt|vercel)/.test(urlLower)
  ) {
    score = -100;
  }

  // Duplicate or variant pages (with query params that aren't important)
  if (/\?(utm_|fbclid|gclid|ref=|source=)/.test(urlLower)) {
    score -= 20;
  }

  return score;
}

/**
 * Get human-readable reason for URL score
 */
function getScoreReason(url: DiscoveredUrl): string {
  const urlLower = url.url.toLowerCase();
  const titleLower = url.title?.toLowerCase() || "";
  const combinedText = `${urlLower} ${titleLower}`;

  if (isHomepage(url.url)) return "Homepage";
  if (/\/(shipping|delivery|postage)/.test(urlLower)) return "Shipping page";
  if (/\/(returns?|refunds?)/.test(urlLower)) return "Returns page";
  if (/\/(faq|help|support)/.test(urlLower)) return "FAQ/Help page";
  if (/\/(cart|basket|checkout)/.test(urlLower)) return "Cart/Checkout page";
  if (/\/(products?|collections?|shop)/.test(urlLower))
    return "Product/Collection page";
  if (/\/(policies|terms|warranty)/.test(urlLower)) return "Policy page";
  if (/\/(sale|deals|offers|promotions?)/.test(urlLower))
    return "Sale/Promotion page";
  if (/\/(about|our-story)/.test(urlLower)) return "About page";
  if (/\/(contact)/.test(urlLower)) return "Contact page";
  if (/\/(blog|news|articles?)/.test(urlLower)) return "Blog/News page";

  return "Other page";
}

/**
 * Check if URL is the homepage
 */
function isHomepage(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.pathname === "/" || parsed.pathname === "";
  } catch {
    return false;
  }
}

/**
 * Group URLs by category for reporting
 */
export function categorizeUrls(urls: ScoredUrl[]): Record<string, ScoredUrl[]> {
  const categories: Record<string, ScoredUrl[]> = {
    homepage: [],
    shipping: [],
    returns: [],
    faq: [],
    cart: [],
    products: [],
    policies: [],
    sale: [],
    other: [],
  };

  for (const url of urls) {
    const reason = url.reason.toLowerCase();
    if (reason.includes("homepage")) categories.homepage.push(url);
    else if (reason.includes("shipping")) categories.shipping.push(url);
    else if (reason.includes("returns")) categories.returns.push(url);
    else if (reason.includes("faq") || reason.includes("help"))
      categories.faq.push(url);
    else if (reason.includes("cart") || reason.includes("checkout"))
      categories.cart.push(url);
    else if (reason.includes("product") || reason.includes("collection"))
      categories.products.push(url);
    else if (reason.includes("policy")) categories.policies.push(url);
    else if (reason.includes("sale") || reason.includes("promotion"))
      categories.sale.push(url);
    else categories.other.push(url);
  }

  return categories;
}
