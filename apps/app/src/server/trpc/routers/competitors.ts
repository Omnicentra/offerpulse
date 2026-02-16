import { router, workspaceProcedure } from "../trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { competitors, monitorSettings, snapshots, changeEvents, recommendations } from "../../db/schema";
import { eq, and, desc } from "drizzle-orm";
import { nanoid } from "nanoid";

const createCompetitorSchema = z.object({
  workspaceId: z.string(),
  name: z.string().min(1),
  domain: z.string().min(1),
  baseUrl: z.string().url(),
  platformGuess: z.enum(["shopify", "other"]).default("other"),
  tags: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
});

const updateCompetitorSchema = z.object({
  workspaceId: z.string(),
  id: z.string(),
  name: z.string().min(1).optional(),
  domain: z.string().min(1).optional(),
  baseUrl: z.string().url().optional(),
  platformGuess: z.enum(["shopify", "other"]).optional(),
  tags: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export const competitorsRouter = router({
  list: workspaceProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ ctx, input }) => {
      const competitorsList = await ctx.db.query.competitors.findMany({
        where: eq(competitors.workspaceId, input.workspaceId),
        orderBy: [desc(competitors.createdAt)],
        with: {
          monitorSettings: true,
        },
      });

      return competitorsList;
    }),

  get: workspaceProcedure
    .input(z.object({ workspaceId: z.string(), id: z.string() }))
    .query(async ({ ctx, input }) => {
      const competitor = await ctx.db.query.competitors.findFirst({
        where: and(
          eq(competitors.id, input.id),
          eq(competitors.workspaceId, input.workspaceId)
        ),
        with: {
          monitorSettings: true,
        },
      });

      if (!competitor) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Competitor not found",
        });
      }

      return competitor;
    }),

  create: workspaceProcedure
    .input(createCompetitorSchema)
    .mutation(async ({ ctx, input }) => {
      const { workspaceId, ...data } = input;

      const id = `comp_${nanoid()}`;

      const [newCompetitor] = await ctx.db
        .insert(competitors)
        .values({
          id,
          workspaceId,
          ...data,
        })
        .returning();

      // Create default monitor settings
      await ctx.db.insert(monitorSettings).values({
        id: `ms_${nanoid()}`,
        competitorId: id,
        frequency: "daily",
        trackPromos: true,
        trackShipping: true,
        trackBundles: true,
        trackCart: true,
        trackDeliveryReturns: true,
      });

      return newCompetitor;
    }),

  update: workspaceProcedure
    .input(updateCompetitorSchema)
    .mutation(async ({ ctx, input }) => {
      const { workspaceId, id, ...data } = input;

      // Verify ownership
      const existing = await ctx.db.query.competitors.findFirst({
        where: and(
          eq(competitors.id, id),
          eq(competitors.workspaceId, workspaceId)
        ),
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Competitor not found",
        });
      }

      const [updated] = await ctx.db
        .update(competitors)
        .set(data)
        .where(eq(competitors.id, id))
        .returning();

      return updated;
    }),

  delete: workspaceProcedure
    .input(z.object({ workspaceId: z.string(), id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const existing = await ctx.db.query.competitors.findFirst({
        where: and(
          eq(competitors.id, input.id),
          eq(competitors.workspaceId, input.workspaceId)
        ),
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Competitor not found",
        });
      }

      // Cascade delete will handle related records
      await ctx.db.delete(competitors).where(eq(competitors.id, input.id));

      return { success: true };
    }),

  toggleStatus: workspaceProcedure
    .input(z.object({ workspaceId: z.string(), id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.competitors.findFirst({
        where: and(
          eq(competitors.id, input.id),
          eq(competitors.workspaceId, input.workspaceId)
        ),
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Competitor not found",
        });
      }

      const [updated] = await ctx.db
        .update(competitors)
        .set({ isActive: !existing.isActive })
        .where(eq(competitors.id, input.id))
        .returning();

      return updated;
    }),
});
