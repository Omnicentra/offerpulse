/**
 * Simple IP-based rate limiting for tool endpoints
 * Prevents abuse of free tools
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

class RateLimiter {
  private limits = new Map<string, RateLimitEntry>();
  private readonly MAX_REQUESTS = 20; // requests per window
  private readonly WINDOW_MS = 60 * 60 * 1000; // 1 hour

  isRateLimited(identifier: string): boolean {
    const now = Date.now();
    const entry = this.limits.get(identifier);

    if (!entry || now > entry.resetAt) {
      // Reset or create new entry
      this.limits.set(identifier, {
        count: 1,
        resetAt: now + this.WINDOW_MS,
      });
      return false;
    }

    if (entry.count >= this.MAX_REQUESTS) {
      return true;
    }

    entry.count++;
    return false;
  }

  getRemainingRequests(identifier: string): number {
    const entry = this.limits.get(identifier);
    if (!entry || Date.now() > entry.resetAt) {
      return this.MAX_REQUESTS;
    }
    return Math.max(0, this.MAX_REQUESTS - entry.count);
  }

  getResetTime(identifier: string): number {
    const entry = this.limits.get(identifier);
    if (!entry) return 0;
    return entry.resetAt;
  }
}

export const rateLimiter = new RateLimiter();

export function getClientIdentifier(request: Request): string {
  // In production, use real IP from headers
  // For now, use a combination of headers
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  
  return forwarded?.split(",")[0] || realIp || "unknown";
}
