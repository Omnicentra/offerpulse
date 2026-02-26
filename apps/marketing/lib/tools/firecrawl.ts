/**
 * Firecrawl integration for URL discovery
 * Uses Firecrawl's /map endpoint to discover all URLs on a domain
 */

import Firecrawl from "@mendable/firecrawl-js";
import { env } from "@/env";
import { logger } from "@/lib/logger";

export interface DiscoveredUrl {
  url: string;
  title?: string;
  description?: string;
}

/**
 * Discover all URLs on a domain using Firecrawl's /map endpoint
 * Returns array of discovered URLs with metadata
 * 
 * Cost: 1 credit per call regardless of number of URLs returned
 * Speed: ~2-3 seconds
 */
export async function discoverDomainUrls(
  domain: string,
  options?: {
    limit?: number;
    search?: string;
    ignoreSitemap?: boolean;
  }
): Promise<DiscoveredUrl[]> {
  const startTime = Date.now();
  logger.debug("[firecrawl] discoverDomainUrls started", { domain, options });

  try {
    const firecrawl = new Firecrawl({ apiKey: env.FIRECRAWL_API_KEY });

    // Normalize domain to full URL
    const url = domain.startsWith("http") ? domain : `https://${domain}`;

    const result = await firecrawl.map(url, {
      limit: options?.limit || 100,
      search: options?.search,
      sitemap: options?.ignoreSitemap ? "skip" : "include",
      ignoreQueryParameters: true, // Treat /page?foo=1 same as /page
    });

    const urls: DiscoveredUrl[] = result.links.map((link) => ({
      url: link.url,
      title: link.title,
      description: link.description,
    }));

    logger.debug("[firecrawl] discoverDomainUrls completed", {
      domain,
      urlsFound: urls.length,
      elapsedMs: Date.now() - startTime,
    });

    return urls;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error("[firecrawl] discoverDomainUrls failed", {
      domain,
      error: errorMessage,
      elapsedMs: Date.now() - startTime,
    });

    // If Firecrawl fails, return just the homepage so we can still scrape something
    const fallbackUrl = domain.startsWith("http") ? domain : `https://${domain}`;
    logger.debug("[firecrawl] returning fallback URL", { url: fallbackUrl });
    return [{ url: fallbackUrl, title: "Homepage (fallback)" }];
  }
}

/**
 * Extract domain from URL
 */
export function extractDomain(url: string): string {
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    return parsed.hostname;
  } catch {
    return url;
  }
}
