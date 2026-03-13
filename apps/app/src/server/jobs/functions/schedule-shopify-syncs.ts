import { inngest } from "../client";
import { db } from "../../db";
import { ownStores, workspaceMembers, subscriptions } from "../../db/schema";
import { eq } from "drizzle-orm";
import { getPlanById } from "@offerpulse/lib/pricing";
import { logger } from "@offerpulse/lib";

/**
 * Scheduled job that runs every 3 hours to sync Shopify stores.
 * Agency: every 3h, Growth: every 6h (based on plan limits).
 */
export const scheduleShopifySyncsJob = inngest.createFunction(
  {
    id: "schedule-shopify-syncs",
    name: "Schedule Shopify Syncs",
  },
  { cron: "0 */3 * * *" },
  async ({ step }) => {
    const stores = await step.run("fetch-shopify-stores", async () => {
      return db.query.ownStores.findMany({
        where: eq(ownStores.platform, "shopify"),
        columns: {
          id: true,
          workspaceId: true,
          lastSyncedAt: true,
          syncStatus: true,
        },
      });
    });

    const now = Date.now();
    const events: Array<{ name: string; data: { workspaceId: string } }> = [];

    for (const store of stores) {
      if (store.syncStatus === "syncing") continue;

      const [member] = await db
        .select({ userId: workspaceMembers.userId })
        .from(workspaceMembers)
        .where(eq(workspaceMembers.workspaceId, store.workspaceId))
        .limit(1);

      if (!member) continue;

      const [subscription] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, member.userId));

      const planId = subscription?.planId as string | undefined;
      const plan = planId ? getPlanById(planId as "starter" | "growth" | "agency") : undefined;
      if (!plan?.limits.shopifyIntegration || !plan.limits.syncFrequencyHours) continue;

      const lastSync = store.lastSyncedAt
        ? new Date(store.lastSyncedAt).getTime()
        : 0;
      const intervalMs = plan.limits.syncFrequencyHours * 60 * 60 * 1000;
      if (now - lastSync >= intervalMs) {
        events.push({
          name: "shopify/store.sync",
          data: { workspaceId: store.workspaceId },
        });
      }
    }

    if (events.length > 0) {
      await step.sendEvent(
        "trigger-syncs",
        events.map((e) => ({ name: e.name, data: e.data }))
      );
      logger.info("[schedule-shopify-syncs] Triggered syncs", { count: events.length });
    }

    return { triggered: events.length };
  }
);
