import Stripe from "stripe";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { router, protectedProcedure, subscribedProcedure } from "../trpc";
import { subscriptions, user } from "../../db/schema";
import { env } from "@/env";
import { getPlanById, TRIAL_PERIOD_DAYS } from "@offerpulse/lib/pricing";

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

export const billingRouter = router({
  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    const subscription = await ctx.db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, ctx.user.id),
    });

    if (!subscription) return null;

    const plan = getPlanById(subscription.planId as "starter" | "growth" | "agency");

    return {
      ...subscription,
      plan: plan ?? null,
    };
  }),

  createCheckoutSession: protectedProcedure
    .input(
      z.object({
        lookupKey: z.string(),
        successUrl: z.string().url().optional(),
        cancelUrl: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.transaction(async (tx) => {
        // Lock user row so concurrent requests cannot both pass the subscription check
        await tx
          .select()
          .from(user)
          .where(eq(user.id, ctx.user.id))
          .for("update");

        const existing = await tx.query.subscriptions.findFirst({
          where: eq(subscriptions.userId, ctx.user.id),
        });

        if (existing && ["active", "trialing"].includes(existing.status)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "You already have an active subscription.",
          });
        }

        const prices = await stripe.prices.list({
          lookup_keys: [input.lookupKey],
          limit: 1,
        });

        const price = prices.data[0];
        if (!price) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `No price found for lookup key: ${input.lookupKey}`,
          });
        }

        const baseUrl = env.BETTER_AUTH_URL.replace(/\/$/, "");

        const session = await stripe.checkout.sessions.create({
          mode: "subscription",
          payment_method_types: ["card"],
          line_items: [{ price: price.id, quantity: 1 }],
          subscription_data: {
            trial_period_days: TRIAL_PERIOD_DAYS,
            metadata: { userId: ctx.user.id, lookupKey: input.lookupKey },
          },
          customer_email: ctx.user.email,
          metadata: { userId: ctx.user.id, lookupKey: input.lookupKey },
          success_url:
            input.successUrl ?? `${baseUrl}/overview?checkout=success`,
          cancel_url:
            input.cancelUrl ?? `${baseUrl}/signup?checkout=cancelled`,
          allow_promotion_codes: true,
        });

        if (!session.url) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create checkout session.",
          });
        }

        return { sessionUrl: session.url };
      });
    }),

  createPortalSession: subscribedProcedure
    .input(z.object({ returnUrl: z.string().url() }))
    .mutation(async ({ ctx, input }) => {
      const session = await stripe.billingPortal.sessions.create({
        customer: ctx.subscription.stripeCustomerId,
        return_url: input.returnUrl,
      });

      return { url: session.url };
    }),

  cancelSubscription: subscribedProcedure.mutation(async ({ ctx }) => {
    await stripe.subscriptions.update(
      ctx.subscription.stripeSubscriptionId,
      { cancel_at_period_end: true }
    );

    await ctx.db
      .update(subscriptions)
      .set({ cancelAtPeriodEnd: true })
      .where(eq(subscriptions.id, ctx.subscription.id));
  }),

  reactivateSubscription: subscribedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.subscription.cancelAtPeriodEnd) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Subscription is not pending cancellation.",
      });
    }

    await stripe.subscriptions.update(
      ctx.subscription.stripeSubscriptionId,
      { cancel_at_period_end: false }
    );

    await ctx.db
      .update(subscriptions)
      .set({ cancelAtPeriodEnd: false })
      .where(eq(subscriptions.id, ctx.subscription.id));
  }),
});
