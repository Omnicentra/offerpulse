/**
 * URL normalization and validation helpers
 * Makes competitor URL input user-friendly while maintaining security
 */

/**
 * Normalizes user input into a valid HTTPS URL
 * Accepts: "brand.com", "www.brand.com", "http://brand.com", etc.
 * Returns: "https://brand.com" or null if invalid
 */
export function normalizeUrl(input: string): string | null {
  if (!input) return null;

  // Trim whitespace
  let url = input.trim();

  // If no protocol, add https://
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  // Upgrade http to https for security
  url = url.replace(/^http:\/\//i, "https://");

  try {
    const parsed = new URL(url);

    // Validate protocol (only allow https)
    if (parsed.protocol !== "https:") {
      return null;
    }

    // Validate hostname has a TLD (contains at least one dot)
    const hostname = parsed.hostname;
    if (!hostname.includes(".")) {
      return null;
    }

    // Disallow localhost and private IPs
    if (isLocalOrPrivate(hostname)) {
      return null;
    }

    // Return canonical URL (preserves path and query params)
    return parsed.href;
  } catch {
    return null;
  }
}

/**
 * Validates if a URL is acceptable
 * Returns { ok: true } or { ok: false, reason: string }
 */
export function validateUrl(
  input: string
): { ok: boolean; reason?: string } {
  if (!input || !input.trim()) {
    return { ok: false, reason: "URL is required" };
  }

  const normalized = normalizeUrl(input);

  if (!normalized) {
    return {
      ok: false,
      reason: "Enter a valid store URL (e.g. brand.com)",
    };
  }

  try {
    const parsed = new URL(normalized);

    // Check for valid TLD
    const hostname = parsed.hostname;
    const parts = hostname.split(".");

    if (parts.length < 2) {
      return {
        ok: false,
        reason: "URL must have a domain extension (e.g. .com, .co.uk)",
      };
    }

    // Check last part looks like a TLD (2-6 chars, letters only)
    const tld = parts[parts.length - 1];
    if (!/^[a-z]{2,6}$/i.test(tld)) {
      return {
        ok: false,
        reason: "Invalid domain extension",
      };
    }

    return { ok: true };
  } catch {
    return {
      ok: false,
      reason: "Enter a valid store URL (e.g. brand.com)",
    };
  }
}

/**
 * Check if hostname is localhost or private IP
 */
function isLocalOrPrivate(hostname: string): boolean {
  // Localhost variations
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".local")
  ) {
    return true;
  }

  // Private IP ranges (basic check)
  if (/^10\./.test(hostname)) return true; // 10.0.0.0/8
  if (/^192\.168\./.test(hostname)) return true; // 192.168.0.0/16
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)) return true; // 172.16.0.0/12

  return false;
}

/**
 * Test cases for validation
 * Run these to verify the normalizer works correctly
 */
export const URL_TEST_CASES = [
  // Valid inputs that should work
  { input: "brand.com", expected: "https://brand.com/", shouldPass: true },
  { input: "www.brand.com", expected: "https://www.brand.com/", shouldPass: true },
  { input: "http://brand.com", expected: "https://brand.com/", shouldPass: true },
  { input: "https://brand.com", expected: "https://brand.com/", shouldPass: true },
  { input: "brand.com/path", expected: "https://brand.com/path", shouldPass: true },
  { input: "brand.com?param=1", expected: "https://brand.com/?param=1", shouldPass: true },
  { input: "brand.co.uk", expected: "https://brand.co.uk/", shouldPass: true },
  { input: "  brand.com  ", expected: "https://brand.com/", shouldPass: true },

  // Invalid inputs that should fail
  { input: "", expected: null, shouldPass: false },
  { input: "brand", expected: null, shouldPass: false }, // No TLD
  { input: "localhost", expected: null, shouldPass: false },
  { input: "127.0.0.1", expected: null, shouldPass: false },
  { input: "192.168.1.1", expected: null, shouldPass: false },
  { input: "javascript:alert(1)", expected: null, shouldPass: false },
  { input: "mailto:test@test.com", expected: null, shouldPass: false },
  { input: "random text", expected: null, shouldPass: false },
];

/**
 * Run tests (development only)
 */
export function runUrlTests() {
  console.log("Running URL normalization tests...");
  let passed = 0;
  let failed = 0;

  URL_TEST_CASES.forEach((test) => {
    const result = normalizeUrl(test.input);
    const success =
      test.shouldPass === (result !== null) &&
      (!test.expected || result === test.expected);

    if (success) {
      passed++;
      console.log(`✓ "${test.input}" → ${result}`);
    } else {
      failed++;
      console.error(
        `✗ "${test.input}" → ${result} (expected ${test.expected})`
      );
    }
  });

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  return { passed, failed };
}
