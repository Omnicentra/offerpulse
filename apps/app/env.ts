/**
 * Environment variable validation and type-safe access with @t3-oss/env-nextjs
 */

import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
    DATABASE_URL: z.url(),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url().default("http://localhost:3001"),
    GOOGLE_CLIENT_ID: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),
    DOPPLER_ENVIRONMENT: z.enum(["dev", "stg", "prd"]).default("dev"),
    DOPPLER_CONFIG: z.string().default("dev"),
    DOPPLER_PROJECT: z.string().default("offerpulse-app"),
    INNGEST_EVENT_KEY: z.string().optional(),
    INNGEST_SIGNING_KEY: z.string().optional(),
    OPENROUTER_API_KEY: z
      .string()
      .min(1, "OPENROUTER_API_KEY is required for AI features")
      .startsWith("sk-or-", "OPENROUTER_API_KEY must start with sk-or-"),
    R2_ACCOUNT_ID: z.string().min(1, "R2_ACCOUNT_ID is required for screenshot storage"),
    R2_ACCESS_KEY_ID: z.string().min(1, "R2_ACCESS_KEY_ID is required for screenshot storage"),
    R2_SECRET_ACCESS_KEY: z.string().min(1, "R2_SECRET_ACCESS_KEY is required for screenshot storage"),
    R2_BUCKET_NAME: z.string().min(1, "R2_BUCKET_NAME is required for screenshot storage"),
    R2_PUBLIC_URL: z.url(),
    RESEND_API_KEY: z.string(),
    RESEND_FROM_EMAIL: z.email(),
    ALERT_EMAIL: z.email().optional(),
    STRIPE_SECRET_KEY: z
      .string()
      .min(1, "STRIPE_SECRET_KEY is required")
      .refine(
        (val) => val.startsWith("sk_"),
        "STRIPE_SECRET_KEY must start with sk_"
      ),
    STRIPE_WEBHOOK_SECRET: z
      .string()
      .startsWith("whsec_", "STRIPE_WEBHOOK_SECRET must start with whsec_"),
    SLACK_CLIENT_ID: z.string().min(1, "SLACK_CLIENT_ID is required"),
    SLACK_CLIENT_SECRET: z.string().min(1, "SLACK_CLIENT_SECRET is required"),
    SLACK_SIGNING_SECRET: z.string().min(1, "SLACK_SIGNING_SECRET is required"),
    FIRECRAWL_API_KEY: z
      .string()
      .min(1, "FIRECRAWL_API_KEY is required for competitor monitoring")
      .startsWith("fc-", "FIRECRAWL_API_KEY must start with fc-"),
    SHOPIFY_API_KEY: z.string().min(1),
    SHOPIFY_API_SECRET: z.string().min(1),
    SHOPIFY_SCOPES: z
      .string()
      .default("read_products,read_inventory,read_price_rules,read_discounts"),
    SENTRY_DSN: z.url().optional(),
    SENTRY_AUTH_TOKEN: z.string().optional(),
    TAWK_WEBHOOK_SECRET: z.string().optional(),
    UPSTASH_REDIS_REST_URL: z
      .string()
      .url("UPSTASH_REDIS_REST_URL must be a valid URL"),
    UPSTASH_REDIS_REST_TOKEN: z
      .string()
      .min(1, "UPSTASH_REDIS_REST_TOKEN is required for pending snapshot handoff"),
  },
  client: {
    NEXT_PUBLIC_TAWK_PROPERTY_ID: z.string().optional().default("69bd4b8c26d3ea1c304ac05b"),
    NEXT_PUBLIC_TAWK_WIDGET_ID: z.string().optional().default("1jk5mu7n3"),
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z
      .string()
      .min(1, "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is required")
      .refine(
        (val) => val.startsWith("pk_"),
        "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY must start with pk_"
      ),
    NEXT_PUBLIC_POSTHOG_KEY: z
      .string()
      .min(1, "NEXT_PUBLIC_POSTHOG_KEY is required")
      .refine(
        (val) => val.startsWith("phc_"),
        "NEXT_PUBLIC_POSTHOG_KEY must start with phc_"
      ),
    NEXT_PUBLIC_POSTHOG_HOST: z.url("NEXT_PUBLIC_POSTHOG_HOST must be a valid URL"),
    NEXT_PUBLIC_ENVIRONMENT: z.enum(["dev", "stg", "prd"]).default("dev"),
    NEXT_PUBLIC_MARKETING_APP_URL: z.url().default("http://localhost:3000"),
    NEXT_PUBLIC_DASHBOARD_APP_URL: z.url().default("http://localhost:3001"),
    NEXT_PUBLIC_SENTRY_DSN: z.url(),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    LOG_LEVEL: process.env.LOG_LEVEL,
    DATABASE_URL: process.env.DATABASE_URL,
    DOPPLER_ENVIRONMENT: process.env.DOPPLER_ENVIRONMENT,
    DOPPLER_CONFIG: process.env.DOPPLER_CONFIG,
    DOPPLER_PROJECT: process.env.DOPPLER_PROJECT,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    INNGEST_EVENT_KEY: process.env.INNGEST_EVENT_KEY,
    INNGEST_SIGNING_KEY: process.env.INNGEST_SIGNING_KEY,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
    R2_BUCKET_NAME: process.env.R2_BUCKET_NAME,
    R2_PUBLIC_URL: process.env.R2_PUBLIC_URL,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
    ALERT_EMAIL: process.env.ALERT_EMAIL,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    SLACK_CLIENT_ID: process.env.SLACK_CLIENT_ID,
    SLACK_CLIENT_SECRET: process.env.SLACK_CLIENT_SECRET,
    SLACK_SIGNING_SECRET: process.env.SLACK_SIGNING_SECRET,
    FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY,
    SHOPIFY_API_KEY: process.env.SHOPIFY_API_KEY,
    SHOPIFY_API_SECRET: process.env.SHOPIFY_API_SECRET,
    SHOPIFY_SCOPES: process.env.SHOPIFY_SCOPES,
    SENTRY_DSN: process.env.SENTRY_DSN,
    SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
    TAWK_WEBHOOK_SECRET: process.env.TAWK_WEBHOOK_SECRET,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    NEXT_PUBLIC_TAWK_PROPERTY_ID: process.env.NEXT_PUBLIC_TAWK_PROPERTY_ID,
    NEXT_PUBLIC_TAWK_WIDGET_ID: process.env.NEXT_PUBLIC_TAWK_WIDGET_ID,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    NEXT_PUBLIC_ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT,
    NEXT_PUBLIC_MARKETING_APP_URL: process.env.NEXT_PUBLIC_MARKETING_APP_URL,
    NEXT_PUBLIC_DASHBOARD_APP_URL: process.env.NEXT_PUBLIC_DASHBOARD_APP_URL,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  },
  skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
});
