import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimiter, getClientIdentifier } from "@/lib/tools/rate-limit";
import {
  PENDING_SNAPSHOT_MAX_BYTES,
  storePendingOfferSnapshotJson,
} from "@/lib/tools/pending-offer-snapshot";
import { logger } from "@/lib/logger";

const bodySchema = z.object({
  competitorUrl: z.string().min(1),
  toolPayload: z.record(z.string(), z.unknown()),
  source: z.string().max(120).optional(),
  utm_source: z.string().max(120).optional(),
  utm_medium: z.string().max(120).optional(),
  utm_campaign: z.string().max(120).optional(),
});

export async function POST(request: Request) {
  logger.debug("[pending-offer-flow] POST /api/tools/offer-snapshot/pending", {
    step: "start",
  });

  const identifier = getClientIdentifier(request);
  const rateLimitResult = await rateLimiter.checkLimit(identifier);
  logger.debug("[pending-offer-flow] rate limit", {
    step: "rate_limit",
    success: rateLimitResult.success,
    remaining: rateLimitResult.remaining,
    clientIdPrefix: identifier.slice(0, 12),
  });
  const headers = new Headers({
    "X-RateLimit-Limit": rateLimitResult.limit.toString(),
    "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
    "X-RateLimit-Reset": new Date(rateLimitResult.reset).toISOString(),
  });

  if (!rateLimitResult.success) {
    logger.debug("[pending-offer-flow] rate limited", { step: "reject_429" });
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    logger.debug("[pending-offer-flow] invalid JSON body", { step: "reject_400" });
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    logger.debug("[pending-offer-flow] validation failed", {
      step: "reject_validation",
      issue: parsed.error.issues[0]?.message,
    });
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400, headers }
    );
  }

  try {
    new URL(parsed.data.competitorUrl);
  } catch {
    logger.debug("[pending-offer-flow] competitorUrl not a URL", {
      step: "reject_bad_url",
    });
    return NextResponse.json(
      { error: "competitorUrl must be a valid URL" },
      { status: 400, headers }
    );
  }

  const record = {
    ...parsed.data,
    createdAt: new Date().toISOString(),
  };
  const jsonString = JSON.stringify(record);
  logger.debug("[pending-offer-flow] json string", jsonString);
  const byteLength = Buffer.byteLength(jsonString, "utf8");
  let competitorHostname: string | undefined;
  try {
    competitorHostname = new URL(parsed.data.competitorUrl).hostname;
  } catch {
    competitorHostname = undefined;
  }
  logger.debug("[pending-offer-flow] payload prepared", {
    step: "payload_ok",
    competitorHostname,
    byteLength,
    source: parsed.data.source,
  });

  if (byteLength > PENDING_SNAPSHOT_MAX_BYTES) {
    logger.debug("[pending-offer-flow] payload too large", {
      step: "reject_413",
      byteLength,
      max: PENDING_SNAPSHOT_MAX_BYTES,
    });
    logger.warn("[offer-snapshot/pending] Payload too large", {
      byteLength,
      max: PENDING_SNAPSHOT_MAX_BYTES,
    });
    return NextResponse.json(
      { error: "Payload too large" },
      { status: 413, headers }
    );
  }

  try {
    const { pendingId } = await storePendingOfferSnapshotJson(jsonString);
    logger.debug("[pending-offer-flow] redis SET complete", {
      step: "redis_set",
      pendingId,
      byteLength,
      competitorHostname,
    });
    logger.info("[offer-snapshot/pending] Stored pending snapshot", {
      pendingId,
      byteLength,
    });
    return NextResponse.json({ pendingId }, { headers });
  } catch (e) {
    logger.error("[offer-snapshot/pending] Redis write failed", e);
    return NextResponse.json(
      { error: "Failed to store pending snapshot" },
      { status: 500, headers }
    );
  }
}
