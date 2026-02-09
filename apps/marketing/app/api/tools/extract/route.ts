import { NextResponse } from "next/server";
import { fetchStoreHtml, isValidStoreUrl } from "@/lib/tools/scraper";
import { extractOffers } from "@/lib/tools/extractor";
import { toolCache } from "@/lib/tools/cache";
import { rateLimiter, getClientIdentifier } from "@/lib/tools/rate-limit";

export async function POST(request: Request) {
  try {
    // Rate limiting
    const identifier = getClientIdentifier(request);
    if (rateLimiter.isRateLimited(identifier)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    if (!isValidStoreUrl(url)) {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }

    // Check cache first
    const cacheKey = toolCache.getCacheKey(url, "extract");
    const cached = toolCache.get(cacheKey);
    
    if (cached) {
      return NextResponse.json({ ...cached, cached: true });
    }

    // Fetch and extract
    const { html, finalUrl } = await fetchStoreHtml(url);
    const offers = extractOffers(html, finalUrl);

    const result = {
      url: finalUrl,
      offers,
      timestamp: new Date().toISOString(),
      cached: false,
    };

    // Cache result
    toolCache.set(cacheKey, result);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Extract API error:", error);
    
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to extract offers",
      },
      { status: 500 }
    );
  }
}
