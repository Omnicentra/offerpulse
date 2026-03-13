import { router, workspaceProcedure } from "../trpc";
import { z } from "zod";
import { workspaceSettings } from "../../db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { DEFAULT_OPENROUTER_MODEL, PREMIUM_OPENROUTER_MODEL } from "@offerpulse/lib/constants";
import { logger } from "@offerpulse/lib";

export const workspaceSettingsRouter = router({
  get: workspaceProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ ctx, input }) => {
      logger.debug("Getting workspace settings", { workspaceId: input.workspaceId });
      let [settings] = await ctx.db.select().from(workspaceSettings).where(eq(workspaceSettings.workspaceId, input.workspaceId));

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
            openRouterModel: DEFAULT_OPENROUTER_MODEL,
          })
          .returning();
      }
      logger.debug("Workspace settings", { settings });
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
        /** OpenRouter model ID (e.g. openai/gpt-4.1-mini, x-ai/grok-4.1-fast, google/gemini-3.1-flash-lite-preview). Pass null to clear. */
        openRouterModel: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { workspaceId, ...data } = input;

      const allowedModels = [
        DEFAULT_OPENROUTER_MODEL,
        "x-ai/grok-4.1-fast",
        PREMIUM_OPENROUTER_MODEL,
      ] as const;
      type AllowedModel = (typeof allowedModels)[number];

      // Restrict premium AI model to Growth/Agency plans; sanitize to allowed enum
      const planId = ctx.subscription.planId as string;
      const canUsePremiumModel = ["growth", "agency"].includes(planId);
      let openRouterModel: AllowedModel | null | undefined = data.openRouterModel as AllowedModel | null | undefined;
      if (openRouterModel === PREMIUM_OPENROUTER_MODEL && !canUsePremiumModel) {
        openRouterModel = DEFAULT_OPENROUTER_MODEL;
      }
      if (openRouterModel !== undefined && openRouterModel !== null && !allowedModels.includes(openRouterModel)) {
        openRouterModel = DEFAULT_OPENROUTER_MODEL;
      }

      const setPayload = {
        ...data,
        openRouterModel,
      };

      // Check if settings exist
      const existing = await ctx.db.query.workspaceSettings.findFirst({
        where: eq(workspaceSettings.workspaceId, workspaceId),
      });

      if (existing) {
        const [updated] = await ctx.db
          .update(workspaceSettings)
          .set(setPayload)
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
            openRouterModel: openRouterModel ?? DEFAULT_OPENROUTER_MODEL,
          })
          .returning();

        return created;
      }
    }),
});
