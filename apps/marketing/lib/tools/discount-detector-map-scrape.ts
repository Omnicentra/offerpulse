/**
 * Discount Detector pipeline: Firecrawl /map for URL discovery, then /scrape on a capped,
 * priority-sorted list of same-origin pages. Findings come from HTML heuristics
 * (`extractDiscountDetectorFindings`) — predictable credits vs /agent.
 *
 * @see https://docs.firecrawl.dev/features/agent (maintainer guidance: map/scrape for known domains)
 */

import { logger } from "@/lib/logger";
import {
  discoverDomainUrls,
  type DiscoveredUrl,
  buildScrollActions,
  scrapeWithFirecrawl,
  FIRECRAWL_CONCURRENCY,
} from "@/lib/tools/firecrawl";
import {
  extractDiscountDetectorFindings,
  mergeDiscountDetectorFindings,
  type DiscountDetectorFindings,
} from "@/lib/tools/discount-detector-extraction";

const PROMO_PATH_RE =
  /sale|promo|offer|discount|deal|coupon|voucher|clearance|outlet|black[-_]?friday|cyber|special|save|bundle|bogo|markdown/i;

export interface DiscountDetectorMapScrapeResult {
  findings: DiscountDetectorFindings;
  /** Approximate Firecrawl credits: 1 map + one per scrape attempt. */
  firecrawlCreditsUsed: number;
  warnings: string[];
  mapUrlCount: number;
  scrapeAttemptCount: number;
}

function normalizeStoreUrl(storeUrl: string): URL {
  const raw = storeUrl.trim();
  const withProto = raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`;
  return new URL(withProto);
}

function isHomePath(pathname: string): boolean {
  const p = pathname.replace(/\/+$/, "") || "/";
  return p === "/";
}

function scorePathname(pathname: string): number {
  const p = pathname.toLowerCase();
  let s = 0;
  if (isHomePath(pathname)) s += 80;
  if (PROMO_PATH_RE.test(p)) s += 100;
  if (/\/collections\//i.test(p)) s += 45;
  if (/\/(cart|checkout|bag|basket)(\/|$)/i.test(p)) s += 40;
  if (/\/products?\//i.test(p)) s += 20;
  return s;
}

/**
 * Pick same-origin URLs from map results: homepage first, then promo-relevant paths, capped.
 */
export function selectDiscountDetectorScrapeUrls(
  discovered: DiscoveredUrl[],
  storeUrl: string,
  maxPages: number,
): string[] {
  const base = normalizeStoreUrl(storeUrl);
  const origin = base.origin;
  const homepageHref = `${origin}/`;

  const seen = new Set<string>();
  const candidates: string[] = [];

  function push(u: string) {
    try {
      const parsed = new URL(u.trim());
      if (parsed.origin !== origin) return;
      const path = parsed.pathname.replace(/\/+$/, "") || "/";
      const key = `${parsed.origin}${path}${parsed.search}`.split("#")[0];
      if (seen.has(key)) return;
      seen.add(key);
      candidates.push(key);
    } catch {
      /* ignore */
    }
  }

  push(homepageHref);
  push(base.href);
  for (const d of discovered) push(d.url);

  if (candidates.length === 0) {
    return [homepageHref];
  }

  const sorted = [...candidates].sort((a, b) => {
    const pa = new URL(a).pathname;
    const pb = new URL(b).pathname;
    const ha = isHomePath(pa);
    const hb = isHomePath(pb);
    if (ha && !hb) return -1;
    if (!ha && hb) return 1;
    const sa = scorePathname(pa);
    const sb = scorePathname(pb);
    if (sa !== sb) return sb - sa;
    return pa.length - pb.length;
  });

  return sorted.slice(0, Math.max(1, maxPages));
}

function isHomepageUrl(url: string): boolean {
  try {
    return isHomePath(new URL(url).pathname);
  } catch {
    return false;
  }
}

export async function runDiscountDetectorMapScrape(options: {
  storeUrl: string;
  mapLimit: number;
  maxScrapePages: number;
}): Promise<DiscountDetectorMapScrapeResult> {
  const { storeUrl, mapLimit, maxScrapePages } = options;
  const warnings: string[] = [];
  const base = normalizeStoreUrl(storeUrl);

  logger.debug("[discount-detector-map-scrape] map start", { storeUrl, mapLimit, maxScrapePages });

  const discovered = await discoverDomainUrls(base.href, { limit: mapLimit });
  const mapUrlCount = discovered.length;

  const targets = selectDiscountDetectorScrapeUrls(discovered, storeUrl, maxScrapePages);
  warnings.push(
    `Discovery: Firecrawl map (${mapUrlCount} URLs) → scraping ${targets.length} prioritized same-origin page(s).`,
  );

  const parts: DiscountDetectorFindings[] = [];
  let scrapeAttemptCount = 0;
  let failedScrapes = 0;

  for (let i = 0; i < targets.length; i += FIRECRAWL_CONCURRENCY) {
    const batch = targets.slice(i, i + FIRECRAWL_CONCURRENCY);
    const chunk = await Promise.all(
      batch.map(async (url) => {
        scrapeAttemptCount += 1;
        const useScroll = isHomepageUrl(url);
        const result = await scrapeWithFirecrawl(url, {
          formats: ["html"],
          timeout: 60_000,
          onlyMainContent: false,
          ...(useScroll ? { actions: buildScrollActions() } : {}),
        });

        if (result.error || !result.html) {
          failedScrapes += 1;
          logger.debug("[discount-detector-map-scrape] scrape failed", {
            url,
            error: result.error,
            useScroll,
          });
          warnings.push(`Scrape failed (${url}): ${result.error ?? "no HTML"}`);
          return emptyFindings();
        }

        return extractDiscountDetectorFindings(result.html, url);
      }),
    );
    parts.push(...chunk);
  }

  if (failedScrapes > 0) {
    warnings.push(`${failedScrapes} of ${scrapeAttemptCount} scrape(s) failed; results may be partial.`);
  }

  const findings = mergeDiscountDetectorFindings(parts);
  const firecrawlCreditsUsed = 1 + scrapeAttemptCount;

  logger.debug("[discount-detector-map-scrape] done", {
    storeUrl,
    mapUrlCount,
    scrapeAttemptCount,
    firecrawlCreditsUsed,
    offers: findings.offers.length,
  });

  return {
    findings,
    firecrawlCreditsUsed,
    warnings,
    mapUrlCount,
    scrapeAttemptCount,
  };
}

function emptyFindings(): DiscountDetectorFindings {
  return {
    offers: [],
    summary: {
      percentageCount: 0,
      fixedAmountCount: 0,
      bundleHintCount: 0,
    },
  };
}
