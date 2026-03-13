import { env } from "@/env";
import { logger } from "@offerpulse/lib";
import { ChangeDetectionResult } from "../change-detection";
import { DEFAULT_OPENROUTER_MODEL } from "@offerpulse/lib/constants";

export interface RecommendationInput {
  competitorName: string;
  competitorUrl: string;
  changeType: string;
  changeSummary: string;
  beforeSignals: unknown;
  afterSignals: unknown;
  detectionResult: ChangeDetectionResult;
}

export interface RecommendationOutput {
  strategy: "MATCH" | "COUNTER" | "IGNORE" | "TEST";
  impact: number; // 1-10
  effort: number; // 1-10
  title: string;
  rationale: string;
  actionSteps: string[];
}

async function callOpenRouter(options: {
  systemPrompt: string;
  userPrompt: string;
  model?: string;
}): Promise<string> {
  const { systemPrompt, userPrompt, model = DEFAULT_OPENROUTER_MODEL } = options;

  logger.debug("OpenRouter: generating recommendation", {
    provider: "openrouter",
    model,
  });

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    logger.error("OpenRouter request failed", {
      status: response.status,
      statusText: response.statusText,
      body: errorBody,
    });
    throw new Error(`OpenRouter request failed with status ${response.status}`);
  }

  const json = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };

  const content = json.choices?.[0]?.message?.content;

  if (!content) {
    logger.warn("OpenRouter response missing content", json);
    return "{}";
  }

  return content;
}

export interface GenerateRecommendationOptions {
  /** OpenRouter model ID. Overrides workspace default when provided. */
  model?: string;
}

/**
 * Generate AI-powered recommendation for a competitor change
 */
export async function generateRecommendation(
  input: RecommendationInput,
  options?: GenerateRecommendationOptions
): Promise<RecommendationOutput> {
  const systemPrompt = `You are an e-commerce competitive intelligence advisor for Shopify sellers. Your role is to analyze competitor offer changes and provide actionable, strategic recommendations.

When a competitor makes a change to their offers (promotions, shipping, bundles, etc.), you must:

1. Assess the strategic intent and impact
2. Recommend one of these strategies:
   - MATCH: Copy the competitor's tactic directly
   - COUNTER: Respond with a different but equally compelling offer
   - IGNORE: Don't respond (explain why)
   - TEST: Run an A/B test to validate response

3. Provide:
   - Impact score (1-10): How much this could affect conversion/revenue
   - Effort score (1-10): How hard it is to implement
   - Clear title for the recommendation
   - Rationale explaining your reasoning
   - 3-5 concrete action steps

Be specific, practical, and focused on conversion impact. Think like a savvy e-commerce operator, not a generic consultant.`;

  const userPrompt = `Competitor: ${input.competitorName} (${input.competitorUrl})

Change Type: ${input.changeType}
Summary: ${input.changeSummary}

Before:
${JSON.stringify(input.beforeSignals, null, 2)}

After:
${JSON.stringify(input.afterSignals, null, 2)}

Changes Detected:
${input.detectionResult.changes.map((c) => `- ${c.description}`).join("\n")}

Provide a strategic recommendation in the following JSON format:
{
  "strategy": "MATCH" | "COUNTER" | "IGNORE" | "TEST",
  "impact": 1-10,
  "effort": 1-10,
  "title": "Brief action-oriented title",
  "rationale": "Clear explanation of why this strategy makes sense",
  "actionSteps": ["Step 1", "Step 2", "Step 3", "Step 4", "Step 5"]
}`;

  try {
    const response = await callOpenRouter({
      systemPrompt,
      userPrompt,
      model: options?.model,
    });

    // Parse JSON response
    const parsed = JSON.parse(response);

    // Validate and return
    return {
      strategy: parsed.strategy || "TEST",
      impact: Math.min(10, Math.max(1, parseInt(parsed.impact) || 5)),
      effort: Math.min(10, Math.max(1, parseInt(parsed.effort) || 5)),
      title: parsed.title || "Review competitor change",
      rationale: parsed.rationale || "No rationale provided",
      actionSteps: Array.isArray(parsed.actionSteps)
        ? parsed.actionSteps.slice(0, 5)
        : ["Review the change", "Assess impact", "Plan response"],
    };
  } catch (error) {
    logger.error("AI recommendation generation failed", error as Error, {
      provider: "openrouter",
    });

    // Fallback to rule-based recommendation
    return generateFallbackRecommendation(input);
  }
}

/**
 * Fallback rule-based recommendation when AI is unavailable
 */
function generateFallbackRecommendation(input: RecommendationInput): RecommendationOutput {
  const { changeType, detectionResult } = input;

  // Simple rule-based strategy
  let strategy: RecommendationOutput["strategy"] = "TEST";
  let impact = 5;
  let effort = 5;
  let title = `Review ${changeType.toLowerCase()} change`;
  let rationale = "Consider responding to this competitive change.";
  let actionSteps = [
    "Review the detected change in detail",
    "Assess potential impact on your conversion rate",
    "Research similar tactics in your market",
    "Plan and implement a response if needed",
  ];

  // Adjust based on change type
  if (changeType === "PROMO" || changeType === "SHIPPING") {
    impact = 7;
    effort = 4;
    strategy = "MATCH";
    title = `Consider matching competitor's ${changeType.toLowerCase()} offer`;
    rationale = `${changeType === "PROMO" ? "Promotional" : "Shipping"} changes typically have high conversion impact and are relatively easy to implement.`;
    actionSteps = [
      "Analyze the competitor's new offer structure",
      "Calculate the cost impact on your margins",
      "Set up the matching offer in your store",
      "Monitor conversion rate impact for 7 days",
    ];
  } else if (changeType === "BUNDLE") {
    impact = 6;
    effort = 6;
    strategy = "COUNTER";
    title = "Consider alternative bundle strategy";
    rationale = "Bundle changes can be countered with different but equally compelling offers.";
    actionSteps = [
      "Review competitor's bundle structure",
      "Identify your best-selling product combinations",
      "Create a competitive bundle offer",
      "Test with a small audience first",
    ];
  }

  // Adjust impact based on confidence
  if (detectionResult.confidence === "high") {
    impact = Math.min(10, impact + 2);
  } else if (detectionResult.confidence === "low") {
    impact = Math.max(1, impact - 2);
  }

  return {
    strategy,
    impact,
    effort,
    title,
    rationale,
    actionSteps,
  };
}
