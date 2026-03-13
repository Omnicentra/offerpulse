import crypto from "node:crypto";
import type { ShopifyOAuthTokenResponse } from "./types";

/**
 * Verify Shopify OAuth callback HMAC signature.
 * Query params must be sorted alphabetically, hmac removed, then hashed with API secret.
 */
export function verifyShopifyHmac(
  params: URLSearchParams,
  secret: string
): boolean {
  const hmac = params.get("hmac");
  if (!hmac) return false;

  const sorted = new URLSearchParams();
  for (const [key, value] of params.entries()) {
    if (key !== "hmac") sorted.append(key, value);
  }
  sorted.sort();
  const message = sorted.toString();

  const digest = crypto
    .createHmac("sha256", secret)
    .update(message)
    .digest("hex");

  return crypto.timingSafeEqual(Buffer.from(hmac, "hex"), Buffer.from(digest, "hex"));
}

/**
 * Exchange authorization code for access token.
 */
export async function exchangeCodeForToken(
  shop: string,
  code: string,
  apiKey: string,
  apiSecret: string,
  redirectUri: string
): Promise<ShopifyOAuthTokenResponse> {
  const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: apiKey,
      client_secret: apiSecret,
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Shopify token exchange failed: ${response.status} ${text}`);
  }

  return response.json() as Promise<ShopifyOAuthTokenResponse>;
}

function deriveKey(secret: string): Buffer {
  return crypto.createHash("sha256").update(secret).digest();
}

/**
 * Encrypt access token for storage using AES-256-GCM.
 */
export function encryptToken(token: string, secret: string): string {
  const iv = crypto.randomBytes(16);
  const key = deriveKey(secret);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(token, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  const combined = Buffer.concat([iv, authTag, encrypted]);
  return combined.toString("base64");
}

/**
 * Decrypt access token from storage.
 */
export function decryptToken(encryptedBase64: string, secret: string): string {
  const combined = Buffer.from(encryptedBase64, "base64");
  const iv = combined.subarray(0, 16);
  const authTag = combined.subarray(16, 32);
  const ciphertext = combined.subarray(32);
  const key = deriveKey(secret);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}
