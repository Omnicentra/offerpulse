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
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
