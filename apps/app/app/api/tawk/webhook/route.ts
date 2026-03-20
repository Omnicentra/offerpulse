import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { z } from "zod";
import { env } from "@/env";
import { sendTawkNewChatEmail } from "@/src/server/notifications/email";
import { logger } from "@offerpulse/lib";

const visitorSchema = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
});

const propertySchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
});

/**
 * tawk.to signs webhooks with HMAC-SHA1 over the raw request body.
 * @see https://developer.tawk.to/webhooks/#verifyingwebhooksignature
 */
function verifyTawkSignature(
  rawBody: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) return false;

  const digest = createHmac("sha1", secret).update(rawBody, "utf8").digest("hex");

  try {
    const sigBuf = Buffer.from(signature, "utf8");
    const digestBuf = Buffer.from(digest, "utf8");
    if (sigBuf.length !== digestBuf.length) return false;
    return timingSafeEqual(sigBuf, digestBuf);
  } catch {
    return false;
  }
}

/**
 * Common fields across tawk.to webhook events.
 * chat:start uses top-level `chatId` and `visitor` (not nested `chat`).
 * @see https://developer.tawk.to/webhooks/
 */
const tawkWebhookPayloadSchema = z.object({
  event: z.string(),
  chatId: z.string().optional(),
  visitor: visitorSchema.optional(),
  property: propertySchema.optional(),
});

export async function POST(req: Request) {
  logger.info("tawk.to webhook POST received");

  const body = await req.text();

  if (env.TAWK_WEBHOOK_SECRET) {
    const signature = req.headers.get("x-tawk-signature");

    if (!verifyTawkSignature(body, signature, env.TAWK_WEBHOOK_SECRET)) {
      logger.warn("tawk.to webhook rejected: invalid or missing x-tawk-signature");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    logger.debug("tawk.to webhook HMAC-SHA1 signature verified");
  }

  let rawPayload: unknown;
  try {
    rawPayload = JSON.parse(body);
  } catch {
    logger.warn("tawk.to webhook: invalid JSON body");
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const parsed = tawkWebhookPayloadSchema.safeParse(rawPayload);
  if (!parsed.success) {
    logger.warn("tawk.to webhook: unexpected payload shape", { error: parsed.error.issues[0]?.message });
    return NextResponse.json({ received: true });
  }

  const payload = parsed.data;
  logger.debug("tawk.to webhook event received", { event: payload.event });

  if (payload.event === "chat:start" && payload.chatId) {
    const { chatId, visitor, property } = payload;
    logger.info("tawk.to new chat started", { chatId, visitor: visitor?.name });

    await sendTawkNewChatEmail({
      chatId,
      visitorName: visitor?.name ?? "Anonymous",
      visitorEmail: visitor?.email ?? null,
      propertyName: property?.name ?? "OfferPulse",
    });
  }

  return NextResponse.json({ received: true });
}
