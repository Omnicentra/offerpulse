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

function getSubscriptionPeriodEndUnix(sub: Stripe.Subscription): number {
  const firstItem = sub.items.data[0];
  if (firstItem && typeof firstItem.current_period_end === "number") {
    return firstItem.current_period_end;
  }
  const legacy = sub as unknown as { current_period_end?: number };
  if (typeof legacy.current_period_end === "number") {
    return legacy.current_period_end;
  }
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "Could not determine the end of your current billing period.",
  });
}

function getScheduleIdFromSubscription(sub: Stripe.Subscription): string | null {
  if (typeof sub.schedule === "string") return sub.schedule;
  if (sub.schedule && typeof sub.schedule === "object" && "id" in sub.schedule) {
    return sub.schedule.id;
  }
  return null;
}

export const billingRouter = router({
  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    const subscription = await ctx.db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, ctx.user.id),
    });

    if (!subscription) {
      logger.debug("billing.getSubscription: no row", { userId: ctx.user.id });
      return null;
    }

    const plan = getPlanById(subscription.planId as "starter" | "growth" | "agency");

    logger.debug("billing.getSubscription: row", {
      userId: ctx.user.id,
      planId: subscription.planId,
      status: subscription.status,
      pendingPlanId: subscription.pendingPlanId ?? null,
      stripeScheduleId: subscription.stripeScheduleId ?? null,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    });

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
      logger.debug("billing.createCheckoutSession: start", {
        userId: ctx.user.id,
        lookupKey: input.lookupKey,
      });

      return await ctx.db.transaction(async (tx) => {
        await tx
          .select()
          .from(user)
          .where(eq(user.id, ctx.user.id))
          .for("update");

        const existing = await tx.query.subscriptions.findFirst({
          where: eq(subscriptions.userId, ctx.user.id),
        });

        if (existing && ["active", "trialing"].includes(existing.status)) {
          logger.debug("billing.createCheckoutSession: rejected active subscription", {
            userId: ctx.user.id,
            status: existing.status,
          });
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
          success_url: input.successUrl ?? `${baseUrl}?checkout=success`,
          cancel_url: input.cancelUrl ?? `${baseUrl}/signup?checkout=cancelled`,
          allow_promotion_codes: true,
        });

        if (!session.url) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create checkout session.",
          });
        }

        logger.debug("billing.createCheckoutSession: created", {
          userId: ctx.user.id,
          sessionId: session.id,
          lookupKey: input.lookupKey,
        });

        return { sessionUrl: session.url };
      });
    }),

  /**
   * Schedule a plan change at the end of the current billing period via Stripe Subscription Schedules.
   * No immediate proration; the new price applies from the next period boundary.
   */
  changeSubscriptionPlan: protectedProcedure
    .input(z.object({ planId: z.enum(["starter", "growth", "agency"]) }))
    .mutation(async ({ ctx, input }) => {
      logger.debug("billing.changeSubscriptionPlan: start", {
        userId: ctx.user.id,
        targetPlanId: input.planId,
      });

      const existing = await ctx.db.transaction(async (tx) => {
        await tx
          .select()
          .from(user)
          .where(eq(user.id, ctx.user.id))
          .for("update");

        const row = await tx.query.subscriptions.findFirst({
          where: eq(subscriptions.userId, ctx.user.id),
        });

        if (!row || !["active", "past_due"].includes(row.status)) {
          if (row?.status === "trialing") {
            logger.debug("billing.changeSubscriptionPlan: rejected trialing", {
              userId: ctx.user.id,
            });
            throw new TRPCError({
              code: "BAD_REQUEST",
              message:
                "Plan changes are not available during your trial. Your plan will be set when the trial ends.",
            });
          }
          logger.debug("billing.changeSubscriptionPlan: rejected no manageable row", {
            userId: ctx.user.id,
            hasRow: !!row,
            status: row?.status,
          });
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "No manageable subscription found. Use checkout to subscribe.",
          });
        }

        if (row.cancelAtPeriodEnd) {
          logger.debug("billing.changeSubscriptionPlan: rejected cancel at period end", {
            userId: ctx.user.id,
          });
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "Your subscription is set to cancel. Reactivate it before changing plans.",
          });
        }

        if (row.status === "past_due") {
          logger.debug("billing.changeSubscriptionPlan: rejected past_due", {
            userId: ctx.user.id,
          });
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "Please update your payment method in the billing portal before changing plans.",
          });
        }

        if (row.planId === input.planId && !row.pendingPlanId) {
          logger.debug("billing.changeSubscriptionPlan: rejected same plan", {
            userId: ctx.user.id,
            planId: row.planId,
          });
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "You are already on this plan.",
          });
        }

        if (row.pendingPlanId === input.planId) {
          logger.debug("billing.changeSubscriptionPlan: rejected already scheduled", {
            userId: ctx.user.id,
            pendingPlanId: row.pendingPlanId,
          });
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "This plan change is already scheduled.",
          });
        }

        logger.debug("billing.changeSubscriptionPlan: DB validation passed", {
          userId: ctx.user.id,
          stripeSubscriptionId: row.stripeSubscriptionId,
          currentPlanId: row.planId,
          interval: row.interval,
          pendingPlanId: row.pendingPlanId ?? null,
          stripeScheduleId: row.stripeScheduleId ?? null,
        });

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

      const stripeSub = await stripe.subscriptions.retrieve(existing.stripeSubscriptionId, {
        expand: ["items.data.price"],
      });

      logger.debug("billing.changeSubscriptionPlan: Stripe subscription retrieved", {
        userId: ctx.user.id,
        stripeSubscriptionId: stripeSub.id,
        stripeStatus: stripeSub.status,
        attachedScheduleId: getScheduleIdFromSubscription(stripeSub),
      });

      const subItem = stripeSub.items.data[0];
      if (!subItem) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Subscription has no line items.",
        });
      }

      const currentPriceId =
        typeof subItem.price === "string" ? subItem.price : subItem.price.id;
      const quantity = subItem.quantity ?? 1;

      if (currentPriceId === newPrice.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You are already on this price.",
        });
      }

      const periodEnd = getSubscriptionPeriodEndUnix(stripeSub);
      const now = Math.floor(Date.now() / 1000);
      logger.debug("billing.changeSubscriptionPlan: billing period boundary", {
        userId: ctx.user.id,
        periodEndUnix: periodEnd,
        periodEndIso: new Date(periodEnd * 1000).toISOString(),
        nowUnix: now,
        currentPriceId,
        newPriceId: newPrice.id,
        lookupKey,
      });

      if (periodEnd <= now) {
        logger.debug("billing.changeSubscriptionPlan: rejected period already ended", {
          userId: ctx.user.id,
          periodEnd,
          now,
        });
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Your billing period has ended. Please refresh the page or contact support.",
        });
      }

      let scheduleId = getScheduleIdFromSubscription(stripeSub);

      if (!scheduleId) {
        if (existing.stripeScheduleId || existing.pendingPlanId) {
          logger.debug("billing.changeSubscriptionPlan: clearing stale schedule fields in DB", {
            userId: ctx.user.id,
            hadStripeScheduleId: !!existing.stripeScheduleId,
            hadPendingPlanId: !!existing.pendingPlanId,
          });
          await ctx.db
            .update(subscriptions)
            .set({ stripeScheduleId: null, pendingPlanId: null })
            .where(eq(subscriptions.userId, ctx.user.id));
        }

        logger.debug("billing.changeSubscriptionPlan: creating schedule from subscription", {
          userId: ctx.user.id,
          stripeSubscriptionId: stripeSub.id,
        });
        const created = await stripe.subscriptionSchedules.create({
          from_subscription: stripeSub.id,
        });
        scheduleId = created.id;
        logger.debug("billing.changeSubscriptionPlan: schedule created", {
          userId: ctx.user.id,
          scheduleId,
        });
      } else {
        logger.debug("billing.changeSubscriptionPlan: using existing attached schedule", {
          userId: ctx.user.id,
          scheduleId,
        });
      }

      const schedule = await stripe.subscriptionSchedules.retrieve(scheduleId, {
        expand: ["phases.items.price"],
      });

      const phases = schedule.phases ?? [];
      const currentPhase =
        phases.find(
          (p) => p.start_date <= now && (p.end_date == null || p.end_date > now)
        ) ?? phases[0];

      if (!currentPhase) {
        logger.debug("billing.changeSubscriptionPlan: no current phase on schedule", {
          userId: ctx.user.id,
          scheduleId,
          phaseCount: phases.length,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not read subscription schedule phases.",
        });
      }

      const phase0Start = currentPhase.start_date;

      logger.debug("billing.changeSubscriptionPlan: updating schedule phases", {
        userId: ctx.user.id,
        scheduleId,
        scheduleStatus: schedule.status,
        phaseCountBefore: phases.length,
        phase0Start,
        phase0End: periodEnd,
        phase1Start: periodEnd,
        endBehavior: "release",
        prorationBehavior: "none",
      });

      await stripe.subscriptionSchedules.update(scheduleId, {
        end_behavior: "release",
        proration_behavior: "none",
        phases: [
          {
            start_date: phase0Start,
            end_date: periodEnd,
            items: [{ price: currentPriceId, quantity }],
            proration_behavior: "none",
          },
          {
            start_date: periodEnd,
            items: [{ price: newPrice.id, quantity: 1 }],
            proration_behavior: "none",
          },
        ],
      });

      logger.debug("billing.changeSubscriptionPlan: Stripe schedule update returned", {
        userId: ctx.user.id,
        scheduleId,
      });

      await ctx.db
        .update(subscriptions)
        .set({
          stripeScheduleId: scheduleId,
          pendingPlanId: input.planId,
        })
        .where(eq(subscriptions.userId, ctx.user.id));

      logger.debug("billing.changeSubscriptionPlan: DB updated with pending plan", {
        userId: ctx.user.id,
        scheduleId,
        pendingPlanId: input.planId,
      });

      logger.info("Subscription plan change scheduled via Stripe", {
        userId: ctx.user.id,
        subscriptionId: existing.stripeSubscriptionId,
        scheduleId,
        fromPlanId: existing.planId,
        toPlanId: input.planId,
        effectiveAt: new Date(periodEnd * 1000).toISOString(),
        lookupKey,
      });

      return { ok: true as const };
    }),

  cancelScheduledPlanChange: protectedProcedure.mutation(async ({ ctx }) => {
    logger.debug("billing.cancelScheduledPlanChange: start", { userId: ctx.user.id });

    const row = await ctx.db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, ctx.user.id),
    });

    if (!row?.stripeScheduleId) {
      logger.debug("billing.cancelScheduledPlanChange: no schedule on row", {
        userId: ctx.user.id,
        pendingPlanId: row?.pendingPlanId ?? null,
      });
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "There is no scheduled plan change to cancel.",
      });
    }

    logger.debug("billing.cancelScheduledPlanChange: releasing Stripe schedule", {
      userId: ctx.user.id,
      scheduleId: row.stripeScheduleId,
      pendingPlanId: row.pendingPlanId ?? null,
    });

    await stripe.subscriptionSchedules.release(row.stripeScheduleId);

    await ctx.db
      .update(subscriptions)
      .set({
        stripeScheduleId: null,
        pendingPlanId: null,
      })
      .where(eq(subscriptions.userId, ctx.user.id));

    logger.debug("billing.cancelScheduledPlanChange: DB cleared", { userId: ctx.user.id });

    logger.info("Released subscription schedule (cancelled pending plan change)", {
      userId: ctx.user.id,
      scheduleId: row.stripeScheduleId,
    });

    return { ok: true as const };
  }),

  /** Billing portal for payment method and invoices; allows past_due so users can fix payment. */
  createPortalSession: protectedProcedure
    .input(z.object({ returnUrl: z.string().url() }))
    .mutation(async ({ ctx, input }) => {
      logger.debug("billing.createPortalSession: start", { userId: ctx.user.id });

      const sub = await ctx.db.query.subscriptions.findFirst({
        where: eq(subscriptions.userId, ctx.user.id),
      });

      if (
        !sub ||
        !["active", "trialing", "past_due"].includes(sub.status)
      ) {
        logger.debug("billing.createPortalSession: forbidden", {
          userId: ctx.user.id,
          hasSub: !!sub,
          status: sub?.status,
        });
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "No billing account available for the customer portal.",
        });
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: sub.stripeCustomerId,
        return_url: input.returnUrl,
      });

      logger.debug("billing.createPortalSession: session created", {
        userId: ctx.user.id,
        stripeCustomerId: sub.stripeCustomerId,
        subscriptionStatus: sub.status,
      });

      return { url: session.url };
    }),

  cancelSubscription: subscribedProcedure.mutation(async ({ ctx }) => {
    await stripe.subscriptions.update(ctx.subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

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

    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });

    await ctx.db
      .update(subscriptions)
      .set({ cancelAtPeriodEnd: false })
      .where(eq(subscriptions.id, subscription.id));
  }),
});
