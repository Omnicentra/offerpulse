import { router, workspaceProcedure } from "../trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  recommendations,
  recommendationChecklistItems,
  competitors,
} from "../../db/schema";
import { eq, and } from "drizzle-orm";

export const recommendationsRouter = router({
  list: workspaceProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        status: z.enum(["open", "done", "snoozed"]).optional(),
        competitorId: z.string().optional(),
        minImpact: z.number().optional(),
        maxEffort: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Get all competitors for the workspace
      const workspaceCompetitors = await ctx.db.query.competitors.findMany({
        where: eq(competitors.workspaceId, input.workspaceId),
      });

      const competitorIds = workspaceCompetitors.map((c) => c.id);

      if (competitorIds.length === 0) {
        return [];
      }

      let recs = await ctx.db.query.recommendations.findMany({
        with: {
          competitor: true,
          changeEvent: true,
          checklistItems: {
            orderBy: (items, { asc }) => [asc(items.order)],
          },
        },
      });

      // Filter by workspace competitors
      recs = recs.filter((r) => competitorIds.includes(r.competitorId));

      // Apply filters
      if (input.status) {
        recs = recs.filter((r) => r.status === input.status);
      }

      if (input.competitorId) {
        if (!competitorIds.includes(input.competitorId)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Access denied",
          });
        }
        recs = recs.filter((r) => r.competitorId === input.competitorId);
      }

      if (input.minImpact !== undefined) {
        recs = recs.filter((r) => r.impact >= input.minImpact!);
      }

      if (input.maxEffort !== undefined) {
        recs = recs.filter((r) => r.effort <= input.maxEffort!);
      }

      return recs;
    }),

  get: workspaceProcedure
    .input(z.object({ workspaceId: z.string(), id: z.string() }))
    .query(async ({ ctx, input }) => {
      const rec = await ctx.db.query.recommendations.findFirst({
        where: eq(recommendations.id, input.id),
        with: {
          competitor: true,
          changeEvent: true,
          checklistItems: {
            orderBy: (items, { asc }) => [asc(items.order)],
          },
        },
      });

      if (!rec) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Recommendation not found",
        });
      }

      // Verify competitor belongs to workspace
      if (rec.competitor.workspaceId !== input.workspaceId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied",
        });
      }

      return rec;
    }),

  updateStatus: workspaceProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        id: z.string(),
        status: z.enum(["open", "done", "snoozed"]),
        snoozedUntil: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const rec = await ctx.db.query.recommendations.findFirst({
        where: eq(recommendations.id, input.id),
        with: {
          competitor: true,
        },
      });

      if (!rec) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Recommendation not found",
        });
      }

      // Verify competitor belongs to workspace
      if (rec.competitor.workspaceId !== input.workspaceId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied",
        });
      }

      const [updated] = await ctx.db
        .update(recommendations)
        .set({
          status: input.status,
          snoozedUntil: input.snoozedUntil
            ? new Date(input.snoozedUntil)
            : null,
        })
        .where(eq(recommendations.id, input.id))
        .returning();

      return updated;
    }),

  updateChecklist: workspaceProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        id: z.string(),
        checklist: z.array(
          z.object({
            id: z.string(),
            text: z.string(),
            done: z.boolean(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const rec = await ctx.db.query.recommendations.findFirst({
        where: eq(recommendations.id, input.id),
        with: {
          competitor: true,
          checklistItems: true,
        },
      });

      if (!rec) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Recommendation not found",
        });
      }

      // Verify competitor belongs to workspace
      if (rec.competitor.workspaceId !== input.workspaceId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied",
        });
      }

      // Update each checklist item
      for (let i = 0; i < input.checklist.length; i++) {
        const item = input.checklist[i];
        await ctx.db
          .update(recommendationChecklistItems)
          .set({
            text: item.text,
            done: item.done,
          })
          .where(eq(recommendationChecklistItems.id, item.id));
      }

      // Return updated recommendation
      const updated = await ctx.db.query.recommendations.findFirst({
        where: eq(recommendations.id, input.id),
        with: {
          checklistItems: {
            orderBy: (items, { asc }) => [asc(items.order)],
          },
        },
      });

      return updated;
    }),
});
