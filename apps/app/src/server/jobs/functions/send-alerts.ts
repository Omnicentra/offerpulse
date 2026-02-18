import { inngest } from "../client";
import { db } from "../../db";
import { alertSettings, changeEvents, recommendations, competitors } from "../../db/schema";
import { eq } from "drizzle-orm";
import { sendChangeAlertEmail, sendSlackAlert } from "../../notifications";
import { env } from "@/env";

export const sendAlertsJob = inngest.createFunction(
  {
    id: "send-alerts",
    name: "Send Alert Notifications",
  },
  { event: "alert/send" },
  async ({ event, step }) => {
    const { changeEventId, recommendationId, competitorId, workspaceId } = event.data;

    // Get alert settings
    const settings = await step.run("get-alert-settings", async () => {
      return await db.query.alertSettings.findFirst({
        where: eq(alertSettings.workspaceId, workspaceId),
      });
    });

    if (!settings) {
      return { sent: false, reason: "No alert settings configured" };
    }

    // Get change event, recommendation, and competitor (return object for correct typing)
    const details = await step.run("get-details", async () => {
      const ce = await db.query.changeEvents.findFirst({
        where: eq(changeEvents.id, changeEventId),
      });
      const rec = await db.query.recommendations.findFirst({
        where: eq(recommendations.id, recommendationId),
      });
      const comp = await db.query.competitors.findFirst({
        where: eq(competitors.id, competitorId),
      });
      return { changeEvent: ce, recommendation: rec, competitor: comp };
    });

    const { changeEvent, recommendation, competitor } = details;

    if (!changeEvent || !competitor) {
      return { sent: false, reason: "Missing event or competitor data" };
    }

    // Check if change type should trigger alert
    const shouldAlert = settings.eventTypes?.includes(changeEvent.type);
    if (!shouldAlert) {
      return { sent: false, reason: "Event type not enabled for alerts" };
    }

    // Check confidence threshold
    const confidenceLevels: Record<"low" | "medium" | "high", number> = {
      low: 1,
      medium: 2,
      high: 3,
    };
    const eventConfidence = confidenceLevels[changeEvent.confidence];
    const minConfidence = confidenceLevels[settings.minConfidence];

    if (eventConfidence < minConfidence) {
      return { sent: false, reason: "Confidence below threshold" };
    }

    const results: string[] = [];
    const errors: string[] = [];

    // Prepare alert data
    const alertData = {
      competitorName: competitor.name,
      competitorUrl: competitor.baseUrl,
      changeType: changeEvent.type,
      changeSummary: changeEvent.summary,
      confidence: changeEvent.confidence,
      recommendationTitle: recommendation?.title,
      recommendationStrategy: recommendation?.strategy,
      dashboardUrl: `${env.NEXT_PUBLIC_DASHBOARD_APP_URL || "http://localhost:3001"}/changes/${changeEventId}`,
    };

    // Send email alert
    if (settings.emailEnabled) {
      await step.run("send-email", async () => {
        // In production, get user email from workspace owner
        // For now, use a placeholder
        const recipientEmail = env.ALERT_EMAIL || "alerts@example.com";

        const result = await sendChangeAlertEmail(recipientEmail, alertData);

        if (result.success) {
          results.push("email");
          console.log("📧 Email alert sent:", result.messageId);
        } else {
          errors.push(`Email: ${result.error}`);
          console.error("📧 Email alert failed:", result.error);
        }
      });
    }

    // Send Slack alert
    if (settings.slackEnabled && settings.slackWebhookUrl) {
      await step.run("send-slack", async () => {
        const result = await sendSlackAlert(settings.slackWebhookUrl!, alertData);

        if (result.success) {
          results.push("slack");
          console.log("💬 Slack alert sent");
        } else {
          errors.push(`Slack: ${result.error}`);
          console.error("💬 Slack alert failed:", result.error);
        }
      });
    }

    return {
      sent: results.length > 0,
      channels: results,
      errors: errors.length > 0 ? errors : undefined,
      changeEventId,
      recommendationId,
    };
  }
);
