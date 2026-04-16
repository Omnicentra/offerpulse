/**
 * Stored in Redis under pending:offer-snapshot:{id}
 * toolPayload mirrors marketing OfferSnapshotResponse subset (JSON-serializable).
 */
export interface PendingOfferSnapshotRecord {
  competitorUrl: string;
  toolPayload: Record<string, unknown>;
  source?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  createdAt: string;
}
