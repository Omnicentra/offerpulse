/**
 * Discount & promo code extraction for the free Discount Detector tool.
 * HTML + JSON-LD heuristics (no vision).
 */

import * as cheerio from "cheerio";

export type PromoCodeConfidence = "high" | "medium" | "low";

export interface DiscountDetectorPercentageOffer {
  kind: "percentage";
  value: number;
  evidenceText: string;
  locationHint: string;
  associatedCode?: string;
  /** Page URL where the offer was seen (when known). */
  sourceUrl?: string;
}

export interface DiscountDetectorFixedOffer {
  kind: "fixed_amount";
  value: number;
  currency: string;
  evidenceText: string;
  locationHint: string;
  associatedCode?: string;
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

export interface DetectedPromoCode {
  code: string;
  evidenceText: string;
  locationHint: string;
  confidence?: PromoCodeConfidence;
  sourceUrl?: string;
}

export interface DiscountDetectorSummary {
  percentageCount: number;
  fixedAmountCount: number;
  promoCodeCount: number;
  bundleHintCount: number;
}

export interface DiscountDetectorFindings {
  offers: DetectedDiscountOffer[];
  promoCodes: DetectedPromoCode[];
  summary: DiscountDetectorSummary;
}

const CODE_BLOCKLIST = new Set(
  [
    "SAVE",
    "SHOP",
    "SALE",
    "FREE",
    "CART",
    "HOME",
    "MENU",
    "NEXT",
    "PREV",
    "VIEW",
    "SHOPNOW",
    "BUY",
    "ITEM",
    "ITEMS",
    "SIZE",
    "COLOR",
    "ADD",
    "USD",
    "GBP",
    "EUR",
    "HTML",
    "HTTP",
    "HTTPS",
    "WWW",
    "JSON",
    "NULL",
    "TRUE",
    "FALSE",
    "EMAIL",
    "CLICK",
    "HERE",
    "READ",
    "MORE",
    "LESS",
  ].map((s) => s.toUpperCase()),
);

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

const CODE_LINE_PATTERNS: RegExp[] = [
  /(?:promo|discount|coupon|voucher)\s+code\s*[:\s]\s*['"]?([A-Z0-9][A-Z0-9-]{2,18})['"]?/gi,
  /(?:use|enter|apply)\s+(?:the\s+)?code\s*[:\s]\s*['"]?([A-Z0-9][A-Z0-9-]{2,18})['"]?/gi,
  /code\s*[:\s]\s*['"]([A-Z0-9][A-Z0-9-]{2,18})['"]/gi,
  /(?:code|promo|coupon)\s*[:\s]+\s*([A-Z0-9]{4,20})\b/gi,
  /\b([A-Z0-9]{4,15})\s+at\s+checkout/gi,
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

function isLikelyPromoCode(raw: string): boolean {
  const code = raw.trim().toUpperCase();
  if (code.length < 4 || code.length > 20) return false;
  if (!/^[A-Z0-9]+(?:-[A-Z0-9]+)*$/.test(code)) return false;
  if (CODE_BLOCKLIST.has(code)) return false;
  if (/^#?[0-9A-F]{3,8}$/i.test(code)) return false;
  if (/^\d+$/.test(code) && code.length > 6) return false;
  return true;
}

function codeConfidence(line: string): PromoCodeConfidence {
  const l = line.toLowerCase();
  if (/promo|discount\s+code|coupon|voucher|use\s+code|apply\s+code|enter\s+code/.test(l))
    return "high";
  if (/code|checkout/.test(l)) return "medium";
  return "low";
}

function extractCodeFromSnippet(snippet: string): string | undefined {
  for (const re of CODE_LINE_PATTERNS) {
    const r = new RegExp(re.source, re.flags);
    const m = r.exec(snippet);
    if (m?.[1] && isLikelyPromoCode(m[1])) return m[1].toUpperCase();
  }
  return undefined;
}

function sentenceContaining(haystack: string, needle: string): string {
  const idx = haystack.indexOf(needle);
  if (idx < 0) return needle;
  const start = Math.max(0, haystack.lastIndexOf(".", idx - 1) + 1, haystack.lastIndexOf("\n", idx - 1) + 1);
  const endSlice = haystack.slice(idx);
  const endRel = endSlice.search(/[.!?\n]/);
  const end = endRel >= 0 ? idx + endRel + 1 : Math.min(haystack.length, idx + 160);
  return haystack.slice(start, end).trim() || needle;
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

function uniquePromoCodes(codes: DetectedPromoCode[]): DetectedPromoCode[] {
  const seen = new Set<string>();
  const out: DetectedPromoCode[] = [];
  for (const c of codes) {
    const key = `${c.code.toUpperCase()}:${normalizeEvidence(c.evidenceText)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c);
  }
  return out;
}

export function extractDiscountDetectorFindings(html: string, _pageUrl: string): DiscountDetectorFindings {
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
  const promoCodes: DetectedPromoCode[] = [];

  const scanText = (text: string, locationOverride?: string): void => {
    for (const pattern of PERCENTAGE_PATTERNS) {
      const matches = matchAllFresh(pattern, text);
      for (const match of matches.slice(0, 8)) {
        const evidenceText = match[0].trim().substring(0, 120);
        const value = parseInt(match[1], 10);
        if (!Number.isFinite(value) || value <= 0 || value > 100) continue;
        const snippet = sentenceContaining(text, match[0]);
        const associatedCode = extractCodeFromSnippet(snippet);
        const locationHint =
          locationOverride ?? determineLocation($, match[0], locationCtx);
        offers.push({
          kind: "percentage",
          value,
          evidenceText,
          locationHint,
          associatedCode,
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
        const snippet = sentenceContaining(text, match[0]);
        const associatedCode = extractCodeFromSnippet(snippet);
        const locationHint =
          locationOverride ?? determineLocation($, match[0], locationCtx);
        offers.push({
          kind: "fixed_amount",
          value,
          currency,
          evidenceText,
          locationHint,
          associatedCode,
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
        });
      }
    }
  };

  scanText(bodyText);
  if (altBlob.trim()) scanText(altBlob, "Image or accessibility text");
  if (jsonLdBlob.trim()) scanText(jsonLdBlob, "Structured data (JSON-LD)");

  // Standalone promo codes from full page text
  const codeSeen = new Set<string>();
  for (const re of CODE_LINE_PATTERNS) {
    const matches = matchAllFresh(re, bodyText);
    for (const match of matches.slice(0, 25)) {
      const code = match[1]?.toUpperCase();
      if (!code || !isLikelyPromoCode(code)) continue;
      const line = sentenceContaining(bodyText, match[0]);
      const key = `${code}:${normalizeEvidence(line)}`;
      if (codeSeen.has(key)) continue;
      codeSeen.add(key);
      promoCodes.push({
        code,
        evidenceText: line.substring(0, 200),
        locationHint: determineLocation($, match[0], locationCtx),
        confidence: codeConfidence(line),
      });
    }
  }

  // Merge codes referenced on offers into promoCodes (dedupe)
  for (const o of offers) {
    if (o.kind === "bundle_hint") continue;
    const c = o.associatedCode;
    if (!c) continue;
    const key = `${c}:${normalizeEvidence(o.evidenceText)}`;
    if (codeSeen.has(key)) continue;
    codeSeen.add(key);
    promoCodes.push({
      code: c,
      evidenceText: o.evidenceText,
      locationHint: o.locationHint,
      confidence: "high",
    });
  }

  const dedupedOffers = uniqueOffers(offers);
  const dedupedCodes = uniquePromoCodes(promoCodes);

  const percentageCount = dedupedOffers.filter((o) => o.kind === "percentage").length;
  const fixedAmountCount = dedupedOffers.filter((o) => o.kind === "fixed_amount").length;
  const bundleHintCount = dedupedOffers.filter((o) => o.kind === "bundle_hint").length;

  return {
    offers: dedupedOffers,
    promoCodes: dedupedCodes,
    summary: {
      percentageCount,
      fixedAmountCount,
      promoCodeCount: dedupedCodes.length,
      bundleHintCount,
    },
  };
}
