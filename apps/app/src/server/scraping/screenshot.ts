import { Page } from "playwright";
import { browserPool } from "./browser-pool";
import { env } from "@/env";

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
 * Uploads a screenshot buffer to Cloudflare R2
 */
export async function uploadScreenshot(
  buffer: Buffer,
  filename: string
): Promise<string> {
  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");

  const accountId = env.R2_ACCOUNT_ID;
  const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;

  const client = new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
  });

  const bucket = env.R2_BUCKET_NAME;
  const key = `${env.DOPPLER_ENVIRONMENT}/screenshots/${filename}`;

  try {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: "image/png",
      CacheControl: "public, max-age=31536000", // 1 year cache
    });

    await client.send(command);

    // Return public URL
    const publicUrl = env.R2_PUBLIC_URL || `https://cdn.offerpulse.com`;
    return `${publicUrl}/${key}`;
  } catch (error) {
    throw new Error(
      `R2 upload failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
