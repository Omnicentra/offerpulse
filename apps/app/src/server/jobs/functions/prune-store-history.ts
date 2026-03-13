import { inngest } from "../client";
import { db } from "../../db";
import { storeProductHistory } from "../../db/schema";
import { lt } from "drizzle-orm";
import { logger } from "@offerpulse/lib";

const PRUNE_DAYS = 90;

/**
 * Prune store product history records older than 90 days.
 */
export const pruneStoreHistoryJob = inngest.createFunction(
  {
    id: "prune-store-history",
    name: "Prune Store Product History",
  },
  { cron: "0 2 * * *" },
  async ({ step }) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - PRUNE_DAYS);

    await step.run("prune", async () => {
      await db
        .delete(storeProductHistory)
        .where(lt(storeProductHistory.changedAt, cutoff));
    });

    logger.info("[prune-store-history] Pruned records older than 90 days", {
      cutoff: cutoff.toISOString(),
    });

    return { success: true };
  }
);
