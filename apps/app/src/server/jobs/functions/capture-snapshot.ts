import { inngest } from "../client";
import { db } from "../../db";
import { snapshots, competitors, scrapeJobs } from "../../db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import {
  scrapeWithChangeTracking,
  extractSignalsFromFirecrawl,
} from "../../scraping";
import { logger } from "@offerpulse/lib";

export const captureSnapshotJob = inngest.createFunction(
  {
    id: "capture-snapshot",
    name: "Capture Competitor Snapshot",
    retries: 3,
  },
  { event: "competitor/capture" },
  async ({ event, step }) => {
    const { competitorId, workspaceId } = event.data;
    const jobId = `job_${nanoid()}`;

    logger.debug("[capture-snapshot] Job started", {
      jobId,
      competitorId,
      workspaceId,
    });

    // Create job record
    await step.run("create-job-record", async () => {
      await db.insert(scrapeJobs).values({
        id: jobId,
        competitorId,
        status: "running",
        startedAt: new Date(),
      });
    });
    logger.debug("[capture-snapshot] Job record created", { jobId });

    // Get competitor with monitor settings
    const competitor = await step.run("get-competitor", async () => {
      return await db.query.competitors.findFirst({
        where: eq(competitors.id, competitorId),
        with: { monitorSettings: true },
      });
    });

    if (!competitor) {
      logger.debug("[capture-snapshot] Competitor not found", { competitorId, jobId });
      await db
        .update(scrapeJobs)
        .set({
          status: "failed",
          error: "Competitor not found",
          completedAt: new Date(),
        })
        .where(eq(scrapeJobs.id, jobId));
      throw new Error("Competitor not found");
    }

    const frequency = competitor.monitorSettings?.frequency ?? "daily";
    logger.debug("[capture-snapshot] Competitor loaded", {
      competitorId,
      baseUrl: competitor.baseUrl,
      frequency,
    });

    // Scrape with Firecrawl change tracking
    const scrapeResult = await step.run("scrape-website", async () => {
      return await scrapeWithChangeTracking({
        url: competitor.baseUrl,
        competitorId,
        frequency,
      });
    });

    logger.debug("[capture-snapshot] Scrape completed", {
      competitorId,
      success: scrapeResult.success,
      error: scrapeResult.error ?? undefined,
      changeStatus: scrapeResult.changeTracking?.changeStatus,
      hasScreenshot: Boolean(scrapeResult.screenshot),
      markdownLength: scrapeResult.markdown?.length ?? 0,
    });

    if (!scrapeResult.success) {
      await db
        .update(scrapeJobs)
        .set({
          status: "failed",
          error: scrapeResult.error || "Scraping failed",
          completedAt: new Date(),
        })
        .where(eq(scrapeJobs.id, jobId));
      throw new Error(scrapeResult.error || "Scraping failed");
    }

    // Firecrawl returns a signed screenshot URL (valid 7 days); use it directly
    const screenshotUrl = scrapeResult.screenshot;
    if (screenshotUrl) {
      logger.debug("[capture-snapshot] Using Firecrawl screenshot URL", {
        competitorId,
        screenshotUrl,
      });
    }

    const changeTracking = scrapeResult.changeTracking;
    const firecrawlTag =
      frequency === "1h" ? "high-frequency" : frequency === "6h" ? "twice-daily" : "daily";

    // Store snapshot with Firecrawl data
    const snapshotId = `snap_${nanoid()}`;
    logger.debug("[capture-snapshot] Storing snapshot", {
      snapshotId,
      competitorId,
      firecrawlTag,
      changeStatus: changeTracking?.changeStatus,
      previousScrapeAt: changeTracking?.previousScrapeAt ?? undefined,
    });
    const snapshot = await step.run("store-snapshot", async () => {
      const [newSnapshot] = await db
        .insert(snapshots)
        .values({
          id: snapshotId,
          competitorId,
          extractedSignals: extractSignalsFromFirecrawl(
            changeTracking?.json
          ),
          screenshotUrl,
          markdown: scrapeResult.markdown,
          firecrawlChangeStatus: changeTracking?.changeStatus,
          firecrawlPreviousScrapeAt: changeTracking?.previousScrapeAt
            ? new Date(changeTracking.previousScrapeAt)
            : null,
          firecrawlVisibility: changeTracking?.visibility,
          firecrawlTag,
          firecrawlJson: changeTracking?.json ?? undefined,
        })
        .returning();

      return newSnapshot;
    });
    logger.debug("[capture-snapshot] Snapshot stored", {
      snapshotId,
      capturedAt: snapshot.capturedAt,
    });

    // Update competitor's lastSnapshotAt
    await step.run("update-competitor", async () => {
      await db
        .update(competitors)
        .set({ lastSnapshotAt: new Date(snapshot.capturedAt) })
        .where(eq(competitors.id, competitorId));
    });

    // Update job status
    await step.run("update-job-status", async () => {
      await db
        .update(scrapeJobs)
        .set({
          status: "completed",
          snapshotId,
          completedAt: new Date(),
        })
        .where(eq(scrapeJobs.id, jobId));
    });

    // Trigger change detection only when Firecrawl reports content changed
    if (changeTracking?.changeStatus === "changed") {
      logger.debug("[capture-snapshot] Triggering change detection", {
        competitorId,
        snapshotId,
        workspaceId,
      });
      await step.sendEvent("trigger-change-detection", {
        name: "change/detected",
        data: {
          competitorId,
          workspaceId,
          snapshotId,
          changeData: changeTracking.json,
        },
      });
    } else {
      logger.debug("[capture-snapshot] Skipping change detection (no change)", {
        competitorId,
        changeStatus: changeTracking?.changeStatus ?? "none",
      });
    }

    logger.debug("[capture-snapshot] Job completed", {
      jobId,
      snapshotId,
      competitorId,
    });
    return { snapshotId, competitorId };
  }
);
