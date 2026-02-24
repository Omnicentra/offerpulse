/**
 * Server-side scraping utilities for free tools
 * Uses Browserless.io for JS-rendered HTML extraction + screenshot capture
 */

import { createBrowserContext } from "./browserless";
import { fetchViaRest } from "./browserless-rest";
import { logger } from "@/lib/logger";

// Toggle between WebSocket (Playwright) and REST API
const USE_REST_API = true;

interface FetchResult {
  html: string;
  finalUrl: string;
  statusCode: number;
  screenshotBuffer?: Buffer;
}

export async function fetchStoreHtml(url: string): Promise<FetchResult> {
  const startTime = Date.now();
  logger.debug("[scraper] fetchStoreHtml started", { url, method: USE_REST_API ? "REST" : "WebSocket" });

  // Validate URL
  try {
    new URL(url);
  } catch {
    logger.debug("[scraper] invalid URL format", { url });
    throw new Error("Invalid URL format");
  }

  // Use REST API if enabled (more reliable for one-off scrapes)
  if (USE_REST_API) {
    try {
      const { html, screenshotBuffer } = await fetchViaRest(url);
      
      return {
        html,
        finalUrl: url,
        statusCode: 200,
        screenshotBuffer,
      };
    } catch (error) {
      const originalMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error("[scraper] REST API fetch failed", { url, elapsedMs: Date.now() - startTime, error: originalMessage });
      throw new Error(`Scraping failed: ${originalMessage}`);
    }
  }

  // WebSocket / Playwright method (original)
  let context;
  let page;

  try {
    // Connect to Browserless remote browser
    const ctxStart = Date.now();
    context = await createBrowserContext();
    logger.debug("[scraper] createBrowserContext done", { ms: Date.now() - ctxStart });

    page = await context.newPage();
    logger.debug("[scraper] newPage done", { ms: Date.now() - ctxStart });

    // Use "load" instead of "networkidle": many stores never go idle (analytics, chat, ads),
    // so networkidle often times out. "load" fires when the page has loaded; we then wait
    // a fixed time for JS-rendered content (banners, offers).
    const navTimeout = 25000; // 25s — stay under common headless-service limits
    const navStart = Date.now();
    logger.debug("[scraper] page.goto starting", { url, waitUntil: "load", timeout: navTimeout });

    const response = await page.goto(url, {
      waitUntil: "load",
      timeout: navTimeout,
    });

    logger.debug("[scraper] page.goto completed", { url, ms: Date.now() - navStart, status: response?.status() });

    if (!response) {
      logger.error("[scraper] page.goto returned no response", { url });
      throw new Error("Failed to load page - no response received");
    }

    // Wait for dynamic content (banners, promo bars, cart widgets)
    const jsWaitMs = 3500;
    logger.debug("[scraper] waiting for JS render", { ms: jsWaitMs });
    await page.waitForTimeout(jsWaitMs);

    // Extract rendered HTML
    const html = await page.content();
    const finalUrl = page.url();
    const statusCode = response.status();

    // Capture screenshot
    let screenshotBuffer: Buffer | undefined;
    try {
      const screenshot = await page.screenshot({
        fullPage: true,
        type: "png",
      });
      screenshotBuffer = Buffer.from(screenshot);
    } catch (screenshotError) {
      logger.error("Screenshot capture failed:", screenshotError);
      // Continue without screenshot
    }

    return {
      html,
      finalUrl,
      statusCode,
      screenshotBuffer,
    };
  } catch (error) {
    const originalMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error("[scraper] fetchStoreHtml failed", { url, elapsedMs: Date.now() - startTime, error: originalMessage });

    if (error instanceof Error) {
      if (error.message.includes("Timeout")) {
        throw new Error(`Request timeout - store took too long to respond (${originalMessage})`);
      }
      throw new Error(`Scraping failed: ${originalMessage}`);
    }

    throw new Error("Failed to fetch store HTML");
  } finally {
    // Clean up
    if (page) {
      try {
        await page.close();
      } catch (err) {
        console.error("Error closing page:", err);
      }
    }
    if (context) {
      try {
        await context.close();
      } catch (err) {
        console.error("Error closing context:", err);
      }
    }
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
