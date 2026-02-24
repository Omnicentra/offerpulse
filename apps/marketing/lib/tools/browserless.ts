/**
 * Browserless.io connection helper
 * Provides remote Playwright browser access for JS-rendered HTML extraction
 */

import { chromium, Browser, BrowserContext } from "playwright-core";
import { env } from "@/env";

let cachedBrowser: Browser | null = null;

export interface BrowserlessConfig {
  apiKey: string;
  wssUrl: string;
}

/**
 * Get Browserless WebSocket endpoint with API key
 */
export function getBrowserlessWsEndpoint(blockAds = true): string {
  const apiKey = env.BROWSERLESS_API_KEY;
  const baseUrl = env.BROWSERLESS_WSS_URL;
  
  let endpoint = `${baseUrl}/chrome/content?token=${apiKey}`;
  
  if (blockAds) {
    endpoint += `&blockAds=true`;
  }
  
  // Log endpoint without exposing full API key (only first/last 4 chars)
  const maskedKey = apiKey.length > 8 
    ? `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`
    : "***";
  console.log(`[browserless] connecting to ${baseUrl} with key ${maskedKey}`);
  
  return endpoint;
}

/**
 * Connect to Browserless remote browser with retry logic
 * Reuses cached connection if available
 */
export async function getBrowserlessConnection(retries = 2): Promise<Browser> {
  if (cachedBrowser && cachedBrowser.isConnected()) {
    console.log("[browserless] reusing cached browser connection");
    return cachedBrowser;
  }

  const wsEndpoint = getBrowserlessWsEndpoint();
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`[browserless] retry attempt ${attempt}/${retries} after ${backoffMs}ms`);
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }

      const connectStart = Date.now();
      console.log(`[browserless] connecting to remote browser (attempt ${attempt + 1}/${retries + 1}, timeout: 30s)...`);

      cachedBrowser = await chromium.connect(wsEndpoint, {
        timeout: 30000,
      });

      console.log(`[browserless] connected successfully (${Date.now() - connectStart}ms)`);
      return cachedBrowser;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown error");
      console.error(`[browserless] connection attempt ${attempt + 1} failed:`, {
        error: lastError.message,
        attempt: attempt + 1,
        retriesLeft: retries - attempt,
      });

      // Don't retry on auth errors
      if (lastError.message.includes("401") || lastError.message.includes("403")) {
        console.error("[browserless] authentication error, not retrying");
        break;
      }
    }
  }

  console.error("[browserless] all connection attempts failed:", {
    error: lastError?.message,
    wsEndpoint: wsEndpoint.replace(/token=[^&]+/, "token=***"),
  });

  throw new Error(
    `Failed to connect to Browserless after ${retries + 1} attempts: ${lastError?.message || "Unknown error"}`
  );
}

/**
 * Create a new browser context for scraping
 */
export async function createBrowserContext(): Promise<BrowserContext> {
  const browser = await getBrowserlessConnection();
  
  return await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    locale: "en-GB",
    timezoneId: "Europe/London",
  });
}

/**
 * Close browser connection
 */
export async function closeBrowserConnection(): Promise<void> {
  if (cachedBrowser) {
    try {
      await cachedBrowser.close();
    } catch (error) {
      console.error("Error closing Browserless connection:", error);
    } finally {
      cachedBrowser = null;
    }
  }
}
