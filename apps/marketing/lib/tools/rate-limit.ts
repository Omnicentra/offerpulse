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

// Create rate limiter: 3 requests per 15 minutes
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "15 m"),
  analytics: true,
  prefix: "@offerpulse/marketing",
});

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

export const rateLimiter = {
  async checkLimit(identifier: string): Promise<RateLimitResult> {
    try {
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
        limit: 5,
        remaining: 5,
        reset: Date.now() + 15 * 60 * 1000,
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
