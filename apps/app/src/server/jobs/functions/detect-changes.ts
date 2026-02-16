import { inngest } from "../client";
import { db } from "../../db";
import { snapshots, changeEvents } from "../../db/schema";
import { eq, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { detectChanges, calculateSimilarity } from "../../change-detection";

export const detectChangesJob = inngest.createFunction(
  {
    id: "detect-changes",
    name: "Detect Competitor Changes",
  },
  { event: "change/detected" },
  async ({ event, step }) => {
    const { competitorId, workspaceId } = event.data;

    // Get the two most recent snapshots
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

    // Run change detection algorithm
    const detectionResult = await step.run("detect-changes", async () => {
      return detectChanges(previous.extractedSignals, current.extractedSignals);
    });

    if (!detectionResult.hasChange) {
      return { changeDetected: false, reason: detectionResult.summary };
    }

    // Calculate similarity to filter out noise
    const similarity = await step.run("calculate-similarity", async () => {
      return calculateSimilarity(previous.extractedSignals, current.extractedSignals);
    });

    // If similarity is too high (>95%), skip creating change event
    if (similarity > 0.95) {
      return {
        changeDetected: false,
        reason: "Changes too minor (similarity: " + (similarity * 100).toFixed(1) + "%)",
      };
    }

    // Create change event
    const changeEventId = await step.run("create-change-event", async () => {
      const id = `change_${nanoid()}`;

      await db.insert(changeEvents).values({
        id,
        competitorId,
        type: detectionResult.changeType || "PROMO",
        confidence: detectionResult.confidence,
        summary: detectionResult.summary,
        before: previous.extractedSignals,
        after: current.extractedSignals,
        snapshotBeforeId: previous.id,
        snapshotAfterId: current.id,
      });

      return id;
    });

    // Trigger recommendation generation
    await step.sendEvent("trigger-recommendation", {
      name: "recommendation/generated",
      data: {
        recommendationId: changeEventId,
        competitorId,
        workspaceId,
      },
    });

    return {
      changeDetected: true,
      changeEventId,
      type: detectionResult.changeType,
      confidence: detectionResult.confidence,
      changeCount: detectionResult.changes.length,
    };
  }
);
