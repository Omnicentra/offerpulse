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
  },
  clientPrefix: "NEXT_PUBLIC_",
  client: {
    NEXT_PUBLIC_MARKETING_APP_URL: z
      .string()
      .min(1, "NEXT_PUBLIC_MARKETING_APP_URL is required")
      .url("NEXT_PUBLIC_MARKETING_APP_URL must be a valid URL"),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
