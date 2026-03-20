/**
 * Fetch price rules from Shopify Admin REST API.
 */

import { logger } from "@offerpulse/lib";

export interface PriceRule {
  id: number;
  title: string;
  value_type: "percentage" | "fixed_amount";
  value: string;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PriceRulesResponse {
  price_rules: PriceRule[];
}

const MAX_RETRIES = 5;

export async function fetchPriceRules(
  shopDomain: string,
  accessToken: string
): Promise<PriceRule[]> {
  const allRules: PriceRule[] = [];
  let url: string | null = `https://${shopDomain}/admin/api/2024-01/price_rules.json?limit=250`;
  let retryCount = 0;

  while (url) {
    const res: Response = await fetch(url, {
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      },
    });

    const contentType = res.headers.get("content-type") || "";
    
    logger.debug("[fetchPriceRules] response received", {
      shopDomain,
      status: res.status,
      statusText: res.statusText,
      contentType,
    });

    if (!res.ok) {
      if (res.status === 429) {
        retryCount++;
        if (retryCount > MAX_RETRIES) {
          throw new Error(
            `Price rules fetch failed: rate limited (HTTP 429) after ${MAX_RETRIES} retries for ${shopDomain}`
          );
        }
        const retryAfter = res.headers.get("Retry-After");
        await new Promise((r) =>
          setTimeout(r, parseInt(retryAfter ?? "60", 10) * 1000)
        );
        continue;
      }
      
      const bodyPreview = await res.text();
      logger.error("[fetchPriceRules] non-ok response", {
        shopDomain,
        status: res.status,
        contentType,
        bodyPreview: bodyPreview.slice(0, 200),
      });
      throw new Error(
        `Price rules fetch failed: ${res.status} ${res.statusText}. ` +
        `Content-Type: ${contentType}. Body preview: ${bodyPreview.slice(0, 100)}`
      );
    }

    retryCount = 0;

    if (!contentType.includes("application/json")) {
      const bodyPreview = await res.text();
      logger.error("[fetchPriceRules] non-JSON response", {
        shopDomain,
        contentType,
        bodyPreview: bodyPreview.slice(0, 200),
      });
      throw new Error(
        `Expected JSON but got ${contentType}. ` +
        `This may indicate an invalid access token, incorrect shop domain, or API endpoint issue. ` +
        `Body preview: ${bodyPreview.slice(0, 100)}`
      );
    }

    const data = (await res.json()) as PriceRulesResponse;
    allRules.push(...data.price_rules);

    const link: string | null = res.headers.get("Link");
    const nextUrl: string | undefined = link?.match(/<([^>]+)>;\s*rel="next"/)?.[1];
    url = nextUrl ?? null;
  }

  return allRules;
}
