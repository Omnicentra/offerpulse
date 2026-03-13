import { logger } from "@offerpulse/lib";
import { inngest } from "../client";

/**
 * Cleanup handler for cancelled scheduled capture jobs.
 * 
 * This function is triggered by the `inngest/function.cancelled` system event
 * whenever a scheduled capture job is cancelled (typically when workspace
 * settings change and the schedule is rescheduled).
 * 
 * Used for:
 * - Logging cancellations for observability
 * - Tracking cancellation metrics
 * - Debugging scheduling issues
 * 
 * @see https://www.inngest.com/docs/examples/cleanup-after-function-cancellation
 */
export const cleanupCancelledSchedules = inngest.createFunction(
  {
    id: "cleanup-cancelled-schedules",
    name: "Cleanup Cancelled Scheduled Captures",
  },
  {
    event: "inngest/function.cancelled",
    // Only handle cancellations for our scheduled capture function
    if: "event.data.function_id == 'offerpulse-schedule-captures-scheduled'",
  },
  async ({ event, step }) => {
    // Extract the original triggering event data
    const originalEvent = event.data.event;
    const workspaceId = originalEvent?.data?.workspaceId;
    const runId = event.data.run_id;
    const functionId = event.data.function_id;

    await step.run("log-cancellation", async () => {
      logger.info("Scheduled capture job was cancelled", {
        workspaceId,
        runId,
        functionId,
        reason: "Likely due to workspace settings change",
        cancelledAt: new Date().toISOString(),
      });

      // Optional: Could track metrics here
      // - Count of cancellations per workspace
      // - Frequency of rescheduling
      // - Alert if too many cancellations (possible bug)

      return {
        workspaceId,
        runId,
        cancelledAt: new Date().toISOString(),
      };
    });

    return {
      workspaceId,
      runId,
      handled: true,
    };
  }
);
