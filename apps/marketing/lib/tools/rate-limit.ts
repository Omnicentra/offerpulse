/**
 * Redis-based rate limiting for tool endpoints using Upstash
 * Prevents abuse of free tools
 * Works across serverless function instances
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env } from "@/env";
import { logger } from "@/lib/logger";

const RATE_LIMIT = 3;
const RATE_WINDOW_MS = 15 * 60 * 1000;

// Initialize Upstash Redis client
const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});

// Create rate limiter: 3 requests per 15 minutes
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(RATE_LIMIT, "15 m"),
  analytics: true,
  prefix: "@offerpulse/marketing",
});

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

function buildAllowedHeaders(): Omit<RateLimitResult, "success"> {
  // Upstash's `remaining` is expected to reflect the quota after this request.
  // Since fail-open/dev shortcuts don't consume a Redis token, we model the
  // current allowed request as already accounted for (remaining = limit - 1).
  return {
    limit: RATE_LIMIT,
    remaining: Math.max(RATE_LIMIT - 1, 0),
    reset: Date.now() + RATE_WINDOW_MS,
  };
}

export const rateLimiter = {
  async checkLimit(identifier: string): Promise<RateLimitResult> {
    try {
      logger.debug("[rate-limit] checking limit", { identifier });
      if (process.env.NODE_ENV === "development") {
        return {
          success: true,
          ...buildAllowedHeaders(),
        };
      }
      const result = await ratelimit.limit(identifier);
      return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
      };
    } catch (error) {
      logger.error("[rate-limit] Upstash rate limit check failed:", error);
      // Fail open: if rate limiter is down, allow request
      return {
        success: true,
        ...buildAllowedHeaders(),
      };
    }
  },
};

export function getClientIdentifier(request: Request): string {
  // Vercel provides client IP in x-forwarded-for header (first IP is the real client)
  // Cloudflare uses cf-connecting-ip
  // Generic proxies use x-real-ip
  const forwardedFor = request.headers.get("x-forwarded-for");
  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  const realIp = request.headers.get("x-real-ip");
  
  // Priority: CF > x-forwarded-for > x-real-ip > fallback
  if (cfConnectingIp) return cfConnectingIp;
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  if (realIp) return realIp;
  
  // Fallback for local dev
  return "127.0.0.1";
}
