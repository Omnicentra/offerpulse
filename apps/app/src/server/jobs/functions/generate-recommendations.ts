import { inngest } from "../client";
import { db } from "../../db";
import { recommendations, recommendationChecklistItems, changeEvents } from "../../db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { generateRecommendation, getAvailableProvider } from "../../ai";
import { detectChanges } from "../../change-detection";
import type { ExtractedSignals } from "../../scraping/extractor";

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
      const provider = getAvailableProvider();

      // Re-run change detection to get detailed changes (guard null JSONB)
      const beforeSignals = (changeEvent.before ?? { confidence: "low" }) as ExtractedSignals;
      const afterSignals = (changeEvent.after ?? { confidence: "low" }) as ExtractedSignals;
      const detectionResult = detectChanges(beforeSignals, afterSignals);

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
        provider || undefined
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
