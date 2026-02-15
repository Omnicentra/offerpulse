import { NextResponse } from "next/server";
import Stripe from "stripe";
import { env } from "@/env";

export async function POST(req: Request) {
  const webhookSecret = env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured");
    return NextResponse.json(
      { message: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    const stripeSignature = req.headers.get("stripe-signature");
    if (!stripeSignature) {
      return NextResponse.json(
        { message: "Missing Stripe-Signature header" },
        { status: 400 }
      );
    }

    const body = await req.text();
    const stripe = new Stripe(env.STRIPE_SECRET_KEY);
    event = stripe.webhooks.constructEvent(
      body,
      stripeSignature,
      webhookSecret
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    if (err instanceof Error) {
      console.error("Webhook signature verification failed:", err.message);
    }
    return NextResponse.json(
      { message: `Webhook Error: ${errorMessage}` },
      { status: 400 }
    );
  }

  const permittedEvents = [
    "checkout.session.completed",
    "checkout.session.expired",
    "payment_intent.succeeded",
    "payment_intent.payment_failed",
  ] as const;

  if (permittedEvents.includes(event.type as (typeof permittedEvents)[number])) {
    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          console.log(
            `[Stripe Webhook] Checkout completed: session ${session.id}, payment_status=${session.payment_status}`
          );
          // TODO: Provision access, send confirmation email, update database
          break;
        }
        case "checkout.session.expired": {
          const session = event.data.object as Stripe.Checkout.Session;
          console.log(
            `[Stripe Webhook] Checkout session expired: ${session.id}`
          );
          break;
        }
        case "payment_intent.succeeded": {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          console.log(
            `[Stripe Webhook] PaymentIntent succeeded: ${paymentIntent.id}`
          );
          break;
        }
        case "payment_intent.payment_failed": {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          console.log(
            `[Stripe Webhook] Payment failed: ${paymentIntent.id}, ${paymentIntent.last_payment_error?.message ?? "unknown"}`
          );
          break;
        }
        default:
          console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      console.error("Webhook handler error:", error);
      return NextResponse.json(
        { message: "Webhook handler failed" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
