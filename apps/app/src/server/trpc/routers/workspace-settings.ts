import { router, workspaceProcedure } from "../trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { workspaceSettings } from "../../db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export const workspaceSettingsRouter = router({
  get: workspaceProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ ctx, input }) => {
      let settings = await ctx.db.query.workspaceSettings.findFirst({
        where: eq(workspaceSettings.workspaceId, input.workspaceId),
      });

      // Create default settings if they don't exist
      if (!settings) {
        [settings] = await ctx.db
          .insert(workspaceSettings)
          .values({
            id: `ws_${nanoid()}`,
            workspaceId: input.workspaceId,
            defaultFrequency: "daily",
            defaultTrackPromos: true,
            defaultTrackShipping: true,
            defaultTrackBundles: true,
            defaultTrackCart: true,
            defaultTrackDeliveryReturns: true,
          })
          .returning();
      }

      return settings;
    }),

  update: workspaceProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        defaultFrequency: z.enum(["1h", "6h", "daily"]).optional(),
        defaultTrackPromos: z.boolean().optional(),
        defaultTrackShipping: z.boolean().optional(),
        defaultTrackBundles: z.boolean().optional(),
        defaultTrackCart: z.boolean().optional(),
        defaultTrackDeliveryReturns: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { workspaceId, ...data } = input;

      // Check if settings exist
      const existing = await ctx.db.query.workspaceSettings.findFirst({
        where: eq(workspaceSettings.workspaceId, workspaceId),
      });

      if (existing) {
        const [updated] = await ctx.db
          .update(workspaceSettings)
          .set(data)
          .where(eq(workspaceSettings.workspaceId, workspaceId))
          .returning();

        return updated;
      } else {
        // Create new
        const [created] = await ctx.db
          .insert(workspaceSettings)
          .values({
            id: `ws_${nanoid()}`,
            workspaceId,
            defaultFrequency: data.defaultFrequency ?? "daily",
            defaultTrackPromos: data.defaultTrackPromos ?? true,
            defaultTrackShipping: data.defaultTrackShipping ?? true,
            defaultTrackBundles: data.defaultTrackBundles ?? true,
            defaultTrackCart: data.defaultTrackCart ?? true,
            defaultTrackDeliveryReturns: data.defaultTrackDeliveryReturns ?? true,
          })
          .returning();

        return created;
      }
    }),
});
