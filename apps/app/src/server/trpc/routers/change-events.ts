import { logger } from "@offerpulse/lib";
import { TRPCError } from "@trpc/server";
import { desc, eq, gte, lte } from "drizzle-orm";
import { z } from "zod";
import { changeEvents, competitors } from "../../db/schema";
import { router, workspaceProcedure } from "../trpc";

export const changeEventsRouter = router({
  list: workspaceProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        competitorId: z.string().optional(),
        type: z.array(z.string()).optional(),
        confidence: z.enum(["low", "medium", "high"]).optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
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

      // Build query filters
      const whereConditions: any[] = [];

      if (input.competitorId) {
        // Verify competitor belongs to workspace
        if (!competitorIds.includes(input.competitorId)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Access denied",
          });
        }
        whereConditions.push(eq(changeEvents.competitorId, input.competitorId));
      }

      if (input.confidence) {
        whereConditions.push(eq(changeEvents.confidence, input.confidence));
      }

      if (input.dateFrom) {
        whereConditions.push(
          gte(changeEvents.detectedAt, new Date(input.dateFrom))
        );
      }

      if (input.dateTo) {
        whereConditions.push(lte(changeEvents.detectedAt, new Date(input.dateTo)));
      }

      let events = await ctx.db.query.changeEvents.findMany({
        orderBy: [desc(changeEvents.detectedAt)],
        with: {
          competitor: true,
          snapshotBefore: true,
          snapshotAfter: true,
        },
      });

      // Filter by workspace competitors
      events = events.filter((e) => competitorIds.includes(e.competitorId));

      // Apply additional filters
      if (input.competitorId) {
        events = events.filter((e) => e.competitorId === input.competitorId);
      }

      if (input.type && input.type.length > 0) {
        events = events.filter((e) => input.type!.includes(e.type));
      }

      if (input.confidence) {
        events = events.filter((e) => e.confidence === input.confidence);
      }

      if (input.dateFrom) {
        const fromDate = new Date(input.dateFrom);
        events = events.filter((e) => new Date(e.detectedAt) >= fromDate);
      }

      if (input.dateTo) {
        const toDate = new Date(input.dateTo);
        events = events.filter((e) => new Date(e.detectedAt) <= toDate);
      }

      return events;
    }),

  get: workspaceProcedure
    .input(z.object({ workspaceId: z.string(), id: z.string() }))
    .query(async ({ ctx, input }) => {
      const event = await ctx.db.query.changeEvents.findFirst({
        where: eq(changeEvents.id, input.id),
        with: {
          competitor: true,
          snapshotBefore: true,
          snapshotAfter: true,
          recommendations: true,
        },
      });

      if (!event) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Change event not found",
        });
      }

      // Verify competitor belongs to workspace
      if (event.competitor.workspaceId !== input.workspaceId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied",
        });
      }

      logger.debug("[change-events] get", {
        event: { id: event.id, competitorId: event.competitorId, detectedAt: event.detectedAt, competitor: event.competitor?.name },
      });

      return event;
    }),
});
