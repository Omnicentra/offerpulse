import { router, workspaceProcedure } from "../trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { monitorSettings, competitors } from "../../db/schema";
import { eq, and } from "drizzle-orm";

const upsertSchema = z.object({
  workspaceId: z.string(),
  competitorId: z.string(),
  frequency: z.enum(["1h", "6h", "daily"]),
  trackPromos: z.boolean(),
  trackShipping: z.boolean(),
  trackBundles: z.boolean(),
  trackCart: z.boolean(),
  trackDeliveryReturns: z.boolean(),
});

export const monitorSettingsRouter = router({
  get: workspaceProcedure
    .input(z.object({ workspaceId: z.string(), competitorId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Verify competitor belongs to workspace
      const competitor = await ctx.db.query.competitors.findFirst({
        where: and(
          eq(competitors.id, input.competitorId),
          eq(competitors.workspaceId, input.workspaceId)
        ),
      });

      if (!competitor) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Competitor not found",
        });
      }

      const settings = await ctx.db.query.monitorSettings.findFirst({
        where: eq(monitorSettings.competitorId, input.competitorId),
      });

      return settings;
    }),

  upsert: workspaceProcedure
    .input(upsertSchema)
    .mutation(async ({ ctx, input }) => {
      const { workspaceId, competitorId, ...data } = input;

      // Verify competitor belongs to workspace
      const competitor = await ctx.db.query.competitors.findFirst({
        where: and(
          eq(competitors.id, competitorId),
          eq(competitors.workspaceId, workspaceId)
        ),
      });

      if (!competitor) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Competitor not found",
        });
      }

      // Check if settings exist
      const existing = await ctx.db.query.monitorSettings.findFirst({
        where: eq(monitorSettings.competitorId, competitorId),
      });

      if (existing) {
        // Update
        const [updated] = await ctx.db
          .update(monitorSettings)
          .set(data)
          .where(eq(monitorSettings.competitorId, competitorId))
          .returning();

        return updated;
      } else {
        // Insert
        const { nanoid } = await import("nanoid");
        const [created] = await ctx.db
          .insert(monitorSettings)
          .values({
            id: `ms_${nanoid()}`,
            competitorId,
            ...data,
          })
          .returning();

        return created;
      }
    }),
});
