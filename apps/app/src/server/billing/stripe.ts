import "server-only";

import { cache } from "react";
import Stripe from "stripe";
import { env } from "@/env";

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-02-25.clover",
});

export const getPriceId = cache(async (lookupKey: string) => {
  const prices = await stripe.prices.list({
    lookup_keys: [lookupKey],
    limit: 1,
  });
  return prices.data[0]?.id;
});
