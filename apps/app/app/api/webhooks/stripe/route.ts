import { NextResponse } from "next/server";
import Stripe from "stripe";
import { eq, or, sql } from "drizzle-orm";
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
  "subscription_schedule.updated",
  "subscription_schedule.released",
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
      case "customer.subscription.created": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.userId;

        if (!userId) {
          logger.warn("customer.subscription.created skipped: no userId in metadata", {
            subId: sub.id,
            metadata: sub.metadata,
          });
          break;
        }

        logger.debug("customer.subscription.created upserting subscription", {
          userId,
          subId: sub.id,
          status: sub.status,
        });
        const hasTrial = Boolean(sub.trial_end && sub.trial_end && sub.status === "trialing");
        await upsertSubscription(userId, sub, hasTrial);
        logger.info("customer.subscription.created processed", {
          userId,
          subscriptionId: sub.id,
        });
        break;
      }

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

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const scheduleOnSub =
          typeof sub.schedule === "string"
            ? sub.schedule
            : sub.schedule && typeof sub.schedule === "object" && "id" in sub.schedule
              ? sub.schedule.id
              : null;
        logger.debug("customer.subscription.updated", {
          subId: sub.id,
          status: sub.status,
          cancelAtPeriodEnd: sub.cancel_at_period_end,
          attachedScheduleId: scheduleOnSub,
        });
        const existing = await db.query.subscriptions.findFirst({
          where: eq(subscriptions.stripeSubscriptionId, sub.id),
        });

        if (!existing) {
          logger.debug("customer.subscription.updated skipped: no existing subscription", { subId: sub.id });
          break;
        }

        logger.debug("customer.subscription.updated: existing DB row", {
          subId: sub.id,
          dbPlanId: existing.planId,
          dbPendingPlanId: existing.pendingPlanId ?? null,
          dbStripeScheduleId: existing.stripeScheduleId ?? null,
        });

        const priceItem = sub.items.data[0];
        const lookupKey = priceItem?.price.lookup_key ?? existing.planId;
        const parsed = lookupKey ? parseLookupKey(lookupKey) : null;
        const period = await getSubscriptionPeriod(sub);

        logger.debug("customer.subscription.updated: computed sync fields", {
          subId: sub.id,
          lookupKey,
          parsedPlanId: parsed?.planId ?? null,
          parsedInterval: parsed?.interval ?? null,
          periodStart: period.currentPeriodStart.toISOString(),
          periodEnd: period.currentPeriodEnd.toISOString(),
        });

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

      case "subscription_schedule.updated": {
        const schedule = event.data.object as Stripe.SubscriptionSchedule;
        logger.debug("subscription_schedule.updated: event payload", {
          scheduleId: schedule.id,
          status: schedule.status,
          phaseCount: schedule.phases?.length ?? 0,
        });

        const subRef = schedule.subscription;
        const subId =
          typeof subRef === "string"
            ? subRef
            : subRef && typeof subRef === "object" && "id" in subRef
              ? subRef.id
              : null;

        if (!subId) {
          logger.debug("subscription_schedule.updated skipped: no subscription on schedule", {
            scheduleId: schedule.id,
          });
          break;
        }

        const existing = await db.query.subscriptions.findFirst({
          where: eq(subscriptions.stripeSubscriptionId, subId),
        });

        if (!existing) {
          logger.debug("subscription_schedule.updated skipped: no DB row", { subId, scheduleId: schedule.id });
          break;
        }

        logger.debug("subscription_schedule.updated: matched DB row", {
          subId,
          scheduleId: schedule.id,
          dbUserId: existing.userId,
          dbPendingBefore: existing.pendingPlanId ?? null,
          dbStripeScheduleBefore: existing.stripeScheduleId ?? null,
        });

        if (schedule.status === "released" || schedule.status === "canceled") {
          logger.debug("subscription_schedule.updated: terminal schedule status, clearing DB", {
            scheduleId: schedule.id,
            subId,
            status: schedule.status,
          });
          await db
            .update(subscriptions)
            .set({
              stripeScheduleId: null,
              pendingPlanId: null,
            })
            .where(eq(subscriptions.id, existing.id));
          logger.info("subscription_schedule.updated cleared pending (terminal schedule status)", {
            scheduleId: schedule.id,
          });
          break;
        }

        const fullSchedule = await stripe.subscriptionSchedules.retrieve(schedule.id, {
          expand: ["phases.items.price"],
        });

        logger.debug("subscription_schedule.updated: retrieved full schedule from API", {
          scheduleId: fullSchedule.id,
          status: fullSchedule.status,
          phaseCount: fullSchedule.phases?.length ?? 0,
          phasesSummary: (fullSchedule.phases ?? []).map((p, i) => ({
            index: i,
            start: p.start_date,
            end: p.end_date ?? null,
            itemCount: p.items?.length ?? 0,
          })),
        });

        const pendingPlanId = derivePendingPlanIdFromSchedule(fullSchedule, schedule.id);
        const pendingPlanIdDb =
          pendingPlanId === "starter" ||
          pendingPlanId === "growth" ||
          pendingPlanId === "agency"
            ? pendingPlanId
            : null;

        await db
          .update(subscriptions)
          .set({
            stripeScheduleId: fullSchedule.id,
            pendingPlanId: pendingPlanIdDb,
          })
          .where(eq(subscriptions.id, existing.id));

        logger.debug("subscription_schedule.updated: DB write complete", {
          scheduleId: schedule.id,
          subscriptionId: subId,
          pendingPlanIdRaw: pendingPlanId,
          pendingPlanIdDb,
        });

        logger.info("subscription_schedule.updated synced pending plan", {
          scheduleId: schedule.id,
          subscriptionId: subId,
          pendingPlanId: pendingPlanIdDb,
        });
        break;
      }

      case "subscription_schedule.released": {
        const schedule = event.data.object as Stripe.SubscriptionSchedule;
        logger.debug("subscription_schedule.released: event payload", {
          scheduleId: schedule.id,
          status: schedule.status,
        });

        const subRef = schedule.subscription;
        const subId =
          typeof subRef === "string"
            ? subRef
            : subRef && typeof subRef === "object" && "id" in subRef
              ? subRef.id
              : null;

        logger.debug("subscription_schedule.released: clearing DB by subscription or schedule id", {
          scheduleId: schedule.id,
          subscriptionId: subId,
        });

        await db
          .update(subscriptions)
          .set({
            stripeScheduleId: null,
            pendingPlanId: null,
          })
          .where(
            subId
              ? or(
                  eq(subscriptions.stripeSubscriptionId, subId),
                  eq(subscriptions.stripeScheduleId, schedule.id)
                )
              : eq(subscriptions.stripeScheduleId, schedule.id)
          );

        logger.debug("subscription_schedule.released: DB update issued", {
          scheduleId: schedule.id,
          subscriptionId: subId,
        });

        logger.info("subscription_schedule.released cleared schedule fields", {
          scheduleId: schedule.id,
          subscriptionId: subId,
        });
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

/**
 * If the schedule has a future phase with a different price, return that phase's plan id (from price lookup_key).
 */
function derivePendingPlanIdFromSchedule(
  schedule: Stripe.SubscriptionSchedule,
  scheduleIdForLog?: string
): string | null {
  const now = Math.floor(Date.now() / 1000);
  const phases = [...(schedule.phases ?? [])].sort(
    (a, b) => a.start_date - b.start_date
  );

  logger.debug("derivePendingPlanIdFromSchedule: start", {
    scheduleId: scheduleIdForLog ?? schedule.id,
    nowUnix: now,
    phaseCount: phases.length,
  });

  if (phases.length < 2) {
    logger.debug("derivePendingPlanIdFromSchedule: fewer than 2 phases, no pending", {
      scheduleId: scheduleIdForLog ?? schedule.id,
    });
    return null;
  }

  const secondPhase = phases[1];
  if (secondPhase.start_date <= now) {
    logger.debug("derivePendingPlanIdFromSchedule: second phase already active", {
      scheduleId: scheduleIdForLog ?? schedule.id,
      secondPhaseStart: secondPhase.start_date,
    });
    return null;
  }

  const item = secondPhase.items?.[0];
  const price = item?.price;
  const lookupKey =
    typeof price === "string" || price == null || price.deleted === true
      ? null
      : ("lookup_key" in price ? price.lookup_key : null) ?? null;

  logger.debug("derivePendingPlanIdFromSchedule: second phase price", {
    scheduleId: scheduleIdForLog ?? schedule.id,
    lookupKey,
    priceIsString: typeof price === "string",
  });

  if (!lookupKey) {
    logger.debug("derivePendingPlanIdFromSchedule: no lookup_key on phase 2 price", {
      scheduleId: scheduleIdForLog ?? schedule.id,
    });
    return null;
  }

  const parsed = parseLookupKey(lookupKey);
  const planId = parsed?.planId ?? null;

  logger.debug("derivePendingPlanIdFromSchedule: result", {
    scheduleId: scheduleIdForLog ?? schedule.id,
    lookupKey,
    planId,
  });

  return planId;
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
  sub: Stripe.Subscription,
  hasTrial: boolean = false
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

  const values = {
    userId,
    stripeCustomerId: customerId,
    stripeSubscriptionId: sub.id,
    stripePriceId: priceItem?.price.id ?? "",
    planId: parsed?.planId ?? "starter",
    interval: parsed?.interval ?? "month",
    status: mapStripeStatus(sub.status),
    cancelAtPeriodEnd: hasTrial || sub.cancel_at_period_end,
    currentPeriodStart: period.currentPeriodStart,
    currentPeriodEnd: period.currentPeriodEnd,
    trialStart: sub.trial_start ? new Date(sub.trial_start * 1000) : null,
    trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
    canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : null,
  };

  const id = `sub_${nanoid()}`;

  await db
    .insert(subscriptions)
    .values({
      id,
      ...values,
    })
    .onConflictDoUpdate({
      target: [subscriptions.userId],
      targetWhere: sql`"status" in ('active', 'trialing', 'canceled', 'past_due')`,
      set: values,
    });

  logger.debug("upsertSubscription upserted", { userId, subId: sub.id });
}
