import { Page } from "playwright";
import { browserPool } from "./browser-pool";

export interface ScreenshotOptions {
  url: string;
  fullPage?: boolean;
  waitForSelector?: string;
  timeout?: number;
}

export interface ScreenshotResult {
  buffer: Buffer;
  contentType: string;
  timestamp: Date;
}

/**
 * Captures a screenshot of a webpage
 */
export async function captureScreenshot(
  options: ScreenshotOptions
): Promise<ScreenshotResult> {
  const { url, fullPage = true, waitForSelector, timeout = 30000 } = options;

  const context = await browserPool.getContext();
  let page: Page | null = null;

  try {
    page = await context.newPage();

    // Navigate to URL
    await page.goto(url, {
      waitUntil: "networkidle",
      timeout,
    });

    // Wait for specific selector if provided
    if (waitForSelector) {
      await page.waitForSelector(waitForSelector, { timeout: 10000 });
    }

    // Take screenshot
    const buffer = await page.screenshot({
      fullPage,
      type: "png",
    });

    return {
      buffer: Buffer.from(buffer),
      contentType: "image/png",
      timestamp: new Date(),
    };
  } catch (error) {
    throw new Error(
      `Screenshot capture failed for ${url}: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  } finally {
    if (page) {
      await page.close();
    }
    // Note: We don't release the context as it's managed by the pool
  }
}

/**
 * Uploads a screenshot buffer to storage (R2 or S3)
 * TODO: Implement actual upload in Phase 5
 */
export async function uploadScreenshot(
  buffer: Buffer,
  filename: string
): Promise<string> {
  // For now, return a mock URL
  // In production, this would upload to Cloudflare R2 or AWS S3
  console.log(`📸 Would upload screenshot: ${filename} (${buffer.length} bytes)`);

  const mockUrl = `https://cdn.offerpulse.com/screenshots/${filename}`;
  return mockUrl;
}
