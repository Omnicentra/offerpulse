import { NextResponse } from "next/server";
import Stripe from "stripe";
import { env } from "@/env";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      email,
      competitorUrl,
      utmSource,
      utmMedium,
      utmCampaign,
    } = body as {
      email?: string;
      competitorUrl?: string;
      utmSource?: string;
      utmMedium?: string;
      utmCampaign?: string;
    };

    const stripe = new Stripe(env.STRIPE_SECRET_KEY);

    const priceList = await stripe.prices.list({
      lookup_keys: [env.STRIPE_PRICE_LOOKUP_KEY],
      limit: 1,
    });

    const price = priceList.data[0];
    if (!price) {
      console.error(
        `No price found for lookup key: ${env.STRIPE_PRICE_LOOKUP_KEY}`
      );
      return NextResponse.json(
        { error: "Price not configured. Please try again later." },
        { status: 500 }
      );
    }

    const baseUrl = env.NEXT_PUBLIC_MARKETING_APP_URL.replace(/\/$/, "");

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["klarna", "card"],
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      name_collection: {
        individual: {
          enabled: true,
        },
      },
      success_url: `${baseUrl}/snapshot/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/snapshot?cancelled=true`,
      ...(email && { customer_email: email }),
      metadata: {
        competitorUrl: competitorUrl ?? "",
        utmSource: utmSource ?? "",
        utmMedium: utmMedium ?? "",
        utmCampaign: utmCampaign ?? "",
      },
      allow_promotion_codes: true,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to start checkout. Please try again." },
      { status: 500 }
    );
  }
}
