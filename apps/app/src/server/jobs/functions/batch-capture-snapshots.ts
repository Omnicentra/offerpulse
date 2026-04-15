import { inngest } from "../client";
import { db } from "../../db";
import { snapshots, competitors } from "../../db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import {
  batchScrapeCompetitors,
  extractSignalsFromFirecrawl,
} from "../../scraping";
import { logger } from "@offerpulse/lib";

export const batchCaptureSnapshotsJob = inngest.createFunction(
  {
    id: "batch-capture-snapshots",
    name: "Batch Capture Competitor Snapshots",
    concurrency: { limit: 1 },
    retries: 2,
  },
  { event: "snapshot/batch-capture" },
  async ({ event, step }) => {
    const { workspaceId, frequency } = event.data;
    logger.debug("[batch-capture] Job started", { workspaceId, frequency });

    // Get active competitors with matching frequency
    const activeCompetitors = await step.run("get-competitors", async () => {
      logger.debug("[batch-capture] Fetching active competitors", { workspaceId });
      return await db.query.competitors.findMany({
        where: and(
          eq(competitors.workspaceId, workspaceId),
          eq(competitors.isActive, true)
        ),
        with: { monitorSettings: true },
      });
    });

    const toScrape = activeCompetitors.filter(
      (c) => c.monitorSettings?.frequency === frequency
    );
    logger.debug("[batch-capture] Competitors filtered by frequency", {
      activeCount: activeCompetitors.length,
      toScrapeCount: toScrape.length,
      frequency,
      competitorIds: toScrape.map((c) => c.id),
    });

    if (toScrape.length === 0) {
      logger.debug("[batch-capture] No competitors match frequency, skipping", {
        workspaceId,
        frequency,
      });
      return { scraped: 0, reason: "No competitors match frequency" };
    }

    // Batch scrape with Firecrawl
    const results = await step.run("batch-scrape", async () => {
      logger.debug("[batch-capture] Starting batch scrape", {
        count: toScrape.length,
        urls: toScrape.map((c) => ({ id: c.id, url: c.baseUrl })),
      });
      return await batchScrapeCompetitors(
        toScrape.map((c) => ({ url: c.baseUrl, id: c.id })),
        frequency
      );
    });

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.length - successCount;
    logger.debug("[batch-capture] Batch scrape completed", {
      total: results.length,
      successCount,
      failCount,
      failedIds: results.filter((r) => !r.success).map((r) => r.competitorId),
    });

    const firecrawlTag =
      frequency === "1h" ? "high-frequency" : frequency === "6h" ? "twice-daily" : "daily";

    // Create snapshots and trigger change detection for changed items
    const snapshotIds = await step.run("create-snapshots", async () => {
      const ids: string[] = [];
      logger.debug("[batch-capture] Creating snapshots from results", {
        resultCount: results.length,
      });

      for (const result of results) {
        if (!result.success) {
          logger.error("[batch-capture] Failed to scrape competitor", {
            competitorId: result.competitorId,
            error: result.error,
          });
          continue;
        }

        const competitor = toScrape.find((c) => c.id === result.competitorId);
        if (!competitor) {
          logger.debug("[batch-capture] Skipping result: competitor not in toScrape", {
            competitorId: result.competitorId,
          });
          continue;
        }

        const screenshotUrl = result.screenshot;
        if (screenshotUrl) {
          logger.info("[batch-capture] Using Firecrawl screenshot URL", {
            competitorId: competitor.id,
            screenshotUrl,
          });
        }

        const changeTracking = result.changeTracking;
        const snapshotId = `snap_${nanoid()}`;

        await db.insert(snapshots).values({
          id: snapshotId,
          competitorId: competitor.id,
          extractedSignals: extractSignalsFromFirecrawl(changeTracking?.json),
          screenshotUrl,
          markdown: result.markdown,
          firecrawlChangeStatus: changeTracking?.changeStatus,
          firecrawlPreviousScrapeAt: changeTracking?.previousScrapeAt
            ? new Date(changeTracking.previousScrapeAt)
            : null,
          firecrawlVisibility: changeTracking?.visibility,
          firecrawlTag,
          firecrawlJson: changeTracking?.json ?? undefined,
          captureSource: "product_capture",
        });

        ids.push(snapshotId);
        logger.debug("[batch-capture] Snapshot created", {
          snapshotId,
          competitorId: competitor.id,
          changeStatus: changeTracking?.changeStatus,
        });

        // Update competitor lastSnapshotAt
        await db
          .update(competitors)
          .set({ lastSnapshotAt: new Date() })
          .where(eq(competitors.id, competitor.id));

        // Trigger change detection when Firecrawl reports content changed
        if (changeTracking?.changeStatus === "changed") {
          logger.debug("[batch-capture] Content changed, triggering change detection", {
            competitorId: competitor.id,
            snapshotId,
          });
          await inngest.send({
            name: "change/detected",
            data: {
              competitorId: competitor.id,
              workspaceId,
              snapshotId,
              changeData: changeTracking.json,
            },
          });
        }
      }

      logger.debug("[batch-capture] Create-snapshots step finished", {
        snapshotCount: ids.length,
        snapshotIds: ids,
      });
      return ids;
    });

    logger.info("[batch-capture] Job completed", {
      workspaceId,
      frequency,
      scraped: snapshotIds.length,
      total: toScrape.length,
      snapshotIds,
    });
    return {
      scraped: snapshotIds.length,
      total: toScrape.length,
      frequency,
      snapshotIds,
    };
  }
);
