/**
 * Retry utilities for Firecrawl and scraping operations
 * Implements exponential backoff for rate limits (429) and transient failures
 */

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  backoffFactor?: number;
}

/**
 * Retry a function with exponential backoff.
 * Use for Firecrawl 429 (rate limit) and 5xx errors.
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelayMs = 1000,
    backoffFactor = 2,
  } = options;

  let lastError: Error | undefined;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries) {
        const delay = initialDelayMs * Math.pow(backoffFactor, attempt);
        console.warn(
          `[retry] Attempt ${attempt + 1}/${maxRetries + 1} failed, retrying in ${delay}ms`,
          { error: lastError.message }
        );
        await sleep(delay);
      }
    }
  }
  throw lastError;
}
