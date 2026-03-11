import { inngest } from "../client";
import { db } from "../../db";
import { snapshots, changeEvents } from "../../db/schema";
import { eq, desc } from "drizzle-orm";
import { nanoid } from "nanoid";

interface FieldChange {
  type: "PROMO" | "SHIPPING" | "BUNDLE" | "CART_INCENTIVE" | "DELIVERY_RETURNS";
  confidence: "low" | "medium" | "high";
  summary: string;
  fieldsChanged: string[];
  before: Record<string, unknown>;
  after: Record<string, unknown>;
}

type FirecrawlJson = Record<string, { previous?: unknown; current?: unknown }>;

const PROMO_FIELDS = [
  "promo_text",
  "promo_code",
  "discount_percentage",
  "promo_expiry",
];
const SHIPPING_FIELDS = [
  "free_shipping_threshold",
  "shipping_cost",
  "delivery_time",
];
const BUNDLE_FIELDS = ["bundle_title", "bundle_products", "bundle_discount"];
const CART_FIELDS = [
  "cart_incentive_text",
  "minimum_order_value",
  "cart_discount",
];
const DELIVERY_FIELDS = ["delivery_text", "returns_text"];

function extractFields(
  json: FirecrawlJson,
  fields: string[],
  key: "previous" | "current"
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    const val = json[f]?.[key];
    if (val !== undefined && val !== null) out[f] = val;
  }
  return out;
}

export function analyzeFieldChanges(firecrawlJson: FirecrawlJson): FieldChange[] {
  const changes: FieldChange[] = [];

  const analyzeCategory = (
    fields: string[],
    type: FieldChange["type"],
    summaryFn: (changed: string[], json: FirecrawlJson) => string
  ) => {
    const changed = fields.filter(
      (f) =>
        firecrawlJson[f] &&
        firecrawlJson[f].previous !== firecrawlJson[f].current
    );
    if (changed.length === 0) return;

    const confidence =
      changed.length >= 2 ? "high" : changed.includes("discount_percentage") || changed.includes("promo_code") ? "medium" : "low";

    changes.push({
      type,
      confidence,
      summary: summaryFn(changed, firecrawlJson),
      fieldsChanged: changed,
      before: extractFields(firecrawlJson, changed, "previous"),
      after: extractFields(firecrawlJson, changed, "current"),
    });
  };

  analyzeCategory(PROMO_FIELDS, "PROMO", (changed) => {
    const discount = firecrawlJson.discount_percentage;
    if (discount && discount.previous !== discount.current) {
      return `Discount changed: ${discount.previous ?? "none"} → ${discount.current ?? "none"}`;
    }
    const code = firecrawlJson.promo_code;
    if (code && code.previous !== code.current) {
      return `Promo code changed: ${code.previous ?? "none"} → ${code.current ?? "none"}`;
    }
    return `${changed.length} promo field(s) changed`;
  });

  analyzeCategory(SHIPPING_FIELDS, "SHIPPING", (changed) => {
    const threshold = firecrawlJson.free_shipping_threshold;
    if (threshold && threshold.previous !== threshold.current) {
      return `Free shipping threshold: ${threshold.previous ?? "none"} → ${threshold.current ?? "none"}`;
    }
    return `${changed.length} shipping field(s) changed`;
  });

  analyzeCategory(BUNDLE_FIELDS, "BUNDLE", (changed) => {
    return `${changed.length} bundle field(s) changed`;
  });

  analyzeCategory(CART_FIELDS, "CART_INCENTIVE", (changed) => {
    return `${changed.length} cart incentive field(s) changed`;
  });

  analyzeCategory(DELIVERY_FIELDS, "DELIVERY_RETURNS", (changed) => {
    return `${changed.length} delivery/returns field(s) changed`;
  });

  return changes;
}

export const detectChangesJob = inngest.createFunction(
  {
    id: "detect-changes",
    name: "Detect Competitor Changes",
  },
  { event: "change/detected" },
  async ({ event, step }) => {
    const { competitorId, workspaceId, snapshotId, changeData } = event.data;

    // New Firecrawl flow: snapshotId and changeData (firecrawlJson) provided
    if (snapshotId && changeData) {
      const snapshot = await step.run("get-snapshot", async () => {
        return await db.query.snapshots.findFirst({
          where: eq(snapshots.id, snapshotId),
        });
      });

      if (!snapshot?.firecrawlJson) {
        return { changeDetected: false, reason: "No Firecrawl data" };
      }

      const firecrawlJson = (snapshot.firecrawlJson ?? changeData) as FirecrawlJson;
      const fieldChanges = analyzeFieldChanges(firecrawlJson);

      if (fieldChanges.length === 0) {
        return { changeDetected: false, reason: "No field-level changes" };
      }

      const changeEventIds = await step.run("create-change-events", async () => {
        const ids: string[] = [];
        for (const change of fieldChanges) {
          const id = `change_${nanoid()}`;
          await db.insert(changeEvents).values({
            id,
            competitorId,
            type: change.type,
            confidence: change.confidence,
            summary: change.summary,
            before: change.before,
            after: change.after,
            snapshotAfterId: snapshotId,
            diffType: "json",
            fieldsChanged: change.fieldsChanged,
          });
          ids.push(id);
        }
        return ids;
      });

      for (const eventId of changeEventIds) {
        await step.sendEvent(`trigger-recommendation-${eventId}`, {
          name: "recommendation/generated",
          data: { recommendationId: eventId, competitorId, workspaceId },
        });
      }

      return {
        changeDetected: true,
        changeEventCount: changeEventIds.length,
        changes: fieldChanges,
      };
    }

    // Legacy flow: only competitorId/workspaceId (compare two most recent snapshots)
    // Kept for backward compatibility during transition
    const recentSnapshots = await step.run("get-recent-snapshots", async () => {
      return await db.query.snapshots.findMany({
        where: eq(snapshots.competitorId, competitorId),
        orderBy: [desc(snapshots.capturedAt)],
        limit: 2,
      });
    });

    if (recentSnapshots.length < 2) {
      return { changeDetected: false, reason: "Not enough snapshots to compare" };
    }

    const [current, previous] = recentSnapshots;

    // If current has Firecrawl data and changeStatus was 'changed', we should have used the new flow
    if (current.firecrawlJson && current.firecrawlChangeStatus === "changed") {
      const firecrawlJson = current.firecrawlJson as FirecrawlJson;
      const fieldChanges = analyzeFieldChanges(firecrawlJson);

      if (fieldChanges.length > 0) {
        const changeEventIds = await step.run("create-change-events", async () => {
          const ids: string[] = [];
          for (const change of fieldChanges) {
            const id = `change_${nanoid()}`;
            await db.insert(changeEvents).values({
              id,
              competitorId,
              type: change.type,
              confidence: change.confidence,
              summary: change.summary,
              before: change.before,
              after: change.after,
              snapshotBeforeId: previous.id,
              snapshotAfterId: current.id,
              diffType: "json",
              fieldsChanged: change.fieldsChanged,
            });
            ids.push(id);
          }
          return ids;
        });

        for (const eventId of changeEventIds) {
          await step.sendEvent(`trigger-recommendation-${eventId}`, {
            name: "recommendation/generated",
            data: { recommendationId: eventId, competitorId, workspaceId },
          });
        }

        return {
          changeDetected: true,
          changeEventCount: changeEventIds.length,
          changes: fieldChanges,
        };
      }
    }

    return { changeDetected: false, reason: "No changes detected" };
  }
);
