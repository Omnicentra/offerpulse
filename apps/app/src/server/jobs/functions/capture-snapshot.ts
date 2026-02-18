import { inngest } from "../client";
import { db } from "../../db";
import { snapshots, competitors, scrapeJobs } from "../../db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { scrapeCompetitor } from "../../scraping";

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

    // Get competitor details
    const competitor = await step.run("get-competitor", async () => {
      return await db.query.competitors.findFirst({
        where: eq(competitors.id, competitorId),
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

    // Scrape the competitor's website
    const scrapeResult = await step.run("scrape-website", async () => {
      return await scrapeCompetitor({
        url: competitor.baseUrl,
        captureScreenshot: true,
        timeout: 45000,
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

    // Store snapshot with extracted signals
    const snapshotId = `snap_${nanoid()}`;
    const snapshot = await step.run("store-snapshot", async () => {
      const [newSnapshot] = await db
        .insert(snapshots)
        .values({
          id: snapshotId,
          competitorId,
          extractedSignals: scrapeResult.signals,
          screenshotUrl: scrapeResult.screenshotUrl,
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

    // Trigger change detection
    await step.sendEvent("trigger-change-detection", {
      name: "change/detected",
      data: {
        changeEventId: "", // Will be created by change detector
        competitorId,
        workspaceId,
      },
    });

    return { snapshotId, competitorId };
  }
);
