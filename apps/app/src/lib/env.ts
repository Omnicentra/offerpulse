/**
 * Environment variable validation and type-safe access
 * Ensures all required environment variables are present
 */

import { z } from "zod";

const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  // Database
  DATABASE_URL: z.string().url(),

  // Better-auth
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),

  // Inngest
  INNGEST_EVENT_KEY: z.string().optional(),
  INNGEST_SIGNING_KEY: z.string().optional(),

  // AI (at least one required)
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),

  // Storage (optional for now)
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),

  // Notifications (optional)
  RESEND_API_KEY: z.string().optional(),
  ALERT_EMAIL: z.string().email().optional(),

  // App URLs
  NEXT_PUBLIC_MARKETING_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_DASHBOARD_APP_URL: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validate and parse environment variables
 * Throws error if validation fails
 */
export function validateEnv(): Env {
  try {
    const parsed = envSchema.parse(process.env);

    // Check that at least one AI provider is configured
    if (!parsed.OPENAI_API_KEY && !parsed.ANTHROPIC_API_KEY) {
      console.warn(
        "⚠️  Warning: No AI provider configured. AI recommendations will use fallback rules."
      );
    }

    // Check Inngest keys in production
    if (parsed.NODE_ENV === "production") {
      if (!parsed.INNGEST_EVENT_KEY || !parsed.INNGEST_SIGNING_KEY) {
        console.warn(
          "⚠️  Warning: Inngest keys not configured. Background jobs will not work properly."
        );
      }

      if (!parsed.RESEND_API_KEY) {
        console.warn("⚠️  Warning: Resend API key not configured. Email alerts will not work.");
      }
    }

    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);

      console.error("❌ Environment variable validation failed:");
      issues.forEach((issue) => console.error(`  - ${issue}`));

      throw new Error("Invalid environment variables. Please check your .env.local file.");
    }

    throw error;
  }
}

/**
 * Get validated environment variables
 * Safe to call multiple times (cached after first validation)
 */
let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (!cachedEnv) {
    cachedEnv = validateEnv();
  }
  return cachedEnv;
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development";
}

/**
 * Check if running in test
 */
export function isTest(): boolean {
  return process.env.NODE_ENV === "test";
}
