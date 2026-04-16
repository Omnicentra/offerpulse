/** Redis key prefix; distinct from marketing rate-limit prefix */
export const PENDING_OFFER_SNAPSHOT_KEY_PREFIX = "pending:offer-snapshot:";

export const PENDING_SNAPSHOT_COOKIE_NAME = "offerpulse_pending_snapshot";

/** Max JSON body size for pending offer snapshot (bytes) */
export const PENDING_SNAPSHOT_MAX_BYTES = 512 * 1024;

/** TTL for pending keys (7 days, seconds) */
export const PENDING_SNAPSHOT_TTL_SECONDS = 7 * 24 * 60 * 60;

/** Hex id from randomBytes(12) (marketing pending store) */
export const PENDING_SNAPSHOT_ID_REGEX = /^[a-f0-9]{24}$/;

export const PENDING_BOOTSTRAP_ALLOWED_NEXT = ["/signup", "/login"] as const;

export function pendingRedisKey(pendingId: string): string {
  return `${PENDING_OFFER_SNAPSHOT_KEY_PREFIX}${pendingId}`;
}
