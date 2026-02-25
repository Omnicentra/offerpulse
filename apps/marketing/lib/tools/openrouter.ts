/**
 * OpenRouter API client for AI-generated suggestions and vision-based offer extraction
 * Uses the official @openrouter/sdk: https://github.com/OpenRouterTeam/typescript-sdk
 */

import { OpenRouter } from "@openrouter/sdk";
import type { ExtractedOffer } from "./extractor";

export interface ClarityContext {
  url: string;
  score: number;
  issues: string[];
  strengths: string[];
  offersSummary: string;
}

export interface SuggestedFix {
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
}

/**
 * Call OpenRouter to generate 3–5 actionable fixes for offer clarity
 * based on the audit score, issues, strengths, and extracted offers summary.
 */
export async function suggestClarityFixes(
  context: ClarityContext,
  apiKey: string
): Promise<SuggestedFix[]> {
  const openRouter = new OpenRouter({ apiKey });

  const systemPrompt = `You are an e-commerce conversion expert. Given an audit of a store's offer clarity (score 0-10), you suggest specific, actionable improvements—not generic advice. Each suggestion must be concrete and implementable.

Respond with a JSON array only, no other text. Each item: { "title": "Short action title", "description": "One or two sentences on what to do and why", "priority": "high" | "medium" | "low" }
- Give 3 to 5 suggestions.
- Base them on the issues and strengths provided; prioritise fixing the issues.
- If score is already high (8+), suggest refinements (e.g. A/B test, tighten copy).
- Titles should be specific (e.g. "Move free shipping above the fold") not vague ("Improve visibility").`;

  const userContent = `Store: ${context.url}

Clarity score (0-10): ${context.score}

Issues found:
${context.issues.length ? context.issues.map((i) => `- ${i}`).join("\n") : "None"}

Strengths:
${context.strengths.length ? context.strengths.map((s) => `- ${s}`).join("\n") : "None"}

Detected offers on the page:
${context.offersSummary}

Return a JSON array of 3-5 suggested fixes.`;

  const response = await openRouter.chat.send({
    chatGenerationParams: {
      model: "openai/gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      stream: false,
      maxCompletionTokens: 1024,
      temperature: 0.3,
    },
  });

  // Non-streaming response is ChatResponse
  const chatResponse = response as { choices?: Array<{ message?: { content?: string | null } }> };
  const content = chatResponse.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("Empty response from OpenRouter");

  // Parse JSON array from response (handle optional markdown code block)
  let jsonStr = content;
  const codeMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeMatch) jsonStr = codeMatch[1].trim();
  const parsed = JSON.parse(jsonStr) as unknown;
  const arr = Array.isArray(parsed) ? parsed : [parsed];

  const fixes: SuggestedFix[] = [];
  for (const item of arr.slice(0, 5)) {
    if (item && typeof item === "object" && "title" in item && "description" in item) {
      const priority =
        (item as { priority?: string }).priority === "high" ||
        (item as { priority?: string }).priority === "medium" ||
        (item as { priority?: string }).priority === "low"
          ? ((item as { priority: string }).priority as "high" | "medium" | "low")
          : "medium";
      fixes.push({
        title: String((item as { title: string }).title),
        description: String((item as { description: string }).description),
        priority,
      });
    }
  }
  return fixes;
}

/** Location hint for all vision-extracted offers */
const VISION_LOCATION_HINT = "Screenshot (visual)";

/**
 * Extract promotional offers from a store screenshot using GPT-4o-mini vision.
 * Catches offers that appear only in images (hero banners, badges, text overlays).
 * Returns an ExtractedOffer-shaped object to merge with regex extraction.
 */
export async function extractOffersFromImage(
  screenshotBuffer: Buffer,
  apiKey: string
): Promise<ExtractedOffer> {
  const openRouter = new OpenRouter({ apiKey });
  const base64 = screenshotBuffer.toString("base64");
  const dataUrl = `data:image/png;base64,${base64}`;

  const systemPrompt = `You are an e-commerce analyst. You will see a screenshot of an online store homepage. Extract every promotional offer, discount, shipping info, bundle, gift, or cart incentive that is visible in the image (text in banners, hero images, badges, announcement bars, pop-ups).

Return a single JSON object only, no other text. Use this exact structure (omit arrays/fields that are empty):
{
  "shippingThreshold": null or { "amount": number, "currency": "£"|"$"|"€"|"A$"|"CA$"|"NZ$", "evidenceText": "exact phrase seen", "locationHint": "Screenshot (visual)" },
  "discounts": [ { "type": "percentage"|"fixed"|"unknown", "value": number or null, "code": null or "CODE", "evidenceText": "exact phrase", "locationHint": "Screenshot (visual)" } ],
  "bundles": [ { "evidenceText": "exact phrase", "locationHint": "Screenshot (visual)" } ],
  "gifts": [ { "evidenceText": "exact phrase", "locationHint": "Screenshot (visual)" } ],
  "cartIncentives": [ { "evidenceText": "exact phrase", "locationHint": "Screenshot (visual)" } ],
  "announcements": [ "string per announcement line" ]
}
- evidenceText: the exact promotional text as shown (max 100 chars).
- For discounts, set type "percentage" when you see % off, "fixed" when you see a currency amount off.
- If no offers are visible, return empty arrays and null shippingThreshold.`;

  const userContent: Array<{ type: "text"; text: string } | { type: "image_url"; imageUrl: { url: string } }> = [
    { type: "text", text: "Extract all promotional offers visible in this store screenshot. Return only the JSON object." },
    { type: "image_url", imageUrl: { url: dataUrl } },
  ];

  const response = await openRouter.chat.send({
    chatGenerationParams: {
      model: "openai/gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      stream: false,
      maxCompletionTokens: 2048,
      temperature: 0.2,
    },
  });

  const chatResponse = response as { choices?: Array<{ message?: { content?: string | null } }> };
  const content = chatResponse.choices?.[0]?.message?.content?.trim();
  if (!content) return emptyExtractedOffer();

  let jsonStr = content;
  const codeMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeMatch) jsonStr = codeMatch[1].trim();
  const parsed = JSON.parse(jsonStr) as Record<string, unknown>;

  return parseVisionOffers(parsed);
}

function emptyExtractedOffer(): ExtractedOffer {
  return {
    discounts: [],
    bundles: [],
    gifts: [],
    cartIncentives: [],
    announcements: [],
  };
}

function parseVisionOffers(parsed: Record<string, unknown>): ExtractedOffer {
  const result = emptyExtractedOffer();

  if (parsed.shippingThreshold && typeof parsed.shippingThreshold === "object") {
    const s = parsed.shippingThreshold as Record<string, unknown>;
    const amount = typeof s.amount === "number" ? s.amount : undefined;
    const currency = typeof s.currency === "string" ? s.currency : "$";
    const evidenceText = typeof s.evidenceText === "string" ? s.evidenceText.slice(0, 100) : "";
    if (amount !== undefined && evidenceText) {
      result.shippingThreshold = {
        amount,
        currency,
        evidenceText,
        locationHint: VISION_LOCATION_HINT,
      };
    }
  }

  if (Array.isArray(parsed.discounts)) {
    for (const d of parsed.discounts) {
      if (d && typeof d === "object" && "evidenceText" in d) {
        const o = d as Record<string, unknown>;
        const evidenceText = String(o.evidenceText ?? "").slice(0, 100);
        if (!evidenceText) continue;
        const type = (["percentage", "fixed", "bogo", "bundle", "unknown"] as const).includes(o.type as never)
          ? (o.type as "percentage" | "fixed" | "bogo" | "bundle" | "unknown")
          : "unknown";
        result.discounts.push({
          type,
          value: typeof o.value === "number" ? o.value : undefined,
          code: typeof o.code === "string" ? o.code : undefined,
          evidenceText,
          locationHint: VISION_LOCATION_HINT,
        });
      }
    }
  }

  if (Array.isArray(parsed.bundles)) {
    for (const b of parsed.bundles) {
      if (b && typeof b === "object" && "evidenceText" in b) {
        const evidenceText = String((b as Record<string, unknown>).evidenceText ?? "").slice(0, 100);
        if (evidenceText) result.bundles.push({ evidenceText, locationHint: VISION_LOCATION_HINT });
      }
    }
  }

  if (Array.isArray(parsed.gifts)) {
    for (const g of parsed.gifts) {
      if (g && typeof g === "object" && "evidenceText" in g) {
        const evidenceText = String((g as Record<string, unknown>).evidenceText ?? "").slice(0, 100);
        if (evidenceText) result.gifts.push({ evidenceText, locationHint: VISION_LOCATION_HINT });
      }
    }
  }

  if (Array.isArray(parsed.cartIncentives)) {
    for (const c of parsed.cartIncentives) {
      if (c && typeof c === "object" && "evidenceText" in c) {
        const evidenceText = String((c as Record<string, unknown>).evidenceText ?? "").slice(0, 100);
        if (evidenceText) result.cartIncentives.push({ evidenceText, locationHint: VISION_LOCATION_HINT });
      }
    }
  }

  if (Array.isArray(parsed.announcements)) {
    result.announcements = parsed.announcements
      .filter((a): a is string => typeof a === "string" && a.length > 0 && a.length < 300)
      .slice(0, 10);
  }

  return result;
}
