/**
 * Tests for URL normalization and validation
 * Run with: npm test or node -r tsx url-helpers.test.ts
 */

import { normalizeUrl, validateUrl, URL_TEST_CASES } from "../url-helpers";

describe("URL Normalization", () => {
  describe("normalizeUrl", () => {
    it("should add https:// to domain-only inputs", () => {
      expect(normalizeUrl("brand.com")).toBe("https://brand.com/");
      expect(normalizeUrl("www.brand.com")).toBe("https://www.brand.com/");
    });

    it("should upgrade http:// to https://", () => {
      expect(normalizeUrl("http://brand.com")).toBe("https://brand.com/");
      expect(normalizeUrl("http://www.brand.com")).toBe("https://www.brand.com/");
    });

    it("should preserve https:// URLs", () => {
      expect(normalizeUrl("https://brand.com")).toBe("https://brand.com/");
    });

    it("should preserve paths and query params", () => {
      expect(normalizeUrl("brand.com/sale")).toBe("https://brand.com/sale");
      expect(normalizeUrl("brand.com?ref=ad")).toBe("https://brand.com/?ref=ad");
      expect(normalizeUrl("brand.com/sale?ref=ad")).toBe("https://brand.com/sale?ref=ad");
    });

    it("should trim whitespace", () => {
      expect(normalizeUrl("  brand.com  ")).toBe("https://brand.com/");
      expect(normalizeUrl("\nbrand.com\n")).toBe("https://brand.com/");
    });

    it("should reject URLs without TLD", () => {
      expect(normalizeUrl("brand")).toBeNull();
      expect(normalizeUrl("localhost")).toBeNull();
    });

    it("should reject localhost and private IPs", () => {
      expect(normalizeUrl("localhost")).toBeNull();
      expect(normalizeUrl("127.0.0.1")).toBeNull();
      expect(normalizeUrl("192.168.1.1")).toBeNull();
      expect(normalizeUrl("10.0.0.1")).toBeNull();
      expect(normalizeUrl("172.16.0.1")).toBeNull();
    });

    it("should reject non-http(s) protocols", () => {
      expect(normalizeUrl("javascript:alert(1)")).toBeNull();
      expect(normalizeUrl("mailto:test@test.com")).toBeNull();
      expect(normalizeUrl("file:///etc/passwd")).toBeNull();
      expect(normalizeUrl("ftp://example.com")).toBeNull();
    });

    it("should reject empty or invalid inputs", () => {
      expect(normalizeUrl("")).toBeNull();
      expect(normalizeUrl("   ")).toBeNull();
      expect(normalizeUrl("random text")).toBeNull();
    });
  });

  describe("validateUrl", () => {
    it("should validate correct URLs", () => {
      expect(validateUrl("brand.com").ok).toBe(true);
      expect(validateUrl("www.brand.com").ok).toBe(true);
      expect(validateUrl("https://brand.com").ok).toBe(true);
    });

    it("should reject invalid URLs with helpful messages", () => {
      const emptyResult = validateUrl("");
      expect(emptyResult.ok).toBe(false);
      expect(emptyResult.reason).toBe("URL is required");

      const noTldResult = validateUrl("brand");
      expect(noTldResult.ok).toBe(false);
      expect(noTldResult.reason).toContain("valid store URL");
    });

    it("should validate TLD format", () => {
      expect(validateUrl("brand.com").ok).toBe(true);
      expect(validateUrl("brand.co.uk").ok).toBe(true);
      expect(validateUrl("brand.travel").ok).toBe(true);
    });
  });

  describe("Test Cases Suite", () => {
    it("should pass all predefined test cases", () => {
      URL_TEST_CASES.forEach((test) => {
        const result = normalizeUrl(test.input);
        const passed =
          test.shouldPass === (result !== null) &&
          (!test.expected || result === test.expected);

        expect(passed).toBe(true);
      });
    });
  });
});

// For direct execution (non-test environment)
if (require.main === module) {
  console.log("Running URL normalization tests...\n");

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

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}
