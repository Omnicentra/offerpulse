import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    STRIPE_SECRET_KEY: z
      .string()
      .min(1, "STRIPE_SECRET_KEY is required")
      .refine(
        (val) => val.startsWith("sk_"),
        "STRIPE_SECRET_KEY must start with sk_"
      ),
    STRIPE_WEBHOOK_SECRET: z
      .string()
      .startsWith("whsec_", "STRIPE_WEBHOOK_SECRET must start with whsec_")
      .optional(),
    STRIPE_PRICE_LOOKUP_KEY: z.string().default("snapshot-report"),
    RESEND_API_KEY: z
      .string()
      .min(1, "RESEND_API_KEY is required")
      .refine(
        (val) => val.startsWith("re_"),
        "RESEND_API_KEY must start with re_"
      ),
    AIRTABLE_API_KEY: z
      .string()
      .min(1, "AIRTABLE_API_KEY is required")
      .refine(
        (val) => val.startsWith("pat"),
        "AIRTABLE_API_KEY must start with pat"
      ),
    AIRTABLE_BASE_ID: z.string().default("app2FMikxa9F6erFY"),
    DOPPLER_CONFIG: z.string().default("dev"),
    DOPPLER_ENVIRONMENT: z.enum(["dev", "stg", "prd"]).default("dev"),
    DOPPLER_PROJECT: z.string().default("offerpulse"),
    BROWSERLESS_API_KEY: z
      .string()
      .min(1, "BROWSERLESS_API_KEY is required for JS-rendered scraping"),
    BROWSERLESS_WSS_URL: z
      .url()
      .default("wss://production-lon.browserless.io"),
    R2_ACCOUNT_ID: z
      .string()
      .min(1, "R2_ACCOUNT_ID is required for screenshot storage"),
    R2_ACCESS_KEY_ID: z
      .string()
      .min(1, "R2_ACCESS_KEY_ID is required for screenshot storage"),
    R2_SECRET_ACCESS_KEY: z
      .string()
      .min(1, "R2_SECRET_ACCESS_KEY is required for screenshot storage"),
    R2_BUCKET_NAME: z
      .string()
      .min(1, "R2_BUCKET_NAME is required for screenshot storage").default("offerpulse-snapshots"),
    R2_PUBLIC_URL: z
      .url()
      .optional().default("https://pub-d1037b173c5f40ebb985230458591c67.r2.dev"),
    OPENROUTER_API_KEY: z
      .string()
      .min(1, "OPENROUTER_API_KEY is required for OpenRouter API"),
    FIRECRAWL_API_KEY: z
      .string()
      .min(1, "FIRECRAWL_API_KEY is required for URL discovery")
      .refine(
        (val) => val.startsWith("fc-"),
        "FIRECRAWL_API_KEY must start with fc-"
      ),
    UPSTASH_REDIS_REST_URL: z
      .string()
      .url("UPSTASH_REDIS_REST_URL must be a valid URL"),
    UPSTASH_REDIS_REST_TOKEN: z
      .string()
      .min(1, "UPSTASH_REDIS_REST_TOKEN is required for rate limiting"),
  },
  clientPrefix: "NEXT_PUBLIC_",
  client: {
    NEXT_PUBLIC_MARKETING_APP_URL: z
      .string()
      .min(1, "NEXT_PUBLIC_MARKETING_APP_URL is required")
      .url("NEXT_PUBLIC_MARKETING_APP_URL must be a valid URL"),
    NEXT_PUBLIC_POSTHOG_KEY: z
      .string()
      .min(1, "NEXT_PUBLIC_POSTHOG_KEY is required")
      .refine(
        (val) => val.startsWith("phc_"),
        "NEXT_PUBLIC_POSTHOG_KEY must start with phc_"
      ),
    NEXT_PUBLIC_POSTHOG_HOST: z.url("NEXT_PUBLIC_POSTHOG_HOST must be a valid URL"),
    NEXT_PUBLIC_ENVIRONMENT: z.enum(["dev", "stg", "prd"]).default("dev"),
  },
  runtimeEnv: {
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    STRIPE_PRICE_LOOKUP_KEY: process.env.STRIPE_PRICE_LOOKUP_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    AIRTABLE_API_KEY: process.env.AIRTABLE_API_KEY,
    AIRTABLE_BASE_ID: process.env.AIRTABLE_BASE_ID,
    DOPPLER_CONFIG: process.env.DOPPLER_CONFIG,
    DOPPLER_ENVIRONMENT: process.env.DOPPLER_ENVIRONMENT,
    DOPPLER_PROJECT: process.env.DOPPLER_PROJECT,
    BROWSERLESS_API_KEY: process.env.BROWSERLESS_API_KEY,
    BROWSERLESS_WSS_URL: process.env.BROWSERLESS_WSS_URL,
    R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
    R2_BUCKET_NAME: process.env.R2_BUCKET_NAME,
    R2_PUBLIC_URL: process.env.R2_PUBLIC_URL,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    NEXT_PUBLIC_MARKETING_APP_URL: process.env.NEXT_PUBLIC_MARKETING_APP_URL,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    NEXT_PUBLIC_ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT,
  },
  emptyStringAsUndefined: true,
  skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
});
