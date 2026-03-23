import { inngest } from "../client";
import { db } from "../../db";
import {
  weeklyPulses,
  changeEvents,
  recommendations,
  alertSettings,
  workspaceMembers,
  user,
} from "../../db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { nanoid } from "nanoid";
import { sendWeeklyPulseEmail, sendSlackWeeklyPulse } from "../../notifications";
import { env } from "@/env";
import { logger } from "@offerpulse/lib";

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

        const digestMoves =
          topMoves.length > 0
            ? topMoves
            : [...workspaceChanges]
                .sort(
                  (a, b) =>
                    new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime()
                )
                .slice(0, 5);

        const topChangesPayload = digestMoves.map((m) => ({
          competitorName: m.competitor.name,
          changeType: m.type,
          summary: m.summary,
        }));

        const dashboardBase = env.NEXT_PUBLIC_DASHBOARD_APP_URL;
        const dashboardUrl = `${dashboardBase}/weekly-pulse?week=${encodeURIComponent(weekStart.toISOString())}`;

        const settings = await db.query.alertSettings.findFirst({
          where: eq(alertSettings.workspaceId, workspace.id),
        });

        if (settings?.weeklyPulseAlertsEnabled) {
          if (settings.emailEnabled) {
            const [workspaceOwner] = await db
              .select({ email: user.email })
              .from(workspaceMembers)
              .innerJoin(user, eq(user.id, workspaceMembers.userId))
              .where(
                and(
                  eq(workspaceMembers.workspaceId, workspace.id),
                  eq(workspaceMembers.role, "owner")
                )
              )
              .limit(1);

            const recipientEmail = workspaceOwner?.email;
            if (recipientEmail) {
              const emailResult = await sendWeeklyPulseEmail(recipientEmail, {
                weekOf: weekStart,
                totalChanges: totals.changes,
                topChanges: topChangesPayload,
                dashboardUrl,
              });
              if (emailResult.success) {
                logger.info("Weekly pulse email sent", {
                  workspaceId: workspace.id,
                  messageId: emailResult.messageId,
                });
              } else {
                logger.error("Weekly pulse email failed", {
                  workspaceId: workspace.id,
                  error: emailResult.error,
                });
              }
            } else {
              logger.warn("Weekly pulse email skipped: no owner email", {
                workspaceId: workspace.id,
              });
            }
          }

          if (settings.slackEnabled) {
            const slackTarget =
              settings.slackAccessToken && settings.slackChannel
                ? {
                    accessToken: settings.slackAccessToken,
                    channel: settings.slackChannel,
                  }
                : settings.slackWebhookUrl
                  ? { webhookUrl: settings.slackWebhookUrl }
                  : null;

            if (slackTarget) {
              const slackResult = await sendSlackWeeklyPulse(slackTarget, {
                weekOf: weekStart,
                totalChanges: totals.changes,
                topChanges: topChangesPayload,
                dashboardUrl,
              });
              if (slackResult.success) {
                logger.info("Weekly pulse Slack message sent", {
                  workspaceId: workspace.id,
                });
              } else {
                logger.error("Weekly pulse Slack failed", {
                  workspaceId: workspace.id,
                  error: slackResult.error,
                });
              }
            }
          }
        }

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
