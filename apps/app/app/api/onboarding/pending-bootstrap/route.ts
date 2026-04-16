import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  PENDING_BOOTSTRAP_ALLOWED_NEXT,
  PENDING_SNAPSHOT_ID_REGEX,
  PENDING_SNAPSHOT_TTL_SECONDS,
  pendingRedisKey,
} from "@/src/server/pending-snapshot/constants";
import { getPendingSnapshotRedis } from "@/src/server/pending-snapshot/redis";
import { signPendingSnapshotToken } from "@/src/server/pending-snapshot/cookie-token";
import { buildSetPendingSnapshotCookieHeader } from "@/src/server/pending-snapshot/cookie-header";
import { logger } from "@offerpulse/lib";

function isAllowedNextPath(pathname: string): boolean {
  return (PENDING_BOOTSTRAP_ALLOWED_NEXT as readonly string[]).includes(pathname);
}

function safeOptionalUrl(param: string | null): string | null {
  if (!param) return null;
  try {
    const u = new URL(param);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.toString();
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const pendingId = request.nextUrl.searchParams.get("pendingId");
  const nextRaw = request.nextUrl.searchParams.get("next") ?? "/signup";

  logger.debug("[pending-offer-flow] GET pending-bootstrap", {
    step: "request",
    pendingIdPrefix: pendingId?.slice(0, 8),
    nextRaw,
    origin: request.nextUrl.origin,
  });

  if (!pendingId || !PENDING_SNAPSHOT_ID_REGEX.test(pendingId)) {
    logger.debug("[pending-offer-flow] bootstrap reject", {
      step: "invalid_pending_id",
      hasPendingId: Boolean(pendingId),
    });
    return new NextResponse("Invalid pendingId", { status: 400 });
  }

  let nextPathname: string;
  try {
    nextPathname = new URL(nextRaw, request.nextUrl.origin).pathname;
  } catch {
    logger.debug("[pending-offer-flow] bootstrap reject", {
      step: "invalid_next_url",
      nextRaw,
    });
    return new NextResponse("Invalid next", { status: 400 });
  }

  if (!isAllowedNextPath(nextPathname)) {
    logger.debug("[pending-offer-flow] bootstrap reject", {
      step: "next_not_allowlisted",
      nextPathname,
    });
    return new NextResponse("Invalid next", { status: 400 });
  }

  const redis = getPendingSnapshotRedis();
  const redisKey = pendingRedisKey(pendingId);
  const exists = await redis.exists(redisKey);
  if (!exists) {
    logger.warn("[pending-bootstrap] Redis key missing", { pendingId });
    logger.debug("[pending-offer-flow] bootstrap reject", {
      step: "redis_key_missing",
      pendingIdPrefix: pendingId.slice(0, 8),
    });
    return new NextResponse("Pending snapshot expired or invalid", { status: 400 });
  }

  const redirectUrl = new URL(request.nextUrl.origin);
  redirectUrl.pathname = nextPathname;

  const competitorUrl = safeOptionalUrl(
    request.nextUrl.searchParams.get("competitorUrl")
  );
  if (competitorUrl) redirectUrl.searchParams.set("competitorUrl", competitorUrl);

  for (const key of [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "source",
    "ph_distinct_id",
    "ph_session_id",
  ] as const) {
    const v = request.nextUrl.searchParams.get(key);
    if (v && v.length < 400) redirectUrl.searchParams.set(key, v);
  }

  const signed = signPendingSnapshotToken(pendingId);
  const cookie = buildSetPendingSnapshotCookieHeader(
    signed,
    PENDING_SNAPSHOT_TTL_SECONDS
  );

  logger.debug("[pending-offer-flow] bootstrap success", {
    step: "set_cookie_redirect",
    pendingIdPrefix: pendingId.slice(0, 8),
    redirectPath: redirectUrl.pathname + redirectUrl.search,
    cookieMaxAgeSeconds: PENDING_SNAPSHOT_TTL_SECONDS,
  });

  const res = NextResponse.redirect(redirectUrl.toString(), 302);
  res.headers.append("Set-Cookie", cookie);
  return res;
}
