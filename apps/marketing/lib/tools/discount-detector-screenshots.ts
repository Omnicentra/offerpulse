/**
 * Second-phase screenshots for the Discount Detector: after extraction, scrape a small set of
 * same-origin URLs with `formats: ["screenshot"]`. Each call uses one Firecrawl scrape credit.
 */

import { logger } from "@/lib/logger";
import type { DiscountDetectorFindings } from "@/lib/tools/discount-detector-extraction";
import { scrapeWithFirecrawl, FIRECRAWL_CONCURRENCY } from "@/lib/tools/firecrawl";

export const DISCOUNT_DETECTOR_MAX_SCREENSHOT_URLS = 5;

export interface DiscountDetectorPageScreenshot {
  url: string;
  screenshotUrl?: string;
  error?: string;
}

/**
 * Dedupe same-origin URLs from findings + always include the store URL; homepage first, then stable sort.
 */
export function pickDiscountDetectorScreenshotUrls(
  storeUrl: string,
  findings: DiscountDetectorFindings,
  max: number = DISCOUNT_DETECTOR_MAX_SCREENSHOT_URLS,
): string[] {
  let origin: string;
  try {
    origin = new URL(storeUrl).origin;
  } catch {
    return [];
  }

  const seen = new Set<string>();

  function add(u: string | undefined) {
    if (!u?.trim()) return;
    try {
      const parsed = new URL(u.trim());
      if (parsed.origin !== origin) return;
      seen.add(parsed.href);
    } catch {
      /* ignore */
    }
  }

  add(storeUrl);

  for (const o of findings.offers) add(o.sourceUrl);

  const list = [...seen];
  const isHomePath = (pathname: string) => pathname === "/" || pathname === "";

  list.sort((a, b) => {
    const pa = new URL(a).pathname;
    const pb = new URL(b).pathname;
    if (isHomePath(pa) && !isHomePath(pb)) return -1;
    if (!isHomePath(pa) && isHomePath(pb)) return 1;
    return a.localeCompare(b);
  });

  return list.slice(0, max);
}

export async function scrapeDiscountDetectorScreenshots(
  urls: string[],
): Promise<DiscountDetectorPageScreenshot[]> {
  const out: DiscountDetectorPageScreenshot[] = [];
  for (let i = 0; i < urls.length; i += FIRECRAWL_CONCURRENCY) {
    const batch = urls.slice(i, i + FIRECRAWL_CONCURRENCY);
    const chunk = await Promise.all(
      batch.map(async (url) => {
        const r = await scrapeWithFirecrawl(url, {
          formats: ["screenshot"],
          timeout: 60_000,
          onlyMainContent: false,
        });
        if (r.error) {
          logger.debug("[discount-detector-screenshots] scrape failed", { url, error: r.error });
          return { url, error: r.error };
        }
        if (!r.screenshot) {
          return { url, error: "No screenshot returned" };
        }
        return { url, screenshotUrl: r.screenshot };
      }),
    );
    out.push(...chunk);
  }

  return out;
}
