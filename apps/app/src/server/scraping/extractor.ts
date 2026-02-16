import { Page } from "playwright";

export interface ExtractedSignals {
  confidence: "low" | "medium" | "high";
  // Promotion signals
  promoText?: string;
  discountPercent?: number;
  discountCode?: string;
  // Shipping signals
  shippingThreshold?: number;
  shippingText?: string;
  shippingCurrency?: string;
  // Bundle signals
  bundleText?: string;
  bundleType?: string;
  // Cart incentives
  cartIncentiveText?: string;
  cartIncentiveType?: string;
  // Delivery & returns
  deliveryText?: string;
  deliveryDays?: number;
  returnsText?: string;
  returnsDays?: number;
  // Badge signals
  badgeTexts?: string[];
  urgencySignals?: string[];
}

/**
 * Extracts offer signals from a webpage
 * Uses heuristics and selectors to find promotional content
 */
export async function extractOfferSignals(page: Page): Promise<ExtractedSignals> {
  const signals: ExtractedSignals = {
    confidence: "low",
  };

  try {
    // Extract all text content from the page
    const textContent = await page.evaluate(() => {
      return document.body.innerText.toLowerCase();
    });

    // Common promotion selectors
    const promoSelectors = [
      '[class*="promo"]',
      '[class*="banner"]',
      '[class*="discount"]',
      '[class*="sale"]',
      '[class*="offer"]',
      '[id*="promo"]',
      '[id*="banner"]',
      ".announcement-bar",
      ".top-bar",
      "header [class*=message]",
    ];

    // Extract promotion text
    for (const selector of promoSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          const text = await element.innerText();
          if (text && text.length > 0) {
            signals.promoText = text.trim();
            break;
          }
        }
      } catch {
        // Continue to next selector
      }
    }

    // Parse discount percentage
    const percentMatch = textContent.match(/(\d+)%\s*off/i);
    if (percentMatch) {
      signals.discountPercent = parseInt(percentMatch[1]);
      signals.confidence = "high";
    }

    // Parse discount code
    const codeMatch = textContent.match(/code:?\s*([A-Z0-9]{4,20})/i);
    if (codeMatch) {
      signals.discountCode = codeMatch[1];
      signals.confidence = "high";
    }

    // Parse free shipping threshold
    const shippingMatches = [
      /free\s+(?:standard\s+)?shipping\s+(?:on\s+orders?\s+)?(?:over|above)\s*[£$€]?\s*(\d+)/i,
      /orders?\s+(?:over|above)\s*[£$€]?\s*(\d+)\s+ship\s+free/i,
      /spend\s*[£$€]?\s*(\d+)\s+(?:for|to\s+get)\s+free\s+shipping/i,
    ];

    for (const regex of shippingMatches) {
      const match = textContent.match(regex);
      if (match) {
        signals.shippingThreshold = parseInt(match[1]);
        signals.confidence = "high";
        break;
      }
    }

    // Extract shipping text
    const shippingSelectors = [
      '[class*="shipping"]',
      '[class*="delivery"]',
      '[class*="free-shipping"]',
      "text=Free Shipping",
      "text=Free Delivery",
    ];

    for (const selector of shippingSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          const text = await element.innerText();
          if (text && text.length > 0 && text.length < 200) {
            signals.shippingText = text.trim();
            break;
          }
        }
      } catch {
        // Continue
      }
    }

    // Detect currency
    if (textContent.includes("£") || textContent.includes("gbp")) {
      signals.shippingCurrency = "GBP";
    } else if (textContent.includes("$") || textContent.includes("usd")) {
      signals.shippingCurrency = "USD";
    } else if (textContent.includes("€") || textContent.includes("eur")) {
      signals.shippingCurrency = "EUR";
    }

    // Parse bundle offers
    const bundleMatch = textContent.match(/buy\s+(\d+)\s+get\s+(\d+)\s+(?:free|off)/i);
    if (bundleMatch) {
      signals.bundleText = bundleMatch[0];
      signals.bundleType = `buy_${bundleMatch[1]}_get_${bundleMatch[2]}`;
      signals.confidence = "high";
    }

    // Extract delivery promises
    const deliveryMatch = textContent.match(
      /(?:next\s+day|same\s+day|(\d+)[\s-]day)\s+delivery/i
    );
    if (deliveryMatch) {
      signals.deliveryText = deliveryMatch[0];
      if (deliveryMatch[1]) {
        signals.deliveryDays = parseInt(deliveryMatch[1]);
      } else if (deliveryMatch[0].includes("next day")) {
        signals.deliveryDays = 1;
      } else if (deliveryMatch[0].includes("same day")) {
        signals.deliveryDays = 0;
      }
      signals.confidence = signals.confidence === "high" ? "high" : "medium";
    }

    // Extract returns policy
    const returnsMatch = textContent.match(/(\d+)[\s-]day\s+(?:returns?|money[\s-]back)/i);
    if (returnsMatch) {
      signals.returnsText = returnsMatch[0];
      signals.returnsDays = parseInt(returnsMatch[1]);
      signals.confidence = signals.confidence === "high" ? "high" : "medium";
    }

    // Extract badge texts (limited stock, bestseller, etc.)
    const badgeSelectors = [
      '[class*="badge"]',
      '[class*="label"]',
      '[class*="tag"]',
      '[class*="pill"]',
    ];

    const badgeTexts: string[] = [];
    for (const selector of badgeSelectors) {
      try {
        const elements = await page.$$(selector);
        for (const element of elements.slice(0, 10)) {
          // Limit to 10
          const text = await element.innerText();
          if (text && text.length > 0 && text.length < 50) {
            badgeTexts.push(text.trim());
          }
        }
      } catch {
        // Continue
      }
    }

    if (badgeTexts.length > 0) {
      signals.badgeTexts = badgeTexts;
    }

    // Detect urgency signals
    const urgencyKeywords = [
      "limited time",
      "hurry",
      "ends soon",
      "last chance",
      "while stocks last",
      "only \\d+ left",
      "selling fast",
    ];

    const urgencySignals: string[] = [];
    for (const keyword of urgencyKeywords) {
      const regex = new RegExp(keyword, "i");
      if (regex.test(textContent)) {
        urgencySignals.push(keyword);
      }
    }

    if (urgencySignals.length > 0) {
      signals.urgencySignals = urgencySignals;
      signals.confidence = "high";
    }

    // Set confidence based on signals found
    if (signals.confidence === "low") {
      const signalCount = Object.keys(signals).filter((key) => {
        const value = signals[key as keyof ExtractedSignals];
        return value !== undefined && key !== "confidence";
      }).length;

      if (signalCount >= 3) {
        signals.confidence = "medium";
      }
    }
  } catch (error) {
    console.error("Error extracting offer signals:", error);
    signals.confidence = "low";
  }

  return signals;
}
