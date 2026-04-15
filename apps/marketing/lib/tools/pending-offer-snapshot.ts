import { randomBytes } from "node:crypto";
import { logger } from "@/lib/logger";
import { redis } from "./rate-limit";

export const PENDING_OFFER_SNAPSHOT_KEY_PREFIX = "pending:offer-snapshot:";
export const PENDING_SNAPSHOT_MAX_BYTES = 512 * 1024;
export const PENDING_SNAPSHOT_TTL_SECONDS = 7 * 24 * 60 * 60;

export function pendingOfferSnapshotRedisKey(pendingId: string): string {
  return `${PENDING_OFFER_SNAPSHOT_KEY_PREFIX}${pendingId}`;
}

export async function storePendingOfferSnapshotJson(
  jsonString: string
): Promise<{ pendingId: string }> {
  const pendingId = randomBytes(12).toString("hex");
  const key = pendingOfferSnapshotRedisKey(pendingId);
  await redis.set(key, jsonString, {
    ex: PENDING_SNAPSHOT_TTL_SECONDS,
  });
  logger.debug("[pending-offer-flow] Upstash SET", {
    step: "upstash_set",
    pendingId,
    ttlSeconds: PENDING_SNAPSHOT_TTL_SECONDS,
  });
  return { pendingId };
}
