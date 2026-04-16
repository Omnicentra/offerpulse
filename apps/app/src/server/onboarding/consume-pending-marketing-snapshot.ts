import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { db } from "../db";
import {
  competitors,
  monitorSettings,
  snapshots,
} from "../db/schema";
import { inngest } from "../jobs/client";
import { logger } from "@offerpulse/lib";
import { getPendingSnapshotRedis } from "../pending-snapshot/redis";
import { pendingRedisKey } from "../pending-snapshot/constants";
import type { PendingOfferSnapshotRecord } from "../pending-snapshot/types";
import { resolveCompetitorBrandNameFromUrl } from "./brand-name-from-store-url";
import { extractSignalsFromMarketingToolPayload } from "./marketing-tool-signals";

const pendingRecordSchema = z.object({
  competitorUrl: z.string().min(1),
  toolPayload: z.record(z.string(), z.unknown()),
  source: z.string().optional(),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  createdAt: z.string().optional(),
});

export interface ConsumePendingResult {
  ok: boolean;
  /** Dashboard path to navigate to */
  next: string;
  competitorId?: string;
  snapshotId?: string;
  duplicate?: boolean;
  reason?: "no_cookie" | "invalid_cookie" | "not_found" | "invalid_payload";
}

async function deriveCompetitorFields(competitorUrl: string): Promise<{
  domain: string;
  baseUrl: string;
  name: string;
}> {
  const url = new URL(competitorUrl);
  const domain = url.hostname.replace(/^www\./, "");
  const baseUrl = `${url.protocol}//${url.hostname}`;
  const name = await resolveCompetitorBrandNameFromUrl(competitorUrl, domain);
  return { domain, baseUrl, name };
}

/**
 * Reads and deletes the pending Redis entry (consume-once).
 */
export async function takePendingOfferSnapshotFromRedis(
  pendingId: string
): Promise<PendingOfferSnapshotRecord | null> {
  const redis = getPendingSnapshotRedis();
  const key = pendingRedisKey(pendingId);
  const raw = await redis.get<string>(key);
  if (raw == null) {
    logger.debug("[pending-offer-flow] redis GET miss", {
      step: "take_pending_miss",
      pendingIdPrefix: pendingId.slice(0, 8),
    });
    return null;
  }

  const rec = pendingRecordSchema.safeParse(raw);
  if (!rec.success) {
    logger.warn("[pending-snapshot] Invalid redis payload shape", pendingId, rec.error);
    await redis.del(key);
    return null;
  }

  await redis.del(key);
  logger.debug("[pending-offer-flow] redis consumed (GET+DEL)", {
    step: "take_pending_ok",
    pendingIdPrefix: pendingId.slice(0, 8),
    hasCompetitorUrl: Boolean((rec.data as PendingOfferSnapshotRecord).competitorUrl),
  });
  return rec.data as PendingOfferSnapshotRecord;
}

export async function provisionFromPendingMarketingSnapshot(params: {
  workspaceId: string;
  pendingId: string;
  record: PendingOfferSnapshotRecord;
}): Promise<ConsumePendingResult> {
  const { workspaceId, pendingId, record } = params;

  logger.debug("[pending-offer-flow] provision start", {
    step: "provision",
    workspaceId,
    pendingIdPrefix: pendingId.slice(0, 8),
    recordSource: record.source,
  });

  let competitorUrl: string;
  try {
    competitorUrl = new URL(record.competitorUrl).toString();
  } catch {
    logger.warn("[pending-snapshot] Bad competitorUrl", { pendingId });
    return { ok: false, next: "/", reason: "invalid_payload" };
  }

  const { domain, baseUrl, name } = await deriveCompetitorFields(competitorUrl);

  const existing = await db.query.competitors.findFirst({
    where: and(
      eq(competitors.workspaceId, workspaceId),
      eq(competitors.domain, domain)
    ),
  });

  if (existing) {
    logger.debug("[pending-offer-flow] duplicate domain skip insert", {
      step: "provision_duplicate",
      domain,
      existingCompetitorId: existing.id,
    });
    logger.info("[pending-snapshot] Duplicate competitor domain; clearing pending only", {
      workspaceId,
      domain,
      pendingId,
    });
    return {
      ok: true,
      duplicate: true,
      next: `/competitors/${existing.id}?welcome=1`,
      competitorId: existing.id,
    };
  }

  const competitorId = `comp_${nanoid()}`;
  const snapshotId = `snap_${nanoid()}`;
  const monitorId = `ms_${nanoid()}`;

  const extractedSignals = extractSignalsFromMarketingToolPayload(
    record.toolPayload
  );
  const screenshotUrl =
    typeof record.toolPayload.screenshotUrl === "string"
      ? record.toolPayload.screenshotUrl
      : undefined;

  await db.insert(competitors).values({
    id: competitorId,
    workspaceId,
    name,
    domain,
    baseUrl,
    platformGuess: domain.includes("myshopify") ? "shopify" : "other",
    tags: [],
    isActive: true,
    lastSnapshotAt: new Date(),
  });

  await db.insert(monitorSettings).values({
    id: monitorId,
    competitorId,
    frequency: "daily",
    trackPromos: true,
    trackShipping: true,
    trackBundles: true,
    trackCart: true,
    trackDeliveryReturns: true,
  });

  await db.insert(snapshots).values({
    id: snapshotId,
    competitorId,
    extractedSignals,
    screenshotUrl: screenshotUrl ?? null,
    captureSource: "marketing_tool",
    marketingToolPayload: record.toolPayload,
  });

  await inngest.send({
    name: "competitor/capture",
    data: { competitorId, workspaceId },
  });

  logger.debug("[pending-offer-flow] inngest competitor/capture queued", {
    step: "queue_product_capture",
    competitorId,
    workspaceId,
  });

  logger.info("[pending-snapshot] Provisioned competitor from marketing tool", {
    competitorId,
    snapshotId,
    workspaceId,
    pendingId,
  });

  return {
    ok: true,
    next: `/competitors/${competitorId}?welcome=1`,
    competitorId,
    snapshotId,
  };
}
