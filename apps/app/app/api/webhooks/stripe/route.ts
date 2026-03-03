import { NextResponse } from "next/server";
import Stripe from "stripe";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { env } from "@/env";
import { db } from "@/src/server/db";
import { subscriptions } from "@/src/server/db/schema";
import { logger, parseLookupKey } from "@offerpulse/lib";

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-02-25.clover",
});

const RELEVANT_EVENTS = new Set([
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.payment_succeeded",
  "invoice.payment_failed",
]);

export async function POST(req: Request) {
  logger.debug("Stripe webhook POST received");
  let event: Stripe.Event;

  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    logger.debug("Webhook body length", body.length, "signature present", !!signature);

    if (!signature) {
      logger.warn("Stripe webhook rejected: missing Stripe-Signature header");
      return NextResponse.json(
        { message: "Missing Stripe-Signature header" },
        { status: 400 }
      );
    }

    event = stripe.webhooks.constructEvent(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );
    logger.debug("Stripe webhook verified", { type: event.type, id: event.id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    logger.error("Webhook signature verification failed", err);
    return NextResponse.json(
      { message: `Webhook Error: ${msg}` },
      { status: 400 }
    );
  }

  if (!RELEVANT_EVENTS.has(event.type)) {
    logger.debug("Stripe webhook ignored (not relevant)", { type: event.type });
    return NextResponse.json({ received: true });
  }

  logger.debug("Stripe webhook processing", { type: event.type, id: event.id });

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logger.debug("checkout.session.completed", {
          mode: session.mode,
          subscriptionId: session.subscription,
          metadata: session.metadata,
        });
        if (session.mode !== "subscription" || !session.subscription) {
          logger.debug("checkout.session.completed skipped: not subscription or no subscription id");
          break;
        }

        const userId = session.metadata?.userId;
        if (!userId) {
          logger.error("checkout.session.completed: missing userId in metadata", { metadata: session.metadata });
          break;
        }

        const stripeSubscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );
        logger.debug("checkout.session.completed upserting subscription", { userId, subId: stripeSubscription.id });
        await upsertSubscription(userId, stripeSubscription);
        logger.info("checkout.session.completed processed", { userId, subscriptionId: stripeSubscription.id });
        break;
      }

      case "customer.subscription.created": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.userId;
        logger.debug("customer.subscription.created", { subId: sub.id, userId: userId ?? null });
        if (!userId) {
          logger.debug("customer.subscription.created skipped: no userId in metadata");
          break;
        }

        await upsertSubscription(userId, sub);
        logger.info("customer.subscription.created processed", { userId, subscriptionId: sub.id });
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        logger.debug("customer.subscription.updated", { subId: sub.id, status: sub.status });
        const existing = await db.query.subscriptions.findFirst({
          where: eq(subscriptions.stripeSubscriptionId, sub.id),
        });

        if (!existing) {
          logger.debug("customer.subscription.updated skipped: no existing subscription", { subId: sub.id });
          break;
        }

        const priceItem = sub.items.data[0];
        const lookupKey = priceItem?.price.lookup_key ?? existing.planId;
        const parsed = lookupKey ? parseLookupKey(lookupKey) : null;
        const period = await getSubscriptionPeriod(sub);

        await db
          .update(subscriptions)
          .set({
            status: mapStripeStatus(sub.status),
            stripePriceId: priceItem?.price.id ?? existing.stripePriceId,
            planId: parsed?.planId ?? existing.planId,
            interval: parsed?.interval ?? existing.interval,
            cancelAtPeriodEnd: sub.cancel_at_period_end,
            currentPeriodStart: period.currentPeriodStart,
            currentPeriodEnd: period.currentPeriodEnd,
            trialStart: sub.trial_start
              ? new Date(sub.trial_start * 1000)
              : null,
            trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
            canceledAt: sub.canceled_at
              ? new Date(sub.canceled_at * 1000)
              : null,
          })
          .where(eq(subscriptions.id, existing.id));
        logger.info("customer.subscription.updated processed", { subscriptionId: sub.id, status: sub.status });
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        logger.debug("customer.subscription.deleted", { subId: sub.id });
        const existing = await db.query.subscriptions.findFirst({
          where: eq(subscriptions.stripeSubscriptionId, sub.id),
        });

        if (!existing) {
          logger.debug("customer.subscription.deleted skipped: no existing subscription", { subId: sub.id });
          break;
        }

        await db
          .update(subscriptions)
          .set({
            status: "canceled",
            canceledAt: new Date(),
          })
          .where(eq(subscriptions.id, existing.id));
        logger.info("customer.subscription.deleted processed", { subscriptionId: sub.id });
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice & {
          subscription?: string | Stripe.Subscription | null;
        };
        logger.debug("invoice.payment_succeeded", { invoiceId: invoice.id, subscription: invoice.subscription });
        if (!invoice.subscription) {
          logger.debug("invoice.payment_succeeded skipped: no subscription");
          break;
        }

        const subId =
          typeof invoice.subscription === "string"
            ? invoice.subscription
            : invoice.subscription.id;

        const existing = await db.query.subscriptions.findFirst({
          where: eq(subscriptions.stripeSubscriptionId, subId),
        });

        if (!existing) {
          logger.debug("invoice.payment_succeeded skipped: no existing subscription", { subId });
          break;
        }

        const stripeSub = await stripe.subscriptions.retrieve(subId);
        const period = await getSubscriptionPeriod(stripeSub);
        logger.debug("invoice.payment_succeeded updating period", {
          subId,
          currentPeriodStart: period.currentPeriodStart,
          currentPeriodEnd: period.currentPeriodEnd,
        });

        await db
          .update(subscriptions)
          .set({
            status: "active",
            currentPeriodStart: period.currentPeriodStart,
            currentPeriodEnd: period.currentPeriodEnd,
          })
          .where(eq(subscriptions.id, existing.id));
        logger.info("invoice.payment_succeeded processed", { subscriptionId: subId });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice & {
          subscription?: string | Stripe.Subscription | null;
        };
        logger.debug("invoice.payment_failed", { invoiceId: invoice.id, subscription: invoice.subscription });
        if (!invoice.subscription) {
          logger.debug("invoice.payment_failed skipped: no subscription");
          break;
        }

        const subId =
          typeof invoice.subscription === "string"
            ? invoice.subscription
            : invoice.subscription.id;

        const existing = await db.query.subscriptions.findFirst({
          where: eq(subscriptions.stripeSubscriptionId, subId),
        });

        if (!existing) {
          logger.debug("invoice.payment_failed skipped: no existing subscription", { subId });
          break;
        }

        await db
          .update(subscriptions)
          .set({ status: "past_due" })
          .where(eq(subscriptions.id, existing.id));
        logger.info("invoice.payment_failed processed (status set to past_due)", { subscriptionId: subId });
        break;
      }
    }
  } catch (error) {
    logger.error("Webhook handler error", error);
    return NextResponse.json(
      { message: "Webhook handler failed" },
      { status: 500 }
    );
  }

  logger.debug("Stripe webhook completed", { type: event.type, id: event.id });
  return NextResponse.json({ received: true });
}

function mapStripeStatus(
  status: Stripe.Subscription.Status
): "active" | "trialing" | "past_due" | "canceled" | "incomplete" {
  switch (status) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
      return "past_due";
    case "canceled":
    case "unpaid":
      return "canceled";
    default:
      return "incomplete";
  }
}

/**
 * Get current billing period start/end. Uses subscription schedule API when the
 * subscription is attached to a schedule; otherwise falls back to subscription
 * fields if present.
 */
async function getSubscriptionPeriod(
  sub: Stripe.Subscription
): Promise<{ currentPeriodStart: Date; currentPeriodEnd: Date }> {
  const subWithSchedule = sub as Stripe.Subscription & {
    schedule?: string | Stripe.SubscriptionSchedule | null;
    subscription_schedule?: string | Stripe.SubscriptionSchedule | null;
  };
  const scheduleRef =
    subWithSchedule.schedule ?? subWithSchedule.subscription_schedule ?? null;
  const scheduleId =
    typeof scheduleRef === "string"
      ? scheduleRef
      : scheduleRef?.id ?? null;

  if (scheduleId) {
    logger.debug("getSubscriptionPeriod: using schedule", { subId: sub.id, scheduleId });
    const schedule = await stripe.subscriptionSchedules.retrieve(scheduleId);
    const now = Math.floor(Date.now() / 1000);
    const currentPhase =
      schedule.phases?.find(
        (p) =>
          p.start_date <= now && (p.end_date == null || p.end_date > now)
      ) ?? schedule.phases?.[0];

    if (currentPhase) {
      const result = {
        currentPeriodStart: new Date(currentPhase.start_date * 1000),
        currentPeriodEnd: new Date(
          (currentPhase.end_date ?? currentPhase.start_date + 28 * 24 * 3600) *
            1000
        ),
      };
      logger.debug("getSubscriptionPeriod: from schedule phase", { subId: sub.id, ...result });
      return result;
    }
  }

  // Fallback: subscription object may expose period on the root (legacy) or we use created + 1 month
  const subAny = sub as unknown as {
    current_period_start?: number;
    current_period_end?: number;
  };
  if (
    typeof subAny.current_period_start === "number" &&
    typeof subAny.current_period_end === "number"
  ) {
    logger.debug("getSubscriptionPeriod: from subscription root", { subId: sub.id });
    return {
      currentPeriodStart: new Date(subAny.current_period_start * 1000),
      currentPeriodEnd: new Date(subAny.current_period_end * 1000),
    };
  }

  const created = typeof sub.created === "number" ? sub.created : 0;
  const fallbackEnd = created + 30 * 24 * 3600;
  logger.debug("getSubscriptionPeriod: fallback from created", { subId: sub.id, created });
  return {
    currentPeriodStart: new Date(created * 1000),
    currentPeriodEnd: new Date(fallbackEnd * 1000),
  };
}

async function upsertSubscription(
  userId: string,
  sub: Stripe.Subscription
) {
  logger.debug("upsertSubscription start", { userId, subId: sub.id, status: sub.status });
  const priceItem = sub.items.data[0];
  const lookupKey =
    priceItem?.price.lookup_key ??
    sub.metadata?.lookupKey ??
    "";
  const parsed = parseLookupKey(lookupKey);
  logger.debug("upsertSubscription parsed plan", { lookupKey, planId: parsed?.planId, interval: parsed?.interval });

  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer.id;

  const period = await getSubscriptionPeriod(sub);

  const existing = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
  });
  logger.debug("upsertSubscription existing", { existingId: existing?.id ?? null });

  const values = {
    userId,
    stripeCustomerId: customerId,
    stripeSubscriptionId: sub.id,
    stripePriceId: priceItem?.price.id ?? "",
    planId: parsed?.planId ?? "starter",
    interval: parsed?.interval ?? "month",
    status: mapStripeStatus(sub.status),
    cancelAtPeriodEnd: sub.cancel_at_period_end,
    currentPeriodStart: period.currentPeriodStart,
    currentPeriodEnd: period.currentPeriodEnd,
    trialStart: sub.trial_start ? new Date(sub.trial_start * 1000) : null,
    trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
    canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : null,
  };

  if (existing) {
    await db
      .update(subscriptions)
      .set(values)
      .where(eq(subscriptions.id, existing.id));
    logger.debug("upsertSubscription updated", { subscriptionId: existing.id });
  } else {
    const id = `sub_${nanoid()}`;
    await db.insert(subscriptions).values({
      id,
      ...values,
    });
    logger.debug("upsertSubscription inserted", { subscriptionId: id });
  }
}
