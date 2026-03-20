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

const chatSchema = z.object({
  id: z.string(),
  visitor: visitorSchema.optional(),
});

const propertySchema = z.object({
  name: z.string().optional(),
});

const tawkWebhookPayloadSchema = z.object({
  event: z.string(),
  chat: chatSchema.optional(),
  property: propertySchema.optional(),
});

type TawkWebhookPayload = z.infer<typeof tawkWebhookPayloadSchema>;

function verifySignature(body: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;

  const algPrefix = signature.startsWith("sha256=") ? "sha256=" : "sha1=";
  const alg = algPrefix === "sha256=" ? "sha256" : "sha1";

  try {
    const expected = `${algPrefix}${createHmac(alg, secret).update(body).digest("hex")}`;
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  logger.debug("tawk.to webhook POST received");

  const body = await req.text();

  if (env.TAWK_WEBHOOK_SECRET) {
    const signature =
      req.headers.get("x-hub-signature-256") ??
      req.headers.get("x-hub-signature") ??
      req.headers.get("x-tawk-signature");

    if (!verifySignature(body, signature, env.TAWK_WEBHOOK_SECRET)) {
      logger.warn("tawk.to webhook rejected: invalid or missing signature");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    logger.debug("tawk.to webhook signature verified");
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

  const payload: TawkWebhookPayload = parsed.data;
  logger.debug("tawk.to webhook event received", { event: payload.event });

  if (payload.event === "chat:start" && payload.chat) {
    const { chat, property } = payload;
    logger.info("tawk.to new chat started", { chatId: chat.id, visitor: chat.visitor?.name });

    await sendTawkNewChatEmail({
      chatId: chat.id,
      visitorName: chat.visitor?.name ?? "Anonymous",
      visitorEmail: chat.visitor?.email ?? null,
      propertyName: property?.name ?? "OfferPulse",
    });
  }

  return NextResponse.json({ received: true });
}
