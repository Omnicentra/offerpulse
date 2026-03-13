/**
 * Fetch price rules from Shopify Admin REST API.
 */

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

export async function fetchPriceRules(
  shopDomain: string,
  accessToken: string
): Promise<PriceRule[]> {
  const allRules: PriceRule[] = [];
  let url: string | null = `https://${shopDomain}/admin/api/2024-01/price_rules.json?limit=250`;

  while (url) {
    const res: Response = await fetch(url, {
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      if (res.status === 429) {
        const retryAfter = res.headers.get("Retry-After");
        await new Promise((r) => setTimeout(r, (parseInt(retryAfter ?? "60", 10) * 1000)));
        continue;
      }
      throw new Error(`Price rules fetch failed: ${res.status} ${res.statusText}`);
    }

    const data = (await res.json()) as PriceRulesResponse;
    allRules.push(...data.price_rules);

    const link: string | null = res.headers.get("Link");
    const nextUrl: string | undefined = link?.match(/<([^>]+)>;\s*rel="next"/)?.[1];
    url = nextUrl ?? null;
  }

  return allRules;
}
