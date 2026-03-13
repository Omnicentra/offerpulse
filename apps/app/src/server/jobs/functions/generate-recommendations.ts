import { inngest } from "../client";
import { db } from "../../db";
import {
  recommendations,
  recommendationChecklistItems,
  changeEvents,
  workspaceSettings,
} from "../../db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { generateRecommendation } from "../../ai";
import { detectChanges } from "../../change-detection";
import type { ExtractedSignals } from "../../scraping/extractor";
import type { ChangeDetectionResult } from "../../change-detection";

function buildDetectionResultFromFirecrawl(
  changeEvent: { summary: string; before?: Record<string, unknown> | null; after?: Record<string, unknown> | null; fieldsChanged?: string[] | null }
): ChangeDetectionResult {
  const fieldsChanged = changeEvent.fieldsChanged ?? [];
  const changes = fieldsChanged.map((field) => ({
    field,
    before: (changeEvent.before as Record<string, unknown>)?.[field],
    after: (changeEvent.after as Record<string, unknown>)?.[field],
    significance: "major" as const,
    description: `${field}: ${(changeEvent.before as Record<string, unknown>)?.[field] ?? "none"} → ${(changeEvent.after as Record<string, unknown>)?.[field] ?? "none"}`,
  }));
  return {
    hasChange: true,
    changeType: undefined,
    confidence: "medium",
    changes,
    summary: changeEvent.summary,
  };
}

export const generateRecommendationsJob = inngest.createFunction(
  {
    id: "generate-recommendations",
    name: "Generate AI Recommendations",
  },
  { event: "recommendation/generated" },
  async ({ event, step }) => {
    const { recommendationId: changeEventId, competitorId, workspaceId } = event.data;

    // Get the change event
    const changeEvent = await step.run("get-change-event", async () => {
      return await db.query.changeEvents.findFirst({
        where: eq(changeEvents.id, changeEventId),
        with: {
          competitor: true,
        },
      });
    });

    if (!changeEvent) {
      return { success: false, reason: "Change event not found" };
    }

    // Generate AI-powered recommendation
    const aiRecommendation = await step.run("generate-ai-recommendation", async () => {
      const settings = await db.query.workspaceSettings.findFirst({
        where: eq(workspaceSettings.workspaceId, workspaceId),
      });
      const model = settings?.openRouterModel ?? undefined;

      // Firecrawl change events have diffType 'json' and fieldsChanged
      const isFirecrawlChange = changeEvent.diffType === "json" && (changeEvent.fieldsChanged?.length ?? 0) > 0;

      let detectionResult: ChangeDetectionResult;
      let beforeSignals: ExtractedSignals | Record<string, unknown>;
      let afterSignals: ExtractedSignals | Record<string, unknown>;

      if (isFirecrawlChange) {
        detectionResult = buildDetectionResultFromFirecrawl(changeEvent);
        beforeSignals = (changeEvent.before ?? {}) as Record<string, unknown>;
        afterSignals = (changeEvent.after ?? {}) as Record<string, unknown>;
      } else {
        beforeSignals = (changeEvent.before ?? { confidence: "low" }) as ExtractedSignals;
        afterSignals = (changeEvent.after ?? { confidence: "low" }) as ExtractedSignals;
        detectionResult = detectChanges(beforeSignals, afterSignals);
      }

      const result = await generateRecommendation(
        {
          competitorName: changeEvent.competitor.name,
          competitorUrl: changeEvent.competitor.baseUrl,
          changeType: changeEvent.type,
          changeSummary: changeEvent.summary,
          beforeSignals,
          afterSignals,
          detectionResult,
        },
        { model }
      );

      return result;
    });

    // Create recommendation record
    const recommendation = await step.run("create-recommendation", async () => {
      const recId = `rec_${nanoid()}`;

      const [rec] = await db
        .insert(recommendations)
        .values({
          id: recId,
          changeEventId,
          competitorId,
          strategy: aiRecommendation.strategy,
          impact: aiRecommendation.impact,
          effort: aiRecommendation.effort,
          title: aiRecommendation.title,
          rationale: aiRecommendation.rationale,
          status: "open",
        })
        .returning();

      // Create checklist items from AI action steps
      for (let i = 0; i < aiRecommendation.actionSteps.length; i++) {
        await db.insert(recommendationChecklistItems).values({
          id: `item_${nanoid()}`,
          recommendationId: recId,
          text: aiRecommendation.actionSteps[i],
          done: false,
          order: i + 1,
        });
      }

      return rec;
    });

    // Trigger alert notification
    await step.sendEvent("trigger-alert", {
      name: "alert/send",
      data: {
        type: "change_detected",
        changeEventId,
        recommendationId: recommendation.id,
        competitorId,
        workspaceId,
      },
    });

    return {
      success: true,
      recommendationId: recommendation.id,
    };
  }
);
