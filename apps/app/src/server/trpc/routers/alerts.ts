import { router, workspaceProcedure } from "../trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { alertSettings } from "../../db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { sendChangeAlertEmail } from "../../notifications/email";
import {
  sendSlackAlert,
  listSlackChannels as listSlackChannelsFromSlack,
} from "../../notifications/slack";
import { env } from "@/env";

export const alertsRouter = router({
  get: workspaceProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ ctx, input }) => {
      let settings = await ctx.db.query.alertSettings.findFirst({
        where: eq(alertSettings.workspaceId, input.workspaceId),
      });

      // Create default settings if they don't exist
      if (!settings) {
        [settings] = await ctx.db
          .insert(alertSettings)
          .values({
            id: `alert_${nanoid()}`,
            workspaceId: input.workspaceId,
            emailEnabled: true,
            slackEnabled: false,
            eventTypes: [
              "PROMO",
              "SHIPPING",
              "BUNDLE",
              "CART_INCENTIVE",
              "DELIVERY_RETURNS",
            ],
            minConfidence: "medium",
            weeklyPulseAlertsEnabled: false,
          })
          .returning();
      }

      return settings;
    }),

  disconnectSlack: workspaceProcedure
    .input(z.object({ workspaceId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(alertSettings)
        .set({
          slackAccessToken: null,
          slackTeamId: null,
          slackTeamName: null,
          slackBotUserId: null,
          slackChannel: null,
          slackChannelName: null,
          slackEnabled: false,
        })
        .where(eq(alertSettings.workspaceId, input.workspaceId))
        .returning();
      return updated;
    }),

  update: workspaceProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        emailEnabled: z.boolean().optional(),
        slackEnabled: z.boolean().optional(),
        slackWebhookUrl: z.string().optional(),
        slackChannel: z.string().optional(),
        slackChannelName: z.string().optional(),
        captureNotificationsEnabled: z.boolean().optional(),
        weeklyPulseAlertsEnabled: z.boolean().optional(),
        eventTypes: z.array(z.string()).optional(),
        minConfidence: z.enum(["low", "medium", "high"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { workspaceId, ...data } = input;

      // Check if settings exist
      const existing = await ctx.db.query.alertSettings.findFirst({
        where: eq(alertSettings.workspaceId, workspaceId),
      });

      if (existing) {
        const [updated] = await ctx.db
          .update(alertSettings)
          .set({
            ...data,
            slackChannel: data.slackChannel,
            slackChannelName: data.slackChannelName,
          })
          .where(eq(alertSettings.workspaceId, workspaceId))
          .returning();

        return updated;
      } else {
        // Create new
        const [created] = await ctx.db
          .insert(alertSettings)
          .values({
            id: `alert_${nanoid()}`,
            workspaceId,
            emailEnabled: data.emailEnabled ?? true,
            slackEnabled: data.slackEnabled ?? false,
            slackWebhookUrl: data.slackWebhookUrl,
            slackChannel: data.slackChannel,
            slackChannelName: data.slackChannelName,
            captureNotificationsEnabled: data.captureNotificationsEnabled ?? false,
            eventTypes: data.eventTypes ?? [
              "PROMO",
              "SHIPPING",
              "BUNDLE",
              "CART_INCENTIVE",
              "DELIVERY_RETURNS",
            ],
            minConfidence: data.minConfidence ?? "medium",
            weeklyPulseAlertsEnabled: data.weeklyPulseAlertsEnabled ?? false,
          })
          .returning();

        return created;
      }
    }),

  listChannels: workspaceProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ ctx, input }) => {
      const settings = await ctx.db.query.alertSettings.findFirst({
        where: eq(alertSettings.workspaceId, input.workspaceId),
      });

      if (!settings?.slackAccessToken) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Slack not connected. Connect your workspace first.",
        });
      }

      return await listSlackChannelsFromSlack(settings.slackAccessToken);
    }),

  test: workspaceProcedure
    .input(z.object({ workspaceId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const settings = await ctx.db.query.alertSettings.findFirst({
        where: eq(alertSettings.workspaceId, input.workspaceId),
      });

      if (!settings) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Alert settings not found",
        });
      }

      const dashboardUrl =
        env.NEXT_PUBLIC_DASHBOARD_APP_URL ?? "https://app.offerpulse.com";
      const testAlertData = {
        competitorName: "Test Competitor",
        competitorUrl: "https://example.com",
        changeType: "PROMO",
        changeSummary:
          "This is a test notification from OfferPulse. Your alerts are working correctly.",
        confidence: "medium" as const,
        recommendationTitle: "No action needed",
        recommendationStrategy: "Test alert",
        dashboardUrl: `${dashboardUrl}/changes`,
      };

      const sent: string[] = [];
      const errors: string[] = [];

      if (settings.emailEnabled && ctx.user.email) {
        const emailResult = await sendChangeAlertEmail(
          ctx.user.email,
          testAlertData
        );
        if (emailResult.success) {
          sent.push("email");
        } else {
          errors.push(`Email: ${emailResult.error ?? "Unknown error"}`);
        }
      } else if (settings.emailEnabled && !ctx.user.email) {
        errors.push("Email: No email address for current user");
      }

      if (settings.slackEnabled) {
        let slackTarget:
          | { accessToken: string; channel: string }
          | { webhookUrl: string }
          | null = null;
        if (settings.slackAccessToken && settings.slackChannel) {
          slackTarget = {
            accessToken: settings.slackAccessToken,
            channel: settings.slackChannel,
          };
        } else if (settings.slackWebhookUrl) {
          slackTarget = { webhookUrl: settings.slackWebhookUrl };
        }
        if (slackTarget) {
          const slackResult = await sendSlackAlert(slackTarget, testAlertData);
          if (slackResult.success) {
            sent.push("Slack");
          } else {
            errors.push(`Slack: ${slackResult.error ?? "Unknown error"}`);
          }
        }
      }

      if (sent.length === 0 && errors.length > 0) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: errors.join(". "),
        });
      }

      if (sent.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Enable at least one channel (email or Slack) and ensure your account has an email before testing.",
        });
      }

      const channelList = sent.join(" and ");
      return {
        success: true,
        message: `Test notification sent successfully via ${channelList}.`,
      };
    }),
});
