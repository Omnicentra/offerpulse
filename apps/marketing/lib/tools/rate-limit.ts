/**
 * Redis-based rate limiting for tool endpoints using Upstash
 * Prevents abuse of free tools
 * Works across serverless function instances
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env } from "@/env";
import { logger } from "@/lib/logger";

// Initialize Upstash Redis client
const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});

// Create rate limiter: 5 requests per 15 minutes
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "15 m"),
  analytics: true,
  prefix: "@offerpulse/marketing",
});

export const rateLimiter = {
  async isRateLimited(identifier: string): Promise<boolean> {
    try {
      const { success } = await ratelimit.limit(identifier);
      return !success;
    } catch (error) {
      logger.error("[rate-limit] Upstash rate limit check failed:", error);
      // Fail open: if rate limiter is down, allow request
      return false;
    }
  },

  async getRemainingRequests(identifier: string): Promise<number> {
    try {
      const { remaining } = await ratelimit.limit(identifier);
      return remaining;
    } catch (error) {
      logger.error("[rate-limit] Failed to get remaining requests:", error);
      return 5; // Return max on error
    }
  },

  async getResetTime(identifier: string): Promise<number> {
    try {
      const { reset } = await ratelimit.limit(identifier);
      return reset;
    } catch (error) {
      logger.error("[rate-limit] Failed to get reset time:", error);
      return Date.now() + 15 * 60 * 1000; // 15 minutes from now
    }
  },
};

export function getClientIdentifier(request: Request): string {
  // In production, use real IP from headers
  // For now, use a combination of headers
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  
  return forwarded?.split(",")[0] || realIp || "unknown";
}
