/**
 * Environment variable validation and type-safe access with @t3-oss/env-nextjs
 */

import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    DATABASE_URL: z.url(),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),
    INNGEST_EVENT_KEY: z.string().optional(),
    INNGEST_SIGNING_KEY: z.string().optional(),
    OPENAI_API_KEY: z.string().optional(),
    ANTHROPIC_API_KEY: z.string().optional(),
    R2_ACCOUNT_ID: z.string().min(1, "R2_ACCOUNT_ID is required for screenshot storage"),
    R2_ACCESS_KEY_ID: z.string().min(1, "R2_ACCESS_KEY_ID is required for screenshot storage"),
    R2_SECRET_ACCESS_KEY: z.string().min(1, "R2_SECRET_ACCESS_KEY is required for screenshot storage"),
    R2_BUCKET_NAME: z.string().min(1, "R2_BUCKET_NAME is required for screenshot storage"),
    R2_PUBLIC_URL: z.url(),
    RESEND_API_KEY: z.string(),
    RESEND_FROM_EMAIL: z.email(),
    ALERT_EMAIL: z.email().optional(),
  },
  client: {
    NEXT_PUBLIC_POSTHOG_KEY: z
      .string()
      .min(1, "NEXT_PUBLIC_POSTHOG_KEY is required")
      .refine(
        (val) => val.startsWith("phc_"),
        "NEXT_PUBLIC_POSTHOG_KEY must start with phc_"
      ),
    NEXT_PUBLIC_POSTHOG_HOST: z.url("NEXT_PUBLIC_POSTHOG_HOST must be a valid URL"),
    NEXT_PUBLIC_ENVIRONMENT: z.enum(["dev", "stg", "prd"]).default("dev"),
    NEXT_PUBLIC_MARKETING_APP_URL: z.url(),
    NEXT_PUBLIC_DASHBOARD_APP_URL: z.url(),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    INNGEST_EVENT_KEY: process.env.INNGEST_EVENT_KEY,
    INNGEST_SIGNING_KEY: process.env.INNGEST_SIGNING_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
    R2_BUCKET_NAME: process.env.R2_BUCKET_NAME,
    R2_PUBLIC_URL: process.env.R2_PUBLIC_URL,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
    ALERT_EMAIL: process.env.ALERT_EMAIL,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    NEXT_PUBLIC_ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT,
    NEXT_PUBLIC_MARKETING_APP_URL: process.env.NEXT_PUBLIC_MARKETING_APP_URL,
    NEXT_PUBLIC_DASHBOARD_APP_URL: process.env.NEXT_PUBLIC_DASHBOARD_APP_URL,
  },
  skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
});
