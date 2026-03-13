import { router, workspaceProcedure, shopifyIntegrationProcedure } from "../trpc";
import { z } from "zod";
import { ownStores } from "../../db/schema";
import { eq } from "drizzle-orm";
import { inngest } from "../../jobs/client";

export const shopifyRouter = router({
  triggerSync: shopifyIntegrationProcedure
    .input(z.object({ workspaceId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [store] = await ctx.db
        .select()
        .from(ownStores)
        .where(eq(ownStores.workspaceId, input.workspaceId));

      if (!store || store.platform !== "shopify") {
        throw new Error("Store not connected to Shopify");
      }

      await inngest.send({
        name: "shopify/store.sync",
        data: { workspaceId: input.workspaceId },
      });

      return { success: true };
    }),

  disconnect: workspaceProcedure
    .input(z.object({ workspaceId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [store] = await ctx.db
        .select()
        .from(ownStores)
        .where(eq(ownStores.workspaceId, input.workspaceId));

      if (!store) {
        return { success: true };
      }

      await ctx.db
        .update(ownStores)
        .set({
          platform: "manual",
          shopifyAccessToken: null,
          shopifyShopDomain: null,
          syncStatus: null,
          syncError: null,
          lastSyncedAt: null,
        })
        .where(eq(ownStores.id, store.id));

      return { success: true };
    }),
});
