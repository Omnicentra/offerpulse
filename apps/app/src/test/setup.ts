import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";

process.env.SKIP_ENV_VALIDATION = "true";
process.env.DATABASE_URL = process.env.DATABASE_URL ?? "postgresql://test:test@localhost:5432/test";
process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "pk_test_123";
process.env.NEXT_PUBLIC_POSTHOG_KEY =
  process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "phc_test_123";
process.env.NEXT_PUBLIC_POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";
process.env.RESEND_API_KEY = process.env.RESEND_API_KEY ?? "re_test_123";
process.env.RESEND_FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? "noreply@offerpulse.test";

afterEach(() => {
  vi.clearAllMocks();
});
