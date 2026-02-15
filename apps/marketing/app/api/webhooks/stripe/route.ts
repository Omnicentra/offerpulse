import { NextResponse } from "next/server";
import Stripe from "stripe";
import { env } from "@/env";
import { logger } from "@/lib/logger";
import { captureEvent, identifyUser, shutdownPostHog } from "@/lib/posthog-server";

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
    const body = await req.text();
    const stripe = new Stripe(env.STRIPE_SECRET_KEY);

    if (process.env.NODE_ENV === "development") {
      const testHeader = stripe.webhooks.generateTestHeaderString({
        payload: body,
        secret: webhookSecret,
      });
      event = stripe.webhooks.constructEvent(body, testHeader, webhookSecret);
    } else {
      const stripeSignature = req.headers.get("stripe-signature");
      if (!stripeSignature) {
        return NextResponse.json(
          { message: "Missing Stripe-Signature header" },
          { status: 400 }
        );
      }

      
      event = stripe.webhooks.constructEvent(
        body,
        stripeSignature,
        webhookSecret
      );
    }
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

          logger.info(
            "Checkout session completed",
            { sessionId: session.id, payment_status: session.payment_status }
          );

          // Debug: log raw metadata to trace competitorUrl
          logger.debug(
            "Checkout session completed — raw metadata",
            session.metadata ?? "(no metadata)"
          );

          const meta = session.metadata ?? {};
          const competitorUrl =
            (meta.competitorUrl as string | undefined) ??
            (meta.competitor_url as string | undefined) ??
            undefined;
          const utmSource = (meta.utmSource as string | undefined) ?? undefined;
          const utmMedium = (meta.utmMedium as string | undefined) ?? undefined;
          const utmCampaign = (meta.utmCampaign as string | undefined) ?? undefined;

          logger.debug(
            "Checkout session completed — extracted metadata",
            {
              competitorUrl,
              competitorUrlLength: competitorUrl?.length ?? 0,
              utmSource,
              utmMedium,
              utmCampaign,
            }
          );

          // Only process if payment was successful
          if (session.payment_status === "paid") {
            const customerEmail =
              session.customer_email || session.customer_details?.email;

            if (!customerEmail) {
              logger.error("Checkout session completed — no customer email in session", {
                sessionId: session.id,
              });
              break;
            }

            try {
              const purchasePayload = {
                contactEmail: customerEmail,
                contactName: session.customer_details?.name || undefined,
                competitorUrl: competitorUrl && competitorUrl.length > 0 ? competitorUrl : undefined,
                purchaseDate: new Date().toISOString().split("T")[0],
                sourceForm: "Snapshot Page - Stripe Checkout",
                promoReportType: "£19 Competitor Promo Report",
                stripeSessionId: session.id,
                utmSource,
                utmMedium,
                utmCampaign,
              };

              logger.debug(
                "Checkout session completed — Airtable payload",
                purchasePayload
              );

              // Save to Airtable
              const { createPurchaseRecord } = await import("@/lib/airtable");
              await createPurchaseRecord(purchasePayload);

              logger.info(
                "Checkout session completed — saved to Airtable",
                { email: customerEmail, competitorUrl: purchasePayload.competitorUrl }
              );

              // Send confirmation email
              const { sendPurchaseConfirmation } = await import("@/lib/email");
              await sendPurchaseConfirmation({
                to: customerEmail,
                sessionId: session.id,
              });

              logger.info(
                "Checkout session completed — confirmation email sent",
                { email: customerEmail }
              );

              // Track checkout completion in PostHog (server-side)
              captureEvent({
                distinctId: customerEmail,
                event: "checkout_completed",
                properties: {
                  session_id: session.id,
                  amount_total: session.amount_total ? session.amount_total / 100 : undefined,
                  currency: session.currency,
                  payment_status: session.payment_status,
                  competitor_url: competitorUrl,
                  utm_source: utmSource,
                  utm_medium: utmMedium,
                  utm_campaign: utmCampaign,
                },
              });
              identifyUser({
                distinctId: customerEmail,
                properties: {
                  email: customerEmail,
                  name: session.customer_details?.name,
                  has_purchased: true,
                },
              });
              await shutdownPostHog();
            } catch (error) {
              logger.error(
                "Checkout session completed — failed to process purchase",
                error
              );
              // Track error in PostHog
              captureEvent({
                distinctId: customerEmail || session.id,
                event: "checkout_processing_error",
                properties: {
                  session_id: session.id,
                  error: error instanceof Error ? error.message : "Unknown error",
                },
              });
              await shutdownPostHog();
            }
          }
          break;
        }
        case "checkout.session.expired": {
          const session = event.data.object as Stripe.Checkout.Session;
          console.log(
            `[Stripe Webhook] Checkout session expired: ${session.id}`
          );

          // Track checkout expiration in PostHog (server-side)
          const customerEmail = session.customer_email || session.customer_details?.email;
          captureEvent({
            distinctId: customerEmail || session.id,
            event: "checkout_expired",
            properties: {
              session_id: session.id,
              customer_email: customerEmail,
            },
          });
          await shutdownPostHog();
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

          // Track payment failure in PostHog (server-side)
          captureEvent({
            distinctId: paymentIntent.receipt_email || paymentIntent.id,
            event: "payment_failed",
            properties: {
              payment_intent_id: paymentIntent.id,
              error_message: paymentIntent.last_payment_error?.message,
              error_code: paymentIntent.last_payment_error?.code,
              amount: paymentIntent.amount ? paymentIntent.amount / 100 : undefined,
              currency: paymentIntent.currency,
            },
          });
          await shutdownPostHog();
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
