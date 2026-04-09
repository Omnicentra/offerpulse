/**
 * Discount-oriented extraction for the free Discount Detector tool.
 * HTML + JSON-LD heuristics (no vision). Does not infer promo codes.
 */

import * as cheerio from "cheerio";

export interface DiscountDetectorPercentageOffer {
  kind: "percentage";
  value: number;
  evidenceText: string;
  locationHint: string;
  /** Page URL where the offer was seen (when known). */
  sourceUrl?: string;
}

export interface DiscountDetectorFixedOffer {
  kind: "fixed_amount";
  value: number;
  currency: string;
  evidenceText: string;
  locationHint: string;
  sourceUrl?: string;
}

export interface DiscountDetectorBundleHint {
  kind: "bundle_hint";
  evidenceText: string;
  locationHint: string;
  sourceUrl?: string;
}

export type DetectedDiscountOffer =
  | DiscountDetectorPercentageOffer
  | DiscountDetectorFixedOffer
  | DiscountDetectorBundleHint;

export interface DiscountDetectorSummary {
  percentageCount: number;
  fixedAmountCount: number;
  bundleHintCount: number;
}

export interface DiscountDetectorFindings {
  offers: DetectedDiscountOffer[];
  summary: DiscountDetectorSummary;
}

const PERCENTAGE_PATTERNS: RegExp[] = [
  /(?:up\s+to\s+)?(\d+)%\s+off/gi,
  /save\s+(?:up\s+to\s+)?(\d+)%/gi,
  /(\d+)%\s+(?:discount|sale)/gi,
  /get\s+(\d+)%\s+off/gi,
  /(\d+)%\s+off\s+(?:your\s+first\s+order|everything|sitewide|all|today|now)/gi,
  /sale\s+[:-]?\s*(?:up\s+to\s+)?(\d+)%\s+off/gi,
  /extra\s+(\d+)%\s+off/gi,
  /(\d+)%\s+off\s+with\s+code/gi,
  /(?:take|enjoy)\s+(\d+)%\s+off/gi,
  /(\d+)\s*%\s*off/gi,
  /(?:minus|less)\s+(\d+)%/gi,
];

const FIXED_PATTERNS: Array<{ regex: RegExp; decimal: boolean }> = [
  { regex: /save\s+[£$€]\s*(\d+(?:[.,]\d{1,2})?)/gi, decimal: true },
  { regex: /[£$€]\s*(\d+(?:[.,]\d{1,2})?)\s+off/gi, decimal: true },
  { regex: /(?:save|get)\s+(?:an?\s+)?extra\s+[£$€]\s*(\d+(?:[.,]\d{1,2})?)/gi, decimal: true },
  { regex: /[£$€]\s*(\d+)\s*(?:off|discount)/gi, decimal: false },
  { regex: /(?:AUD|NZD|CAD|USD)\s*\$?\s*(\d+(?:[.,]\d{1,2})?)\s+off/gi, decimal: true },
  { regex: /A\$\s*(\d+(?:[.,]\d{1,2})?)\s+off/gi, decimal: true },
  { regex: /NZ\$\s*(\d+(?:[.,]\d{1,2})?)\s+off/gi, decimal: true },
  { regex: /CA\$\s*(\d+(?:[.,]\d{1,2})?)\s+off/gi, decimal: true },
];

const BUNDLE_PATTERNS: RegExp[] = [
  /buy\s+\d+\s+get\s+\d+\s+(?:free|off)/gi,
  /buy\s+\d+\s+get\s+\d+\s+at\s+\d+%\s+off/gi,
  /\d+\s+for\s+[£$€A$NZ$CA$]?\s*\d+/gi,
  /bundle\s+(?:and\s+save|deal|offer)/gi,
  /multi-?buy/gi,
  /mix\s+(?:and|&)\s+match/gi,
  /\d+\s+for\s+the\s+price\s+of\s+\d+/gi,
  /bogo/gi,
  /buy\s+one\s+get\s+one/gi,
];

function normalizeEvidence(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function detectCurrency(text: string): string {
  if (text.includes("£") || /GBP/i.test(text)) return "£";
  if (text.includes("€") || /EUR/i.test(text)) return "€";
  if (/A\$|AUD/i.test(text)) return "A$";
  if (/NZ\$|NZD/i.test(text)) return "NZ$";
  if (/CA\$|CAD/i.test(text)) return "CA$";
  if (text.includes("$") || /USD/i.test(text)) return "$";
  return "$";
}

function parseAmount(raw: string, decimal: boolean): number {
  const normalized = raw.replace(",", ".");
  const n = decimal ? parseFloat(normalized) : parseInt(raw.replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) ? n : 0;
}

function determineLocation(
  $: cheerio.CheerioAPI,
  matchText: string,
  context: {
    announcements: string[];
    headerText: string;
    heroText: string;
  },
): string {
  const { announcements, headerText, heroText } = context;
  for (const announcement of announcements) {
    if (announcement.includes(matchText)) return "Announcement bar";
  }
  if (headerText.includes(matchText)) return "Header";
  if (heroText.includes(matchText)) return "Hero banner";
  const navText = $("nav, [role='navigation']").text();
  if (navText.includes(matchText)) return "Navigation";
  const footerText = $("footer, [role='contentinfo'], .footer").text();
  if (footerText.includes(matchText)) return "Footer";
  return "Page content";
}

function collectAnnouncements($: cheerio.CheerioAPI): string[] {
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
  const out: string[] = [];
  $(announcementSelectors.join(", ")).each((_, elem) => {
    const text = $(elem).text().trim();
    if (text.length > 5 && text.length < 300) out.push(text);
  });
  return [...new Set(out)];
}

function collectAltAndAriaText($: cheerio.CheerioAPI): string {
  const parts: string[] = [];
  $("img[alt], [aria-label]").each((_, el) => {
    const $el = $(el);
    const alt = $el.attr("alt")?.trim();
    const aria = $el.attr("aria-label")?.trim();
    if (alt && alt.length > 3 && alt.length < 200) parts.push(alt);
    if (aria && aria.length > 3 && aria.length < 200) parts.push(aria);
  });
  return parts.join("\n");
}

function flattenJsonLdStrings(value: unknown, out: string[], depth: number): void {
  if (depth > 12 || out.join("").length > 80_000) return;
  if (typeof value === "string") {
    if (value.length > 2 && value.length < 2_000) out.push(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) flattenJsonLdStrings(item, out, depth + 1);
    return;
  }
  if (value && typeof value === "object") {
    for (const v of Object.values(value as Record<string, unknown>)) {
      flattenJsonLdStrings(v, out, depth + 1);
    }
  }
}

function extractJsonLdBlob(html: string): string {
  const $ = cheerio.load(html);
  const chunks: string[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).html();
    if (!raw?.trim()) return;
    try {
      const parsed = JSON.parse(raw) as unknown;
      const strings: string[] = [];
      flattenJsonLdStrings(parsed, strings, 0);
      if (strings.length) chunks.push(strings.join("\n"));
    } catch {
      chunks.push(raw.slice(0, 5_000));
    }
  });
  return chunks.join("\n");
}

function uniqueOffers(offers: DetectedDiscountOffer[]): DetectedDiscountOffer[] {
  const seen = new Set<string>();
  const out: DetectedDiscountOffer[] = [];
  for (const o of offers) {
    const key =
      o.kind === "bundle_hint"
        ? `bundle:${normalizeEvidence(o.evidenceText)}`
        : `${o.kind}:${normalizeEvidence(o.evidenceText)}:${"value" in o ? o.value : ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(o);
  }
  return out;
}

function matchAllFresh(re: RegExp, text: string): RegExpMatchArray[] {
  const r = new RegExp(re.source, re.flags);
  return [...text.matchAll(r)];
}

export function mergeDiscountDetectorFindings(
  parts: DiscountDetectorFindings[],
): DiscountDetectorFindings {
  const allOffers = parts.flatMap((p) => p.offers);
  const offers = uniqueOffers(allOffers);
  return {
    offers,
    summary: {
      percentageCount: offers.filter((o) => o.kind === "percentage").length,
      fixedAmountCount: offers.filter((o) => o.kind === "fixed_amount").length,
      bundleHintCount: offers.filter((o) => o.kind === "bundle_hint").length,
    },
  };
}

export function extractDiscountDetectorFindings(html: string, pageUrl: string): DiscountDetectorFindings {
  const $ = cheerio.load(html);
  const announcements = collectAnnouncements($);
  const headerText = $("header, [role='banner'], .header, #header").text();
  const heroText = $(".hero, [class*='hero'], [class*='banner']:not([class*='announcement'])")
    .first()
    .text();
  const bodyText = $("body").text();
  const altBlob = collectAltAndAriaText($);
  const jsonLdBlob = extractJsonLdBlob(html);

  const locationCtx = { announcements, headerText, heroText };

  const offers: DetectedDiscountOffer[] = [];

  const scanText = (text: string, locationOverride?: string): void => {
    for (const pattern of PERCENTAGE_PATTERNS) {
      const matches = matchAllFresh(pattern, text);
      for (const match of matches.slice(0, 8)) {
        const evidenceText = match[0].trim().substring(0, 120);
        const value = parseInt(match[1], 10);
        if (!Number.isFinite(value) || value <= 0 || value > 100) continue;
        const locationHint =
          locationOverride ?? determineLocation($, match[0], locationCtx);
        offers.push({
          kind: "percentage",
          value,
          evidenceText,
          locationHint,
          sourceUrl: pageUrl,
        });
      }
    }

    for (const { regex, decimal } of FIXED_PATTERNS) {
      const matches = matchAllFresh(regex, text);
      for (const match of matches.slice(0, 8)) {
        const evidenceText = match[0].trim().substring(0, 120);
        const value = parseAmount(match[1], decimal);
        if (!Number.isFinite(value) || value <= 0) continue;
        const currency = detectCurrency(match[0]);
        const locationHint =
          locationOverride ?? determineLocation($, match[0], locationCtx);
        offers.push({
          kind: "fixed_amount",
          value,
          currency,
          evidenceText,
          locationHint,
          sourceUrl: pageUrl,
        });
      }
    }

    for (const pattern of BUNDLE_PATTERNS) {
      const matches = matchAllFresh(pattern, text);
      for (const match of matches.slice(0, 4)) {
        const evidenceText = match[0].trim().substring(0, 120);
        const locationHint =
          locationOverride ?? determineLocation($, match[0], locationCtx);
        offers.push({
          kind: "bundle_hint",
          evidenceText,
          locationHint,
          sourceUrl: pageUrl,
        });
      }
    }
  };

  scanText(bodyText);
  if (altBlob.trim()) scanText(altBlob, "Image or accessibility text");
  if (jsonLdBlob.trim()) scanText(jsonLdBlob, "Structured data (JSON-LD)");

  const dedupedOffers = uniqueOffers(offers);

  return {
    offers: dedupedOffers,
    summary: {
      percentageCount: dedupedOffers.filter((o) => o.kind === "percentage").length,
      fixedAmountCount: dedupedOffers.filter((o) => o.kind === "fixed_amount").length,
      bundleHintCount: dedupedOffers.filter((o) => o.kind === "bundle_hint").length,
    },
  };
}
