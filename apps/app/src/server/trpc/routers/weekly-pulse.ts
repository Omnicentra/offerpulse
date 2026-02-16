import { router, workspaceProcedure } from "../trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { weeklyPulses } from "../../db/schema";
import { eq, and, desc } from "drizzle-orm";

export const weeklyPulseRouter = router({
  list: workspaceProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ ctx, input }) => {
      const pulses = await ctx.db.query.weeklyPulses.findMany({
        where: eq(weeklyPulses.workspaceId, input.workspaceId),
        orderBy: [desc(weeklyPulses.weekOf)],
      });

      return pulses;
    }),

  get: workspaceProcedure
    .input(z.object({ workspaceId: z.string(), weekOf: z.string() }))
    .query(async ({ ctx, input }) => {
      const pulse = await ctx.db.query.weeklyPulses.findFirst({
        where: and(
          eq(weeklyPulses.workspaceId, input.workspaceId),
          eq(weeklyPulses.weekOf, new Date(input.weekOf))
        ),
      });

      if (!pulse) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Weekly pulse not found for this week",
        });
      }

      // Fetch related change events and recommendations
      const changeEventsList = pulse.topMoveIds
        ? await ctx.db.query.changeEvents.findMany({
            where: (changeEvents, { inArray }) =>
              inArray(changeEvents.id, pulse.topMoveIds as string[]),
          })
        : [];

      const recommendationsList = pulse.recommendationIds
        ? await ctx.db.query.recommendations.findMany({
            where: (recommendations, { inArray }) =>
              inArray(recommendations.id, pulse.recommendationIds as string[]),
          })
        : [];

      return {
        ...pulse,
        topMoves: changeEventsList,
        recommendations: recommendationsList,
      };
    }),
});
