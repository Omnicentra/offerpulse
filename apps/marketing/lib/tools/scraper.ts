/**
 * Server-side scraping utilities for free tools
 * Uses Firecrawl for JS-rendered HTML extraction + screenshot capture
 */

import { scrapeWithFirecrawl } from "./firecrawl";
import { logger } from "@/lib/logger";

interface FetchResult {
  html: string;
  finalUrl: string;
  statusCode: number;
  screenshotBuffer?: Buffer;
  screenshotUrl?: string;
}

interface FetchOptions {
  includeScreenshot?: boolean;
}

async function downloadImageAsBuffer(url: string): Promise<Buffer | undefined> {
  try {
    const response = await fetch(url);
    if (!response.ok) return undefined;
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch {
    return undefined;
  }
}

export async function fetchStoreHtml(
  url: string,
  options: FetchOptions = {}
): Promise<FetchResult> {
  const startTime = Date.now();
  const includeScreenshot = options.includeScreenshot ?? true;

  logger.debug("[scraper] fetchStoreHtml started", {
    url,
    method: "firecrawl",
    includeScreenshot,
  });

  // Validate URL
  try {
    new URL(url);
  } catch {
    logger.debug("[scraper] invalid URL format", { url });
    throw new Error("Invalid URL format");
  }

  try {
    const scrapeResult = await scrapeWithFirecrawl(url, {
      formats: includeScreenshot ? ["html", "screenshot"] : ["html"],
      timeout: 60_000,
      onlyMainContent: false,
    });

    if (scrapeResult.error) {
      throw new Error(scrapeResult.error);
    }

    if (!scrapeResult.html) {
      throw new Error("Firecrawl did not return HTML content");
    }

    let screenshotBuffer: Buffer | undefined;
    if (includeScreenshot && scrapeResult.screenshot) {
      screenshotBuffer = await downloadImageAsBuffer(scrapeResult.screenshot);
    }

    return {
      html: scrapeResult.html,
      finalUrl: url,
      statusCode: 200,
      screenshotBuffer,
      screenshotUrl: scrapeResult.screenshot,
    };
  } catch (error) {
    const originalMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error("[scraper] fetchStoreHtml failed", {
      url,
      elapsedMs: Date.now() - startTime,
      error: originalMessage,
    });

    if (error instanceof Error) {
      if (error.message.includes("Timeout")) {
        throw new Error(
          `Request timeout - store took too long to respond (${originalMessage})`
        );
      }
      throw new Error(`Scraping failed: ${originalMessage}`);
    }

    throw new Error("Failed to fetch store HTML");
  }
}

export function isValidStoreUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}
