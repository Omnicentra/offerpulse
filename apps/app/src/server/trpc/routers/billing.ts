import Stripe from "stripe";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { router, protectedProcedure, subscribedProcedure } from "../trpc";
import { subscriptions, user } from "../../db/schema";
import { env } from "@/env";
import { getPlanById } from "@offerpulse/lib/pricing";
import { logger } from "@offerpulse/lib";

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-02-25.clover",
});

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
            metadata: { userId: ctx.user.id, lookupKey: input.lookupKey },
          },
          customer_email: ctx.user.email,
          metadata: { userId: ctx.user.id, lookupKey: input.lookupKey },
          success_url:
            input.successUrl ?? `${baseUrl}?checkout=success`,
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

  /**
   * Switch plan for an existing Stripe subscription (upgrade or downgrade).
   * Proration is handled by Stripe (invoice items for the unused vs new price).
   */
  changeSubscriptionPlan: protectedProcedure
    .input(z.object({ planId: z.enum(["starter", "growth", "agency"]) }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.transaction(async (tx) => {
        await tx
          .select()
          .from(user)
          .where(eq(user.id, ctx.user.id))
          .for("update");

        const row = await tx.query.subscriptions.findFirst({
          where: eq(subscriptions.userId, ctx.user.id),
        });

        if (
          !row ||
          !["active", "trialing", "past_due"].includes(row.status)
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "No manageable subscription found. Use checkout to subscribe.",
          });
        }

        if (row.planId === input.planId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "You are already on this plan.",
          });
        }

        return row;
      });

      const targetPlan = getPlanById(input.planId);
      if (!targetPlan) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Unknown plan.",
        });
      }

      const interval = existing.interval === "year" ? "year" : "month";
      const lookupKey =
        interval === "year"
          ? targetPlan.stripeLookupKeyYearly
          : targetPlan.stripeLookupKeyMonthly;

      const prices = await stripe.prices.list({
        lookup_keys: [lookupKey],
        limit: 1,
      });

      const newPrice = prices.data[0];
      if (!newPrice) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `No price found for lookup key: ${lookupKey}`,
        });
      }

      const stripeSub = await stripe.subscriptions.retrieve(
        existing.stripeSubscriptionId
      );

      const item = stripeSub.items.data[0];
      if (!item) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Subscription has no line items.",
        });
      }

      if (item.price.id === newPrice.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You are already on this price.",
        });
      }

      const metadata: Record<string, string> = {
        ...(stripeSub.metadata ?? {}),
        userId: ctx.user.id,
        lookupKey,
      };

      await stripe.subscriptions.update(existing.stripeSubscriptionId, {
        items: [{ id: item.id, price: newPrice.id }],
        proration_behavior: "create_prorations",
        metadata,
      });

      logger.info("Subscription plan change applied in Stripe", {
        userId: ctx.user.id,
        subscriptionId: existing.stripeSubscriptionId,
        fromPlanId: existing.planId,
        toPlanId: input.planId,
        lookupKey,
      });

      return { ok: true as const };
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

  reactivateSubscription: protectedProcedure.mutation(async ({ ctx }) => {
    const subscription = await ctx.db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, ctx.user.id),
    });

    if (!subscription) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Subscription not found.",
      });
    }

    if (!subscription.cancelAtPeriodEnd) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Subscription is not pending cancellation.",
      });
    }

    await stripe.subscriptions.update(
      subscription.stripeSubscriptionId,
      { cancel_at_period_end: false }
    );

    await ctx.db
      .update(subscriptions)
      .set({ cancelAtPeriodEnd: false })
      .where(eq(subscriptions.id, subscription.id));
  }),
});
