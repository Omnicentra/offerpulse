import { inngest } from "../client";
import { db } from "../../db";
import { competitors, monitorSettings } from "../../db/schema";
import { eq } from "drizzle-orm";

export const scheduleCapturesJob = inngest.createFunction(
  {
    id: "schedule-captures",
    name: "Schedule Competitor Captures",
  },
  { cron: "0 * * * *" }, // Run every hour
  async ({ step }) => {
    // Get all active competitors with their monitor settings
    const activeCompetitors = await step.run("get-active-competitors", async () => {
      return await db.query.competitors.findMany({
        where: eq(competitors.isActive, true),
        with: {
          monitorSettings: true,
        },
      });
    });

    const now = new Date();
    const capturePromises: Promise<any>[] = [];

    for (const competitor of activeCompetitors) {
      const settings = competitor.monitorSettings;

      if (!settings) continue;

      let shouldCapture = false;

      // Determine if we should capture based on frequency
      if (settings.frequency === "1h") {
        shouldCapture = true; // Capture every hour
      } else if (settings.frequency === "6h") {
        // Capture every 6 hours (at 0, 6, 12, 18)
        shouldCapture = now.getHours() % 6 === 0;
      } else if (settings.frequency === "daily") {
        // Capture once per day at 9 AM UTC
        shouldCapture = now.getHours() === 9;
      }

      if (shouldCapture) {
        capturePromises.push(
          step.sendEvent(`capture-${competitor.id}`, {
            name: "competitor/capture",
            data: {
              competitorId: competitor.id,
              workspaceId: competitor.workspaceId,
            },
          })
        );
      }
    }

    // Send all capture events
    await Promise.all(capturePromises);

    return {
      scheduled: capturePromises.length,
      total: activeCompetitors.length,
    };
  }
);
