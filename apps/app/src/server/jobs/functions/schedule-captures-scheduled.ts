import { logger } from "@offerpulse/lib";
import { eq } from "drizzle-orm";
import { db } from "../../db";
import { competitors, workspaceSettings } from "../../db/schema";
import { inngest } from "../client";

/**
 * Calculate the next run time based on frequency setting.
 * 
 * @param frequency - The capture frequency: "1h", "6h", or "daily"
 * @returns Date object representing the next scheduled run time
 */
export function calculateNextRun(frequency: "1h" | "6h" | "daily"): Date {
  const now = new Date();
  const nextRun = new Date(now);

  if (frequency === "1h") {
    // Run 1 hour from now
    nextRun.setHours(nextRun.getHours() + 1);
  } else if (frequency === "6h") {
    // Run 6 hours from now
    nextRun.setHours(nextRun.getHours() + 6);
  } else {
    // daily - next run at 9 AM UTC tomorrow
    nextRun.setDate(nextRun.getDate() + 1);
    nextRun.setHours(9, 0, 0, 0);
  }

  return nextRun;
}

/**
 * Scheduled event-based capture scheduler.
 * 
 * Instead of using a fixed cron, this job is triggered by a scheduled event
 * with a future timestamp. When workspace settings change, old scheduled
 * events are cancelled via bulk cancellation API and new ones are sent.
 * 
 * Each workspace gets its own scheduled event, allowing per-workspace
 * frequency control and immediate rescheduling when settings change.
 * 
 * @see https://www.inngest.com/docs/guides/delayed-functions
 */
export const scheduleCapturesScheduledJob = inngest.createFunction(
  {
    id: "schedule-captures-scheduled",
    name: "Schedule Competitor Captures (Scheduled)",
  },
  { event: "workspace/schedule-captures" },
  async ({ event, step }) => {
    const { workspaceId } = event.data;

    logger.info("Scheduled capture job triggered", { workspaceId });

    // Get workspace settings
    const settings = await step.run("get-workspace-settings", async () => {
      const [wsSettings] = await db
        .select()
        .from(workspaceSettings)
        .where(eq(workspaceSettings.workspaceId, workspaceId));

      return wsSettings;
    });

    if (!settings) {
      logger.warn("No workspace settings found, skipping", { workspaceId });
      return { scheduled: 0 };
    }

    // Get active competitors for this workspace
    const activeCompetitors = await step.run(
      "get-active-competitors",
      async () => {
        return await db.query.competitors.findMany({
          where: eq(competitors.workspaceId, workspaceId),
          with: { monitorSettings: true },
        });
      }
    );

    const now = new Date();
    const batchEvents: Array<{
      name: string;
      data: { workspaceId: string; frequency: "1h" | "6h" | "daily" };
    }> = [];

    // Group by frequency and trigger batch jobs
    const frequencies = new Set<string>();

    for (const competitor of activeCompetitors) {
      const monitorSettingsItem = competitor.monitorSettings;
      if (!monitorSettingsItem || !competitor.isActive) continue;

      let shouldCapture = false;
      if (monitorSettingsItem.frequency === "1h") {
        shouldCapture = true;
      } else if (monitorSettingsItem.frequency === "6h") {
        shouldCapture = now.getHours() % 6 === 0;
      } else if (monitorSettingsItem.frequency === "daily") {
        shouldCapture = now.getHours() === 9;
      }

      if (shouldCapture) {
        frequencies.add(monitorSettingsItem.frequency);
      }
    }

    // Send batch capture events
    for (const frequency of frequencies) {
      batchEvents.push({
        name: "snapshot/batch-capture",
        data: {
          workspaceId,
          frequency: frequency as "1h" | "6h" | "daily",
        },
      });
    }

    if (batchEvents.length > 0) {
      await Promise.all(
        batchEvents.map((evt) =>
          step.sendEvent(`batch-${evt.data.workspaceId}-${evt.data.frequency}`, evt)
        )
      );
    }

    // Calculate next run time based on current workspace frequency setting
    const nextRunTime = calculateNextRun(settings.defaultFrequency);

    logger.info("Calculated next run time", {
      workspaceId,
      frequency: settings.defaultFrequency,
      nextRun: nextRunTime.toISOString(),
    });

    // Reschedule by sending event with future timestamp
    await step.sendEvent("reschedule-self", {
      name: "workspace/schedule-captures",
      data: { workspaceId },
      ts: nextRunTime.getTime(), // Schedule for future execution
    });

    return {
      scheduled: batchEvents.length,
      nextRunTime: nextRunTime.toISOString(),
    };
  }
);
