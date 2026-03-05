import { inngest } from "../client";
import { db } from "../../db";
import { alertSettings, competitors } from "../../db/schema";
import { eq } from "drizzle-orm";
import { sendCaptureCompleteEmail } from "../../notifications/email";
import { sendSlackCaptureComplete } from "../../notifications/slack";
import { env } from "@/env";

export const sendCaptureNotificationJob = inngest.createFunction(
  {
    id: "send-capture-notification",
    name: "Send Capture Notification",
  },
  { event: "alert/capture-complete" },
  async ({ event, step }) => {
    const { snapshotId, competitorId, workspaceId, status } = event.data;

    const settings = await step.run("get-settings", async () => {
      return await db.query.alertSettings.findFirst({
        where: eq(alertSettings.workspaceId, workspaceId),
      });
    });

    if (!settings?.captureNotificationsEnabled) {
      return { sent: false, reason: "Capture notifications disabled" };
    }

    const competitor = await step.run("get-competitor", async () => {
      return await db.query.competitors.findFirst({
        where: eq(competitors.id, competitorId),
      });
    });

    if (!competitor) {
      return { sent: false, reason: "Competitor not found" };
    }

    const dashboardUrl =
      env.NEXT_PUBLIC_DASHBOARD_APP_URL ?? "http://localhost:3001";
    const snapshotUrl = `${dashboardUrl}/snapshots/${snapshotId}`;
    const payload = {
      competitorName: competitor.name,
      competitorUrl: competitor.baseUrl,
      status: status as "success" | "failed" | "changes_detected",
      snapshotUrl,
      timestamp: new Date(),
    };

    const results: string[] = [];
    const errors: string[] = [];

    if (settings.emailEnabled) {
      await step.run("send-email", async () => {
        const to = env.ALERT_EMAIL ?? "alerts@example.com";
        const result = await sendCaptureCompleteEmail(to, payload);
        if (result.success) {
          results.push("email");
        } else {
          errors.push(`Email: ${result.error}`);
        }
      });
    }

    if (settings.slackEnabled) {
      const slackTarget =
        settings.slackAccessToken && settings.slackChannel
          ? {
              accessToken: settings.slackAccessToken,
              channel: settings.slackChannel,
            }
          : settings.slackWebhookUrl
            ? { webhookUrl: settings.slackWebhookUrl }
            : null;

      if (slackTarget) {
        await step.run("send-slack", async () => {
          const result = await sendSlackCaptureComplete(slackTarget, payload);
          if (result.success) {
            results.push("slack");
          } else {
            errors.push(`Slack: ${result.error}`);
          }
        });
      }
    }

    return {
      sent: results.length > 0,
      channels: results,
      errors: errors.length > 0 ? errors : undefined,
    };
  }
);
