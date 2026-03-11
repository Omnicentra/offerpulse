import { router, workspaceProcedure } from "../trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { snapshots, competitors, scrapeJobs } from "../../db/schema";
import { eq, and, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { inngest } from "../../jobs/client";
import { logger } from "@offerpulse/lib";
import { generateSnapshotPdf } from "../../pdf/generate-snapshot-pdf";

export const snapshotsRouter = router({
  list: workspaceProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        competitorId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
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

  downloadPDF: workspaceProcedure
    .input(z.object({ workspaceId: z.string(), id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { buffer, model } = await generateSnapshotPdf({
        db: ctx.db,
        workspaceId: input.workspaceId,
        snapshotId: input.id,
      });

      const sanitizedName = model.competitorName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      return {
        data: buffer.toString("base64"),
        filename: `snapshot-${sanitizedName || "report"}-${Date.now()}.pdf`,
      };
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

      // Create scrape job record to track capture progress
      const jobId = `job_${nanoid()}`;
      await ctx.db.insert(scrapeJobs).values({
        id: jobId,
        competitorId: input.competitorId,
        status: "pending",
      });

      logger.debug("[snapshots] Manual capture triggered", {
        competitorId: input.competitorId,
        workspaceId: input.workspaceId,
        jobId,
      });

      // Trigger Inngest job for async scraping
      await inngest.send({
        name: "competitor/capture",
        data: {
          competitorId: input.competitorId,
          workspaceId: input.workspaceId,
        },
      });

      // Return job ID so frontend can track progress
      return {
        jobId,
        message: "Capture queued - snapshot will appear shortly",
      };
    }),

  captureStatus: workspaceProcedure
    .input(z.object({ workspaceId: z.string(), jobId: z.string() }))
    .query(async ({ ctx, input }) => {
      const job = await ctx.db.query.scrapeJobs.findFirst({
        where: eq(scrapeJobs.id, input.jobId),
        with: {
          competitor: true,
          snapshot: true,
        },
      });

      if (!job) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Scrape job not found",
        });
      }

      // Verify competitor belongs to workspace
      if (job.competitor.workspaceId !== input.workspaceId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied",
        });
      }

      return {
        status: job.status,
        snapshotId: job.snapshotId,
        error: job.error,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
      };
    }),
});
