/**
 * Firecrawl Agent integration for the Discount & Code Detector (marketing free tool).
 *
 * Why Agent instead of HTML/regex: the Agent searches and reads the live store like a researcher,
 * producing structured JSON (percent off, fixed amounts, codes, bundle copy) from visible UI text.
 *
 * `maxCredits`: hard cap per request so a single free-tool call cannot exhaust your Firecrawl budget
 * (see Firecrawl Agent docs — default without a cap is very high).
 *
 * `urls` + `strictConstrainToURLs`: restricts the run to the submitted store hostname so the agent
 * does not follow arbitrary external links.
 *
 * Agent jobs are async: we `startAgent`, then poll `getAgentStatus` until a terminal state or timeout
 * (see Firecrawl docs — Job status and completion).
 *
 * @see https://docs.firecrawl.dev/features/agent#job-status-and-completion
 */

import Firecrawl from "@mendable/firecrawl-js";
import { env } from "@/env";
import { logger } from "@/lib/logger";
import { discountDetectorAgentOutputSchema } from "@/lib/tools/discount-detector-agent-schema";

function buildDiscountDetectorAgentPrompt(storeUrl: string): string {
  const target = storeUrl.trim();
  return `Extract publicly visible promotions from the ecommerce store at ${target}.

Scope:
- Only report discounts, monetary-offers, bundle/BOGO-style deals, and promotional coupon codes that a normal visitor can SEE on the store's public pages (banners, announcement bars, hero, headers, product/collection sale messaging, footer promos).
- Do NOT invent or guess codes. If no code is shown, omit associatedCode / leave promoCodes empty for that case.
- Prefer the exact promotional phrase as evidenceText (short snippet, max ~200 characters).
- For each item, set sourceUrl to the full URL of the page where you saw it (must stay on this store's domain).
- locationHint: short label like "Announcement bar", "Hero", "Header", "Footer", "Collection banner", "Product promo", or "Page content".

Output:
- percentageOffers: e.g. "20% off", "up to 30% off sitewide" with numeric value (use the main percentage if a range).
- fixedAmountOffers: currency symbol or code + numeric amount (e.g. £10 off → currency "£", value 10).
- promoCodes: visible codes only (e.g. SAVE20), with the surrounding text as evidenceText.
- bundleHints: BOGO, multi-buy, "buy 2 get 1", "bundle and save" style copy without a single % or fixed amount.

If nothing is found, return empty arrays.`;
}


export interface DiscountAgentRunResult {
  ok: boolean;
  /** Raw structured payload when ok */
  data?: unknown;
  creditsUsed?: number;
  error?: string;
  model?: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isTerminalAgentStatus(status: string | undefined): boolean {
  return status === "completed" || status === "failed" || status === "cancelled";
}

export async function runDiscountDetectorAgent(options: {
  storeUrl: string;
  maxCredits: number;
  /** Wall-clock cap while polling job status (Agent jobs can be slow). */
  timeoutSeconds?: number;
  /** Delay between `getAgentStatus` calls (milliseconds). */
  pollIntervalMs?: number;
}): Promise<DiscountAgentRunResult> {
  const start = Date.now();
  const timeoutSeconds = options.timeoutSeconds ?? 180;
  const pollIntervalMs = options.pollIntervalMs ?? 2000;
  const deadline = start + timeoutSeconds * 1000;

  logger.debug("[firecrawl-discount-agent] starting", {
    storeUrl: options.storeUrl,
    maxCredits: options.maxCredits,
    timeoutSeconds,
    pollIntervalMs,
  });

  try {
    const firecrawl = new Firecrawl({ apiKey: env.FIRECRAWL_API_KEY });

    const started = await firecrawl.startAgent({
      urls: [options.storeUrl],
      prompt: buildDiscountDetectorAgentPrompt(options.storeUrl),
      model: "spark-1-mini",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Firecrawl SDK typings expect zod@3 ZodTypeAny; zod@4 schemas work at runtime.
      schema: discountDetectorAgentOutputSchema as any,
      maxCredits: options.maxCredits,
      strictConstrainToURLs: true,
    });

    if (!started.success || !started.id) {
      const msg = started.error ?? "Failed to start Firecrawl Agent job";
      logger.warn("[firecrawl-discount-agent] start failed", {
        storeUrl: options.storeUrl,
        error: msg,
        elapsedMs: Date.now() - start,
      });
      return { ok: false, error: msg };
    }

    const jobId = started.id;
    let lastStatus = await firecrawl.getAgentStatus(jobId);

    while (Date.now() < deadline && !isTerminalAgentStatus(lastStatus.status)) {
      const wait = Math.min(pollIntervalMs, Math.max(0, deadline - Date.now()));
      if (wait > 0) await sleep(wait);
      if (Date.now() >= deadline) break;
      lastStatus = await firecrawl.getAgentStatus(jobId);
    }

    if (!isTerminalAgentStatus(lastStatus.status)) {
      const msg =
        Date.now() >= deadline
          ? `Agent job timed out after ${timeoutSeconds}s`
          : lastStatus.error ?? `Agent status polling stopped (${lastStatus.status ?? "unknown"})`;
      logger.warn("[firecrawl-discount-agent] incomplete", {
        storeUrl: options.storeUrl,
        jobId,
        status: lastStatus.status,
        error: lastStatus.error,
        elapsedMs: Date.now() - start,
      });
      return {
        ok: false,
        error: msg,
        creditsUsed: lastStatus.creditsUsed,
        model: lastStatus.model,
      };
    }

    if (!lastStatus.success || lastStatus.status !== "completed") {
      const msg =
        lastStatus.error ?? `Agent finished with status ${lastStatus.status ?? "unknown"}`;
      logger.warn("[firecrawl-discount-agent] incomplete", {
        storeUrl: options.storeUrl,
        jobId,
        status: lastStatus.status,
        error: lastStatus.error,
        elapsedMs: Date.now() - start,
      });
      return {
        ok: false,
        error: msg,
        creditsUsed: lastStatus.creditsUsed,
        model: lastStatus.model,
      };
    }

    logger.debug("[firecrawl-discount-agent] completed", {
      storeUrl: options.storeUrl,
      jobId,
      creditsUsed: lastStatus.creditsUsed,
      elapsedMs: Date.now() - start,
    });

    return {
      ok: true,
      data: lastStatus.data,
      creditsUsed: lastStatus.creditsUsed,
      model: lastStatus.model,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Firecrawl Agent request failed";
    logger.error("[firecrawl-discount-agent] failed", {
      storeUrl: options.storeUrl,
      error: message,
      elapsedMs: Date.now() - start,
    });
    return { ok: false, error: message };
  }
}
