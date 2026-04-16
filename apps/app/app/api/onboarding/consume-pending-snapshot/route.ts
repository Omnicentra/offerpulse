import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/src/server/auth";
import { PENDING_SNAPSHOT_COOKIE_NAME } from "@/src/server/pending-snapshot/constants";
import { verifyPendingSnapshotCookieValue } from "@/src/server/pending-snapshot/cookie-token";
import { buildClearPendingSnapshotCookieHeader } from "@/src/server/pending-snapshot/cookie-header";
import {
  provisionFromPendingMarketingSnapshot,
  takePendingOfferSnapshotFromRedis,
} from "@/src/server/onboarding/consume-pending-marketing-snapshot";
import { logger } from "@offerpulse/lib";

export async function POST() {
  const hdrs = await headers();
  const session = await auth.api.getSession({ headers: hdrs });

  logger.debug("[pending-offer-flow] POST consume-pending-snapshot", {
    step: "session_lookup",
    hasUser: Boolean(session?.user?.id),
    hasWorkspaceId: Boolean(session?.user?.workspaceId),
  });

  if (!session?.user?.id || !session.user.workspaceId) {
    logger.debug("[pending-offer-flow] consume reject", { step: "unauthorized" });
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }

  const cookieHeader = hdrs.get("cookie") ?? "";
  const match = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${PENDING_SNAPSHOT_COOKIE_NAME}=`));

  const rawValue = match?.slice(PENDING_SNAPSHOT_COOKIE_NAME.length + 1);
  const decoded = rawValue ? decodeURIComponent(rawValue) : undefined;
  const pendingId = verifyPendingSnapshotCookieValue(decoded);

  logger.debug("[pending-offer-flow] pending cookie", {
    step: "cookie_parse",
    hasRawCookie: Boolean(match),
    pendingIdPrefix: pendingId?.slice(0, 8) ?? null,
    verified: Boolean(pendingId),
  });

  const clearCookie = buildClearPendingSnapshotCookieHeader();

  if (!pendingId) {
    logger.debug("[pending-offer-flow] consume no-op", {
      step: "no_pending_cookie",
      clearedCookie: true,
    });
    const res = NextResponse.json({
      ok: false,
      reason: "no_pending",
      next: "/",
    });
    res.headers.append("Set-Cookie", clearCookie);
    return res;
  }

  const record = await takePendingOfferSnapshotFromRedis(pendingId);
  if (!record) {
    logger.debug("[pending-offer-flow] consume abort", {
      step: "redis_record_missing",
      pendingIdPrefix: pendingId.slice(0, 8),
    });
    logger.info("[consume-pending-snapshot] No redis record", { pendingId });
    const res = NextResponse.json({
      ok: false,
      reason: "not_found",
      next: "/",
    });
    res.headers.append("Set-Cookie", clearCookie);
    return res;
  }

  const result = await provisionFromPendingMarketingSnapshot({
    workspaceId: session.user.workspaceId,
    pendingId,
    record,
  });

  logger.debug("[pending-offer-flow] consume provision result", {
    step: "provision_done",
    userId: session.user.id,
    workspaceId: session.user.workspaceId,
    ok: result.ok,
    duplicate: result.duplicate,
    next: result.next,
    competitorId: result.competitorId,
    snapshotId: result.snapshotId,
    reason: result.reason,
  });

  const res = NextResponse.json({
    ok: result.ok,
    next: result.next,
    competitorId: result.competitorId,
    snapshotId: result.snapshotId,
    duplicate: result.duplicate,
    reason: result.reason,
  });
  res.headers.append("Set-Cookie", clearCookie);
  return res;
}
