/**
 * Cloudflare R2 screenshot upload utility
 * R2 is S3-compatible, so we use the AWS SDK
 */

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { env } from "@/env";
import { logger } from "../logger";

let s3Client: S3Client | null = null;

/**
 * Get or create S3 client configured for Cloudflare R2
 */
function getS3Client(): S3Client {
  if (s3Client) {
    return s3Client;
  }

  const accountId = env.R2_ACCOUNT_ID;
  const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;

  s3Client = new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
  });

  return s3Client;
}

/**
 * Upload screenshot buffer to R2
 * Returns public URL of the uploaded screenshot
 */
export async function uploadScreenshot(
  buffer: Buffer,
  filename: string
): Promise<string> {
  const client = getS3Client();
  const bucket = env.R2_BUCKET_NAME;
  const key = `snapshots/${filename}`;

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
    const publicUrl = env.R2_PUBLIC_URL;
    return `${publicUrl}/${key}`;
  } catch (error) {
    logger.error(`R2 upload failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    throw new Error(
      `R2 upload failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Generate unique filename for screenshot
 * Format: {domain}-{timestamp}.png
 */
export function generateScreenshotFilename(url: string): string {
  const hostname = new URL(url).hostname.replace(/\./g, "-");
  const timestamp = Date.now();
  return `${hostname}-${timestamp}.png`;
}
