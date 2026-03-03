/**
 * Firecrawl integration for URL discovery and advanced scraping
 * Uses Firecrawl's /map endpoint for URL discovery and /scrape endpoint
 * with browser actions for scroll/checkout flows
 */

import Firecrawl from "@mendable/firecrawl-js";
import { env } from "@/env";
import { logger } from "@/lib/logger";

export interface DiscoveredUrl {
  url: string;
  title?: string;
  description?: string;
}

// ─── Scrape types ────────────────────────────────────────────────────────────

export type FirecrawlAction =
  | { type: "wait"; milliseconds: number }
  | { type: "wait"; selector: string }
  | { type: "click"; selector: string }
  | { type: "scroll"; direction?: "up" | "down" }
  | { type: "scrape" }
  | { type: "screenshot"; fullPage?: boolean }
  | { type: "executeJavascript"; script: string };

export interface FirecrawlScrapeOptions {
  formats?: string[];
  actions?: FirecrawlAction[];
  timeout?: number;
  onlyMainContent?: boolean;
}

export interface FirecrawlScrapeResult {
  html?: string;
  markdown?: string;
  metadata?: Record<string, unknown>;
  screenshot?: string;
  actionScreenshots?: string[];
  actionScrapes?: Array<{ url: string; html: string }>;
  error?: string;
}

/**
 * Scrape a URL using Firecrawl, optionally with browser actions.
 * Cost: 1 credit per call (actions run in-session, no extra credits).
 */
export async function scrapeWithFirecrawl(
  url: string,
  options: FirecrawlScrapeOptions = {},
): Promise<FirecrawlScrapeResult> {
  const startTime = Date.now();
  const {
    formats = ["html"],
    actions,
    timeout = 60_000,
    onlyMainContent = false,
  } = options;

  logger.debug("[firecrawl-scrape] started", { url, formats, hasActions: !!actions, timeout });

  try {
    const firecrawl = new Firecrawl({ apiKey: env.FIRECRAWL_API_KEY });

    const scrapeParams: Record<string, unknown> = {
      formats,
      timeout,
      onlyMainContent,
    };
    if (actions && actions.length > 0) {
      scrapeParams.actions = actions;
    }

    const result = await firecrawl.scrape(url, scrapeParams);

    const out: FirecrawlScrapeResult = {};

    if (result.html) out.html = result.html;
    if (result.markdown) out.markdown = result.markdown;
    if (result.metadata) out.metadata = result.metadata as Record<string, unknown>;
    if (result.screenshot) out.screenshot = result.screenshot;

    const actionsResult = (result as Record<string, unknown>).actions as
      | { screenshots?: string[]; scrapes?: Array<{ url: string; html: string }> }
      | undefined;
    if (actionsResult?.screenshots) out.actionScreenshots = actionsResult.screenshots;
    if (actionsResult?.scrapes) out.actionScrapes = actionsResult.scrapes;

    logger.debug("[firecrawl-scrape] completed", {
      url,
      htmlLength: out.html?.length ?? 0,
      hasScreenshot: !!out.screenshot,
      actionScrapes: out.actionScrapes?.length ?? 0,
      elapsedMs: Date.now() - startTime,
    });

    return out;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error("[firecrawl-scrape] failed", { url, error: errorMessage, elapsedMs: Date.now() - startTime });
    return { error: errorMessage };
  }
}

// ─── Action sequence builders ────────────────────────────────────────────────

/**
 * Build actions for a scroll-then-scrape flow.
 * Scrolls down 2 times with waits to reveal lazy-loaded promo banners.
 */
export function buildScrollActions(): FirecrawlAction[] {
  return [
    { type: "wait", milliseconds: 2000 },
    { type: "scroll", direction: "down" },
    { type: "wait", milliseconds: 1500 },
    { type: "scroll", direction: "down" },
    { type: "wait", milliseconds: 1500 },
  ];
}

const ADD_TO_CART_JS = `
(function() {
  var texts = ['add to cart','add to bag','add to basket','buy now','add to trolley'];
  var buttons = Array.from(document.querySelectorAll('button, [role="button"], input[type="submit"], a.btn, a.button'));
  for (var i = 0; i < buttons.length; i++) {
    var el = buttons[i];
    var t = (el.textContent || el.value || '').trim().toLowerCase();
    for (var j = 0; j < texts.length; j++) {
      if (t.includes(texts[j])) { el.click(); return 'clicked:' + texts[j]; }
    }
  }
  // Fallback: Shopify form submit
  var form = document.querySelector('form[action*="/cart/add"]');
  if (form) {
    var submit = form.querySelector('[type="submit"], button');
    if (submit) { submit.click(); return 'clicked:shopify-form'; }
  }
  // Fallback: WooCommerce
  var woo = document.querySelector('.single_add_to_cart_button, button.add_to_cart_button');
  if (woo) { woo.click(); return 'clicked:woo'; }
  return 'not-found';
})();
`.trim();

const GO_TO_CART_JS = `
(function() {
  var texts = ['view cart','go to cart','view bag','view basket','checkout','go to checkout','proceed to checkout'];
  // First check for cart drawer / mini-cart links
  var links = Array.from(document.querySelectorAll('a[href*="/cart"], a[href*="/checkout"], a[href*="/bag"], a[href*="/basket"]'));
  if (links.length > 0) {
    // Prefer visible links
    for (var i = 0; i < links.length; i++) {
      if (links[i].offsetParent !== null) { links[i].click(); return 'clicked:link-' + links[i].href; }
    }
    links[0].click(); return 'clicked:link-' + links[0].href;
  }
  // Try by text
  var buttons = Array.from(document.querySelectorAll('button, [role="button"], a'));
  for (var i = 0; i < buttons.length; i++) {
    var t = (buttons[i].textContent || '').trim().toLowerCase();
    for (var j = 0; j < texts.length; j++) {
      if (t.includes(texts[j])) { buttons[i].click(); return 'clicked:' + texts[j]; }
    }
  }
  // Last resort: navigate directly
  window.location.href = '/cart';
  return 'navigated:/cart';
})();
`.trim();

/**
 * Build actions for an add-to-cart → checkout discovery flow.
 * Runs on a product page: clicks add-to-cart, waits, navigates to cart/checkout,
 * waits, then scrapes the cart/checkout page HTML.
 */
export function buildCheckoutFlowActions(): FirecrawlAction[] {
  return [
    { type: "wait", milliseconds: 2000 },
    { type: "executeJavascript", script: ADD_TO_CART_JS },
    { type: "wait", milliseconds: 3000 },
    { type: "executeJavascript", script: GO_TO_CART_JS },
    { type: "wait", milliseconds: 3000 },
    { type: "scrape" },
  ];
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
