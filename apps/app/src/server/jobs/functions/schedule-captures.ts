import { inngest } from "../client";
import { db } from "../../db";
import { competitors } from "../../db/schema";
import { eq } from "drizzle-orm";

export const scheduleCapturesJob = inngest.createFunction(
  {
    id: "schedule-captures",
    name: "Schedule Competitor Captures",
  },
  { cron: "0 * * * *" }, // Run every hour
  async ({ step }) => {
    // Get unique workspaces with active competitors
    const activeCompetitors = await step.run("get-active-competitors", async () => {
      return await db.query.competitors.findMany({
        where: eq(competitors.isActive, true),
        with: { monitorSettings: true },
      });
    });

    const now = new Date();
    const batchEvents: Array<{ name: string; data: { workspaceId: string; frequency: "1h" | "6h" | "daily" } }> = [];

    // Group by workspace + frequency and trigger batch jobs
    const workspaceFrequencies = new Set<string>();

    for (const competitor of activeCompetitors) {
      const settings = competitor.monitorSettings;
      if (!settings) continue;

      let shouldCapture = false;
      if (settings.frequency === "1h") {
        shouldCapture = true;
      } else if (settings.frequency === "6h") {
        shouldCapture = now.getHours() % 6 === 0;
      } else if (settings.frequency === "daily") {
        shouldCapture = now.getHours() === 9;
      }

      if (shouldCapture) {
        workspaceFrequencies.add(`${competitor.workspaceId}:${settings.frequency}`);
      }
    }

    for (const key of workspaceFrequencies) {
      const [workspaceId, frequency] = key.split(":") as [string, "1h" | "6h" | "daily"];
      batchEvents.push({
        name: "snapshot/batch-capture",
        data: { workspaceId, frequency },
      });
    }

    await Promise.all(
      batchEvents.map((evt) =>
        step.sendEvent(`batch-${evt.data.workspaceId}-${evt.data.frequency}`, evt)
      )
    );

    return {
      scheduled: batchEvents.length,
      total: activeCompetitors.length,
    };
  }
);
