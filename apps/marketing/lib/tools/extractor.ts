/**
 * Extract offers and promotional information from HTML
 * Uses pattern matching and heuristics (no AI required)
 */

import * as cheerio from "cheerio";

export interface ExtractedOffer {
  shippingThreshold?: {
    amount: number;
    currency: string;
    evidenceText: string;
    locationHint: string;
  };
  discounts: Array<{
    type: "percentage" | "fixed" | "bogo" | "bundle" | "unknown";
    value?: number;
    code?: string;
    evidenceText: string;
    locationHint: string;
  }>;
  bundles: Array<{
    evidenceText: string;
    locationHint: string;
  }>;
  gifts: Array<{
    evidenceText: string;
    locationHint: string;
  }>;
  cartIncentives: Array<{
    evidenceText: string;
    locationHint: string;
  }>;
  announcements: string[];
  metaTitle?: string;
  metaDescription?: string;
}

export function extractOffers(html: string, url: string): ExtractedOffer {
  const $ = cheerio.load(html);

  const result: ExtractedOffer = {
    discounts: [],
    bundles: [],
    gifts: [],
    cartIncentives: [],
    announcements: [],
  };

  // Extract meta
  result.metaTitle = $('meta[property="og:title"]').attr("content") || $("title").text() || undefined;
  result.metaDescription =
    $('meta[property="og:description"]').attr("content") ||
    $('meta[name="description"]').attr("content") ||
    undefined;

  // Get all text content
  const bodyText = $("body").text();
  const headerText = $("header, [role='banner'], .header, #header").text();
  const announcementBarText = $(
    ".announcement-bar, .promo-banner, .top-bar, [class*='announcement'], [class*='promo']"
  ).first().text();

  if (announcementBarText) {
    result.announcements.push(announcementBarText.trim());
  }

  // Extract shipping threshold
  const shippingPatterns = [
    /free\s+shipping\s+(?:on\s+orders?\s+)?(?:over|above)\s+[£$€]?\s*(\d+)/gi,
    /spend\s+[£$€]?\s*(\d+)\s+(?:for|to\s+get)\s+free\s+shipping/gi,
    /orders?\s+(?:over|above)\s+[£$€]?\s*(\d+)\s+ship\s+free/gi,
  ];

  for (const pattern of shippingPatterns) {
    const matches = [...bodyText.matchAll(pattern)];
    if (matches.length > 0) {
      const match = matches[0];
      const amount = parseInt(match[1]);
      const currency = detectCurrency(match[0]);
      
      result.shippingThreshold = {
        amount,
        currency,
        evidenceText: match[0].trim(),
        locationHint: announcementBarText.includes(match[0]) ? "Announcement bar" : "Site content",
      };
      break;
    }
  }

  // Extract discounts
  const discountPatterns = [
    { pattern: /(\d+)%\s+off/gi, type: "percentage" as const },
    { pattern: /save\s+(\d+)%/gi, type: "percentage" as const },
    { pattern: /\b(\d{2,3})%\s+discount/gi, type: "percentage" as const },
    { pattern: /save\s+[£$€]\s*(\d+)/gi, type: "fixed" as const },
    { pattern: /[£$€]\s*(\d+)\s+off/gi, type: "fixed" as const },
  ];

  const codePattern = /(?:code|promo|coupon)[:\s]+([A-Z0-9]{4,15})/gi;
  const codes = [...bodyText.matchAll(codePattern)].map((m) => m[1]);

  for (const { pattern, type } of discountPatterns) {
    const matches = [...bodyText.matchAll(pattern)];
    for (const match of matches.slice(0, 5)) {
      // Limit to top 5
      result.discounts.push({
        type,
        value: parseInt(match[1]),
        code: codes[0],
        evidenceText: match[0].trim(),
        locationHint: headerText.includes(match[0])
          ? "Header"
          : announcementBarText.includes(match[0])
          ? "Announcement bar"
          : "Page content",
      });
    }
  }

  // BOGO / Bundle patterns
  const bundlePatterns = [
    /buy\s+(\d+)\s+get\s+(\d+)\s+free/gi,
    /(\d+)\s+for\s+(\d+)/gi,
    /bundle\s+and\s+save/gi,
    /multi-buy/gi,
  ];

  for (const pattern of bundlePatterns) {
    const matches = [...bodyText.matchAll(pattern)];
    for (const match of matches.slice(0, 3)) {
      result.bundles.push({
        evidenceText: match[0].trim(),
        locationHint: "Page content",
      });
    }
  }

  // Gift patterns
  const giftPatterns = [
    /free\s+gift\s+with\s+purchase/gi,
    /complimentary\s+gift/gi,
    /free\s+sample/gi,
    /gift\s+with\s+orders?\s+over/gi,
  ];

  for (const pattern of giftPatterns) {
    const matches = [...bodyText.matchAll(pattern)];
    for (const match of matches.slice(0, 3)) {
      result.gifts.push({
        evidenceText: match[0].trim(),
        locationHint: "Page content",
      });
    }
  }

  // Cart incentive patterns
  const cartIncentivePatterns = [
    /(?:you're|you\s+are)\s+[£$€]?\s*(\d+)\s+away/gi,
    /(?:add|spend)\s+[£$€]?\s*(\d+)\s+more/gi,
    /unlock\s+free\s+(?:shipping|gift)/gi,
  ];

  for (const pattern of cartIncentivePatterns) {
    const matches = [...bodyText.matchAll(pattern)];
    for (const match of matches.slice(0, 3)) {
      result.cartIncentives.push({
        evidenceText: match[0].trim(),
        locationHint: "Cart/Product page",
      });
    }
  }

  // Remove duplicates
  result.discounts = uniqueBy(result.discounts, (d) => d.evidenceText);
  result.bundles = uniqueBy(result.bundles, (b) => b.evidenceText);
  result.gifts = uniqueBy(result.gifts, (g) => g.evidenceText);
  result.cartIncentives = uniqueBy(result.cartIncentives, (c) => c.evidenceText);

  return result;
}

function detectCurrency(text: string): string {
  if (text.includes("£")) return "GBP";
  if (text.includes("$")) return "USD";
  if (text.includes("€")) return "EUR";
  return "USD"; // default
}

function uniqueBy<T>(arr: T[], keyFn: (item: T) => string): T[] {
  const seen = new Set<string>();
  return arr.filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Calculate offer clarity score (0-10)
 */
export function calculateOfferClarity(html: string): {
  score: number;
  issues: string[];
  strengths: string[];
} {
  const $ = cheerio.load(html);
  let score = 10;
  const issues: string[] = [];
  const strengths: string[] = [];

  // Check for visible offer above fold (first 1500 chars of body text)
  const aboveFoldText = $("body").text().substring(0, 1500);
  const hasOffer = /(?:sale|discount|off|free\s+shipping|promo)/gi.test(aboveFoldText);
  
  if (!hasOffer) {
    score -= 3;
    issues.push("No clear offer visible above the fold");
  } else {
    strengths.push("Offer visible above the fold");
  }

  // Check for shipping info
  const hasShippingInfo = /free\s+shipping|shipping|delivery/gi.test($("body").text());
  if (!hasShippingInfo) {
    score -= 2;
    issues.push("Shipping information not clearly stated");
  } else {
    strengths.push("Shipping information present");
  }

  // Check for returns policy
  const hasReturns = /returns?|refund|money\s+back/gi.test($("body").text());
  if (!hasReturns) {
    score -= 2;
    issues.push("Returns policy not easily found");
  } else {
    strengths.push("Returns policy mentioned");
  }

  // Check for contact info
  const hasContact = /contact|email|phone|support/gi.test($("body").text());
  if (!hasContact) {
    score -= 1;
    issues.push("Contact information unclear");
  } else {
    strengths.push("Contact information available");
  }

  // Check for clear CTA
  const hasCTA = $("button, [role='button'], .cta, .buy-button").length > 0;
  if (!hasCTA) {
    score -= 2;
    issues.push("No clear call-to-action buttons detected");
  } else {
    strengths.push("Clear CTAs present");
  }

  return {
    score: Math.max(0, Math.min(10, score)),
    issues,
    strengths,
  };
}
