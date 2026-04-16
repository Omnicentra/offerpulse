import { env } from "@/env";
import { OPENROUTER_BRAND_NAME_FROM_URL_MODEL } from "@offerpulse/lib/constants";
import { logger } from "@offerpulse/lib";
import { z } from "zod";

const MAX_BRAND_NAME_LENGTH = 200;
const OPENROUTER_TIMEOUT_MS = 12_000;

const brandNameResponseSchema = z.object({
  brandName: z.string().min(1).max(MAX_BRAND_NAME_LENGTH),
});

/**
 * Common regional / language storefront subdomains (first label).
 * When present, the brand token is usually the second label (e.g. uk.gymshark.com → gymshark).
 */
const LOCALE_OR_REGION_FIRST_LABELS = new Set(
  [
    "ae",
    "ar",
    "at",
    "au",
    "be",
    "bg",
    "br",
    "ca",
    "ch",
    "cl",
    "co",
    "cz",
    "de",
    "dk",
    "ee",
    "en",
    "es",
    "eu",
    "fi",
    "fr",
    "global",
    "gr",
    "hk",
    "hr",
    "hu",
    "id",
    "ie",
    "in",
    "intl",
    "it",
    "jp",
    "kr",
    "lt",
    "lv",
    "m",
    "mx",
    "my",
    "na",
    "nl",
    "no",
    "nz",
    "ph",
    "pl",
    "pt",
    "ro",
    "se",
    "sg",
    "si",
    "sk",
    "th",
    "tr",
    "tw",
    "uk",
    "us",
    "vn",
    "za",
  ].map((s) => s.toLowerCase())
);

function titleCaseFromSlug(token: string): string {
  const cleaned = token.replace(/_/g, "-").trim();
  if (!cleaned) return token;
  return cleaned
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Heuristic brand label from hostname when OpenRouter is unavailable or fails.
 * Handles many regional subdomains; does not cover every global TLD pattern.
 */
export function fallbackBrandNameFromDomain(domain: string): string {
  const parts = domain.split(".").filter(Boolean);
  if (parts.length === 0) return domain;

  let token = parts[0] ?? domain;
  const first = token.toLowerCase();

  if (parts.length >= 3 && LOCALE_OR_REGION_FIRST_LABELS.has(first)) {
    token = parts[1] ?? token;
  }

  return titleCaseFromSlug(token);
}

function sanitizeBrandName(raw: string): string | null {
  const trimmed = raw
    .replace(/\s+/g, " ")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim();
  if (!trimmed) return null;
  if (trimmed.length > MAX_BRAND_NAME_LENGTH) {
    return trimmed.slice(0, MAX_BRAND_NAME_LENGTH).trim();
  }
  return trimmed;
}

async function fetchBrandNameFromOpenRouter(competitorUrl: string): Promise<string | null> {
  const systemPrompt = `You identify the public brand or company name for e-commerce and storefront URLs.

Rules:
- Return ONLY valid JSON matching: {"brandName":"<name>"} with no markdown or extra keys.
- brandName is how the business is known to shoppers (e.g. "Gymshark", "Nike", "Allbirds"), not the legal entity unless that is the consumer brand.
- Ignore locale, country, or language subdomains (e.g. uk., de., en., fr., na., eu., global.).
- Ignore common path noise in the URL (utm_, tracking, /collections/, /products/, campaign slugs).
- For Shopify myshopify.com subdomains, use the store subdomain as the brand hint in Title Case unless the URL clearly indicates another brand.
- For Amazon / marketplace seller URLs, use the seller or brand shown in the URL if obvious; otherwise a concise store fragment in Title Case.
- Never return a country code, TLD, or generic word alone (e.g. not "Uk", "Com", "Shop", "Store") unless it is genuinely the brand.
- Use the real-world spelling shoppers would recognize; no emojis or markup.`;

  const userPrompt = `Storefront URL (full string as captured):\n${competitorUrl}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OPENROUTER_TIMEOUT_MS);

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENROUTER_BRAND_NAME_FROM_URL_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
        max_tokens: 120,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      logger.warn("[brand-name-from-url] OpenRouter non-OK response", {
        status: response.status,
        statusText: response.statusText,
        bodyPreview: errorBody.slice(0, 500),
      });
      return null;
    }

    const json = (await response.json()) as {
      choices?: { message?: { content?: string | null } }[];
    };

    const content = json.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      logger.warn("[brand-name-from-url] OpenRouter empty content", {
        hasChoices: Boolean(json.choices?.length),
      });
      return null;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(content) as unknown;
    } catch (e) {
      logger.warn("[brand-name-from-url] OpenRouter JSON parse failed", {
        error: e instanceof Error ? e.message : String(e),
        contentPreview: content.slice(0, 200),
      });
      return null;
    }

    const validated = brandNameResponseSchema.safeParse(parsed);
    if (!validated.success) {
      logger.warn("[brand-name-from-url] OpenRouter JSON shape invalid", {
        message: validated.error.message,
      });
      return null;
    }

    return sanitizeBrandName(validated.data.brandName);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (e instanceof Error && e.name === "AbortError") {
      logger.warn("[brand-name-from-url] OpenRouter request aborted (timeout)", {
        timeoutMs: OPENROUTER_TIMEOUT_MS,
      });
    } else {
      logger.warn("[brand-name-from-url] OpenRouter request failed", { error: message });
    }
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Resolves a human-readable competitor brand name from a storefront URL using OpenRouter,
 * with a deterministic fallback when the API fails or returns invalid output.
 */
export async function resolveCompetitorBrandNameFromUrl(
  competitorUrl: string,
  domainForFallback: string
): Promise<string> {
  const fromModel = await fetchBrandNameFromOpenRouter(competitorUrl);
  if (fromModel) {
    logger.debug("[brand-name-from-url] resolved via OpenRouter", {
      domain: domainForFallback,
      model: OPENROUTER_BRAND_NAME_FROM_URL_MODEL,
    });
    return fromModel;
  }

  const fallback = fallbackBrandNameFromDomain(domainForFallback);
  logger.debug("[brand-name-from-url] resolved via fallback heuristic", {
    domain: domainForFallback,
  });
  return fallback;
}
