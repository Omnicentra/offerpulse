import { inngest } from "../client";
import { db } from "../../db";
import { snapshots, competitors } from "../../db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import {
  batchScrapeCompetitors,
  extractSignalsFromFirecrawl,
} from "../../scraping";
import { uploadScreenshot } from "../../scraping/screenshot";

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

    // Get active competitors with matching frequency
    const activeCompetitors = await step.run("get-competitors", async () => {
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

    if (toScrape.length === 0) {
      return { scraped: 0, reason: "No competitors match frequency" };
    }

    // Batch scrape with Firecrawl
    const results = await step.run("batch-scrape", async () => {
      return await batchScrapeCompetitors(
        toScrape.map((c) => ({ url: c.baseUrl, id: c.id })),
        frequency
      );
    });

    const firecrawlTag =
      frequency === "1h" ? "high-frequency" : frequency === "6h" ? "twice-daily" : "daily";

    // Create snapshots and trigger change detection for changed items
    const snapshotIds = await step.run("create-snapshots", async () => {
      const ids: string[] = [];

      for (const result of results) {
        if (!result.success) {
          console.error(
            `[batch-capture] Failed to scrape ${result.competitorId}:`,
            result.error
          );
          continue;
        }

        const competitor = toScrape.find((c) => c.id === result.competitorId);
        if (!competitor) continue;

        let screenshotUrl: string | undefined;
        if (result.screenshot) {
          try {
            const buffer = Buffer.from(result.screenshot, "base64");
            const hostname = new URL(competitor.baseUrl).hostname.replace(/\./g, "-");
            const filename = `${hostname}-${Date.now()}.png`;
            screenshotUrl = await uploadScreenshot(buffer, filename);
          } catch {
            // Continue without screenshot
          }
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
        });

        ids.push(snapshotId);

        // Update competitor lastSnapshotAt
        await db
          .update(competitors)
          .set({ lastSnapshotAt: new Date() })
          .where(eq(competitors.id, competitor.id));

        // Trigger change detection when Firecrawl reports content changed
        if (changeTracking?.changeStatus === "changed") {
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

      return ids;
    });

    return {
      scraped: snapshotIds.length,
      total: toScrape.length,
      frequency,
      snapshotIds,
    };
  }
);
