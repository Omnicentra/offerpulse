import { browserPool } from "./browser-pool";
import { captureScreenshot, uploadScreenshot } from "./screenshot";
import { extractOfferSignals, ExtractedSignals } from "./extractor";
import { Page } from "playwright";

export interface ScrapeResult {
  url: string;
  success: boolean;
  signals: ExtractedSignals;
  screenshotUrl?: string;
  error?: string;
  duration: number;
}

export interface ScrapeOptions {
  url: string;
  captureScreenshot?: boolean;
  timeout?: number;
}

/**
 * Main scraping service
 * Coordinates browser automation, signal extraction, and screenshot capture
 */
export async function scrapeCompetitor(options: ScrapeOptions): Promise<ScrapeResult> {
  const { url, captureScreenshot: shouldCaptureScreenshot = true, timeout = 30000 } = options;
  const startTime = Date.now();

  const context = await browserPool.getContext();
  let page: Page | null = null;

  try {
    page = await context.newPage();

    // Navigate to the competitor's website
    await page.goto(url, {
      waitUntil: "networkidle",
      timeout,
    });

    // Wait a bit for dynamic content to load
    await page.waitForTimeout(2000);

    // Extract offer signals
    const signals = await extractOfferSignals(page);

    // Capture screenshot if enabled
    let screenshotUrl: string | undefined;

    if (shouldCaptureScreenshot) {
      try {
        const screenshot = await captureScreenshot({
          url,
          fullPage: true,
          timeout,
        });

        // Generate filename
        const hostname = new URL(url).hostname.replace(/\./g, "-");
        const timestamp = Date.now();
        const filename = `${hostname}-${timestamp}.png`;

        // Upload screenshot
        screenshotUrl = await uploadScreenshot(screenshot.buffer, filename);
      } catch (screenshotError) {
        console.error("Screenshot capture failed:", screenshotError);
        // Continue without screenshot
      }
    }

    const duration = Date.now() - startTime;

    return {
      url,
      success: true,
      signals,
      screenshotUrl,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;

    return {
      url,
      success: false,
      signals: { confidence: "low" },
      error: error instanceof Error ? error.message : "Unknown scraping error",
      duration,
    };
  } finally {
    if (page) {
      await page.close();
    }
  }
}

/**
 * Batch scrape multiple competitors
 */
export async function scrapeMultipleCompetitors(
  urls: string[],
  options?: Omit<ScrapeOptions, "url">
): Promise<ScrapeResult[]> {
  const results: ScrapeResult[] = [];

  // Process in parallel (max 3 concurrent)
  const concurrency = 3;
  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map((url) => scrapeCompetitor({ url, ...options }))
    );
    results.push(...batchResults);
  }

  return results;
}

// Export all components
export { browserPool } from "./browser-pool";
export { captureScreenshot, uploadScreenshot } from "./screenshot";
export { extractOfferSignals } from "./extractor";
export type { ExtractedSignals };
