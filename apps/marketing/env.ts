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
    NEXT_PUBLIC_MARKETING_APP_URL: process.env.NEXT_PUBLIC_MARKETING_APP_URL,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    NEXT_PUBLIC_ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT,
  },
  emptyStringAsUndefined: true,
  skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
});
