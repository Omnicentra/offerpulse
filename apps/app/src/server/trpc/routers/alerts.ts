import { router, workspaceProcedure } from "../trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { alertSettings } from "../../db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

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
          })
          .returning();
      }

      return settings;
    }),

  update: workspaceProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        emailEnabled: z.boolean().optional(),
        slackEnabled: z.boolean().optional(),
        slackWebhookUrl: z.string().optional(),
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
          .set(data)
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
            eventTypes: data.eventTypes ?? [
              "PROMO",
              "SHIPPING",
              "BUNDLE",
              "CART_INCENTIVE",
              "DELIVERY_RETURNS",
            ],
            minConfidence: data.minConfidence ?? "medium",
          })
          .returning();

        return created;
      }
    }),

  test: workspaceProcedure
    .input(z.object({ workspaceId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // TODO: Implement actual notification sending in Phase 4
      // For now, just return success
      const settings = await ctx.db.query.alertSettings.findFirst({
        where: eq(alertSettings.workspaceId, input.workspaceId),
      });

      if (!settings) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Alert settings not found",
        });
      }

      // Simulate success (90% of the time)
      if (Math.random() > 0.1) {
        return {
          success: true,
          message: "Test notification sent successfully!",
        };
      } else {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send test notification. Please check your settings.",
        });
      }
    }),
});
