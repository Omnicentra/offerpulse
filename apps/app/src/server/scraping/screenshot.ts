import { env } from "@/env";

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
