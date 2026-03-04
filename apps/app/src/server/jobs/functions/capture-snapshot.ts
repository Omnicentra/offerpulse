import { inngest } from "../client";
import { db } from "../../db";
import { snapshots, competitors, scrapeJobs } from "../../db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import {
  scrapeWithChangeTracking,
  extractSignalsFromFirecrawl,
} from "../../scraping";
import { uploadScreenshot } from "../../scraping/screenshot";

export const captureSnapshotJob = inngest.createFunction(
  {
    id: "capture-snapshot",
    name: "Capture Competitor Snapshot",
    retries: 3,
  },
  { event: "competitor/capture" },
  async ({ event, step }) => {
    const { competitorId, workspaceId } = event.data;

    // Create job record
    const jobId = `job_${nanoid()}`;
    await step.run("create-job-record", async () => {
      await db.insert(scrapeJobs).values({
        id: jobId,
        competitorId,
        status: "running",
        startedAt: new Date(),
      });
    });

    // Get competitor with monitor settings
    const competitor = await step.run("get-competitor", async () => {
      return await db.query.competitors.findFirst({
        where: eq(competitors.id, competitorId),
        with: { monitorSettings: true },
      });
    });

    if (!competitor) {
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

    // Scrape with Firecrawl change tracking
    const scrapeResult = await step.run("scrape-website", async () => {
      return await scrapeWithChangeTracking({
        url: competitor.baseUrl,
        competitorId,
        frequency,
      });
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

    // Upload screenshot if Firecrawl returned one (base64)
    let screenshotUrl: string | undefined;
    if (scrapeResult.screenshot) {
      try {
        const buffer = Buffer.from(scrapeResult.screenshot, "base64");
        const hostname = new URL(competitor.baseUrl).hostname.replace(/\./g, "-");
        const filename = `${hostname}-${Date.now()}.png`;
        screenshotUrl = await uploadScreenshot(buffer, filename);
      } catch (screenshotError) {
        console.error("Screenshot upload failed:", screenshotError);
      }
    }

    const changeTracking = scrapeResult.changeTracking;
    const firecrawlTag =
      frequency === "1h" ? "high-frequency" : frequency === "6h" ? "twice-daily" : "daily";

    // Store snapshot with Firecrawl data
    const snapshotId = `snap_${nanoid()}`;
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
      await step.sendEvent("trigger-change-detection", {
        name: "change/detected",
        data: {
          competitorId,
          workspaceId,
          snapshotId,
          changeData: changeTracking.json,
        },
      });
    }

    return { snapshotId, competitorId };
  }
);
