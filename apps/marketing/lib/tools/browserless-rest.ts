/**
 * Alternative Browserless implementation using REST API
 * More reliable than WebSocket for one-off scrapes
 */

import { env } from "@/env";
import { logger } from "@/lib/logger";

interface BrowserlessContentResponse {
  data: string; // Base64 encoded HTML
}

interface BrowserlessScreenshotResponse {
  // Binary screenshot data
}

/**
 * Fetch rendered HTML using Browserless REST API
 * More reliable than WebSocket for simple scraping
 */
export async function fetchViaRest(url: string): Promise<{
  html: string;
  screenshotBuffer?: Buffer;
}> {
  const apiKey = env.BROWSERLESS_API_KEY;
  const baseUrl = env.BROWSERLESS_WSS_URL
    .replace("wss://", "https://")
    .replace("ws://", "http://");

  logger.debug("[browserless-rest] baseUrl", { baseUrl });
  logger.debug("[browserless-rest] fetching content", { url });

  try {
    // Use /content endpoint to get rendered HTML
    const contentResponse = await fetch(`${baseUrl}/chrome/content?token=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url,
        gotoOptions: {
          waitUntil: "load",
          timeout: 25000,
        },
      }),
    });

    if (!contentResponse.ok) {
      throw new Error(`Browserless content API error: ${contentResponse.status} ${contentResponse.statusText}`);
    }

    const html = await contentResponse.text();
    logger.debug("[browserless-rest] html length", { htmlLength: html.length });

    // Get screenshot using /screenshot endpoint
    let screenshotBuffer: Buffer | undefined;
    try {
      const screenshotResponse = await fetch(`${baseUrl}/screenshot?token=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          options: {
            fullPage: true,
            type: "png",
          },
          gotoOptions: {
            waitUntil: "load",
            timeout: 25000,
          },
        }),
      });

      if (screenshotResponse.ok) {
        const arrayBuffer = await screenshotResponse.arrayBuffer();
        screenshotBuffer = Buffer.from(arrayBuffer);
      }
    } catch (screenshotError) {
      logger.error("[browserless-rest] screenshot failed", { error: screenshotError });
      // Continue without screenshot
    }

    return { html, screenshotBuffer };
  } catch (error) {
    logger.error("[browserless-rest] fetch failed", { error });
    throw error;
  }
}
