import { inngest } from "../client";
import { db } from "../../db";
import { weeklyPulses, changeEvents, recommendations } from "../../db/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { nanoid } from "nanoid";

export const generateWeeklyPulseJob = inngest.createFunction(
  {
    id: "generate-weekly-pulse",
    name: "Generate Weekly Pulse Report",
  },
  { cron: "0 9 * * 1" }, // Monday at 9 AM
  async ({ step }) => {
    // Calculate week range (previous Monday to Sunday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - daysToMonday - 7);
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    weekEnd.setHours(23, 59, 59, 999);

    // Get all workspaces (simplified - in production would batch by workspace)
    const workspaces = await step.run("get-workspaces", async () => {
      return await db.query.workspaces.findMany();
    });

    for (const workspace of workspaces) {
      await step.run(`generate-pulse-${workspace.id}`, async () => {
        // Get changes for the week
        const changes = await db.query.changeEvents.findMany({
          where: and(
            gte(changeEvents.detectedAt, weekStart),
            lte(changeEvents.detectedAt, weekEnd)
          ),
          with: {
            competitor: true,
          },
        });

        // Filter by workspace
        const workspaceChanges = changes.filter(
          (c) => c.competitor.workspaceId === workspace.id
        );

        if (workspaceChanges.length === 0) {
          return { skipped: true, reason: "No changes this week" };
        }

        // Calculate totals
        const totals = {
          changes: workspaceChanges.length,
          promos: workspaceChanges.filter((c) => c.type === "PROMO").length,
          shipping: workspaceChanges.filter((c) => c.type === "SHIPPING").length,
          bundles: workspaceChanges.filter((c) => c.type === "BUNDLE").length,
          cart: workspaceChanges.filter((c) => c.type === "CART_INCENTIVE").length,
        };

        // Get top moves (high confidence changes)
        const topMoves = workspaceChanges
          .filter((c) => c.confidence === "high")
          .sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime())
          .slice(0, 5);

        // Get open recommendations from the week
        const recs = await db.query.recommendations.findMany({
          where: eq(recommendations.status, "open"),
          with: {
            changeEvent: true,
          },
        });

        const weekRecs = recs.filter(
          (r) =>
            r.changeEvent &&
            new Date(r.changeEvent.detectedAt) >= weekStart &&
            new Date(r.changeEvent.detectedAt) <= weekEnd &&
            workspaceChanges.some((c) => c.id === r.changeEventId)
        );

        // Generate highlights
        const highlights = [
          {
            title: "Most Active Competitors",
            detail: `${new Set(workspaceChanges.map((c) => c.competitorId)).size} competitors made changes`,
          },
          {
            title: "Promotion Activity",
            detail: `${totals.promos} promotional changes detected`,
          },
        ];

        // Create pulse record
        await db.insert(weeklyPulses).values({
          id: `pulse_${nanoid()}`,
          workspaceId: workspace.id,
          weekOf: weekStart,
          totals,
          highlights,
          topMoveIds: topMoves.map((m) => m.id),
          recommendationIds: weekRecs.map((r) => r.id),
        });

        return {
          success: true,
          workspaceId: workspace.id,
          changesCount: workspaceChanges.length,
        };
      });
    }

    return { processed: workspaces.length };
  }
);
