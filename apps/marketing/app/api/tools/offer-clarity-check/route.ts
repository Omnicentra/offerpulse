import { NextResponse } from "next/server";
import { env } from "@/env";
import { fetchStoreHtml, isValidStoreUrl } from "@/lib/tools/scraper";
import {
  extractOffers,
  calculateOfferClarity,
  formatOffersSummary,
  type ExtractedOffer,
} from "@/lib/tools/extractor";
import { suggestClarityFixes } from "@/lib/tools/openrouter";
import { rateLimiter, getClientIdentifier } from "@/lib/tools/rate-limit";
import { logger } from "@/lib/logger";

export interface ClaritySuggestion {
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
}

export interface OfferClarityResponse {
  url: string;
  offers: ExtractedOffer;
  timestamp: string;
  clarity: {
    score: number;
    issues: string[];
    strengths: string[];
    suggestions: ClaritySuggestion[];
  };
}

export async function POST(request: Request) {
  const startTime = Date.now();
  logger.debug("offer-clarity-check started");

  try {
    // Rate limiting
    const identifier = getClientIdentifier(request);
    logger.debug("[offer-clarity-check] client identifier", { identifier });

    const rateLimitResult = await rateLimiter.checkLimit(identifier);
    
    // Always include rate limit headers for transparency
    const headers = new Headers({
      "X-RateLimit-Limit": rateLimitResult.limit.toString(),
      "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
      "X-RateLimit-Reset": new Date(rateLimitResult.reset).toISOString(),
    });

    if (!rateLimitResult.success) {
      logger.debug("[offer-clarity-check] rate limited", {
        identifier,
        remaining: rateLimitResult.remaining,
        reset: new Date(rateLimitResult.reset).toISOString(),
      });
      return NextResponse.json(
        { 
          error: "Rate limit exceeded. Please try again later.",
          resetAt: new Date(rateLimitResult.reset).toISOString(),
        },
        { status: 429, headers }
      );
    }

    const body = await request.json();
    const { url } = body as { url?: string };

    if (!url || typeof url !== "string") {
      logger.debug("[offer-clarity-check] missing or invalid url in body");
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    logger.debug("[offer-clarity-check] target url", url);

    if (!isValidStoreUrl(url)) {
      logger.debug("[offer-clarity-check] url failed validation");
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }

    logger.debug("[offer-clarity-check] calling fetchStoreHtml", { elapsed: Date.now() - startTime });

    // Fetch rendered HTML without screenshot to reduce credits/cost.
    const fetchStart = Date.now();
    const { html, finalUrl } = await fetchStoreHtml(url, {
      includeScreenshot: false,
    });

    logger.debug("[offer-clarity-check] fetchStoreHtml completed", { finalUrl, htmlLength: html?.length, fetchMs: Date.now() - fetchStart });
    
    // Extract offers from rendered HTML
    const offers = extractOffers(html, finalUrl);

    // Calculate clarity score
    const clarity = calculateOfferClarity(html);
    const offersSummary = formatOffersSummary(offers);

    // Get AI-powered suggestions
    let suggestions: ClaritySuggestion[] = [];
    try {
      suggestions = await suggestClarityFixes(
        {
          url: finalUrl,
          score: clarity.score,
          issues: clarity.issues,
          strengths: clarity.strengths,
          offersSummary,
        },
        env.OPENROUTER_API_KEY
      );
    } catch (openRouterError) {
      logger.error("[offer-clarity-check] OpenRouter clarity suggestions failed", {
        error: openRouterError,
        url: finalUrl,
      });
      // Continue with empty suggestions
    }

    const result: OfferClarityResponse = {
      url: finalUrl,
      offers,
      timestamp: new Date().toISOString(),
      clarity: {
        score: clarity.score,
        issues: clarity.issues,
        strengths: clarity.strengths,
        suggestions,
      },
    };

    logger.debug("[offer-clarity-check] success", { url: finalUrl, totalMs: Date.now() - startTime });
    return NextResponse.json(result, { headers });
  } catch (error) {
    const elapsed = Date.now() - startTime;
    logger.error("[offer-clarity-check] API error", { error, elapsedMs: elapsed });

    if (error instanceof Error) {
      logger.debug("[offer-clarity-check] error details", {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to check offer clarity",
      },
      { status: 500 }
    );
  }
}
