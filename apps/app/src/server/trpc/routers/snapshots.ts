import { router, workspaceProcedure } from "../trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { snapshots, competitors } from "../../db/schema";
import { eq, and, desc } from "drizzle-orm";
import { nanoid } from "nanoid";

export const snapshotsRouter = router({
  list: workspaceProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        competitorId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      let query = ctx.db.query.snapshots.findMany({
        orderBy: [desc(snapshots.capturedAt)],
        with: {
          competitor: true,
        },
      });

      if (input.competitorId) {
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

        const snapshotsList = await ctx.db.query.snapshots.findMany({
          where: eq(snapshots.competitorId, input.competitorId),
          orderBy: [desc(snapshots.capturedAt)],
          with: {
            competitor: true,
          },
        });

        return snapshotsList;
      }

      // Get all snapshots for workspace competitors
      const workspaceCompetitors = await ctx.db.query.competitors.findMany({
        where: eq(competitors.workspaceId, input.workspaceId),
      });

      const competitorIds = workspaceCompetitors.map((c) => c.id);

      if (competitorIds.length === 0) {
        return [];
      }

      const snapshotsList = await ctx.db.query.snapshots.findMany({
        orderBy: [desc(snapshots.capturedAt)],
        with: {
          competitor: true,
        },
      });

      // Filter by workspace competitors
      return snapshotsList.filter((s) =>
        competitorIds.includes(s.competitorId)
      );
    }),

  get: workspaceProcedure
    .input(z.object({ workspaceId: z.string(), id: z.string() }))
    .query(async ({ ctx, input }) => {
      const snapshot = await ctx.db.query.snapshots.findFirst({
        where: eq(snapshots.id, input.id),
        with: {
          competitor: true,
        },
      });

      if (!snapshot) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Snapshot not found",
        });
      }

      // Verify competitor belongs to workspace
      if (snapshot.competitor.workspaceId !== input.workspaceId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied",
        });
      }

      return snapshot;
    }),

  capture: workspaceProcedure
    .input(z.object({ workspaceId: z.string(), competitorId: z.string() }))
    .mutation(async ({ ctx, input }) => {
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

      // TODO: This will be replaced with actual scraping logic in Phase 3
      // For now, create a mock snapshot with random data
      const mockSignals = {
        confidence: ["low", "medium", "high"][
          Math.floor(Math.random() * 3)
        ] as "low" | "medium" | "high",
        promoText: Math.random() > 0.5 ? "20% OFF SITEWIDE" : undefined,
        discountPercent: Math.random() > 0.5 ? 20 : undefined,
        discountCode: Math.random() > 0.5 ? "SAVE20" : undefined,
        shippingThreshold: Math.random() > 0.6 ? 50 : undefined,
        shippingText:
          Math.random() > 0.6 ? "Free shipping on orders over $50" : undefined,
      };

      const [newSnapshot] = await ctx.db
        .insert(snapshots)
        .values({
          id: `snap_${nanoid()}`,
          competitorId: input.competitorId,
          extractedSignals: mockSignals,
          screenshotUrl: undefined, // Will be set by scraping service
        })
        .returning();

      // Update competitor's lastSnapshotAt
      await ctx.db
        .update(competitors)
        .set({ lastSnapshotAt: newSnapshot.capturedAt })
        .where(eq(competitors.id, input.competitorId));

      return newSnapshot;
    }),
});
