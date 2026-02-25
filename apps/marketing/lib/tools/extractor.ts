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

  // Get all text content with better structure
  const bodyText = $("body").text();
  const headerText = $("header, [role='banner'], .header, #header").text();
  const heroText = $(".hero, [class*='hero'], [class*='banner']:not([class*='announcement'])").first().text();
  const navText = $("nav, [role='navigation'], .navigation").text();
  
  // Extract announcement bars with Shopify-specific selectors
  const announcementSelectors = [
    ".announcement-bar",
    ".announcement-bar__message",
    "[data-section-type='announcement-bar']",
    ".promo-banner",
    ".top-bar",
    ".topbar",
    "[class*='announcement']",
    "[class*='promo-bar']",
    "marquee",
  ];
  
  const announcementElements = $(announcementSelectors.join(", "));
  announcementElements.each((_, elem) => {
    const text = $(elem).text().trim();
    if (text && text.length > 5 && text.length < 300) {
      result.announcements.push(text);
    }
  });
  
  // Remove duplicate announcements
  result.announcements = [...new Set(result.announcements)];

  // Extract shipping threshold - expanded patterns
  const shippingPatterns = [
    /free\s+(?:standard\s+)?shipping\s+(?:on\s+)?(?:all\s+)?orders?\s+(?:over|above)\s+[£$€A$NZ$CA$]?\s*(\d+)/gi,
    /free\s+delivery\s+(?:on\s+)?orders?\s+(?:over|above)\s+[£$€A$NZ$CA$]?\s*(\d+)/gi,
    /spend\s+[£$€A$NZ$CA$]?\s*(\d+)\s+(?:for|to\s+get|and\s+get)\s+free\s+(?:shipping|delivery)/gi,
    /orders?\s+(?:over|above)\s+[£$€A$NZ$CA$]?\s*(\d+)\s+ship\s+free/gi,
    /complimentary\s+shipping\s+(?:over|above)\s+[£$€A$NZ$CA$]?\s*(\d+)/gi,
    /[£$€A$NZ$CA$]?\s*(\d+)\+\s+free\s+(?:shipping|delivery)/gi,
    /free\s+(?:shipping|delivery)\s+(?:on|for)\s+[£$€A$NZ$CA$]?\s*(\d+)\+/gi,
  ];

  for (const pattern of shippingPatterns) {
    const matches = [...bodyText.matchAll(pattern)];
    if (matches.length > 0) {
      const match = matches[0];
      const amount = parseInt(match[1]);
      const currency = detectCurrency(match[0]);
      const locationHint = determineLocation($, match[0], {
        announcements: result.announcements,
        headerText,
        heroText,
      });
      
      result.shippingThreshold = {
        amount,
        currency,
        evidenceText: match[0].trim().substring(0, 100),
        locationHint,
      };
      break;
    }
  }

  // Extract discounts - significantly expanded patterns
  const discountPatterns = [
    { pattern: /(?:up\s+to\s+)?(\d+)%\s+off/gi, type: "percentage" as const },
    { pattern: /save\s+(?:up\s+to\s+)?(\d+)%/gi, type: "percentage" as const },
    { pattern: /(\d+)%\s+(?:discount|sale)/gi, type: "percentage" as const },
    { pattern: /get\s+(\d+)%\s+off/gi, type: "percentage" as const },
    { pattern: /(\d+)%\s+off\s+(?:your\s+first\s+order|everything|sitewide|all)/gi, type: "percentage" as const },
    { pattern: /sale\s+[:-]?\s*(?:up\s+to\s+)?(\d+)%\s+off/gi, type: "percentage" as const },
    { pattern: /extra\s+(\d+)%\s+off/gi, type: "percentage" as const },
    { pattern: /save\s+[£$€A$NZ$CA$]\s*(\d+)/gi, type: "fixed" as const },
    { pattern: /[£$€A$NZ$CA$]\s*(\d+)\s+off/gi, type: "fixed" as const },
    { pattern: /(\d+)%\s+off\s+with\s+code/gi, type: "percentage" as const },
  ];

  // Extract promo codes more aggressively
  const codePatterns = [
    /(?:code|promo|coupon)[:\s]+([A-Z0-9]{4,15})/gi,
    /use\s+code[:\s]+([A-Z0-9]{4,15})/gi,
    /code[:\s]+['"]([A-Z0-9]{4,15})['"]/gi,
    /\b([A-Z0-9]{6,12})\b.*?(?:checkout|discount|off)/gi,
  ];
  
  const codes: string[] = [];
  for (const pattern of codePatterns) {
    const matches = [...bodyText.matchAll(pattern)];
    codes.push(...matches.map((m) => m[1]));
  }
  const uniqueCodes = [...new Set(codes)].slice(0, 5);

  for (const { pattern, type } of discountPatterns) {
    const matches = [...bodyText.matchAll(pattern)];
    for (const match of matches.slice(0, 5)) {
      const evidenceText = match[0].trim().substring(0, 100);
      const locationHint = determineLocation($, match[0], {
        announcements: result.announcements,
        headerText,
        heroText,
      });
      
      result.discounts.push({
        type,
        value: parseInt(match[1]),
        code: uniqueCodes[0],
        evidenceText,
        locationHint,
      });
    }
  }

  // BOGO / Bundle patterns - expanded
  const bundlePatterns = [
    /buy\s+(\d+)\s+get\s+(\d+)\s+(?:free|off)/gi,
    /buy\s+(\d+)\s+get\s+(\d+)\s+at\s+\d+%\s+off/gi,
    /(\d+)\s+for\s+[£$€A$NZ$CA$]?\s*(\d+)/gi,
    /bundle\s+(?:and\s+save|deal|offer)/gi,
    /multi-?buy/gi,
    /mix\s+(?:and|&)\s+match/gi,
    /(\d+)\s+for\s+the\s+price\s+of\s+(\d+)/gi,
    /spend\s+[£$€A$NZ$CA$]?\s*(\d+)\s+save\s+[£$€A$NZ$CA$]?\s*(\d+)/gi,
    /sets?\s+from\s+[£$€A$NZ$CA$]?\s*(\d+)/gi,
    /save\s+when\s+you\s+buy\s+(\d+)/gi,
  ];

  for (const pattern of bundlePatterns) {
    const matches = [...bodyText.matchAll(pattern)];
    for (const match of matches.slice(0, 3)) {
      const evidenceText = match[0].trim().substring(0, 100);
      const locationHint = determineLocation($, match[0], {
        announcements: result.announcements,
        headerText,
        heroText,
      });
      
      result.bundles.push({
        evidenceText,
        locationHint,
      });
    }
  }

  // Gift patterns - expanded
  const giftPatterns = [
    /free\s+gift\s+with\s+(?:purchase|every\s+order)/gi,
    /free\s+(?:.+?)\s+with\s+every\s+order/gi,
    /complimentary\s+(?:gift|.+?)\s+with/gi,
    /free\s+samples?/gi,
    /gift\s+with\s+orders?\s+over\s+[£$€A$NZ$CA$]?\s*(\d+)/gi,
    /receive\s+a\s+free\s+.+?\s+with/gi,
    /free\s+.+?\s+on\s+orders?\s+over/gi,
  ];

  for (const pattern of giftPatterns) {
    const matches = [...bodyText.matchAll(pattern)];
    for (const match of matches.slice(0, 3)) {
      const evidenceText = match[0].trim().substring(0, 100);
      const locationHint = determineLocation($, match[0], {
        announcements: result.announcements,
        headerText,
        heroText,
      });
      
      result.gifts.push({
        evidenceText,
        locationHint,
      });
    }
  }

  // Cart incentive patterns - expanded
  const cartIncentivePatterns = [
    /(?:you're|you\s+are)\s+[£$€A$NZ$CA$]?\s*(\d+)\s+away\s+from/gi,
    /(?:add|spend)\s+[£$€A$NZ$CA$]?\s*(\d+)\s+more/gi,
    /unlock\s+(?:free\s+)?(?:shipping|gift|delivery)/gi,
    /(?:only|just)\s+[£$€A$NZ$CA$]?\s*(\d+)\s+(?:away|more)/gi,
    /spend\s+[£$€A$NZ$CA$]?\s*(\d+)\s+(?:get|unlock)/gi,
    /add\s+[£$€A$NZ$CA$]?\s*(\d+)\s+for\s+free/gi,
    /tiered\s+(?:discount|offer)/gi,
    /spend\s+[£$€A$NZ$CA$]?\s*(\d+)\s+get\s+.+?,\s+spend\s+[£$€A$NZ$CA$]?\s*(\d+)\s+get/gi,
  ];

  for (const pattern of cartIncentivePatterns) {
    const matches = [...bodyText.matchAll(pattern)];
    for (const match of matches.slice(0, 3)) {
      const evidenceText = match[0].trim().substring(0, 100);
      const locationHint = determineLocation($, match[0], {
        announcements: result.announcements,
        headerText,
        heroText,
      });
      
      result.cartIncentives.push({
        evidenceText,
        locationHint,
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
  if (text.includes("£") || /GBP/i.test(text)) return "£";
  if (text.includes("€") || /EUR/i.test(text)) return "€";
  if (/A\$|AUD/i.test(text)) return "A$";
  if (/NZ\$|NZD/i.test(text)) return "NZ$";
  if (/CA\$|CAD/i.test(text)) return "CA$";
  if (text.includes("$") || /USD/i.test(text)) return "$";
  return "$"; // default
}

/**
 * Determine location of matched text within page structure
 */
function determineLocation(
  $: cheerio.CheerioAPI,
  matchText: string,
  context: {
    announcements: string[];
    headerText: string;
    heroText: string;
  }
): string {
  const { announcements, headerText, heroText } = context;
  
  // Check if in announcement bar
  for (const announcement of announcements) {
    if (announcement.includes(matchText)) {
      return "Announcement bar";
    }
  }
  
  // Check if in header
  if (headerText.includes(matchText)) {
    return "Header";
  }
  
  // Check if in hero section
  if (heroText.includes(matchText)) {
    return "Hero banner";
  }
  
  // Check if in navigation
  const navText = $("nav, [role='navigation']").text();
  if (navText.includes(matchText)) {
    return "Navigation";
  }
  
  // Check if in footer
  const footerText = $("footer, [role='contentinfo'], .footer").text();
  if (footerText.includes(matchText)) {
    return "Footer";
  }
  
  // Default
  return "Page content";
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

/**
 * Build a short text summary of extracted offers for AI context
 */
export function formatOffersSummary(offers: ExtractedOffer): string {
  const parts: string[] = [];
  if (offers.shippingThreshold) {
    parts.push(
      `Free shipping over ${offers.shippingThreshold.currency}${offers.shippingThreshold.amount} (${offers.shippingThreshold.locationHint})`
    );
  }
  if (offers.discounts.length > 0) {
    parts.push(
      `Discounts: ${offers.discounts.map((d) => `${d.value}% off${d.code ? ` code ${d.code}` : ""}`).join("; ")}`
    );
  }
  if (offers.bundles.length > 0) {
    parts.push(`Bundles: ${offers.bundles.map((b) => b.evidenceText).join("; ")}`);
  }
  if (offers.gifts.length > 0) {
    parts.push(`Gifts: ${offers.gifts.map((g) => g.evidenceText).join("; ")}`);
  }
  if (offers.cartIncentives.length > 0) {
    parts.push(`Cart incentives: ${offers.cartIncentives.map((c) => c.evidenceText).join("; ")}`);
  }
  if (offers.announcements.length > 0) {
    parts.push(`Announcement bar: ${offers.announcements.join("; ")}`);
  }
  return parts.length ? parts.join("\n") : "No offers detected on the page.";
}

/**
 * Normalize evidence text for deduplication (lowercase, trim, collapse whitespace)
 */
function normalizeEvidence(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Merge offers from HTML/regex extraction with offers from vision (screenshot) extraction.
 * Deduplicates by normalized evidence text so the same offer found in both is not duplicated.
 * HTML/regex results are preferred for shippingThreshold when both exist.
 */
export function mergeExtractedOffers(
  htmlOffers: ExtractedOffer,
  visualOffers: ExtractedOffer
): ExtractedOffer {
  const merged: ExtractedOffer = {
    discounts: [],
    bundles: [],
    gifts: [],
    cartIncentives: [],
    announcements: [],
    metaTitle: htmlOffers.metaTitle,
    metaDescription: htmlOffers.metaDescription,
  };

  // Shipping: prefer HTML if both have it; otherwise use whichever is set
  merged.shippingThreshold =
    htmlOffers.shippingThreshold ?? visualOffers.shippingThreshold ?? undefined;

  // Merge arrays and dedupe by normalized evidence text
  merged.discounts = mergeByEvidence(htmlOffers.discounts, visualOffers.discounts, (d) => d.evidenceText);
  merged.bundles = mergeByEvidence(htmlOffers.bundles, visualOffers.bundles, (b) => b.evidenceText);
  merged.gifts = mergeByEvidence(htmlOffers.gifts, visualOffers.gifts, (g) => g.evidenceText);
  merged.cartIncentives = mergeByEvidence(
    htmlOffers.cartIncentives,
    visualOffers.cartIncentives,
    (c) => c.evidenceText
  );

  // Announcements: merge and dedupe by normalized text
  const annNorm = new Map<string, string>();
  for (const a of htmlOffers.announcements) {
    if (a.trim().length > 0 && a.length < 300) annNorm.set(normalizeEvidence(a), a);
  }
  for (const a of visualOffers.announcements) {
    if (a.trim().length > 0 && a.length < 300) annNorm.set(normalizeEvidence(a), a);
  }
  merged.announcements = [...annNorm.values()];

  return merged;
}

function mergeByEvidence<T>(
  primary: T[],
  secondary: T[],
  getEvidence: (item: T) => string
): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of primary) {
    const key = normalizeEvidence(getEvidence(item));
    if (!seen.has(key)) {
      seen.add(key);
      out.push(item);
    }
  }
  for (const item of secondary) {
    const key = normalizeEvidence(getEvidence(item));
    if (!seen.has(key)) {
      seen.add(key);
      out.push(item);
    }
  }
  return out;
}
