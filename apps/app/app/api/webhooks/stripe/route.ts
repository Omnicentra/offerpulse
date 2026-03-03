import { NextResponse } from "next/server";
import Stripe from "stripe";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { env } from "@/env";
import { db } from "@/src/server/db";
import { subscriptions } from "@/src/server/db/schema";
import { parseLookupKey } from "@offerpulse/lib/pricing";

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
  let event: Stripe.Event;

  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
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
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook signature verification failed:", msg);
    return NextResponse.json(
      { message: `Webhook Error: ${msg}` },
      { status: 400 }
    );
  }

  if (!RELEVANT_EVENTS.has(event.type)) {
    return NextResponse.json({ received: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription" || !session.subscription) break;

        const userId = session.metadata?.userId;
        if (!userId) {
          console.error("checkout.session.completed: missing userId in metadata");
          break;
        }

        const stripeSubscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );
        await upsertSubscription(userId, stripeSubscription);
        break;
      }

      case "customer.subscription.created": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.userId;
        if (!userId) break;

        await upsertSubscription(userId, sub);
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const existing = await db.query.subscriptions.findFirst({
          where: eq(subscriptions.stripeSubscriptionId, sub.id),
        });

        if (!existing) break;

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
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const existing = await db.query.subscriptions.findFirst({
          where: eq(subscriptions.stripeSubscriptionId, sub.id),
        });

        if (!existing) break;

        await db
          .update(subscriptions)
          .set({
            status: "canceled",
            canceledAt: new Date(),
          })
          .where(eq(subscriptions.id, existing.id));
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice & {
          subscription?: string | Stripe.Subscription | null;
        };
        if (!invoice.subscription) break;

        const subId =
          typeof invoice.subscription === "string"
            ? invoice.subscription
            : invoice.subscription.id;

        const existing = await db.query.subscriptions.findFirst({
          where: eq(subscriptions.stripeSubscriptionId, subId),
        });

        if (!existing) break;

        const stripeSub = await stripe.subscriptions.retrieve(subId);
        const period = await getSubscriptionPeriod(stripeSub);

        await db
          .update(subscriptions)
          .set({
            status: "active",
            currentPeriodStart: period.currentPeriodStart,
            currentPeriodEnd: period.currentPeriodEnd,
          })
          .where(eq(subscriptions.id, existing.id));
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice & {
          subscription?: string | Stripe.Subscription | null;
        };
        if (!invoice.subscription) break;

        const subId =
          typeof invoice.subscription === "string"
            ? invoice.subscription
            : invoice.subscription.id;

        const existing = await db.query.subscriptions.findFirst({
          where: eq(subscriptions.stripeSubscriptionId, subId),
        });

        if (!existing) break;

        await db
          .update(subscriptions)
          .set({ status: "past_due" })
          .where(eq(subscriptions.id, existing.id));
        break;
      }
    }
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { message: "Webhook handler failed" },
      { status: 500 }
    );
  }

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
    const schedule = await stripe.subscriptionSchedules.retrieve(scheduleId);
    const now = Math.floor(Date.now() / 1000);
    const currentPhase =
      schedule.phases?.find(
        (p) =>
          p.start_date <= now && (p.end_date == null || p.end_date > now)
      ) ?? schedule.phases?.[0];

    if (currentPhase) {
      return {
        currentPeriodStart: new Date(currentPhase.start_date * 1000),
        currentPeriodEnd: new Date(
          (currentPhase.end_date ?? currentPhase.start_date + 28 * 24 * 3600) *
            1000
        ),
      };
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
    return {
      currentPeriodStart: new Date(subAny.current_period_start * 1000),
      currentPeriodEnd: new Date(subAny.current_period_end * 1000),
    };
  }

  const created = typeof sub.created === "number" ? sub.created : 0;
  const fallbackEnd = created + 30 * 24 * 3600;
  return {
    currentPeriodStart: new Date(created * 1000),
    currentPeriodEnd: new Date(fallbackEnd * 1000),
  };
}

async function upsertSubscription(
  userId: string,
  sub: Stripe.Subscription
) {
  const priceItem = sub.items.data[0];
  const lookupKey =
    priceItem?.price.lookup_key ??
    sub.metadata?.lookupKey ??
    "";
  const parsed = parseLookupKey(lookupKey);

  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer.id;

  const period = await getSubscriptionPeriod(sub);

  const existing = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
  });

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
  } else {
    await db.insert(subscriptions).values({
      id: `sub_${nanoid()}`,
      ...values,
    });
  }
}
